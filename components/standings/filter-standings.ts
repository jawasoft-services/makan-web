import type { StandingRow } from '@/lib/eat-standings'

const normalize = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().trim()

/** A display filter only: original order, rank and all source evidence stay intact. */
export function filterStandings(rows: StandingRow[], query: string) {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  return rows.map((row, index) => ({ row, rank: index + 1 })).filter(({ row }) => {
    const text = normalize(`${row.name} ${row.where?.city ?? ''} ${row.where?.country ?? ''}`)
    return terms.every((term) => text.includes(term))
  })
}
