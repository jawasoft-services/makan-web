import { createHash } from 'node:crypto'
import { Timestamp, type Firestore } from 'firebase-admin/firestore'
import type { DirectoryPlace, EatStandings, MaitredList, PlaceIndexEntry, PlaceStats } from './types'
import { parseMaitredList } from './maitred'

/**
 * Where the aggregates live in Firestore, and how they are written and read.
 *
 *   webAggregates/meta                       lastRunAt (every run: the heartbeat)
 *   webAggregates/standings                  EatStandings
 *   webAggregates/stats                      PlaceStats
 *   webAggregates/maitred                    MaitredList
 *   webAggregates/placeIndex                 { shards, count } + shards/{n} of 500 entries
 *   webAggregates/places/items/{placeId}     DirectoryPlace
 *
 * (Firestore paths alternate collection and document, so the per-place
 * documents sit one level under a `places` document, which is otherwise
 * empty.) Every content document carries a contentHash; a write is skipped
 * when the hash matches, so an hour with no new meals writes only the
 * heartbeat. A Firestore document is capped at 1 MB, which is why places
 * are separate documents and the index is sharded.
 *
 * This module writes to webAggregates/* only. It must never write to meals,
 * restaurants, users or anything the app reads or writes.
 */

const ROOT = 'webAggregates'
const SHARD_SIZE = 500
/** Allow one missed hourly Scheduler run before readers use the live fallback. */
export const MAX_AGE_MS = 2 * 60 * 60 * 1000

export function hashOf(payload: unknown): string {
  return createHash('sha1').update(JSON.stringify(payload)).digest('hex')
}

interface Stored<T> {
  payload: T
  contentHash: string
  updatedAt: Timestamp
}

class AggregateIntegrityError extends Error {}
const record = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null
const count = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const date = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value))
const position = (value: unknown) => value === null || (count(value) && value > 0)
const coordinate = (value: unknown, bound: number) => value === null || (typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= bound)
const unique = (values: unknown[], key: string) => new Set(values.map(value => record(value)?.[key])).size === values.length
// Match indexOf's legacy hash order; Firestore map key order is not a content change.
const orderedIndex = (entries: PlaceIndexEntry[]) => entries.map(({ placeId, slug, hash, name, city, indexable, meals }) => ({ placeId, slug, hash, name, city, indexable, meals }))
const matchesIndexHash = (entries: PlaceIndexEntry[], expected: string) => hashOf(entries) === expected || hashOf(orderedIndex(entries)) === expected

function standingRow(value: unknown): boolean {
  const row = record(value)
  if (!row) return false
  const where = record(row.where)
  return ['placeId', 'slug', 'name'].every(key => text(row[key]))
    && ['eats', 'yeets', 'ties', 'matchups', 'publicMeals'].every(key => count(row[key]))
    && typeof row.eatRate === 'number' && Number.isFinite(row.eatRate) && row.eatRate >= 0 && row.eatRate <= 1
    && (row.since === null || date(row.since))
    && (row.where === null || Boolean(where && text(where.city) && text(where.country)))
    && coordinate(row.lat, 90) && coordinate(row.lng, 180)
    && Array.isArray(row.recentCaptions) && row.recentCaptions.every(caption => typeof caption === 'string')
    && position(row.rank) && position(row.cityRank)
}

function validStandings(value: unknown): value is EatStandings {
  const data = record(value)
  if (!data || !Array.isArray(data.rows) || !Array.isArray(data.all) || !Array.isArray(data.cities)) return false
  return data.rows.every(standingRow) && unique(data.rows, 'placeId')
    && data.all.every(standingRow) && unique(data.all, 'placeId')
    && data.cities.every(value => {
      const city = record(value)
      return city && ['slug', 'city', 'country'].every(key => text(city[key]))
        && Array.isArray(city.rows) && city.rows.every(standingRow) && unique(city.rows, 'placeId')
    }) && unique(data.cities, 'slug')
    && ['belowFloor', 'matchups', 'countries'].every(key => count(data[key]))
    && (date(data.computedAt) || (data.computedAt === '' && !data.rows.length && !data.all.length && !data.cities.length))
}

