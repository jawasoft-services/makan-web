import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import test from 'node:test'
import { ROOT, assertMintedCardsAreLocked, assertNoRepurpose, loadLock, loadRegistry, lockSync, validateRegistry } from './venue-lib.mjs'

const digest = path => createHash('sha256').update(readFileSync(path)).digest('hex')
const run = (script, cwd = ROOT) => spawnSync(process.execPath, [join(cwd, 'scripts', script)], { cwd, encoding: 'utf8' })

test('existing printed identities match the permanent lock and registry', () => {
  const registry = loadRegistry()
  const lock = loadLock()
  assert.deepEqual(validateRegistry(registry), [])
  assert.deepEqual(assertNoRepurpose(registry, lock), [])
  assert.deepEqual(assertMintedCardsAreLocked(lock), [])
  for (const venue of Object.values(registry)) {
    const card = readFileSync(join(ROOT, 'public', 'venue-qr', `${venue.slug}.svg`), 'utf8')
    const labels = [...card.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map(match => match[1])
    assert.equal(labels[2], lock[venue.slug].name)
    assert.equal(labels[3], lock[venue.slug].city.toUpperCase())
  }
})

test('printed names, cities and recorded place IDs cannot silently change; retirement stays valid', () => {
  const venue = { slug: 'test-venue', name: 'Original', city: 'London', googlePlaceId: 'ChIJoriginal' }
  const lock = { 'test-venue': { ...venue, mintedAt: '2026-01-01' } }
  for (const changed of [{ name: 'Different' }, { city: 'Elsewhere' }, { googlePlaceId: 'ChIJother' }, { googlePlaceId: undefined }]) {
    assert.ok(assertNoRepurpose({ 'test-venue': { ...venue, ...changed } }, lock).length > 0)
  }
  assert.deepEqual(assertNoRepurpose({}, lock), [])
  assert.deepEqual(assertNoRepurpose({ fresh: { slug: 'fresh', name: 'New venue', city: 'London' } }, lock), [])
  assert.ok(assertMintedCardsAreLocked({}).length > 0)
})

test('minting reserves a slug once and never overwrites an existing printed label', () => {
  const venue = { slug: 'test-venue', name: 'Original', city: 'London' }
  const lock = {}
  assert.equal(lockSync(lock, venue, '2026-01-01'), 'minted')
  const original = JSON.stringify(lock)
  assert.equal(lockSync(lock, venue, '2026-02-01'), null)
  assert.equal(lockSync(lock, { ...venue, name: 'Changed' }, '2026-02-01'), null)
  assert.equal(JSON.stringify(lock), original)
  assert.equal(lockSync(lock, { ...venue, googlePlaceId: 'ChIJfirst' }), 'filled')
  assert.equal(lock['test-venue'].mintedAt, '2026-01-01')
})

test('real check is idempotent and existing QR verification writes nothing', () => {
  const files = ['lib/venues.data.json', 'lib/venues.lock.json', ...readdirSync(join(ROOT, 'public', 'venue-qr')).map(name => `public/venue-qr/${name}`)]
  const before = files.map(path => digest(join(ROOT, path)))
  for (const script of ['venue-check.mjs', 'venue-check.mjs', 'verify-venue-qr.mjs']) {
    const result = run(script)
    assert.equal(result.status, 0, result.stderr || result.stdout)
  }
  assert.deepEqual(files.map(path => digest(join(ROOT, path))), before)
})

test('real check refuses a repurposed registry and a lost lock without changing fixture files', () => {
  const root = mkdtempSync(join(tmpdir(), 'makan-qr-guard-'))
  try {
    for (const dir of ['scripts', 'lib', 'public/venue-qr']) mkdirSync(join(root, dir), { recursive: true })
    for (const script of ['venue-check.mjs', 'venue-lib.mjs']) copyFileSync(join(ROOT, 'scripts', script), join(root, 'scripts', script))
    const data = join(root, 'lib', 'venues.data.json')
    const lock = join(root, 'lib', 'venues.lock.json')
    const card = join(root, 'public', 'venue-qr', 'test-venue.svg')
    writeFileSync(data, JSON.stringify({ 'test-venue': { slug: 'test-venue', name: 'Different', city: 'London' } }))
    writeFileSync(lock, JSON.stringify({ 'test-venue': { name: 'Original', city: 'London', mintedAt: '2026-01-01' } }))
    writeFileSync(card, '<svg><text>Makan</text><text>Tagline</text><text>Original</text><text>LONDON</text></svg>')
    const before = [data, lock, card].map(digest)
    const repurposed = run('venue-check.mjs', root)
    assert.notEqual(repurposed.status, 0)
    assert.match(repurposed.stderr, /PRINT-SAFETY/)
    assert.deepEqual([data, lock, card].map(digest), before)
    writeFileSync(lock, '{}')
    const lost = run('venue-check.mjs', root)
    assert.notEqual(lost.status, 0)
    assert.match(lost.stderr, /NO entry/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
