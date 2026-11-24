import { WEBSITE_FIXTURES, fixturePlaceStats, fixturePublicMeals } from '@/lib/website-fixtures'
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { computePlaceStats } from '@/lib/aggregates/compute'
import { MAX_AGE_MS, readLastRun, readStats } from '@/lib/aggregates/store'
import { FALLBACK_PLACE_STATS, type PlaceStats } from '@/lib/aggregates/types'
import { isPublicMeal, PUBLIC_MEAL_FIELDS } from '@/lib/public-meal'
import { isCleanCaption } from '@/lib/captions'
import { DELIVERY_VENUE, selectDishWall, type WallCandidate, type WallMeal } from '@/lib/dish-wall'
import { accountDeletionFencePath, chosenHandle, isVisiblePublicProfile, mayAppearOnPublicPage } from '@/lib/profile-visibility'
import { AGE_FIELDS, USER_FIELDS, storagePhoto } from '@/lib/public-profile-data'
import type { Firestore } from 'firebase-admin/firestore'

/** Live count first; persisted real count on failure, never a fabricated total. */
export async function getMealCount(): Promise<number | null> {
  if (WEBSITE_FIXTURES) return fixturePlaceStats().mealCount
  try {
    const db = getDb()
    if (!db) return null

    const snap = await db.collection('meals').count().get()
    const count = snap.data().count
    if (!Number.isSafeInteger(count) || count < 0) throw new Error('Invalid meal count.')
    return count
  } catch {
    // Live count failed: reuse the persisted aggregate the cron wrote, so the
    // fallback tracks live state instead of a frozen constant.
    console.error('makan-stats: failed to fetch meal count; reading persisted stats.')
    try {
      const db = getDb()
      const stored = db ? await readStats(db) : null
      if (stored && Number.isSafeInteger(stored.mealCount) && stored.mealCount >= 0) return stored.mealCount
    } catch {
      // Leave the total unavailable when neither source can verify it.
    }
    return null
  }
}

export { FALLBACK_PLACE_STATS, TOP_PLACES } from '@/lib/aggregates/types'
export type { PlaceStats } from '@/lib/aggregates/types'

/**
 * The two numbers a restaurant owner asks for, read from the aggregate the
 * hourly Firebase Scheduler job writes (webAggregates/stats). The scan runs only when the
 * aggregate is missing or stale, which is logged.
 */
const getCachedPlaceStats = unstable_cache(
  async (): Promise<PlaceStats> => {
    if (WEBSITE_FIXTURES) return fixturePlaceStats()
    const db = getDb()
    if (!db) throw new Error('Place statistics database unavailable.')
    const [stored, lastRun] = await Promise.all([readStats(db), readLastRun(db)])
    const fresh = lastRun !== null && Date.now() >= lastRun.getTime() && Date.now() - lastRun.getTime() < MAX_AGE_MS
    if (stored && fresh) return stored
    console.warn(`makan-stats: aggregate ${stored ? 'stale' : 'missing'}; falling back to a live scan.`)
    return computePlaceStats(db)
  },
  ['makan-place-stats', 'v4-recovery'],
  { revalidate: 3600 },
)

export async function getPlaceStats(): Promise<PlaceStats> {
  try { return await getCachedPlaceStats() }
  catch { console.error('makan-stats: failed to read place statistics.'); return FALLBACK_PLACE_STATS }
}

/** One homepage share-card "post" — the app's export-as-a-post format. */
export interface PublicMeal {
  src: string
  alt: string
  caption: string
  locationName: string
  mealType: string
  username: string
}

// Enough variety for several swipes without mounting hundreds of image cards.
// Remote Firebase photos are served directly (not through a billed Vercel
// transformation), so keep the swipeable strip rich without making a visitor
// download dozens of full-size originals.
export const HOME_MEAL_STRIP_TARGET = 12

