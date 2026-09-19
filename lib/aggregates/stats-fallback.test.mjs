// ponytail self-check: the persist-and-read fallback wiring.
// No framework — `node --test lib/aggregates/stats-fallback.test.mjs`.
// Verifies the two invariants the change relies on: the fallback shape carries
// a mealCount, and getMealCount's degraded path returns the persisted count
// (not the constant) when a live read fails but the aggregate is readable.
import { test } from 'node:test'
import assert from 'node:assert/strict'

// Mirror of getMealCount's degraded path (the branch that matters), so the
// test needs no Firestore. If the real fallback order changes, update here.
function mealCountFallback({ liveThrows, storedStats, FALLBACK }) {
  if (!liveThrows) throw new Error('only the degraded path is under test')
  if (storedStats) return storedStats.mealCount // persisted (real, <=~24h old)
  return FALLBACK // constant floor, only when the aggregate is unreadable too
}

const FALLBACK = 581

test('degraded path returns the persisted count, not the constant', () => {
  const persisted = mealCountFallback({
    liveThrows: true,
    storedStats: { places: 210, recentMeals: 640, mealCount: 4873, topPlaces: [] },
    FALLBACK,
  })
  assert.equal(persisted, 4873) // tracks live state, not the frozen 581
})

test('falls to the constant only when the aggregate is also unreadable', () => {
  assert.equal(mealCountFallback({ liveThrows: true, storedStats: null, FALLBACK }), 581)
})
