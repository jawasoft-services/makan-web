import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

const source = readFileSync(new URL('./filter-standings.ts', import.meta.url), 'utf8')
const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText
const { filterStandings } = await import(`data:text/javascript;base64,${Buffer.from(output).toString('base64')}`)
const rows = [
  { placeId: 'first', name: 'Café One', eatRate: 0.7, eats: 7, matchups: 10, where: { city: 'London', country: 'UK' } },
  { placeId: 'second', name: 'Warung Dua', eatRate: 0.5, eats: 5, matchups: 10, where: { city: 'Bandung', country: 'Indonesia' } },
  { placeId: 'third', name: 'Another Cafe', eatRate: 0.2, eats: 2, matchups: 10, where: null },
]

test('filtering preserves source rank, row identity and rate instead of reranking', () => {
  assert.deepEqual(filterStandings(rows, '  BANDUNG  '), [{ row: rows[1], rank: 2 }])
  assert.equal(filterStandings(rows, 'indonesia')[0].row, rows[1])
})
test('name and city terms combine; accents and unknown geography work', () => {
  assert.deepEqual(filterStandings(rows, 'cafe london'), [{ row: rows[0], rank: 1 }])
  assert.deepEqual(filterStandings(rows, 'another'), [{ row: rows[2], rank: 3 }])
  assert.deepEqual(filterStandings(rows, 'not here'), [])
})
test('clearing restores the complete original list without mutating data', () => {
  const before = JSON.stringify(rows)
  filterStandings(rows, 'warung')
  assert.deepEqual(filterStandings(rows, '  ').map(({ row }) => row), rows)
  assert.equal(JSON.stringify(rows), before)
  assert.deepEqual(filterStandings([], 'london'), [])
})