// Roughly 4 in 5 cards should be tagged to a real venue (the whole pitch is
// "remembered at <place>"), with 1 in 5 venue-less for texture. ~38% of recent
// public meals carry a venue, so a 6× overfetch reliably fills the venue bucket.
const VENUE_SHARE = 0.8
const OVERFETCH = 16
// A card with no caption, or a caption that is just the meal type, reads as
// an empty post on a page whose whole claim is "people remember meals here".
const GENERIC_CAPTION = /^(breakfast|lunch|dinner|snack|brunch|supper|food|meal|yum|yummy)[.!]*$/i
// Accounts that never chose a handle get an auto one (user_xxxx). Real proof
// has a name on it.
const AUTO_HANDLE = /^user_/i
const AUTO_HANDLE_MENTION = /@user_/i
// A caption that swears is fine in the app and wrong on the front page.
const ROUGH_CAPTION = /\b(fuck\w*|shit\w*|asf|af|wtf|bitch|cunt|dick)\b/i
// A one-word caption ("Lamb") is a label, not a memory. Two words minimum.
const MIN_CAPTION_WORDS = 2
// Twelve cards from three accounts reads as one family's diary. Two per handle.
const MAX_PER_HANDLE = 2

/**
 * Returns up to `limit` of the most recent PUBLIC meal posts for the homepage
 * strip, weighted ~VENUE_SHARE to meals tagged to a real venue (Google Place
 * — `placeProviderId` + a `locationName` to display) and the remainder to
 * venue-less meals, then interleaved so the two mix through the strip.
 *
 * Friends-only meals must never reach the public site, so `isPublic === true`
 * is enforced here — in code rather than in the query, because `isPublic ==`
 * + `orderBy createdAt` would need a composite index that doesn't exist.
 * Non-active moderationStatus is dropped too.
 *
 * Usernames: recent meal docs carry only uid/userID (the legacy `userName`
 * field is sparse), so handles are joined from `users/<uid>.username`.
 *
 * Only meals with a real caption and a chosen handle make the strip: a card
 * that says "Dinner" by "@user_V3DL…" is not proof of anything.
 *
 * Returns [] on any failure — the component falls back to bundled photos.
 */
export async function getRecentPublicMeals(
  limit = HOME_MEAL_STRIP_TARGET,
): Promise<PublicMeal[]> {
  if (WEBSITE_FIXTURES) return fixturePublicMeals().slice(0, limit)
  try {
    const db = getDb()
    if (!db) return []

    const snap = await db
      .collection('meals')
      .orderBy('createdAt', 'desc')
      .limit(limit * OVERFETCH)
      .select(
        ...PUBLIC_MEAL_FIELDS,
        'imageURL',
        'caption',
        'locationName',
        'mealType',
        'placeProviderId',
        'userName',
        'userID',
        'uid',
      )
      .get()

    type Raw = Omit<PublicMeal, 'username' | 'alt'> & {
      uid: string
      legacyName: string
    }
    const venue: Raw[] = []
    const plain: Raw[] = []
    for (const doc of snap.docs) {
      const d = doc.data()
      if (!isPublicMeal(d)) continue
      const src = typeof d.imageURL === 'string' ? d.imageURL : ''
      if (!src.startsWith('https://firebasestorage.googleapis.com/')) continue
      const locationName = str(d.locationName)
      const caption = str(d.caption)
      if (!caption || GENERIC_CAPTION.test(caption)) continue
      if (caption.split(/\s+/).filter((w) => /\p{L}|\p{N}/u.test(w)).length < MIN_CAPTION_WORDS) continue
      if (DELIVERY_VENUE.test(locationName)) continue
      // "…by @user_V3DL…" inside a caption leaks the same auto handle.
      if (AUTO_HANDLE_MENTION.test(caption)) continue
      if (ROUGH_CAPTION.test(caption)) continue
      const raw: Raw = {
        src,
        caption,
        locationName,
        mealType: str(d.mealType),
        uid: str(d.userID) || str(d.uid),
        legacyName: str(d.userName),
      }
      // "Tagged to a venue" = a Google-Place id AND a name to show.
      if (str(d.placeProviderId) && locationName) venue.push(raw)
      else plain.push(raw)
    }

    const raws = interleaveByShare(venue, plain, venue.length + plain.length, VENUE_SHARE)

    // The same standing check as every other public page: an author who is suspended, under the
    // minimum age or being deleted never appears, whatever the meal's own flag says.
    const authors = await loadAuthors(db, raws.map((r) => r.uid))

    const eligible = raws
      .filter((r) => authors.get(r.uid)?.mayAppear)
      .map((r) => {
        const username = authors.get(r.uid)?.username || r.legacyName || ''
        return {
          src: r.src,
          caption: r.caption,
          locationName: r.locationName,
          mealType: r.mealType,
          username,
          alt: mealAlt(r.caption, r.locationName),
        }
      })
      .filter((m) => m.username && !AUTO_HANDLE.test(m.username))
      .filter(uniqueDishAtPlace())
      .filter(perHandleCap(MAX_PER_HANDLE))
    const venueSources = new Set(venue.map(meal => meal.src))
    return interleaveByShare(eligible.filter(meal => venueSources.has(meal.src)), eligible.filter(meal => !venueSources.has(meal.src)), limit, VENUE_SHARE)
  } catch {
    console.error('makan-stats: failed to fetch public meals; using bundled fallback.')
    return []
  }
}

