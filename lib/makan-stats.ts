import { WEBSITE_FIXTURES, fixturePlaceStats, fixturePublicMeals } from '@/lib/website-fixtures'
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { computePlaceStats } from '@/lib/aggregates/compute'
import { MAX_AGE_MS, readLastRun, readStats } from '@/lib/aggregates/store'
import { FALLBACK_PLACE_STATS, type PlaceStats } from '@/lib/aggregates/types'
import { isPublicMeal, PUBLIC_MEAL_FIELDS } from '@/lib/public-meal'
import { isCleanCaption } from '@/lib/captions'

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
 * daily cron writes (webAggregates/stats). The scan runs only when the
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
// The pitch is places you sit down in. A delivery-branch tag proves the
// opposite of "know what to order at the table".
const DELIVERY_VENUE = /\b(delivery|gofood|grabfood|shopeefood|deliveroo|uber ?eats)\b/i
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

    // Join @usernames for meals that don't carry the legacy field.
    const uids = [...new Set(raws.filter((r) => r.uid).map((r) => r.uid))]
    const nameByUid = new Map<string, string>()
    if (uids.length) {
      const refs = uids.map((u) => db.collection('users').doc(u))
      const users = await db.getAll(...refs, { fieldMask: ['username'] })
      for (const u of users) {
        if (!u.exists) continue
        const data = u.data()
        const handle = str(data?.username)
        if (handle) nameByUid.set(u.id, handle)
      }
    }

    const eligible = raws
      .map((r) => {
        const username = nameByUid.get(r.uid) || r.legacyName || ''
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
