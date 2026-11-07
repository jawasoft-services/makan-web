import type { DocumentSnapshot, Firestore } from 'firebase-admin/firestore'
import { createHash } from 'node:crypto'
import type { DirectoryPlace, MaitredList, MaitredNotes, MaitredVenue } from './types'

/** Internal read shape. Only buildMaitredList's allowlisted fields leave this module. */
export interface MaitredHolder {
  placeId: string
  holderName: string
  holderPhoto: string | null
  notes: MaitredNotes
}

export interface MaitredSource {
  verifiedAt: number
  status: 'ready' | 'disabled'
  holders: MaitredHolder[]
  places: MaitredList['places']
}

const TEST_HOLDER = /\btest\b/i
const STORAGE = 'https://firebasestorage.googleapis.com/'
const NO_NOTES: MaitredNotes = { always: '', another: '', why: '', tip: '' }
const OUTCOMES = ['retained', 'transferred', 'vacant', 'unresolved']
const inFlight = new WeakMap<Firestore, Promise<MaitredSource>>()
const verifiedSources = new WeakMap<Firestore, MaitredSource>()
const verifiedInFlight = new WeakMap<Firestore, Promise<MaitredSource>>()
export const MAITRED_PUBLIC_MAX_AGE_MS = 5 * 60 * 1000

/** Share web eligibility without extending the original verification window. Cron still reads fresh. */
export function getVerifiedMaitredSource(db: Firestore): Promise<MaitredSource> {
  const fresh = (source: MaitredSource) => source.verifiedAt <= Date.now() && Date.now() - source.verifiedAt < MAITRED_PUBLIC_MAX_AGE_MS
  const cached = verifiedSources.get(db)
  if (cached && fresh(cached)) return Promise.resolve(cached)
  verifiedSources.delete(db)
  const pending = verifiedInFlight.get(db)
  if (pending) return pending
  const read = readMaitredSource(db).then(source => {
    if (!fresh(source)) throw new Error('Maître d’ source verification expired.')
    verifiedSources.set(db, source)
    return source
  }).finally(() => { if (verifiedInFlight.get(db) === read) verifiedInFlight.delete(db) })
  verifiedInFlight.set(db, read)
  return read
}

/** Coalesce simultaneous directory/aggregate rebuilds, without keeping a stale privacy result. */
export function readMaitredSource(db: Firestore): Promise<MaitredSource> {
  const pending = inFlight.get(db)
  if (pending) return pending
  const read = readSource(db).finally(() => { if (inFlight.get(db) === read) inFlight.delete(db) })
  inFlight.set(db, read)
  return read
}

