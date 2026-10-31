// RM20364 — "Find your restaurant" matching. Run: node scripts/claim-search.test.mjs
import assert from 'node:assert/strict'
import { mergeVenues, normalize, searchVenues } from '../lib/claim-search.ts'

const entries = [
  { placeId: 'a', name: 'Lucky Plaza', area: 'Pererenan', path: '/claim/lucky-plaza-e7adf6' },
  { placeId: 'b', name: 'The Lucky Dragon', area: 'London', path: '/claim/the-lucky-dragon-111111' },
  { placeId: 'c', name: 'Café Ubud', area: 'Ubud', path: '/claim/cafe-ubud-222222' },
  { placeId: 'd', name: 'Warung Makan', area: 'Canggu', path: '/claim/warung-makan-333333' },
]

assert.equal(normalize('  Café-Ubud!! '), 'cafe ubud')
assert.deepEqual(searchVenues(entries, 'lucky').map((e) => e.placeId), ['a', 'b'], 'a name that starts with the word comes first')
assert.deepEqual(searchVenues(entries, 'cafe').map((e) => e.placeId), ['c'], 'accents are ignored')
assert.deepEqual(searchVenues(entries, 'lucky london').map((e) => e.placeId), ['b'], 'every word must match, name or area')
assert.deepEqual(searchVenues(entries, 'zzz'), [])
assert.deepEqual(searchVenues(entries, 'l'), [], 'one letter is too short')
assert.deepEqual(searchVenues(entries, '   '), [])
assert.equal(searchVenues(entries, 'a', 2).length, 0, 'a single character never lists the whole directory')
assert.equal(searchVenues(Array.from({ length: 30 }, (_, i) => ({ placeId: String(i), name: `Warung ${i}`, area: '', path: `/claim/w${i}` })), 'warung').length, 8, 'results are capped')

const merged = mergeVenues(
  [{ placeId: 'a', name: 'Lucky Plaza', area: 'Pererenan', path: '/claim/prepared-token-aaaaaa' }],
  [{ placeId: 'a', name: 'Lucky Plaza', area: 'Bali', path: '/claim/lucky-plaza-e7adf6' }, { placeId: 'z', name: 'Zed', area: '', path: '/claim/zed-000000' }],
)
assert.equal(merged.length, 2)
assert.equal(merged.find((e) => e.placeId === 'a').path, '/claim/prepared-token-aaaaaa', 'a prepared claim link wins')
console.log('claim-search: ok')
