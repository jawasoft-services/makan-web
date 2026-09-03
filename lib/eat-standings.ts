import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { getPlaceWhere, hasSeededWhere, type PlaceWhere } from '@/lib/place-city'
import { isCleanCaption } from '@/lib/makan-stats'
import { placeSlug, slugify } from '@/lib/slug'

/**
 * The Eat or Yeet standings (D-033, docs/superpowers/specs/2026-09-02-eats-standings-design.md).
 *
 * One Eat or Yeet comparison is one person choosing between two of their OWN
 * saved meals. When both meals are tagged to a restaurant and the restaurants
 * differ, the winner's restaurant gets an Eat and the loser's a Yeet (a tie
 * gives both a tie). Same-restaurant comparisons prove nothing about the place
 * and are skipped. Only totals ever leave this module: no user, no meal, no
 * individual pick is exposed. Public captions are the only user text, and
 * only clean ones.
 *
 * Source of truth today: the raw `rankingComparisons` and `meals` documents,
 * read server-side with the admin credential and reduced here. The app's own
 * server aggregate (RM19117, `eatEvidenceAggregateState`) is live in
 * production but only covers comparisons since mid-August 2026; once it is
 * backfilled this reader should switch to it. The rule applied here is the
 * same one that aggregate implements.
 */
export interface StandingRow {
  placeId: string
  /** URL slug: name plus six characters of the id. */
  slug: string
  name: string
  eats: number
  yeets: number
  ties: number
  matchups: number
  /** eats / matchups, 0..1 */
  eatRate: number
  /** ISO date of the first meal ever tagged to the place, or null. */
  since: string | null
  /** City and country, or null when the place can't be located. */
  where: PlaceWhere | null
  /** Public, active meals tagged to the place. */
  publicMeals: number
  /** Up to three recent, clean public captions saved here, newest first. */
  recentCaptions: string[]
  /** Position in the global standings (evidence floor met), else null. */
  rank: number | null
  /** Position in the city standings (city floor met, city page exists), else null. */
  cityRank: number | null
}

export interface CityStanding {
  slug: string
  city: string
  country: string
  /** Restaurants at or above the city floor, ranked. */
  rows: StandingRow[]
}

export interface EatStandings {
  /** Restaurants at or above the evidence floor, ranked. */
  rows: StandingRow[]
  /** Every restaurant with at least one verified matchup, same order. */
  all: StandingRow[]
  /** Cities with enough ranked restaurants for a page of their own. */
  cities: CityStanding[]
  /** Restaurants with at least one verified matchup but under the floor. */
  belowFloor: number
  /** Verified cross-restaurant matchups counted, all restaurants. */
  matchups: number
  /** Distinct countries among the ranked rows. */
  countries: number
  /** When this snapshot was computed (ISO). */
  computedAt: string
}

/** No score is shown below this many verified matchups (spec §2, RM19117 §6). */
export const EVIDENCE_FLOOR = 10
/** A city page ranks restaurants from this many matchups: a city is a smaller pool. */
export const CITY_FLOOR = 5
/** A city page needs at least this many restaurants over the city floor. */
export const MIN_CITY_ROWS = 2
const RECENT_CAPTIONS = 3

export const EMPTY_STANDINGS: EatStandings = { rows: [], all: [], cities: [], belowFloor: 0, matchups: 0, countries: 0, computedAt: '' }

interface PlaceRef {
  id: string
  name: string
}

const byEats = (x: StandingRow, y: StandingRow) =>
  y.eats - x.eats || y.eatRate - x.eatRate || (x.since ?? '').localeCompare(y.since ?? '')

