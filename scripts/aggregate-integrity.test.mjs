import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { runInNewContext } from 'node:vm'
import { createHash } from 'node:crypto'
import test from 'node:test'
import ts from 'typescript'

const time = Date.UTC(2026, 10, 7, 12)
const copy = value => JSON.parse(JSON.stringify(value))
const hash = value => createHash('sha1').update(JSON.stringify(value)).digest('hex')
const entry = id => ({ placeId: id, slug: `${id}-abc123`, hash: 'abc123', name: `Place ${id}`, city: null, indexable: true, meals: 2 })
const row = id => ({ placeId: id, slug: `${id}-abc123`, name: `Place ${id}`, eats: 8, yeets: 2, ties: 0, matchups: 10,
  eatRate: 0.8, since: null, where: { city: 'London', country: 'UK' }, lat: null, lng: null, publicMeals: 2, recentCaptions: [], rank: 1, cityRank: 1 })
const standings = () => ({ rows: [row('a')], all: [row('a')], cities: [{ slug: 'london', city: 'London', country: 'UK', rows: [row('a')] }],
  belowFloor: 0, matchups: 5, countries: 1, computedAt: new Date(time).toISOString() })
const stats = () => ({ places: 1, recentMeals: 2, mealCount: 12, topPlaces: [{ name: 'Place a', meals: 2 }] })
const payload = () => ({ standings: standings(), stats: stats(), index: [entry('a')],
  directory: [{ ...entry('a'), where: null, address: '', lat: null, lng: null, cuisine: [], since: null, meals: [] }],
  maitred: { schemaVersion: 2, verifiedAt: time, status: 'ready', venues: [], places: [] } })

