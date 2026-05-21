import 'server-only'
import { getDb } from '@/lib/firebase-admin'

export interface MakanStats {
  userCount: number
  mealCount: number
}

// Shown if Firestore is unreachable at render time. Set to the prior
// hardcoded copy values so a fallback render is never "worse than today".
// Update if the live numbers grow far above this floor.
export const FALLBACK_STATS: MakanStats = {
  userCount: 160,
  mealCount: 581,
}

/**
 * Returns live total user and meal counts via Firestore aggregation queries
 * (.count() — billed at ~1 read per 1000 docs, vs 1 per doc for a fetch).
 *
 * Server-only: the `server-only` import causes build failure if any client
 * component imports this file, so the Firebase Admin credential cannot leak
 * into a browser bundle.
 *
 * On any error / missing env / unreachable Firebase, returns FALLBACK_STATS.
 * The homepage cannot break on this path.
 */
export async function getMakanStats(): Promise<MakanStats> {
  try {
    const db = getDb()
    if (!db) return FALLBACK_STATS

    const [usersSnap, mealsSnap] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('meals').count().get(),
    ])

    return {
      userCount: clamp(usersSnap.data().count, FALLBACK_STATS.userCount),
      mealCount: clamp(mealsSnap.data().count, FALLBACK_STATS.mealCount),
    }
  } catch {
    console.error('makan-stats: failed to fetch counts; using fallback.')
    return FALLBACK_STATS
  }
}

/** Coerce to a non-negative integer or fall back to a safe floor. */
function clamp(value: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback
  }
  return Math.floor(value)
}
