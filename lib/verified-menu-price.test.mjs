import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

function load(fixtures = false) {
  const exports = {}
  const code = ts.transpileModule(readFileSync('lib/verified-menu-price.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  runInNewContext(code, { exports, require(id) {
    if (id === 'server-only') return {}
    if (id === './website-fixtures') return { WEBSITE_FIXTURES: fixtures, FIXTURE_SLUG: 'kendal-street-kitchen-f10001' }
    throw new Error(`Unexpected import: ${id}`)
  } })
  return exports.getVerifiedMenuPrice
}

test('the published quote requires the verified venue and exact normalized dish', () => {
  const price = load()
  const slug = 'kendal-street-kitchen-f7d46b'
  for (const dish of ['Harissa prawns', 'Harisa prawns', '  HARISSA   PRAWNS  ']) {
    const result = price(slug, dish)
    assert.equal(result.price, '£10')
    assert.equal(result.menuUrl, 'https://kendalstreetkitchen.com/main-menu/')
    assert.equal(result.sourceImage, 'https://kendalstreetkitchen.com/wp-content/uploads/2024/05/KK-Menu-MAIN-A3_01-scaled.jpg')
    assert.equal(result.checkedOn, '2026-11-06')
  }
  for (const dish of [null, undefined, '', 'Prawns', 'Harissa prawn', 'Harissa prawns and bread', 'Grilled harissa prawns']) {
    assert.equal(price(slug, dish), null)
  }
  for (const other of ['kendal-street-kitchen', 'kendal-street-kitchen-ffffff', 'poppies', '']) {
    assert.equal(price(other, 'Harissa prawns'), null)
  }
})

test('the local venue alias is accepted only by the guarded fixture lane', () => {
  assert.equal(load()('kendal-street-kitchen-f10001', 'Harissa prawns'), null)
  assert.equal(load(true)('kendal-street-kitchen-f10001', 'Harissa prawns').price, '£10')
  assert.equal(load(true)('kendal-street-kitchen-f10002', 'Harissa prawns'), null)
  assert.equal(load(true)('kendal-street-kitchen-f10001', 'Prawns'), null)
})

test('the historical review retains the actual receipt price', () => {
  const exports = {}
  const code = ts.transpileModule(readFileSync('lib/reviews/kendal-street-kitchen.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText
  runInNewContext(code, { exports })
  const review = exports.kendalStreetKitchen
  assert.equal(review.visitDate, '2026-06-15')
  assert.equal(review.bill.lines.find(line => line.item === 'Harissa prawns').price, '£12.00')
})
