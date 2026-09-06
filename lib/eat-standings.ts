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
 * Read from the aggregate document the hourly cron writes
 * (webAggregates/standings): a handful of document reads, never a
 * collection scan. The scan itself lives in lib/aggregates/compute.ts and
 * runs here only when no aggregate exists or the cron has been silent for
 * six hours, which is logged.
 */
export const getEatStandings = unstable_cache(
  async (): Promise<EatStandings> => {
    const db = getDb()
    if (!db) return EMPTY_STANDINGS
    try {
      const [stored, lastRun] = await Promise.all([readStandings(db), readLastRun(db)])
      const fresh = lastRun !== null && Date.now() - lastRun.getTime() < MAX_AGE_MS
      if (stored && fresh) return stored
      console.warn(`eat-standings: aggregate ${stored ? `stale (last run ${lastRun?.toISOString() ?? 'never'})` : 'missing'}; falling back to a live scan.`)
      return await computeEatStandings(db)
    } catch (err) {
      console.error('eat-standings: failed to read or compute standings; page shows the empty state.', err)
      return EMPTY_STANDINGS
    }
  },
  ['makan-eat-standings', 'v6'],
  { revalidate: 3600 },
)

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