function compatibleStandings(value: unknown): unknown {
  const data = record(value)
  if (!data) return value
  // Coordinates were added after the first standings payloads. Missing fields
  // mean unlocated, not malformed evidence; the reader can hydrate them later.
  const locate = (value: unknown) => {
    const row = record(value)
    return row ? { ...row, lat: row.lat === undefined ? null : row.lat, lng: row.lng === undefined ? null : row.lng } : value
  }
  return { ...data,
    rows: Array.isArray(data.rows) ? data.rows.map(locate) : data.rows,
    all: Array.isArray(data.all) ? data.all.map(locate) : data.all,
    cities: Array.isArray(data.cities) ? data.cities.map(value => {
      const city = record(value)
      return city ? { ...city, rows: Array.isArray(city.rows) ? city.rows.map(locate) : city.rows } : value
    }) : data.cities,
  }
}

function validStats(value: unknown): value is PlaceStats {
  const data = record(value)
  return Boolean(data && ['places', 'recentMeals', 'mealCount'].every(key => count(data[key]))
    && Array.isArray(data.topPlaces) && data.topPlaces.every(value => {
      const place = record(value)
      return place && text(place.name) && count(place.meals)
    }))
}

async function readDoc<T>(db: Firestore, ref: FirebaseFirestore.DocumentReference): Promise<T | null> {
  const snap = await ref.get()
  if (!snap.exists) return null
  const d = snap.data() as Partial<Stored<T>> | undefined
  return d && d.payload !== undefined ? (d.payload as T) : null
}

/** When the cron last ran, or null if never. */
export async function readLastRun(db: Firestore): Promise<Date | null> {
  const snap = await db.collection(ROOT).doc('meta').get()
  const at = snap.exists ? (snap.data()?.lastRunAt as Timestamp | undefined) : undefined
  if (!(at instanceof Timestamp)) return null
  const value = at.toDate()
  return Number.isFinite(value.getTime()) && value.getTime() <= Date.now() ? value : null
}

export async function readStandings(db: Firestore): Promise<EatStandings | null> {
  const value = compatibleStandings(await readDoc<unknown>(db, db.collection(ROOT).doc('standings')))
  if (value === null) return null
  if (!validStandings(value)) throw new AggregateIntegrityError('Invalid standings aggregate.')
  return value
}

export async function readMaitred(db: Firestore): Promise<MaitredList | null> {
  const root = db.collection(ROOT)
  const [content, meta] = await Promise.all([root.doc('maitred').get(), root.doc('meta').get()])
  const stored = content.data()
  const payload = parseMaitredList(stored?.payload)
  if (!payload) return null
  const proof = meta.data()?.maitredVerification
  // A successful unchanged run still reverified its source. Its proof lives in
  // the existing meta write, bound to exactly this schema and content. Neither
  // cron completion time nor a mismatched/legacy proof can extend freshness.
  const hash = maitredContentHash(payload)
  if (proof?.schemaVersion === payload.schemaVersion && stored?.contentHash === hash && proof.contentHash === hash
    && typeof proof.verifiedAt === 'number' && Number.isFinite(proof.verifiedAt) && proof.verifiedAt >= payload.verifiedAt) {
    return { ...payload, verifiedAt: proof.verifiedAt }
  }
  return payload
}

function maitredContentHash(payload: MaitredList): string {
  const { verifiedAt: _verifiedAt, ...body } = payload
  void _verifiedAt
  return hashOf(body)
}

export async function readStats(db: Firestore): Promise<PlaceStats | null> {
  const value = await readDoc<unknown>(db, db.collection(ROOT).doc('stats'))
  if (value === null) return null
  if (!validStats(value)) throw new AggregateIntegrityError('Invalid statistics aggregate.')
  return value
}

