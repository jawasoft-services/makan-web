import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { computePlaceStats } from '@/lib/aggregates/compute'
import { MAX_AGE_MS, readLastRun, readStats } from '@/lib/aggregates/store'
import { FALLBACK_PLACE_STATS, type PlaceStats } from '@/lib/aggregates/types'
import { isCleanCaption } from '@/lib/captions'

// Shown if Firestore is unreachable at render time. The previous hardcoded
// copy value — a safe floor that's never "worse than today".
export const FALLBACK_MEAL_COUNT = 581

/**
 * Returns the live total meal count via a Firestore aggregation query
 * (.count() — billed at ~1 read per 1000 docs, vs 1 per doc for a fetch).
 *
 * Server-only: the `server-only` import causes build failure if any client
 * component imports this file, so the Firebase Admin credential cannot leak
 * into a browser bundle.
 *
 * On any error / missing env / unreachable Firebase, falls back to the last
 * count the daily cron persisted (webAggregates/stats, at most ~a day old and
 * real), and only to FALLBACK_MEAL_COUNT if even that read fails. The homepage
 * cannot break on this path.
 */
export async function getMealCount(): Promise<number> {
  try {
    const db = getDb()
    if (!db) return FALLBACK_MEAL_COUNT

    const snap = await db.collection('meals').count().get()
    return clamp(snap.data().count, FALLBACK_MEAL_COUNT)
  } catch {
    // Live count failed: reuse the persisted aggregate the cron wrote, so the
    // fallback tracks live state instead of a frozen constant.
    console.error('makan-stats: failed to fetch meal count; reading persisted stats.')
    try {
      const db = getDb()
      const stored = db ? await readStats(db) : null
      if (stored) return stored.mealCount
    } catch {
      // fall through to the constant floor
    }
    return FALLBACK_MEAL_COUNT
  }
}

/** Coerce to a non-negative integer or fall back to a safe floor. */
function clamp(value: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback
  }
  return Math.floor(value)
}

export { FALLBACK_PLACE_STATS, TOP_PLACES } from '@/lib/aggregates/types'
export type { PlaceStats } from '@/lib/aggregates/types'

/**
 * The two numbers a restaurant owner asks for, read from the aggregate the
 * daily cron writes (webAggregates/stats). The scan runs only when the
 * aggregate is missing or stale, which is logged.
 */
export const getPlaceStats = unstable_cache(
  async (): Promise<PlaceStats> => {
    const db = getDb()
    if (!db) return FALLBACK_PLACE_STATS
    try {
      const [stored, lastRun] = await Promise.all([readStats(db), readLastRun(db)])
      const fresh = lastRun !== null && Date.now() - lastRun.getTime() < MAX_AGE_MS
      if (stored && fresh) return stored
      console.warn(`makan-stats: aggregate ${stored ? 'stale' : 'missing'}; falling back to a live scan.`)
      return await computePlaceStats(db)
    } catch {
      console.error('makan-stats: failed to read or compute place stats; using fallback.')
      return FALLBACK_PLACE_STATS
    }
  },
  ['makan-place-stats', 'v3'],
  { revalidate: 3600 },
)

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
// Candidates over the target so the handle filters below still leave a full strip.
const HANDLE_FILTER_SLACK = 12

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
  try {
    const db = getDb()
    if (!db) return []

    const snap = await db
      .collection('meals')
      .orderBy('createdAt', 'desc')
      .limit(limit * OVERFETCH)
      .select(
        'isPublic',
        'moderationStatus',
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
      if (d.isPublic !== true) continue
      if (d.moderationStatus !== undefined && d.moderationStatus !== 'active') continue
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

    const raws = interleaveByShare(venue, plain, limit + HANDLE_FILTER_SLACK, VENUE_SHARE)

    // Join @usernames for meals that don't carry the legacy field.
    const uids = [...new Set(raws.filter((r) => !r.legacyName && r.uid).map((r) => r.uid))]
    const nameByUid = new Map<string, string>()
    if (uids.length) {
      const refs = uids.map((u) => db.collection('users').doc(u))
      const users = await db.getAll(...refs, { fieldMask: ['username', 'name'] })
      for (const u of users) {
        if (!u.exists) continue
        const data = u.data()
        const handle = str(data?.username) || str(data?.name)
        if (handle) nameByUid.set(u.id, handle)
      }
    }

    return raws
      .map((r) => {
        const username = r.legacyName || nameByUid.get(r.uid) || ''
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
      .filter(perHandleCap(MAX_PER_HANDLE))
      .filter(uniqueDishAtPlace())
      .slice(0, limit)
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
