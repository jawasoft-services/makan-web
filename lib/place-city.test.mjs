import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const HOUR = 60 * 60 * 1000
const BALI = {
  addressComponents: [
    { longText: 'Canggu', types: ['administrative_area_level_3'] },
    { longText: 'Badung Regency', types: ['administrative_area_level_2'] },
    { longText: 'Bali', types: ['administrative_area_level_1'] },
    { longText: 'Indonesia', shortText: 'ID', types: ['country'] },
  ],
}

class Timestamp {
  constructor(ms) { this.ms = ms }
  toMillis() { return this.ms }
  static now() { return new Timestamp(Date.now()) }
}

/** A Firestore stand-in holding webCache/placeCities/places docs by place id. */
function fakeDb(docs = new Map(), { failReads = false } = {}) {
  const doc = (id) => ({
    async get() {
      if (failReads) throw new Error('firestore down')
      return { data: () => docs.get(id) }
    },
    async set(value, opts) {
      assert.equal(opts?.merge, true) // a merge keeps an older raw row when only failedAt changes
      docs.set(id, { ...(docs.get(id) ?? {}), ...value })
    },
  })
  return { docs, db: { collection: () => ({ doc: () => ({ collection: () => ({ doc }) }) }) } }
}

/** Loads lib/place-city.ts with Google answering `status` and counts the calls. */
function load({ db, status = 200 }) {
  const calls = []
  const exports = {}
  const code = ts.transpileModule(readFileSync('lib/place-city.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, resolveJsonModule: true },
  }).outputText
  runInNewContext(code, {
    exports,
    console,
    async fetch(url, init) {
      calls.push({ url, mask: init.headers['X-Goog-FieldMask'] })
      return { ok: status === 200, status, json: async () => BALI }
    },
    process: { env: {} },
    require(id) {
      if (id === 'server-only') return {}
      if (id === 'next/cache') return { unstable_cache: (fn) => fn }
      if (id === 'google-auth-library') return { GoogleAuth: class { async getClient() { return { getAccessToken: async () => 'token' } } }, JWT: class {} }
      if (id === 'firebase-admin/firestore') return { Timestamp }
      if (id === '@/lib/data/place-cities.json') return { default: {} }
      if (id === '@/lib/firebase-admin') return { getDb: () => db }
      if (id === '@/lib/gcp-federation') return { federatedCredentials: () => null }
      if (id === '@/lib/website-fixtures') return { WEBSITE_FIXTURES: false }
      throw new Error(`Unexpected import: ${id}`)
    },
  })
  return { getPlaceWhere: exports.getPlaceWhere, calls }
}

const settle = () => new Promise((r) => setImmediate(r))

test('a stored lookup survives a new deploy without calling Google again', async () => {
  const store = fakeDb()
  const first = load({ db: store.db })
  const where = await first.getPlaceWhere(['p1'])
  assert.deepEqual({ ...where.get('p1') }, { city: 'Canggu, Bali', country: 'Indonesia' })
  assert.equal(first.calls.length, 1)
  assert.equal(first.calls[0].mask, 'addressComponents')
  await settle()
  assert.equal(store.docs.get('p1').failedAt, null)

  const afterDeploy = load({ db: store.db })
  const again = await afterDeploy.getPlaceWhere(['p1'])
  assert.deepEqual({ ...again.get('p1') }, { city: 'Canggu, Bali', country: 'Indonesia' })
  assert.equal(afterDeploy.calls.length, 0)
})

test('a refusal is remembered for six hours, then retried', async () => {
  const store = fakeDb()
  const refused = load({ db: store.db, status: 429 })
  assert.equal((await refused.getPlaceWhere(['p1'])).get('p1'), null)
  assert.equal(refused.calls.length, 1)
  await settle()
  assert.ok(store.docs.get('p1').failedAt instanceof Timestamp)

  const soon = load({ db: store.db })
  assert.equal((await soon.getPlaceWhere(['p1'])).get('p1'), null)
  assert.equal(soon.calls.length, 0)

  store.docs.set('p1', { failedAt: new Timestamp(Date.now() - 7 * HOUR) })
  const later = load({ db: store.db })
  assert.equal((await later.getPlaceWhere(['p1'])).get('p1').city, 'Canggu, Bali')
  assert.equal(later.calls.length, 1)
})

test('content older than 30 days is fetched again, and a failed refetch keeps nothing stale on screen', async () => {
  const old = new Timestamp(Date.now() - 31 * 24 * HOUR)
  const store = fakeDb(new Map([['p1', { raw: { loc: 'Old', a1: '', a2: '', a3: '', country: 'X', cc: 'GB' }, fetchedAt: old }]]))
  const refused = load({ db: store.db, status: 429 })
  assert.equal((await refused.getPlaceWhere(['p1'])).get('p1'), null)
  assert.equal(refused.calls.length, 1)

  store.docs.set('p1', { ...store.docs.get('p1'), failedAt: null })
  const ok = load({ db: store.db })
  assert.equal((await ok.getPlaceWhere(['p1'])).get('p1').city, 'Canggu, Bali')
  assert.equal(ok.calls.length, 1)
})

test('Firestore being unavailable falls back to Google as before', async () => {
  const store = fakeDb(new Map(), { failReads: true })
  const site = load({ db: store.db })
  assert.equal((await site.getPlaceWhere(['p1'])).get('p1').city, 'Canggu, Bali')
  assert.equal(site.calls.length, 1)
})