export async function readPlaceIndex(db: Firestore): Promise<PlaceIndexEntry[] | null> {
  const meta = await db.collection(ROOT).doc('placeIndex').get()
  if (!meta.exists) return null
  const manifest = meta.data() ?? {}
  const shards: unknown = manifest.shards
  if (!count(shards) || (manifest.count !== undefined && !count(manifest.count))
    || (manifest.contentHash !== undefined && !text(manifest.contentHash))) throw new AggregateIntegrityError('Invalid place index manifest.')
  if (manifest.count !== undefined && shards !== Math.ceil(manifest.count / SHARD_SIZE)) throw new AggregateIntegrityError('Place index shard count mismatch.')
  const docs = shards ? await db.getAll(...Array.from({ length: shards }, (_, i) => db.collection(ROOT).doc('placeIndex').collection('shards').doc(String(i)))) : []
  if (docs.length !== shards) throw new AggregateIntegrityError('Missing place index shards.')
  const out: PlaceIndexEntry[] = []
  for (const d of docs) {
    const entries: unknown = d.data()?.entries
    if (!d.exists || !Array.isArray(entries) || !entries.length || entries.length > SHARD_SIZE
      || entries.some(entry => !text(record(entry)?.placeId))) throw new AggregateIntegrityError('Missing or invalid place index shard.')
    out.push(...entries)
  }
  if (!unique(out, 'placeId')) throw new AggregateIntegrityError('Duplicate place IDs in index.')
  // Older valid manifests did not carry count/hash; verify either whenever supplied.
  if (manifest.count !== undefined && out.length !== manifest.count) throw new AggregateIntegrityError('Place index entry count mismatch.')
  if (manifest.contentHash !== undefined && !matchesIndexHash(out, manifest.contentHash)) throw new AggregateIntegrityError('Place index content hash mismatch.')
  return out
}

export async function readPlace(db: Firestore, placeId: string): Promise<DirectoryPlace | null> {
  return readDoc<DirectoryPlace>(db, db.collection(ROOT).doc('places').collection('items').doc(placeId))
}

export async function readPlaces(db: Firestore, placeIds: string[]): Promise<Map<string, DirectoryPlace>> {
  const out = new Map<string, DirectoryPlace>()
  for (let i = 0; i < placeIds.length; i += 100) {
    const docs = await db.getAll(...placeIds.slice(i, i + 100).map((id) => db.collection(ROOT).doc('places').collection('items').doc(id)))
    for (const d of docs) {
      const payload = d.exists ? (d.data()?.payload as DirectoryPlace | undefined) : undefined
      if (payload) out.set(d.id, payload)
    }
  }
  return out
}

export interface WriteSummary {
  written: number
  skipped: number
  removed: number
}

/**
 * Writes every aggregate whose content changed, and the heartbeat. The
 * standings' computedAt is excluded from the hash so an unchanged table
 * keeps its earlier date (the page shows it as "Updated"); it is replaced
 * only when the content is.
 */
