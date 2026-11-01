import type { DocumentSnapshot, Firestore } from 'firebase-admin/firestore'
import type { DirectoryPlace, MaitredList, MaitredNotes } from './types'

/**
 * Every restaurant with a current Maître d', read the way the app's
 * Firestore rules let a signed-in diner see it (munchies-rn
 * firebase/firestore.rules, RM19505):
 *
 *  - the feature document maitredFeature/current is on and not killed;
 *  - the standing is "retained" and its holder still takes part
 *    (users/{uid}/maitredSettings/participation is absent or enabled);
 *  - a menu is shown only while its author still holds the seat, it passed
 *    moderation, and it was published after the holder's last opt-out.
 *
 * The website is public, so it never shows more than a signed-in diner
 * sees. Test accounts and test venues are left out. Only the holder's
 * display name, profile photo and published notes leave; no counts, days
 * or rivals.
 */

export interface MaitredHolder {
  placeId: string
  holderName: string
  holderPhoto: string | null
  notes: MaitredNotes
}

const TEST_HOLDER = /\btest\b/i
const STORAGE = 'https://firebasestorage.googleapis.com/'
const NO_NOTES: MaitredNotes = { always: '', another: '', why: '', tip: '' }

export async function readMaitredHolders(db: Firestore): Promise<MaitredHolder[]> {
  const feature = (await db.doc('maitredFeature/current').get()).data()
  if (feature?.enabled !== true || feature.killSwitch === true) return []

  const standings = await db.collection('maitredStanding').where('outcome', '==', 'retained').select('holderUid', 'holderDisplayName', 'holderPhotoUrl').get()
  const rows = standings.docs
    .map((d) => ({ placeId: d.id, uid: str(d.get('holderUid')), name: str(d.get('holderDisplayName')), photo: str(d.get('holderPhotoUrl')) }))
    .filter((r) => r.uid && r.name && !TEST_HOLDER.test(r.name))
  if (!rows.length) return []

  const uids = [...new Set(rows.map((r) => r.uid))]
  const [menus, participation, venues] = await Promise.all([
    getAll(db, rows.map((r) => `maitredMenus/${r.placeId}`)),
    getAll(db, uids.map((u) => `users/${u}/maitredSettings/participation`)),
    getAll(db, rows.map((r) => `restaurants/${r.placeId}`), ['isTestVenue']),
  ])
  const settingsOf = new Map(uids.map((u, i) => [u, participation[i].exists ? participation[i].data() ?? {} : null]))

  return rows.flatMap((r, i) => {
    const settings = settingsOf.get(r.uid)
    if (settings && settings.enabled === false) return []
    if (venues[i].get('isTestVenue') === true) return []
    return [{ placeId: r.placeId, holderName: r.name, holderPhoto: r.photo.startsWith(STORAGE) ? r.photo : null, notes: notesOf(menus[i], r.uid, settings) }]
  })
}

function notesOf(menu: DocumentSnapshot, uid: string, settings: Record<string, unknown> | null | undefined): MaitredNotes {
  const m = menu.exists ? menu.data() ?? {} : null
  if (!m || m.authorUid !== uid || m.moderation !== 'visible' || m.participationWithdrawn === true) return NO_NOTES
  if (settings && Number(m.participationRevision ?? 0) < Number(settings.lastOptOutRevision ?? 0)) return NO_NOTES
  const e = (m.entries ?? {}) as Record<string, unknown>
  return { always: str(e.alwaysOrderThis), another: str(e.anotherDish), why: str(e.whyOrderThis), tip: str(e.orderingTip) }
}

/**
 * The list the pages render: holders whose restaurant has a page, with the
 * page's name, slug and place, and its newest public meal photo. Restaurants
 * whose Maître d' left a note come first.
 */
export function buildMaitredList(holders: MaitredHolder[], directory: DirectoryPlace[]): MaitredList {
  const byId = new Map(directory.map((p) => [p.placeId, p]))
  const venues = holders.flatMap((h) => {
    const place = byId.get(h.placeId)
    if (!place) return []
    const meal = place.meals[0]
    return [{ ...h, slug: place.slug, name: place.name, where: place.where, photo: meal ? meal.thumb || meal.src : null }]
  })
  venues.sort((x, y) => Number(!x.notes.always) - Number(!y.notes.always) || Number(!x.photo) - Number(!y.photo) || x.name.localeCompare(y.name))
  return { venues }
}

async function getAll(db: Firestore, paths: string[], fieldMask?: string[]): Promise<DocumentSnapshot[]> {
  const out: DocumentSnapshot[] = []
  for (let i = 0; i < paths.length; i += 100) {
    const refs = paths.slice(i, i + 100).map((p) => db.doc(p))
    out.push(...(fieldMask ? await db.getAll(...refs, { fieldMask }) : await db.getAll(...refs)))
  }
  return out
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}
