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