export async function writeAggregates(
  db: Firestore,
  data: { standings: EatStandings; directory: DirectoryPlace[]; index: PlaceIndexEntry[]; stats: PlaceStats; maitred: MaitredList },
): Promise<WriteSummary> {
  // Do not let a legacy producer overwrite the explicit-state public contract.
  const maitred = parseMaitredList(data.maitred)
  if (!maitred) throw new Error('Unsupported Maître d’ aggregate schema.')
  const summary: WriteSummary = { written: 0, skipped: 0, removed: 0 }
  const now = Timestamp.now()
  const root = db.collection(ROOT)

  // Existing hashes, one read per content document.
  const [standingsSnap, statsSnap, indexMetaSnap, maitredSnap] = await Promise.all([root.doc('standings').get(), root.doc('stats').get(), root.doc('placeIndex').get(), root.doc('maitred').get()])
  const existingPlaces = await root.doc('places').collection('items').select('contentHash').get()
  const placeHash = new Map<string, string>()
  for (const d of existingPlaces.docs) placeHash.set(d.id, String(d.data()?.contentHash ?? ''))

  // Each publication phase waits for every write promise: close() alone can
  // resolve after permanent per-document failures. Never publish proof for it.
  const phase = () => {
    const batch = db.bulkWriter()
    batch.onWriteError(err => err.failedAttempts < 3)
    const failures: string[] = []
    const pending: Promise<void>[] = []
    const track = (ref: FirebaseFirestore.DocumentReference, operation: Promise<unknown>) => {
      pending.push(operation.then(() => undefined, error => { failures.push(`${ref.path}: ${String(error)}`) }))
    }
    return {
      set: (ref: FirebaseFirestore.DocumentReference, value: FirebaseFirestore.DocumentData) => track(ref, batch.set(ref, value)),
      delete: (ref: FirebaseFirestore.DocumentReference) => track(ref, batch.delete(ref)),
      async close() {
        await batch.close()
        await Promise.all(pending)
        if (failures.length) throw new Error(`${failures.length} aggregate writes failed; first: ${failures[0]}`)
      },
    }
  }
  const writer = phase()
  const put = (ref: FirebaseFirestore.DocumentReference, payload: unknown, hash: string) => {
    writer.set(ref, { payload, contentHash: hash, updatedAt: now })
    summary.written += 1
  }

  // Standings: hash without computedAt.
  const { computedAt: _computedAt, ...standingsBody } = data.standings
  void _computedAt
  const standingsHash = hashOf(standingsBody)
  if (standingsSnap.data()?.contentHash === standingsHash) summary.skipped += 1
  else put(root.doc('standings'), data.standings, standingsHash)

  const statsHash = hashOf(data.stats)
  if (statsSnap.data()?.contentHash === statsHash) summary.skipped += 1
  else put(root.doc('stats'), data.stats, statsHash)

  // Verification age is not content. The existing meta write carries a new
  // source-read proof even when this content document does not need rewriting.
  const maitredHash = maitredContentHash(maitred)
  if (maitredSnap.data()?.contentHash === maitredHash) summary.skipped += 1
  else put(root.doc('maitred'), maitred, maitredHash)

  // Index: sharded, one hash over the whole list on the meta document.
  const indexHash = hashOf(data.index)
  let unchangedIndex = false
  if (indexMetaSnap.data()?.contentHash === indexHash) {
    try {
      const existing = await readPlaceIndex(db)
      unchangedIndex = existing !== null && matchesIndexHash(existing, indexHash)
    } catch (error) {
      if (!(error instanceof AggregateIntegrityError)) {
        await writer.close()
        throw error
      }
      // A prior partial publication needs repair even when its manifest hash matches.
    }
  }
  const shards = Math.ceil(data.index.length / SHARD_SIZE)
  if (unchangedIndex) summary.skipped += 1
  else {
    for (let i = 0; i < shards; i += 1) {
      writer.set(root.doc('placeIndex').collection('shards').doc(String(i)), { entries: data.index.slice(i * SHARD_SIZE, (i + 1) * SHARD_SIZE), updatedAt: now })
    }
    const previousValue: unknown = indexMetaSnap.data()?.shards
    const previous = count(previousValue) ? previousValue : 0
    for (let i = shards; i < previous; i += 1) writer.delete(root.doc('placeIndex').collection('shards').doc(String(i)))
    summary.written += 1
  }

  // Places: one document each, hash-gated; documents for places that no
  // longer qualify are removed.
  const keep = new Set<string>()
  for (const place of data.directory) {
    keep.add(place.placeId)
    const hash = hashOf(place)
    if (placeHash.get(place.placeId) === hash) summary.skipped += 1
    else put(root.doc('places').collection('items').doc(place.placeId), place, hash)
  }
  for (const id of placeHash.keys()) {
    if (keep.has(id)) continue
    writer.delete(root.doc('places').collection('items').doc(id))
    summary.removed += 1
  }

  await writer.close()
  if (!unchangedIndex) {
    const publication = phase()
    publication.set(root.doc('placeIndex'), { shards, count: data.index.length, contentHash: indexHash, updatedAt: now })
    await publication.close()
  }
  const completion = phase()
  completion.set(root.doc('meta'), {
    lastRunAt: now, places: data.directory.length, standingsRows: data.standings.rows.length,
    maitredVerification: { schemaVersion: maitred.schemaVersion, contentHash: maitredHash, verifiedAt: maitred.verifiedAt },
  })
  await completion.close()
  return summary
}