async function readSource(db: Firestore): Promise<MaitredSource> {
  const verifiedAt = Date.now()
  const feature = (await db.doc('maitredFeature/current').get()).data()
  if (feature?.enabled !== true || feature.killSwitch === true) return { verifiedAt, status: 'disabled', holders: [], places: [] }

  // Both retained and transferred outcomes have a current holder. A vacancy must
  // be explicit in a complete, stable calculation, never inferred from this query's absence.
  const standings = await db.collection('maitredStanding').where('outcome', 'in', OUTCOMES)
    .select('canonicalPlaceId', 'activeGenerationId', 'participationRebuildPending', 'outcome', 'holderUid').get()
  const rows = standings.docs.flatMap(doc => {
    const data = doc.data()
    if (data.canonicalPlaceId !== doc.id || !str(data.activeGenerationId) || data.participationRebuildPending === true) return []
    const outcome = str(data.outcome)
    if (!OUTCOMES.includes(outcome)) return []
    const uid = str(data.holderUid)
    const held = outcome === 'retained' || outcome === 'transferred'
    if (held ? !uid : data.holderUid !== null) return []
    return [{ placeId: doc.id, outcome, uid }]
  })
  if (!rows.length) return { verifiedAt, status: 'ready', holders: [], places: [] }

  const heldRows = rows.filter(row => row.uid)
  const uids = [...new Set(heldRows.map(row => row.uid))]
  const [menus, participation, venues, profiles, deletionFences] = await Promise.all([
    getAll(db, heldRows.map(row => `maitredMenus/${row.placeId}`)),
    getAll(db, uids.map(uid => `users/${uid}/maitredSettings/participation`)),
    getAll(db, rows.map(row => `restaurants/${row.placeId}`), ['isTestVenue', 'state', 'canonicalPlaceId', 'replacedByCanonicalPlaceId']),
    getAll(db, uids.map(uid => `users/${uid}`), ['deletedAt', 'isDeleted', 'isSpam', 'spamSuspected', 'accountStatus', 'display_name', 'displayName', 'name', 'photoURL', 'avatar', 'photoURLString']),
    getAll(db, uids.map(uid => `accountDeletionFences/${createHash('sha256').update(uid).digest('hex')}`)),
  ])
  const settingsOf = new Map(uids.map((uid, i) => [uid, participation[i].exists ? participation[i].data() ?? {} : null]))
  const profileOf = new Map(uids.map((uid, i) => [uid, profiles[i].exists ? profiles[i].data() ?? null : null]))
  // Match the native inactive/deletion predicates. A missing profile fails closed
  // for anonymous export; no guessed account-visibility or owner-roster consent field.
  const active = new Set(uids.filter((_, i) => {
    const profile = profiles[i].exists ? profiles[i].data() : null
    return profile && !deletionFences[i].exists && !profile.deletedAt && profile.isDeleted !== true && profile.isSpam !== true
      && profile.spamSuspected !== true && (profile.accountStatus == null || profile.accountStatus === 'active')
  }))
  const menuOf = new Map(heldRows.map((row, i) => [row.placeId, menus[i]]))
  const holders: MaitredHolder[] = []
  const places: MaitredList['places'] = []
  for (let i = 0; i < rows.length; i += 1) {
    const row = rows[i]
    const venue = venues[i].exists ? venues[i].data() ?? {} : null
    if (!venue || venue.isTestVenue === true || venue.state === 'tombstone' || venue.state === 'unresolved' || venue.replacedByCanonicalPlaceId
      || (typeof venue.canonicalPlaceId === 'string' && venue.canonicalPlaceId !== row.placeId)) continue
    if (!row.uid) {
      places.push({ placeId: row.placeId, status: row.outcome as 'vacant' | 'unresolved' })
      continue
    }
    const settings = settingsOf.get(row.uid)
    const profile = profileOf.get(row.uid)
    // Native profileFromRecord/resolveDinerDisplayNameFromRecord precedence.
    // Standing identity is denormalized at recompute time; never resurrect a
    // removed name/avatar from that older pointer during fresh verification.
    const name = firstString([profile?.display_name, profile?.displayName, profile?.name])
    const photo = firstString([profile?.photoURL, profile?.avatar, profile?.photoURLString])
    if (!active.has(row.uid) || settings?.enabled === false || !name || TEST_HOLDER.test(name)) continue
    holders.push({ placeId: row.placeId, holderName: name, holderPhoto: photo.startsWith(STORAGE) ? photo : null,
      notes: notesOf(menuOf.get(row.placeId), row.uid, settings) })
  }
  return { verifiedAt, status: 'ready', holders, places }
}

/** Compatibility for directory callers; disabled/unknown never manufacture a holder. */
export async function readMaitredHolders(db: Firestore): Promise<MaitredHolder[]> {
  return (await readMaitredSource(db)).holders
}

function notesOf(menu: DocumentSnapshot | undefined, uid: string, settings: Record<string, unknown> | null | undefined): MaitredNotes {
  const m = menu?.exists ? menu.data() ?? {} : null
  if (!m || m.authorUid !== uid || m.moderation !== 'visible' || m.participationWithdrawn === true) return { ...NO_NOTES }
  if (settings && Number(m.participationRevision ?? 0) < Number(settings.lastOptOutRevision ?? 0)) return { ...NO_NOTES }
  const entries = (m.entries ?? {}) as Record<string, unknown>
  return { always: str(entries.alwaysOrderThis), another: str(entries.anotherDish), why: str(entries.whyOrderThis), tip: str(entries.orderingTip) }
}

/**
 * Directory photos can outlive a meal's public status. Recheck exact candidates
 * with computePlaceDirectory's public/moderation/storage rules, never a scan.
 * Read one candidate per unresolved venue per round, and stop at its first valid
 * photo. Successful venues and repeated IDs never create duplicate reads.
 */
export async function readMaitredPhotos(db: Firestore, source: MaitredSource, directory: DirectoryPlace[]): Promise<Map<string, string>> {
  const photos = new Map<string, string>()
  if (source.status === 'disabled' || !source.holders.length) return photos
  const heldIds = new Set(source.holders.map(holder => holder.placeId))
  let candidates = directory.filter(place => heldIds.has(place.placeId)).map(place => ({
    placeId: place.placeId,
    ids: [...new Set(place.meals.map(meal => str(meal.id)).filter(id => id && !id.includes('/')))],
    cursor: 0,
  }))
  const checked = new Map<string, Record<string, unknown> | null>()
  while (candidates.length) {
    candidates = candidates.filter(candidate => candidate.cursor < candidate.ids.length)
    const ids = [...new Set(candidates.map(candidate => candidate.ids[candidate.cursor]).filter(id => !checked.has(id)))]
    const docs = await getAll(db, ids.map(id => `meals/${id}`), ['placeProviderId', 'isPublic', 'moderationStatus', 'imageURL', 'thumbnailUrl'])
    docs.forEach((doc, i) => checked.set(ids[i], doc.exists ? doc.data() ?? null : null))
    candidates = candidates.filter(candidate => {
      const meal = checked.get(candidate.ids[candidate.cursor++])
      const src = str(meal?.imageURL)
      if (!meal || str(meal.placeProviderId) !== candidate.placeId || meal.isPublic !== true
        || (meal.moderationStatus !== undefined && meal.moderationStatus !== 'active') || !src.startsWith(STORAGE)) return true
      const thumb = str(meal.thumbnailUrl)
      photos.set(candidate.placeId, thumb.startsWith(STORAGE) ? thumb : src)
      return false
    })
  }
  return photos
}

