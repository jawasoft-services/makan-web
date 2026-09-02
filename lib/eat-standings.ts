import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'

/**
 * The Eat or Yeet standings (D-033, docs/superpowers/specs/2026-09-02-eats-standings-design.md).
 *
 * One Eat or Yeet comparison is one person choosing between two of their OWN
 * saved meals. When both meals are tagged to a restaurant and the restaurants
 * differ, the winner's restaurant gets an Eat and the loser's a Yeet (a tie
 * gives both a tie). Same-restaurant comparisons prove nothing about the place
 * and are skipped. Only totals ever leave this module: no user, no meal, no
 * individual pick is exposed.
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
  name: string
  eats: number
  yeets: number
  ties: number
  matchups: number
  /** eats / matchups, 0..1 */
  eatRate: number
  /** ISO date of the first meal ever tagged to the place, or null. */
  since: string | null
}

export interface EatStandings {
  /** Restaurants at or above the evidence floor, ranked. */
  rows: StandingRow[]
  /** Restaurants with at least one verified matchup but under the floor. */
  belowFloor: number
  /** Verified cross-restaurant matchups counted, all restaurants. */
  matchups: number
  /** When this snapshot was computed (ISO). */
  computedAt: string
}

/** No score is shown below this many verified matchups (spec §2, RM19117 §6). */
export const EVIDENCE_FLOOR = 10

export const EMPTY_STANDINGS: EatStandings = { rows: [], belowFloor: 0, matchups: 0, computedAt: '' }

interface PlaceRef {
  id: string
  name: string
}

export const getEatStandings = unstable_cache(
  async (): Promise<EatStandings> => {
    try {
      const db = getDb()
      if (!db) return EMPTY_STANDINGS

      const [mealsSnap, compsSnap] = await Promise.all([
        db.collection('meals').select('placeProviderId', 'locationName', 'createdAt').get(),
        db.collection('rankingComparisons').select('mealAId', 'mealBId', 'winnerId').get(),
      ])

      // meal id -> place, plus per-place name votes and first-meal date.
      const placeOfMeal = new Map<string, PlaceRef>()
      const nameVotes = new Map<string, Map<string, number>>()
      const firstMeal = new Map<string, number>()
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
        return {
          placeId: id,
          name: canonical.get(id) || topVote(nameVotes.get(id)) || 'Unnamed place',
          eats: t.eats,
          yeets: t.yeets,
          ties: t.ties,
          matchups: n,
          eatRate: n ? t.eats / n : 0,
          since: since ? new Date(since).toISOString() : null,
        }
      })

      // Spec §3: by Eats, then Eat rate, then the earlier first meal.
      const rows = all
        .filter((r) => r.matchups >= EVIDENCE_FLOOR)
        .sort((x, y) => y.eats - x.eats || y.eatRate - x.eatRate || (x.since ?? '').localeCompare(y.since ?? ''))

      return { rows, belowFloor: all.length - rows.length, matchups, computedAt: new Date().toISOString() }
    } catch {
      console.error('eat-standings: failed to compute standings; page shows the empty state.')
      return EMPTY_STANDINGS
    }
  },
  ['makan-eat-standings', 'v1'],
  { revalidate: 3600 },
)

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
