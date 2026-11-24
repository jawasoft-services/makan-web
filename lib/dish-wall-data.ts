import 'server-only'
import { unstable_cache } from 'next/cache'
import type { Firestore } from 'firebase-admin/firestore'
import { getDb } from '@/lib/firebase-admin'
import { WEBSITE_FIXTURES } from '@/lib/website-fixtures'
import { isPublicMeal, PUBLIC_MEAL_FIELDS } from '@/lib/public-meal'
import { DELIVERY_VENUE, selectDishWall, type WallCandidate, type WallMeal } from '@/lib/dish-wall'
import { accountDeletionFencePath, chosenHandle, isVisiblePublicProfile, mayAppearOnPublicPage } from '@/lib/profile-visibility'
import { AGE_FIELDS, USER_FIELDS, storagePhoto } from '@/lib/public-profile-data'

/**
 * Reads for the homepage dish wall (lib/dish-wall.ts has the rules), and the author check every
 * homepage meal list shares. Kept apart from lib/makan-stats.ts so the gates run in tests without
 * the aggregate code (lib/dish-wall-reads.test.mjs).
 */

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '')

export type Author = { mayAppear: boolean; username: string; handle: string }

/** Each author's standing (users, age record, deletion fence: three reads each, one batch). */
export async function loadAuthors(db: Firestore, uids: readonly string[]): Promise<Map<string, Author>> {
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

// Recent public meals scanned per rebuild. Measured on production, 24 Nov 2026: the newest 400 held
// 54 venue-tagged public meals from 16 authors (11 spiral cards after the per-account cap, too thin);
// the newest 1,200 (back to 27 Aug) gave 223 from 25 authors: 5 previews and 29 spiral cards.
// About 1,500 reads per daily rebuild with the dish and author checks.
const WALL_SCAN = 1200
const DISH_FIELDS = ['uid', 'placeId', 'name', 'retracting', 'dishIsDrink']

export type DishWall = { previews: WallMeal[]; wall: WallMeal[]; fallback: number }

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
      .select(...PUBLIC_MEAL_FIELDS, 'imageURL', 'caption', 'locationName', 'mealType', 'placeProviderId', 'isRestaurantTagged', 'userID', 'uid')
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
        restaurant: d.isRestaurantTagged === true,
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

// ponytail: per-instance backoff, not shared state. A failed or thin read is not cached, so without this
// every visit would rescan; with it each server instance retries at most every ten minutes.
const RETRY_MS = 10 * 60 * 1000
let failedAt = 0

export async function getDishWall(): Promise<DishWall | null> {
  if (failedAt && Date.now() - failedAt < RETRY_MS) return null
  try { const wall = await getCachedDishWall(); failedAt = 0; return wall }
  catch (error) {
    failedAt = Date.now()
    console.error('dish-wall: read failed; using the bundled set.', error instanceof Error ? error.message : error)
    return null
  }
}
