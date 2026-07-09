import 'server-only'
import { getDb } from '@/lib/firebase-admin'

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
 * On any error / missing env / unreachable Firebase, returns
 * FALLBACK_MEAL_COUNT. The homepage cannot break on this path.
 */
export async function getMealCount(): Promise<number> {
  try {
    const db = getDb()
    if (!db) return FALLBACK_MEAL_COUNT

    const snap = await db.collection('meals').count().get()
    return clamp(snap.data().count, FALLBACK_MEAL_COUNT)
  } catch {
    console.error('makan-stats: failed to fetch meal count; using fallback.')
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

/** One homepage share-card "post" — the app's export-as-a-post format. */
export interface PublicMeal {
  src: string
  alt: string
  caption: string
  locationName: string
  mealType: string
  username: string
}

export const HOME_MEAL_STRIP_TARGET = 100

// Roughly 4 in 5 cards should be tagged to a real venue (the whole pitch is
// "remembered at <place>"), with 1 in 5 venue-less for texture. ~38% of recent
// public meals carry a venue, so a 6× overfetch reliably fills the venue bucket.
const VENUE_SHARE = 0.8
const OVERFETCH = 6

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
      const raw: Raw = {
        src,
        caption: str(d.caption),
        locationName,
        mealType: str(d.mealType),
        uid: str(d.userID) || str(d.uid),
        legacyName: str(d.userName),
      }
      // "Tagged to a venue" = a Google-Place id AND a name to show.
      if (str(d.placeProviderId) && locationName) venue.push(raw)
      else plain.push(raw)
    }

    const raws = interleaveByShare(venue, plain, limit, VENUE_SHARE)

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

    return raws.map((r) => {
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

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function mealAlt(caption: string, locationName: string): string {
  const c = caption || 'A meal'
  const l = locationName ? ` at ${locationName}` : ''
  return `${c}${l} — shared on Makan`
}
