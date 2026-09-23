import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { computeEatStandings } from '@/lib/aggregates/compute'
import { MAX_AGE_MS, readLastRun, readStandings } from '@/lib/aggregates/store'
import { EMPTY_STANDINGS, type CityStanding, type EatStandings, type StandingRow } from '@/lib/aggregates/types'

export { CITY_FLOOR, EMPTY_STANDINGS, EVIDENCE_FLOOR, MIN_CITY_ROWS } from '@/lib/aggregates/types'
export type { CityStanding, EatStandings, StandingRow } from '@/lib/aggregates/types'

/**
 * The Eat or Yeet standings (D-033, docs/superpowers/specs/2026-09-02-eats-standings-design.md).
 *
 * Read from the aggregate document the daily cron writes
 * (webAggregates/standings): a handful of document reads, never a
 * collection scan. The scan itself lives in lib/aggregates/compute.ts and
 * runs here only when no aggregate exists or the cron has been silent for
 * 36 hours, which is logged.
 */
export interface EatStandingsSnapshot {
  standings: EatStandings
  /** When this request last read a fresh aggregate or completed a fallback scan. */
  checkedAt: string | null
}

const getCachedEatStandingsSnapshot = unstable_cache(
  async (): Promise<EatStandingsSnapshot> => {
    const db = getDb()
    if (!db) return { standings: EMPTY_STANDINGS, checkedAt: null }
    try {
      const [stored, lastRun] = await Promise.all([readStandings(db), readLastRun(db)])
      const fresh = lastRun !== null && Date.now() - lastRun.getTime() < MAX_AGE_MS
      if (stored && fresh) return { standings: stored, checkedAt: lastRun.toISOString() }
      console.warn(`eat-standings: aggregate ${stored ? `stale (last run ${lastRun?.toISOString() ?? 'never'})` : 'missing'}; falling back to a live scan.`)
      const standings = await computeEatStandings(db)
      return { standings, checkedAt: new Date().toISOString() }
    } catch (err) {
      console.error('eat-standings: failed to read or compute standings; page shows the empty state.', err)
      return { standings: EMPTY_STANDINGS, checkedAt: null }
    }
  },
  ['makan-eat-standings', 'v7'],
  { revalidate: 3600 },
)

export async function getEatStandingsSnapshot(): Promise<EatStandingsSnapshot> {
  return getCachedEatStandingsSnapshot()
}

export async function getEatStandings(): Promise<EatStandings> {
  return (await getEatStandingsSnapshot()).standings
}

/** One restaurant by its URL slug, or null. */
export async function getPlaceStanding(slug: string): Promise<{ row: StandingRow; standings: EatStandings } | null> {
  const standings = await getEatStandings()
  const row = standings.all.find((r) => r.slug === slug)
  return row ? { row, standings } : null
}

/** One city's standings by slug, or null. */
export async function getCityStanding(slug: string): Promise<{ city: CityStanding; standings: EatStandings } | null> {
  const standings = await getEatStandings()
  const city = standings.cities.find((c) => c.slug === slug)
  return city ? { city, standings } : null
}
