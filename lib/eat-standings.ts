import { WEBSITE_FIXTURES, FIXTURE_STATE, FIXTURE_CHECKED_AT, fixtureStandings } from '@/lib/website-fixtures'
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { getPublicVenues, getExcludedPublicVenueIds } from '@/lib/public-venues'
import { assembleEatStandings, computeEatStandings } from '@/lib/aggregates/compute'
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
    if (WEBSITE_FIXTURES) return { standings: fixtureStandings(), checkedAt: FIXTURE_STATE === "unavailable" ? null : FIXTURE_CHECKED_AT }
    const db = getDb()
    if (!db) throw new Error('Standings database unavailable.')
    const [stored, lastRun] = await Promise.all([readStandings(db), readLastRun(db)])
    const age = lastRun === null ? Infinity : Date.now() - lastRun.getTime()
    const fresh = age >= 0 && age < MAX_AGE_MS
    if (stored && fresh) return { standings: stored, checkedAt: lastRun!.toISOString() }
    console.warn(`eat-standings: aggregate ${stored ? `stale (last run ${lastRun?.toISOString() ?? 'never'})` : 'missing'}; falling back to a live scan.`)
    const standings = await computeEatStandings(db)
    return { standings, checkedAt: new Date().toISOString() }
  },
  ['makan-eat-standings', 'v8-validated-success'],
  { revalidate: 3600 },
)

export async function getEatStandingsSnapshot(): Promise<EatStandingsSnapshot> {
  try {
    const snapshot = await getCachedEatStandingsSnapshot()
    if (WEBSITE_FIXTURES) return snapshot
    let { standings } = snapshot
    const rows = [...standings.all, ...standings.rows, ...standings.cities.flatMap(city => city.rows)]
    if (!rows.length) return snapshot
    const excluded = new Set(await getExcludedPublicVenueIds())
    if (rows.some(row => excluded.has(row.placeId))) {
      standings = assembleEatStandings(standings.all.filter(row => !excluded.has(row.placeId)), standings.matchups, standings.computedAt)
    }
    const visible = standings === snapshot.standings ? snapshot : { ...snapshot, standings }
    if (!standings.all.some(row => row.lat === null || row.lng === null)) return visible
    try {
      // Complete coordinates outside the standings cache. A failed optional
      // projection read preserves the table and can recover on the next call.
      const venues = new Map((await getPublicVenues()).map(venue => [venue.placeId, venue]))
      const locate = (row: StandingRow): StandingRow => {
        const venue = venues.get(row.placeId)
        const lat = row.lat ?? venue?.lat ?? null
        const lng = row.lng ?? venue?.lng ?? null
        return lat === row.lat && lng === row.lng ? row : { ...row, lat, lng }
      }
      return { ...visible, standings: { ...standings, rows: standings.rows.map(locate), all: standings.all.map(locate),
        cities: standings.cities.map(city => ({ ...city, rows: city.rows.map(locate) })) } }
    } catch (error) {
      console.error('eat-standings: optional venue coordinates unavailable.', error)
      return visible
    }
  } catch (err) {
    console.error('eat-standings: failed to read or compute standings; page shows the empty state.', err)
    return { standings: EMPTY_STANDINGS, checkedAt: null }
  }
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