// Actual TypeScript modules, with only in-memory adapters. Every network/provider import is blocked.
function lane(seed = {}) {
  const data = new Map(Object.entries(seed)), reads = [], writes = [], events = [], failures = new Set()
  const control = { available: true, failRead: null, computeFails: false, publicFails: false, publicVenues: [], excludedIds: [], excludedFails: false, computations: 0, publicReads: 0, locatedIds: [] }
  const modules = new Map(), clock = { now: time }
  class ClockDate extends Date { constructor(...args) { super(...(args.length ? args : [clock.now])) } static now() { return clock.now } }
  class Timestamp { constructor(ms) { this.ms = ms } static now() { return new Timestamp(clock.now) } toDate() { return new Date(this.ms) } }
  const snapshot = (path, value) => ({ id: path.split('/').at(-1), exists: value !== undefined, data: () => value })
  const read = async path => { reads.push(path); if (control.failRead === path) throw new Error('read unavailable'); return snapshot(path, data.get(path)) }
  const ref = path => ({ path, get: () => read(path), collection: name => collection(`${path}/${name}`) })
  const collection = path => ({ doc: id => ref(`${path}/${id}`), select: () => collection(path),
    get: async () => ({ docs: [...data].filter(([key]) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/')).map(([key, value]) => snapshot(key, value)) }) })
  let phase = 0
  const db = { collection, doc: ref, getAll: (...refs) => {
    const mask = refs.at(-1)?.fieldMask
    if (mask) refs.pop()
    return Promise.all(refs.map(async value => {
      const result = await read(value.path)
      return mask && result.exists ? snapshot(value.path, Object.fromEntries(mask.map(key => [key, result.data()[key]]))) : result
    }))
  },
    bulkWriter() {
      const number = phase++, queue = []
      let onError
      const add = (kind, reference, value) => {
        events.push(['queued', kind, reference.path, number])
        return new Promise((resolve, reject) => queue.push({ kind, reference, value, resolve, reject }))
      }
      return { onWriteError: fn => { onError = fn }, set: (ref, value) => add('set', ref, value), delete: ref => add('delete', ref),
        async close() {
          for (const task of queue) {
            const path = task.reference.path
            if (failures.has(path)) {
              onError?.({ failedAttempts: 3, documentRef: task.reference, message: 'write unavailable' })
              task.reject(new Error(`write unavailable: ${path}`))
            } else {
              writes.push([task.kind, path])
              if (task.kind === 'set') data.set(path, task.value)
              else data.delete(path)
              task.resolve()
            }
          }
          events.push(['closed', number])
        },
      }
    },
  }
  function load(relative) {
    let file = resolve(relative)
    if (!existsSync(file)) file += '.ts'
    if (modules.has(file)) return modules.get(file)
    const exports = {}; modules.set(file, exports)
    const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    runInNewContext(code, { exports, Date: ClockDate, console: { warn() {}, error() {} },
      fetch() { throw new Error('External requests forbidden') },
      require(id) {
        if (id === 'node:crypto') return { createHash }
        if (id === 'server-only') return {}
        if (id === 'firebase-admin/firestore') return { Timestamp }
        if (id === '@/lib/website-fixtures') return { WEBSITE_FIXTURES: false }
        if (id === '@/lib/firebase-admin') return { getDb: () => control.available ? db : null }
        if (id === '@/lib/public-venues') return { ...load('lib/public-venues.ts'),
          getPublicVenues: async () => { control.publicReads++; if (control.publicFails) throw new Error('metadata unavailable'); return control.publicVenues },
          getExcludedPublicVenueIds: async () => { if (control.excludedFails) throw new Error('visibility unavailable'); return control.excludedIds },
        }
        if (id === '@/lib/place-city') return { getPlaceSeed: () => undefined, hasSeededWhere: () => false, isFoodVenue: () => true, placeLabel: () => null,
          getPlaceWhere: async ids => { control.locatedIds.push(...ids); return new Map(ids.map(id => [id, { city: 'London', country: 'UK' }])) },
        }
        if (id === '@/lib/aggregates/compute') return { ...load('lib/aggregates/compute.ts'), computeEatStandings: async () => { control.computations++; if (control.computeFails) throw new Error('compute unavailable'); return standings() } }
        if (id === 'next/cache') return { unstable_cache(fn, _keys, options) {
          const values = new Map()
          return (...args) => {
            const key = JSON.stringify(args), cached = values.get(key)
            if (cached && clock.now - cached.at < options.revalidate * 1000) return cached.promise
            const value = { at: clock.now, promise: null }
            value.promise = Promise.resolve().then(() => fn(...args)).catch(error => { if (values.get(key) === value) values.delete(key); throw error })
            values.set(key, value)
            return value.promise
          }
        } }
        if (id.startsWith('@/')) return load(id.slice(2))
        if (id.startsWith('.')) return load(resolve(dirname(file), id))
        throw new Error(`Unexpected external module: ${id}`)
      },
    }, { filename: file })
    return exports
  }
  return { data, reads, writes, events, failures, control, clock, Timestamp, db, load }
}

function seedIndex(run, entries = [entry('a')]) {
  run.data.set('webAggregates/placeIndex', { shards: Math.ceil(entries.length / 500), count: entries.length, contentHash: hash(entries) })
  for (let i = 0; i < entries.length; i += 500) run.data.set(`webAggregates/placeIndex/shards/${i / 500}`, { entries: entries.slice(i, i + 500) })
}
function seedStandings(run) {
  run.data.set('webAggregates/standings', { payload: standings() })
  run.data.set('webAggregates/meta', { lastRunAt: new run.Timestamp(time) })
}

test('index accepts valid current, reordered Firestore maps, legacy manifests and empty indexes', async () => {
  const run = lane(), store = run.load('lib/aggregates/store.ts')
  seedIndex(run)
  assert.deepEqual(copy(await store.readPlaceIndex(run.db)), [entry('a')])
  const reordered = Object.fromEntries(Object.entries(entry('a')).reverse())
  run.data.set('webAggregates/placeIndex/shards/0', { entries: [reordered] })
  assert.equal((await store.readPlaceIndex(run.db))[0].name, 'Place a')
  run.data.set('webAggregates/placeIndex', { shards: 1 })
  assert.equal((await store.readPlaceIndex(run.db)).length, 1)
  seedIndex(run, [])
  assert.deepEqual(copy(await store.readPlaceIndex(run.db)), [])
})

test('index rejects missing shards, duplicate IDs, bad counts and content changes', async () => {
  for (const damage of ['missing', 'duplicate', 'count', 'hash', 'manifest', 'empty-shard']) {
    const run = lane(), store = run.load('lib/aggregates/store.ts'); seedIndex(run)
    if (damage === 'missing') run.data.delete('webAggregates/placeIndex/shards/0')
    if (damage === 'duplicate') seedIndex(run, [entry('a'), entry('a')])
    if (damage === 'count') run.data.get('webAggregates/placeIndex').count = 2
    if (damage === 'hash') run.data.get('webAggregates/placeIndex/shards/0').entries[0].name = 'Changed'
    if (damage === 'manifest') run.data.get('webAggregates/placeIndex').shards = '1'
    if (damage === 'empty-shard') run.data.get('webAggregates/placeIndex/shards/0').entries = []
    await assert.rejects(store.readPlaceIndex(run.db), /index/i, damage)
  }
})

test('readers validate renderable stats and standings while accepting legacy payloads without schema/hash', async () => {
  const run = lane(), store = run.load('lib/aggregates/store.ts')
  run.data.set('webAggregates/stats', { payload: stats() }); seedStandings(run)
  assert.deepEqual(copy(await store.readStats(run.db)), stats())
  assert.deepEqual(copy(await store.readStandings(run.db)), standings())
  for (const list of [run.data.get('webAggregates/standings').payload.rows, run.data.get('webAggregates/standings').payload.all, run.data.get('webAggregates/standings').payload.cities[0].rows]) {
    delete list[0].lat; delete list[0].lng
  }
  assert.equal((await store.readStandings(run.db)).rows[0].lat, null)
  for (const bad of [{ ...stats(), mealCount: undefined }, { ...stats(), mealCount: -1 }, { ...stats(), topPlaces: [{ name: 'a', meals: NaN }] }]) {
    run.data.set('webAggregates/stats', { payload: bad }); await assert.rejects(store.readStats(run.db), /statistics/)
  }
  for (const bad of [{ rows: [] }, { ...standings(), computedAt: 'invalid' }, { ...standings(), all: [row('a'), row('a')] },
    { ...standings(), rows: [{ ...row('a'), eatRate: Infinity }] }, { ...standings(), cities: [{ slug: 'london', rows: [] }] }]) {
    run.data.set('webAggregates/standings', { payload: bad }); await assert.rejects(store.readStandings(run.db), /standings/)
  }
})

test('future heartbeats never certify aggregate freshness', async () => {
  const run = lane(), store = run.load('lib/aggregates/store.ts')
  run.data.set('webAggregates/meta', { lastRunAt: new run.Timestamp(time + 1) })
  assert.equal(await store.readLastRun(run.db), null)
  run.data.set('webAggregates/meta', { lastRunAt: new run.Timestamp(time) })
  assert.equal((await store.readLastRun(run.db)).getTime(), time)
})

test('writer publishes manifest after content, heartbeat last, and skips unchanged content', async () => {
  const run = lane(), store = run.load('lib/aggregates/store.ts'), input = payload()
  await store.writeAggregates(run.db, input)
  const manifest = run.events.findIndex(event => event[0] === 'queued' && event[2] === 'webAggregates/placeIndex')
  const heartbeat = run.events.findIndex(event => event[0] === 'queued' && event[2] === 'webAggregates/meta')
  assert(manifest > run.events.findIndex(event => event[0] === 'closed' && event[1] === 0))
  assert(heartbeat > run.events.findIndex(event => event[0] === 'closed' && event[1] === 1))
  const before = run.writes.length
  await store.writeAggregates(run.db, input)
  assert.deepEqual(run.writes.slice(before), [['set', 'webAggregates/meta']])
})

test('failed content or manifest never advances the heartbeat; identical retries repair', async () => {
  for (const failed of ['webAggregates/placeIndex/shards/0', 'webAggregates/places/items/a', 'webAggregates/placeIndex', 'webAggregates/meta']) {
    const run = lane(), store = run.load('lib/aggregates/store.ts'), input = payload()
    const previous = { lastRunAt: new run.Timestamp(time - 1000) }
    run.data.set('webAggregates/meta', previous); run.failures.add(failed)
    await assert.rejects(store.writeAggregates(run.db, input), /writes failed/, failed)
    assert.equal(run.data.get('webAggregates/meta'), previous)
    if (failed.includes('/shards/') || failed.includes('/items/')) assert.equal(run.data.has('webAggregates/placeIndex'), false)
    run.failures.clear()
    await store.writeAggregates(run.db, input)
    assert.equal(run.data.get('webAggregates/meta').lastRunAt.toDate().getTime(), time)
    assert.deepEqual(copy(await store.readPlaceIndex(run.db)), input.index)
  }
})

test('writer repairs a historical missing shard even when manifest content hash is unchanged', async () => {
  const run = lane(), store = run.load('lib/aggregates/store.ts'), input = payload()
  await store.writeAggregates(run.db, input)
  run.data.delete('webAggregates/placeIndex/shards/0')
  await store.writeAggregates(run.db, input)
  assert.deepEqual(copy(await store.readPlaceIndex(run.db)), input.index)
})

test('standings failures are not cached as successful empty snapshots', async () => {
  for (const kind of ['database', 'read', 'compute', 'malformed']) {
    const run = lane(); seedStandings(run)
    if (kind === 'database') run.control.available = false
    if (kind === 'read') run.control.failRead = 'webAggregates/standings'
    if (kind === 'compute') { run.data.delete('webAggregates/standings'); run.control.computeFails = true }
    if (kind === 'malformed') run.data.set('webAggregates/standings', { payload: { rows: [] } })
    const api = run.load('lib/eat-standings.ts')
    const failed = await api.getEatStandingsSnapshot()
    assert.equal(failed.checkedAt, null); assert.equal(failed.standings.rows.length, 0)
    run.control.available = true; run.control.failRead = null; run.control.computeFails = false; seedStandings(run)
    const recovered = await api.getEatStandingsSnapshot()
    assert.equal(recovered.standings.rows.length, 1, kind)
    assert.equal(recovered.checkedAt, new Date(time).toISOString(), kind)
    assert.equal(run.clock.now, time)
  }
})

test('coordinate hydration updates every view without changing rank or cached content', async () => {
  const run = lane(); seedStandings(run)
  run.control.publicVenues = [{ placeId: 'a', lat: 51.5, lng: -0.12 }]
  const api = run.load('lib/eat-standings.ts'), value = await api.getEatStandingsSnapshot()
  for (const item of [value.standings.rows[0], value.standings.all[0], value.standings.cities[0].rows[0]]) {
    assert.equal(item.lat, 51.5); assert.equal(item.lng, -0.12)
    assert.equal(item.rank, 1); assert.equal(item.cityRank, 1); assert.equal(item.eatRate, 0.8)
  }
  assert.equal(run.data.get('webAggregates/standings').payload.rows[0].lat, null)
  assert.equal(run.control.computations, 0)
})

test('optional coordinate failure preserves standings and retries on the next call', async () => {
  const run = lane(); seedStandings(run); run.control.publicFails = true
  const api = run.load('lib/eat-standings.ts')
  assert.deepEqual(copy((await api.getEatStandingsSnapshot()).standings), standings())
  run.control.publicFails = false; run.control.publicVenues = [{ placeId: 'a', lat: 51.5, lng: -0.12 }]
  assert.equal((await api.getEatStandingsSnapshot()).standings.rows[0].lat, 51.5)
  assert.equal(run.control.publicReads, 2)
  assert.equal(run.reads.filter(path => path === 'webAggregates/standings').length, 1)
})

test('stored hidden leaders are excluded and every ranking view is rebuilt without inventing comparison totals', async () => {
  for (const survivors of [1, 2]) {
    const run = lane(); seedStandings(run)
    const candidates = [{ ...row('hidden'), eats: 10, yeets: 0, eatRate: 1 }, row('a'),
      { ...row('b'), eats: 6, yeets: 4, eatRate: 0.6, where: survivors === 2 ? row('b').where : { city: 'Paris', country: 'France' } }]
    const assemble = run.load('lib/aggregates/compute.ts').assembleEatStandings
    const previous = assemble(candidates, 15, new Date(time).toISOString())
    run.data.set('webAggregates/standings', { payload: previous }); run.control.excludedIds = ['hidden']
    const next = (await run.load('lib/eat-standings.ts').getEatStandingsSnapshot()).standings
    assert.deepEqual(copy(next.rows.map(value => [value.placeId, value.rank])), [['a', 1], ['b', 2]])
    assert.deepEqual(copy(next.all.map(value => value.placeId)), ['a', 'b'])
    assert.equal(next.matchups, 15); assert.equal(next.computedAt, previous.computedAt)
    assert.equal(next.countries, survivors === 2 ? 1 : 2)
    if (survivors === 1) {
      assert.equal(next.cities.length, 0)
      assert(next.all.every(value => value.cityRank === null))
    } else {
      assert.equal(next.cities.length, 1)
      assert.deepEqual(copy(next.cities[0].rows.map(value => [value.placeId, value.cityRank])), [['a', 1], ['b', 2]])
    }
    assert.equal(previous.rows[0].placeId, 'hidden', 'the cached aggregate is not mutated')
    assert.equal(previous.rows[1].rank, 2)
  }
})

test('visibility failure cannot return unverified stored rows and can recover immediately', async () => {
  const run = lane(); seedStandings(run); run.control.excludedFails = true
  const api = run.load('lib/eat-standings.ts')
  const failed = await api.getEatStandingsSnapshot()
  assert.equal(failed.standings.rows.length, 0); assert.equal(failed.checkedAt, null)
  run.control.excludedFails = false; run.control.excludedIds = ['a']
  const recovered = await api.getEatStandingsSnapshot()
  assert.equal(recovered.standings.rows.length, 0)
  assert.equal(recovered.checkedAt, new Date(time).toISOString())
})

test('standings producer excludes known bad restaurant states even without counters, before location lookups', async () => {
  const run = lane()
  const records = { a: { state: 'active', latitude: 51.5, longitude: -0.12 }, b: {}, test: { isTestVenue: true },
    retired: { state: 'tombstone' }, unresolved: { state: 'unresolved' }, moved: { replacedByCanonicalPlaceId: 'a' },
    alias: { canonicalPlaceId: 'a' }, zero: {} }
  for (const [id, flags] of Object.entries(records)) {
    run.data.set(`restaurants/${id}`, { displayName: `Place ${id}`, ...flags })
    run.data.set(`eatEvidenceAggregateState/${id}`, { eat: id === 'zero' ? 0 : 8, yeet: id === 'zero' ? 0 : 2, tie: 0 })
  }
  const result = await run.load('lib/aggregates/compute.ts').computeEatStandings(run.db)
  assert.deepEqual(copy(result.all.map(value => value.placeId)), ['a', 'b'])
  assert.deepEqual(copy(result.rows.map(value => value.rank)), [1, 2])
  assert.deepEqual(copy(result.cities[0].rows.map(value => value.cityRank)), [1, 2])
  assert.deepEqual(run.control.locatedIds, ['a', 'b'])
  assert.equal(result.matchups, 35, 'retain recorded positive-evidence comparison total, including hidden endpoints')
  assert.equal(result.rows[0].lat, 51.5)
  assert.equal(run.writes.length, 0)
})

test('hourly standings tolerate one missed run and fall back once two hours old',async()=>{
 for(const [age,expectedScans] of [[119*60*1000,0],[120*60*1000,1]]){
  const run=lane();seedStandings(run)
  run.data.set('webAggregates/meta',{lastRunAt:new run.Timestamp(time-age)})
  const snapshot=await run.load('lib/eat-standings.ts').getEatStandingsSnapshot()
  assert.equal(snapshot.standings.rows.length,1)
  assert.equal(run.control.computations,expectedScans)
  assert.equal(snapshot.checkedAt,new Date(expectedScans?time:time-age).toISOString())
 }
})