export const getEatStandings = unstable_cache(
  async (): Promise<EatStandings> => {
    try {
      const db = getDb()
      if (!db) return EMPTY_STANDINGS

      const [mealsSnap, compsSnap] = await Promise.all([
        db
          .collection('meals')
          .select('placeProviderId', 'locationName', 'createdAt', 'isPublic', 'moderationStatus', 'caption')
          .get(),
        db.collection('rankingComparisons').select('mealAId', 'mealBId', 'winnerId').get(),
      ])

      // meal id -> place, plus per-place name votes, first-meal date, public meals and captions.
      const placeOfMeal = new Map<string, PlaceRef>()
      const nameVotes = new Map<string, Map<string, number>>()
      const firstMeal = new Map<string, number>()
      const publicMeals = new Map<string, number>()
      const captions = new Map<string, { at: number; caption: string }[]>()
      for (const doc of mealsSnap.docs) {
        const d = doc.data()
        const id = str(d.placeProviderId)
        if (!id) continue
        const name = str(d.locationName)
        placeOfMeal.set(doc.id, { id, name })
        if (name) {
          const votes = nameVotes.get(id) ?? new Map<string, number>()
          votes.set(name, (votes.get(name) ?? 0) + 1)
          nameVotes.set(id, votes)
        }
        const at = toMillis(d.createdAt)
        if (at && (!firstMeal.has(id) || at < (firstMeal.get(id) as number))) firstMeal.set(id, at)
        const isPublic = d.isPublic === true && (d.moderationStatus === undefined || d.moderationStatus === 'active')
        if (isPublic) {
          publicMeals.set(id, (publicMeals.get(id) ?? 0) + 1)
          const caption = str(d.caption)
          if (caption && isCleanCaption(caption)) {
            const list = captions.get(id) ?? []
            list.push({ at: at ?? 0, caption })
            captions.set(id, list)
          }
        }
      }

      const tally = new Map<string, { eats: number; yeets: number; ties: number }>()
      const bump = (id: string, key: 'eats' | 'yeets' | 'ties') => {
        const t = tally.get(id) ?? { eats: 0, yeets: 0, ties: 0 }
        t[key] += 1
        tally.set(id, t)
      }
      let matchups = 0
      for (const doc of compsSnap.docs) {
        const c = doc.data()
        const a = placeOfMeal.get(str(c.mealAId))
        const b = placeOfMeal.get(str(c.mealBId))
        if (!a || !b || a.id === b.id) continue
        const winner = str(c.winnerId)
        if (winner === 'tie') {
          bump(a.id, 'ties')
          bump(b.id, 'ties')
        } else if (winner === str(c.mealAId)) {
          bump(a.id, 'eats')
          bump(b.id, 'yeets')
        } else if (winner === str(c.mealBId)) {
          bump(b.id, 'eats')
          bump(a.id, 'yeets')
        } else {
          continue
        }
        matchups += 1
      }

      // Canonical display names where the app has them; the most-used tag otherwise.
      const ids = [...tally.keys()]
      const canonical = new Map<string, string>()
      if (ids.length) {
        const refs = ids.map((id) => db.collection('restaurants').doc(id))
        for (let i = 0; i < refs.length; i += 100) {
          const docs = await db.getAll(...refs.slice(i, i + 100), { fieldMask: ['displayName', 'locationName'] })
          for (const d of docs) {
            if (!d.exists) continue
            const name = str(d.data()?.displayName) || str(d.data()?.locationName)
            if (name) canonical.set(d.id, name)
          }
        }
      }

      const all: StandingRow[] = ids.map((id) => {
        const t = tally.get(id) as { eats: number; yeets: number; ties: number }
        const n = t.eats + t.yeets + t.ties
        const since = firstMeal.get(id)
        const name = canonical.get(id) || topVote(nameVotes.get(id)) || 'Unnamed place'
        const recent = (captions.get(id) ?? []).sort((x, y) => y.at - x.at)
        const seen = new Set<string>()
        const recentCaptions: string[] = []
        for (const r of recent) {
          const key = r.caption.toLowerCase()
          if (seen.has(key)) continue
          seen.add(key)
          recentCaptions.push(r.caption)
          if (recentCaptions.length >= RECENT_CAPTIONS) break
        }
        return {
          placeId: id,
          slug: placeSlug(name, id),
          name,
          eats: t.eats,
          yeets: t.yeets,
          ties: t.ties,
          matchups: n,
          eatRate: n ? t.eats / n : 0,
          since: since ? new Date(since).toISOString() : null,
          where: null,
          publicMeals: publicMeals.get(id) ?? 0,
          recentCaptions,
          rank: null,
          cityRank: null,
        }
      })
      all.sort(byEats)

      // Locate every place that is either already known (free) or big enough
      // to earn a paid lookup; tiny unseeded places stay unlocated.
      const locate = all.filter((r) => hasSeededWhere(r.placeId) || r.matchups >= CITY_FLOOR).map((r) => r.placeId)
      const where = await getPlaceWhere(locate)
      for (const r of all) r.where = where.get(r.placeId) ?? null

      // Spec §3: by Eats, then Eat rate, then the earlier first meal.
      const rows = all.filter((r) => r.matchups >= EVIDENCE_FLOOR)
      rows.forEach((r, i) => (r.rank = i + 1))

      // City pages: the same ranking inside one city, from the city floor.
      const cityMap = new Map<string, CityStanding>()
      for (const r of all) {
        if (!r.where || r.matchups < CITY_FLOOR) continue
        const slug = slugify(r.where.city)
        const c: CityStanding = cityMap.get(slug) ?? { slug, city: r.where.city, country: r.where.country, rows: [] }
        c.rows.push(r)
        cityMap.set(slug, c)
      }
      const cities = [...cityMap.values()]
        .filter((c) => c.rows.length >= MIN_CITY_ROWS)
        .sort((x, y) => y.rows.length - x.rows.length || x.city.localeCompare(y.city))
      for (const c of cities) c.rows.forEach((r, i) => (r.cityRank = i + 1))

      const countries = new Set(rows.map((r) => r.where?.country).filter(Boolean)).size

      return { rows, all, cities, belowFloor: all.length - rows.length, matchups, countries, computedAt: new Date().toISOString() }
    } catch {
      console.error('eat-standings: failed to compute standings; page shows the empty state.')
      return EMPTY_STANDINGS
    }
  },
  // Bump when the row shape or the place-label rule changes: labels are
  // computed inside this cache.
  ['makan-eat-standings', 'v4'],
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

function topVote(votes?: Map<string, number>): string {
  if (!votes) return ''
  let best = ''
  let n = 0
  for (const [name, count] of votes) if (count > n) (best = name), (n = count)
  return best
}

function toMillis(v: unknown): number | null {
  if (!v || typeof v !== 'object') return null
  const t = v as { toMillis?: () => number; _seconds?: number }
  if (typeof t.toMillis === 'function') return t.toMillis()
  if (typeof t._seconds === 'number') return t._seconds * 1000
  return null
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}
