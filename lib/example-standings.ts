import type { Duel } from '../components/decision/EatOrYeetDuel'

/** Shared by the meal cards and table; undefined means before the pick. */
export function restaurantScore(meal: { eats: number; matchups: number }, won?: boolean) {
  const eats = meal.eats + Number(won === true)
  const matchups = meal.matchups + Number(won !== undefined)
  return { eats, matchups, rate: Math.round(100 * eats / matchups) }
}

/** Mock totals, real venues. Ties retain the fixture's earliest-evidence order. */
export function exampleStandings(duels: Duel[], picks: number) {
  const initial = [...duels.map(duel => duel.a), ...duels.map(duel => duel.b)]
  const rows = initial.map((meal, i) => ({
    name: meal.restaurant, ...restaurantScore(meal), evidenceOrder: i,
  }))
  for (const duel of duels.slice(0, picks)) {
    for (const side of ['a', 'b'] as const) {
      const row = rows.find(row => row.name === duel[side].restaurant)!
      Object.assign(row, restaurantScore(row, side === duel.winner))
    }
  }
  return rows.sort((a, b) => b.eats / b.matchups - a.eats / a.matchups || b.eats - a.eats || a.evidenceOrder - b.evidenceOrder)
    .map((row, i) => ({ ...row, rank: i + 1 }))
}