/**
 * Merges two recency-ordered lists into `total` items at the given `primary`
 * share, distributing the minority evenly through the result (not clumped at
 * one end). If one list runs short, the other backfills so the strip always
 * fills to `total` where possible.
 */
function interleaveByShare<T>(primary: T[], secondary: T[], total: number, share: number): T[] {
  const wantPrimary = Math.min(primary.length, Math.round(total * share))
  const wantSecondary = Math.min(secondary.length, total - wantPrimary)
  // Backfill toward `total` when one bucket is short.
  const finalPrimary = Math.min(primary.length, total - wantSecondary)
  const p = primary.slice(0, finalPrimary)
  const s = secondary.slice(0, wantSecondary)
  if (!s.length) return p
  if (!p.length) return s

  const out: T[] = []
  const step = p.length / s.length // emit one secondary per `step` primaries
  let si = 0
  for (let pi = 0; pi < p.length; pi++) {
    out.push(p[pi])
    while (si < s.length && (si + 1) * step <= pi + 1) {
      out.push(s[si])
      si++
    }
  }
  while (si < s.length) out.push(s[si++])
  return out
}

/** Drops a second card for the same caption at the same place (two friends, one dinner). */
function uniqueDishAtPlace() {
  const seen = new Set<string>()
  return (m: PublicMeal) => {
    const key = `${m.caption.toLowerCase()}|${m.locationName.toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }
}

/** Keeps the first `max` cards per handle (case-insensitive), in order. */
function perHandleCap(max: number) {
  const seen = new Map<string, number>()
  return (m: PublicMeal) => {
    const key = m.username.toLowerCase()
    const n = (seen.get(key) ?? 0) + 1
    seen.set(key, n)
    return n <= max
  }
}

export { isCleanCaption }

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function mealAlt(caption: string, locationName: string): string {
  const c = caption || 'A meal'
  const l = locationName ? ` at ${locationName}` : ''
  return `${c}${l} — shared on Makan`
}

type Author = { mayAppear: boolean; username: string; handle: string }

/** Each author's standing (users, age record, deletion fence: three reads each, one batch). */
async function loadAuthors(db: Firestore, uids: readonly string[]): Promise<Map<string, Author>> {
  const ids = [...new Set(uids.filter((u) => u && !u.includes('/')))]
  const out = new Map<string, Author>()
  if (!ids.length) return out
  const year = new Date().getUTCFullYear()
  const refs = ids.flatMap((uid) => [db.doc(`users/${uid}`), db.doc(`users/${uid}/private/age`), db.doc(accountDeletionFencePath(uid))])
  const snaps = await db.getAll(...refs, { fieldMask: [...USER_FIELDS, ...AGE_FIELDS] })
  ids.forEach((uid, i) => {
    const [user, age, fence] = snaps.slice(i * 3, i * 3 + 3)
    const account = { user: user.data(), age: age.data(), fenced: fence.exists }
    out.set(uid, {
      mayAppear: mayAppearOnPublicPage(account, year),
      username: str(user.data()?.username),
      handle: isVisiblePublicProfile(account, year) ? chosenHandle(account.user ?? {}).slice(0, 24) : '',
    })
  })
  return out
}

// Recent public meals scanned per rebuild; ~4 in 10 carry a venue, and the wall needs 42.
const WALL_SCAN = 400
const DISH_FIELDS = ['uid', 'placeId', 'name', 'retracting', 'dishIsDrink']

export type DishWall = { previews: WallMeal[]; wall: WallMeal[] }

/**
 * The homepage dish wall: recent public meals tagged at a venue, dish-tagged first, with every
 * public-page gate (lib/dish-wall.ts has the rules). Null on failure or in the fixture lane; the
 * page then shows its bundled set.
 */
async function readDishWall(): Promise<DishWall | null> {
  if (WEBSITE_FIXTURES) return null
  {
    const db = getDb()
    if (!db) return null
    const snap = await db.collection('meals').orderBy('createdAt', 'desc').limit(WALL_SCAN)
      .select(...PUBLIC_MEAL_FIELDS, 'imageURL', 'caption', 'locationName', 'mealType', 'placeProviderId', 'userID', 'uid')
      .get()
    const meals = snap.docs.map((doc) => ({ id: doc.id, d: doc.data() })).filter(({ id, d }) =>
      !id.includes('/') && isPublicMeal(d) && storagePhoto(d.imageURL) && str(d.placeProviderId) && str(d.locationName)
      && !DELIVERY_VENUE.test(str(d.locationName)) && (str(d.userID) || str(d.uid)))
    if (!meals.length) return null
    const [dishes, authors] = await Promise.all([
      db.getAll(...meals.map(({ id }) => db.doc(`dishMemberships/${id}`)), { fieldMask: DISH_FIELDS }),
      loadAuthors(db, meals.map(({ d }) => str(d.userID) || str(d.uid))),
    ])
    const candidates: WallCandidate[] = []
    meals.forEach(({ id, d }, i) => {
      const uid = str(d.userID) || str(d.uid)
      const author = authors.get(uid)
      if (!author?.mayAppear) return
      // The dish line comes only from a membership bound to this meal's owner and venue (as the app's Feed).
      const m = dishes[i].data()
      const bound = m && m.retracting !== true && m.uid === uid && str(m.placeId) === str(d.placeProviderId) && m.dishIsDrink !== true
      candidates.push({
        id, uid, photo: storagePhoto(d.imageURL), dish: bound ? str(m.name).slice(0, 120) : '', caption: str(d.caption),
        locationName: str(d.locationName).slice(0, 100), mealType: str(d.mealType), handle: author.handle,
      })
    })
    const wall = selectDishWall(candidates)
    // Too few to fill a page is a failure: thrown, so it is not cached for a day.
    if (wall.previews.length < 3 || wall.wall.length < 12) throw new Error('Dish wall too thin.')
    return wall
  }
}

// Devon, 24 Nov 2026: refreshed once a day. A meal made private (or an author fenced) can stay on
// the wall for up to a day; every other public page re-checks on its own schedule. A failed read
// throws inside the cache, so the next visit retries instead of keeping the bundled set all day.
const getCachedDishWall = unstable_cache(readDishWall, ['makan-dish-wall', 'v1'], { revalidate: 86400 })

export async function getDishWall(): Promise<DishWall | null> {
  try { return await getCachedDishWall() }
  catch { console.error('makan-stats: failed to read the dish wall; using the bundled set.'); return null }
}