/** Join only real directory entries and freshly verified photos; absence is never vacancy. */
export function buildMaitredList(source: MaitredSource, directory: DirectoryPlace[], photos: ReadonlyMap<string, string>): MaitredList {
  if (source.status === 'disabled') return { schemaVersion: 2, verifiedAt: source.verifiedAt, status: 'disabled', venues: [], places: [] }
  const byId = new Map(directory.map(place => [place.placeId, place]))
  const venues: MaitredVenue[] = source.holders.flatMap(holder => {
    const place = byId.get(holder.placeId)
    if (!place) return []
    return [{ placeId: holder.placeId, holderName: holder.holderName, holderPhoto: holder.holderPhoto, notes: { ...holder.notes },
      slug: place.slug, name: place.name, where: place.where, photo: photos.get(place.placeId) ?? null }]
  })
  venues.sort((x, y) => Number(!x.notes.always) - Number(!y.notes.always) || Number(!x.photo) - Number(!y.photo) || x.name.localeCompare(y.name))
  const heldIds = new Set(venues.map(venue => venue.placeId))
  const places = source.places.filter(place => byId.has(place.placeId) && !heldIds.has(place.placeId))
    .map(place => ({ placeId: place.placeId, status: place.status })).sort((a, b) => a.placeId.localeCompare(b.placeId))
  return { schemaVersion: 2, verifiedAt: source.verifiedAt, status: 'ready', venues, places }
}

/** v1/partial/corrupt snapshots cannot acquire new vacancy semantics. Strip unknown fields. */
export function parseMaitredList(value: unknown): MaitredList | null {
  const data = record(value)
  if (data?.schemaVersion !== 2 || typeof data.verifiedAt !== 'number' || !Number.isFinite(data.verifiedAt) || data.verifiedAt < 0 || !['ready', 'disabled'].includes(String(data.status)) || !Array.isArray(data.venues) || !Array.isArray(data.places)) return null
  if (data.status === 'disabled') return data.venues.length || data.places.length ? null : { schemaVersion: 2, verifiedAt: data.verifiedAt, status: 'disabled', venues: [], places: [] }
  const ids = new Set<string>()
  const venues: MaitredVenue[] = []
  for (const raw of data.venues) {
    const venue = record(raw)
    const notes = record(venue?.notes)
    const where = record(venue?.where)
    if (!venue || !notes || !['placeId', 'slug', 'name', 'holderName'].every(key => typeof venue[key] === 'string' && str(venue[key]))
      || !['always', 'another', 'why', 'tip'].every(key => typeof notes[key] === 'string')
      || ![venue.photo, venue.holderPhoto].every(photo => photo === null || typeof photo === 'string')
      || !(venue.where === null || (where && typeof where.city === 'string' && typeof where.country === 'string'))
      || ids.has(String(venue.placeId))) return null
    ids.add(String(venue.placeId))
    venues.push({ placeId: String(venue.placeId), slug: String(venue.slug), name: String(venue.name), holderName: String(venue.holderName),
      holderPhoto: venue.holderPhoto as string | null, photo: venue.photo as string | null,
      where: venue.where === null ? null : { city: String(where!.city), country: String(where!.country) },
      notes: { always: String(notes.always), another: String(notes.another), why: String(notes.why), tip: String(notes.tip) } })
  }
  const places: MaitredList['places'] = []
  for (const raw of data.places) {
    const place = record(raw)
    if (!place || !str(place.placeId) || !['vacant', 'unresolved'].includes(String(place.status)) || ids.has(String(place.placeId))) return null
    ids.add(String(place.placeId))
    places.push({ placeId: String(place.placeId), status: place.status as 'vacant' | 'unresolved' })
  }
  return { schemaVersion: 2, verifiedAt: data.verifiedAt, status: 'ready', venues, places }
}

async function getAll(db: Firestore, paths: string[], fieldMask?: string[]): Promise<DocumentSnapshot[]> {
  const out: DocumentSnapshot[] = []
  for (let i = 0; i < paths.length; i += 100) {
    const refs = paths.slice(i, i + 100).map(path => db.doc(path))
    out.push(...(fieldMask ? await db.getAll(...refs, { fieldMask }) : await db.getAll(...refs)))
  }
  return out
}
function record(value: unknown): Record<string, unknown> | null { return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null }
function str(value: unknown): string { return typeof value === 'string' ? value.trim() : '' }
function firstString(values: unknown[]): string { return values.map(str).find(Boolean) ?? '' }
