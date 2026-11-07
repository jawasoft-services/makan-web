import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { runInNewContext } from 'node:vm'
import { createHash, timingSafeEqual } from 'node:crypto'
import test from 'node:test'
import ts from 'typescript'

const copy = value => JSON.parse(JSON.stringify(value))
const time = Date.UTC(2026, 10, 6, 12)
const sourcePhoto = 'https://firebasestorage.googleapis.com/public-holder.jpg'
const notes = { always: 'Prawns', another: '', why: '', tip: '' }
const venue = id => ({ placeId: id, slug: `${id}-f10001`, name: `Restaurant ${id}`, where: null,
  holderName: 'Alex', holderPhoto: sourcePhoto, notes: { ...notes }, photo: null })
const directory = ids => ids.map(id => ({ placeId: id, slug: `${id}-f10001`, name: `Restaurant ${id}`, where: null, meals: [] }))
const snapshot = (venues = [], places = []) => ({ schemaVersion: 2, verifiedAt: time, status: 'ready', venues, places })
const doc = (path, value) => ({ id: path.split('/').at(-1), exists: value !== undefined, data: () => value, get: key => value?.[key] })

// In-memory test adapter only. The loader rejects every external module not explicitly listed.
function database(seed = {}) {
  const data = new Map(Object.entries(seed))
  const reads = []
  const writes = []
  const queries = []
  let onRead = null
  async function read(path) { reads.push(path); if (onRead) await onRead(path); return doc(path, data.get(path)) }
  const reference = path => ({ path, get: () => read(path), collection: name => collection(`${path}/${name}`) })
  const collection = (path, filters = [], mask = null) => ({
    doc: id => reference(`${path}/${id}`),
    where: (field, op, value) => collection(path, [...filters, { field, op, value }], mask),
    select: (...fields) => collection(path, filters, fields),
    async get() {
      reads.push(`${path}/*`)
      queries.push({ path, filters: copy(filters), fields: mask ? [...mask] : null })
      if (onRead) await onRead(`${path}/*`, queries.at(-1))
      let rows = [...data].filter(([key]) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/'))
      for (const filter of filters) rows = rows.filter(([, value]) => filter.op === 'in' ? filter.value.includes(value[filter.field]) : value[filter.field] === filter.value)
      return { size: rows.length, docs: rows.map(([key, value]) => doc(key, mask ? Object.fromEntries(mask.map(field => [field, value[field]])) : value)) }
    },
  })
  const db = { doc: reference, collection,
    async getAll(...refs) { const mask = refs.at(-1)?.fieldMask; if (mask) refs.pop(); return Promise.all(refs.map(async ref => { const value = await read(ref.path); return mask ? doc(ref.path, value.exists ? Object.fromEntries(mask.map(field => [field, value.get(field)])) : undefined) : value })) },
    bulkWriter() { return { onWriteError() {}, set(ref, value) { writes.push(['set', ref.path]);data.set(ref.path, value);return Promise.resolve() }, delete(ref) { writes.push(['delete', ref.path]);data.delete(ref.path);return Promise.resolve() }, close: async () => {} } },
  }
  return { db, data, reads, writes, queries, setReadHook: hook => { onRead = hook } }
}
function seeded(ids = ['retained', 'transferred', 'vacant', 'unresolved']) {
  const seed = { 'maitredFeature/current': { enabled: true } }
  for (const id of ids) {
    const held = ['retained', 'transferred'].includes(id)
    seed[`maitredStanding/${id}`] = { canonicalPlaceId: id, activeGenerationId: 'generation-1', participationRebuildPending: false,
      outcome: id, holderUid: held ? id+'-user' : null, holderDisplayName: held ? 'Alex' : '', holderPhotoUrl: sourcePhoto }
    seed[`restaurants/${id}`] = { state: 'active', canonicalPlaceId: id }
    if (held) {
      seed[`users/${id}-user`] = { accountStatus: 'active', display_name: 'Alex', photoURL: sourcePhoto }
      seed[`maitredMenus/${id}`] = { authorUid: id+'-user', moderation: 'visible', entries: { alwaysOrderThis: 'Prawns' } }
    }
  }
  return database(seed)
}
function lane(options = {}) {
  const modules = new Map()
  const clock = { now: time }
  const calls = { source: 0, directory: 0, stored: 0, heartbeat: 0, photos: 0, caches: [], locations: [] }
  const external = []
  class ClockDate extends Date { static now() { return clock.now } }
  class Timestamp { constructor(ms) { this.ms = ms } static now() { return new Timestamp(clock.now) } static fromMillis(ms) { return new Timestamp(ms) } toDate() { return new Date(this.ms) } toMillis() { return this.ms } }
  const control = { stored: null, lastRun: null, source: { status: 'ready', holders: [], places: [] }, directory: [], ...options }
  function load(relative) {
    let file = resolve(relative)
    if (!existsSync(file)) file += '.ts'
    if (modules.has(file)) return modules.get(file)
    const exports = {}; modules.set(file, exports)
    const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    runInNewContext(code, { exports, Date: ClockDate, Buffer, Request, Response, URL, console: { error() {}, warn() {}, log() {} }, process: { env: { NODE_ENV: 'test', CRON_SECRET: 'fixture-cron-token' } },
      fetch() { external.push('fetch'); throw new Error('External traffic forbidden') },
      require(id) {
        if (id === 'node:crypto') return { createHash, timingSafeEqual }
        if (id === 'server-only') return {}
        if (id === 'firebase-admin/firestore') return { Timestamp }
        if (id === 'next/cache') return { unstable_cache: (fn, keys = [], options = {}) => {
          const entries = new Map()
          const cache = { keys: copy(keys), options: copy(options), args: [], misses: [] }
          calls.caches.push(cache)
          return (...args) => {
            cache.args.push(copy(args))
            if (!control.memoizeCache) return fn(...args)
            const key = JSON.stringify(args)
            const previous = entries.get(key)
            const maxAge = typeof options.revalidate === 'number' ? options.revalidate * 1000 : Infinity
            if (previous && clock.now >= previous.at && clock.now - previous.at < maxAge) return previous.pending
            cache.misses.push(copy(args))
            const entry = { at: clock.now, pending: null }
            entry.pending = Promise.resolve().then(() => fn(...args)).catch(error => {
              if (entries.get(key) === entry) entries.delete(key)
              throw error
            })
            entries.set(key, entry)
            return entry.pending
          }
        } }
        if (id === 'next/server') return { NextResponse: Response }
        if (id === '@/lib/website-fixtures') return { WEBSITE_FIXTURES: false }
        if (id === '@/lib/firebase-admin') return { getDb: () => control.db ?? {} }
        if (id === '@/lib/place-directory' && !control.actualDirectory) return { getPlaceDirectoryStrict: async () => { calls.directory++; return typeof control.directory === 'function' ? control.directory() : control.directory } }
        if (id === '@/lib/place-city' && control.actualCompute) return {
          getPlaceSeed: () => undefined, hasSeededWhere: () => false, isFoodVenue: () => true, placeLabel: () => null,
          getPlaceWhere: async ids => { calls.locations.push(copy(ids)); return new Map(ids.map(id => [id, { city: 'Fixture city', country: 'Fixture country' }])) },
        }
        if (id === '@/lib/aggregates/compute' && !control.actualCompute) return {
          computeEatStandings: async () => ({ rows: [], computedAt: 'fixture' }),
          computePlaceStats: async () => ({}), indexOf: () => [],
          computePlaceDirectory: async (_db, ids) => { calls.directoryIds = copy(ids); return control.directory },
        }
        if (id === '@/lib/aggregates/store' && !control.actualStore) return {
          readMaitred: async () => { calls.stored++; return load('lib/aggregates/maitred.ts').parseMaitredList(control.stored) },
          readLastRun: async () => { calls.heartbeat++; return control.lastRun },
        }
        if (id === '@/lib/aggregates/maitred' && !control.actualSource) {
          const source = async () => { calls.source++; const verifiedAt = clock.now; const value = await (typeof control.source === 'function' ? control.source() : control.source); return { verifiedAt, ...value } }
          return { ...load('lib/aggregates/maitred.ts'), readMaitredSource: source, getVerifiedMaitredSource: source,
            readMaitredPhotos: async () => { calls.photos++; return new Map() } }
        }
        if (id.startsWith('@/')) return load(id.slice(2))
        if (id.startsWith('.')) return load(resolve(dirname(file), id))
        external.push(id); throw new Error(`Unexpected provider/module ${id}`)
      },
    }, { filename: file })
    return exports
  }
  return { load, clock, calls, control, external, Timestamp }
}

test('real source includes retained/transferred holders and only explicit vacant/unresolved outcomes', async () => {
  const db = seeded(); const run = lane(); const api = run.load('lib/aggregates/maitred.ts')
  const source = await api.readMaitredSource(db.db)
  assert.deepEqual(copy(source.holders.map(h => h.placeId).sort()), ['retained', 'transferred'])
  assert.deepEqual(copy(source.places), [{ placeId: 'vacant', status: 'vacant' }, { placeId: 'unresolved', status: 'unresolved' }])
  const result = api.buildMaitredList(source, directory(['retained', 'transferred', 'vacant', 'unresolved', 'unknown']), new Map())
  assert.equal(result.schemaVersion, 2); assert.equal(result.venues.length, 2)
  assert(!result.places.some(p => p.placeId === 'unknown'))
  assert.equal(db.reads.filter(path => path === 'maitredStanding/*').length, 1)
  assert.deepEqual(run.external, [])
})

test('disabled, pending, corrupt and moved producers never turn into vacancy', async () => {
  for (const change of [{ enabled: false }, { enabled: true, killSwitch: true }]) {
    const db = seeded(); db.data.set('maitredFeature/current', change)
    const api = lane().load('lib/aggregates/maitred.ts'); const result = api.buildMaitredList(await api.readMaitredSource(db.db), directory(['vacant']), new Map())
    assert.deepEqual(copy(result), { schemaVersion: 2, verifiedAt: time, status: 'disabled', venues: [], places: [] })
    assert.equal(db.reads.length, 1)
  }
  const db = seeded(['vacant', 'unresolved'])
  db.data.get('maitredStanding/vacant').participationRebuildPending = true
  db.data.get('restaurants/unresolved').replacedByCanonicalPlaceId = 'different-place'
  const api = lane().load('lib/aggregates/maitred.ts')
  const source = await api.readMaitredSource(db.db)
  assert.equal(source.places.length, 0); assert.equal(source.holders.length, 0)
})

test('inactive, deleted, missing, opted-out and test identities are excluded without a vacant replacement', async () => {
  const cases = [null, { accountStatus: 'suspended' }, { deletedAt: 'now' }, { isDeleted: true }, { isSpam: true }, { spamSuspected: true }]
  for (const profile of cases) {
    const db = seeded(['retained'])
    if (profile) db.data.set('users/retained-user', profile); else db.data.delete('users/retained-user')
    const value = await lane().load('lib/aggregates/maitred.ts').readMaitredSource(db.db)
    assert.equal(value.holders.length, 0); assert.equal(value.places.length, 0)
  }
  for (const blocked of ['fence', 'participation', 'test']) {
    const db = seeded(['retained'])
    if (blocked === 'fence') db.data.set(`accountDeletionFences/${createHash('sha256').update('retained-user').digest('hex')}`, {})
    if (blocked === 'participation') db.data.set('users/retained-user/maitredSettings/participation', { enabled: false })
    if (blocked === 'test') db.data.get('restaurants/retained').isTestVenue = true
    const value = await lane().load('lib/aggregates/maitred.ts').readMaitredSource(db.db)
    assert.equal(value.holders.length, 0); assert.equal(value.places.length, 0)
  }
})

test('menu authorship/moderation/withdrawal/revision gates preserve the holder without inventing an order', async () => {
  for (const patch of [{ authorUid: 'previous-holder' }, { moderation: 'held' }, { participationWithdrawn: true }, { participationRevision: 1 }]) {
    const db = seeded(['retained'])
    Object.assign(db.data.get('maitredMenus/retained'), patch)
    if ('participationRevision' in patch) db.data.set('users/retained-user/maitredSettings/participation', { lastOptOutRevision: 2 })
    const result = await lane().load('lib/aggregates/maitred.ts').readMaitredSource(db.db)
    assert.equal(result.holders.length, 1); assert.deepEqual(copy(result.holders[0].notes), { always: '', another: '', why: '', tip: '' })
  }
})

test('current profile name and avatar use native precedence, never stale standing identity', async () => {
  const db = seeded(['retained']); const api = lane().load('lib/aggregates/maitred.ts')
  const currentPhoto = 'https://firebasestorage.googleapis.com/current-avatar.jpg'
  db.data.set('users/retained-user', { display_name: '  Current name  ', displayName: 'Auth name', name: 'Legacy name',
    photoURL: currentPhoto, avatar: sourcePhoto, photoURLString: sourcePhoto })
  const current = await api.readMaitredSource(db.db)
  assert.equal(current.holders[0].holderName, 'Current name')
  assert.equal(current.holders[0].holderPhoto, currentPhoto)
  assert.equal(db.reads.filter(path => path === 'users/retained-user').length, 1, 'identity and eligibility share the same batched profile read')
  db.data.set('users/retained-user', { display_name: ' ', displayName: 'Auth fallback', name: 'Legacy name', photoURL: '', avatar: currentPhoto })
  const fallback = await api.readMaitredSource(db.db)
  assert.equal(fallback.holders[0].holderName, 'Auth fallback'); assert.equal(fallback.holders[0].holderPhoto, currentPhoto)
  db.data.set('users/retained-user', { name: 'Legacy profile', photoURLString: currentPhoto })
  const legacy = await api.readMaitredSource(db.db)
  assert.equal(legacy.holders[0].holderName, 'Legacy profile'); assert.equal(legacy.holders[0].holderPhoto, currentPhoto)
  for (const profile of [{ display_name: 'Renamed' }, { display_name: 'Renamed', photoURL: 'https://untrusted.example/avatar.jpg' }]) {
    db.data.set('users/retained-user', profile)
    const removed = await api.readMaitredSource(db.db)
    assert.equal(removed.holders[0].holderPhoto, null, 'removed or disallowed current avatar cannot revive the pointer avatar')
  }
  db.data.set('users/retained-user', { email: 'private@example.test', username: 'private-contact' })
  const unnamed = await api.readMaitredSource(db.db)
  assert.equal(unnamed.holders.length, 0); assert.equal(unnamed.places.length, 0, 'missing public name is not vacancy')
})

test('reader refresh reflects a profile rename/avatar removal and withdraws a deleted profile without false vacancy', async () => {
  const db = seeded(['retained'])
  const run = lane({ db: db.db, actualSource: true, directory: directory(['retained']) })
  const api = run.load('lib/maitred.ts')
  const first = await api.getMaitredStateAt('retained')
  assert.equal(first.status, 'held'); assert.equal(first.venue.holderName, 'Alex'); assert.equal(first.venue.holderPhoto, sourcePhoto)
  db.data.set('users/retained-user', { display_name: 'Renamed diner' })
  run.clock.now += 300_000
  const changed = await api.getMaitredStateAt('retained')
  assert.equal(changed.status, 'held'); assert.equal(changed.venue.holderName, 'Renamed diner'); assert.equal(changed.venue.holderPhoto, null)
  db.data.delete('users/retained-user'); run.clock.now += 300_000
  assert.equal((await api.getMaitredStateAt('retained')).status, 'unavailable')
  assert.equal(db.reads.filter(path => path === 'users/retained-user').length, 3)
  assert.deepEqual(run.external, [])
})

test('source coalesces concurrent work, does not retain a failed read, and retries', async () => {
  const db = seeded(); const api = lane().load('lib/aggregates/maitred.ts')
  let release; const gate = new Promise(resolve => { release = resolve })
  db.setReadHook(path => path === 'maitredFeature/current' ? gate : undefined)
  const first = api.readMaitredSource(db.db); const second = api.readMaitredSource(db.db)
  assert.equal(first, second); release(); await first
  assert.equal(db.reads.filter(path => path === 'maitredFeature/current').length, 1)
  db.setReadHook(() => { throw new Error('offline') })
  await assert.rejects(api.readMaitredSource(db.db), /offline/)
  db.setReadHook(null); assert.equal((await api.readMaitredSource(db.db)).holders.length, 2)
})

test('join and schema decoder never infer vacancy or export extra private fields', () => {
  const api = lane().load('lib/aggregates/maitred.ts')
  const value = api.buildMaitredList({ verifiedAt: time, status: 'ready', holders: [{ ...venue('missing'), qualifyingDays: 42 }], places: [{ placeId: 'missing', status: 'vacant' }] }, [], new Map())
  assert.deepEqual(copy(value), snapshot())
  assert.equal(api.parseMaitredList({ venues: [] }), null)
  assert.equal(api.parseMaitredList({ ...snapshot(), schemaVersion: 1 }), null)
  assert.equal(api.parseMaitredList({ ...snapshot([venue('a')]), status: 'disabled' }), null)
  assert.equal(api.parseMaitredList(snapshot([venue('a')], [{ placeId: 'a', status: 'vacant' }])), null)
  const clean = api.parseMaitredList({ ...snapshot([{ ...venue('a'), uid: 'private', qualifyingDays: 42 }]), privateCounts: { a: 42 } })
  assert.doesNotMatch(JSON.stringify(clean), /private|qualifyingDays/)
})

test('reader cold/warm/concurrent calls share one refresh and expose every explicit state safely', async () => {
  let release; const gate = new Promise(resolve => { release = resolve })
  const run = lane({ directory: directory(['a','vacant','tie']), source: async () => { await gate; return { status: 'ready', holders: [venue('a')], places: [{ placeId: 'vacant', status: 'vacant' }, { placeId: 'tie', status: 'unresolved' }] } } })
  const api = run.load('lib/maitred.ts')
  const promises = [api.getMaitredDirectory(), api.getMaitredStateAt('a'), api.getMaitredStateAt('vacant'), api.getMaitredStateAt('tie'), api.getMaitredStateAt('missing')]
  release(); const values = await Promise.all(promises)
  assert.deepEqual(values.map(value => value.status), ['ready','held','vacant','unresolved','unavailable'])
  await api.getMaitredDirectory(); assert.equal(run.calls.source, 1); assert.equal(run.calls.stored, 1)
  assert.equal(await api.getMaitredAt('vacant'), null); assert.equal(await api.getMaitredAt('tie'), undefined)
  assert.equal(await api.getMaitredAt('missing'), undefined); assert.equal(run.calls.source, 1)
})

test('hard expiry awaits a refresh, drops prior identity on failure, then recovers', async () => {
  const run = lane({ directory: directory(['a']), source: { status: 'ready', holders: [venue('a')], places: [] } })
  const api = run.load('lib/maitred.ts'); assert.equal((await api.getMaitredDirectory()).venues.length, 1)
  run.clock.now += 300_000
  let reject; run.control.source = () => new Promise((_, fail) => { reject = fail })
  let settled = false; const fresh = api.getMaitredDirectory().then(value => { settled = true; return value })
  await new Promise(resolve => setImmediate(resolve)); assert.equal(settled, false)
  reject(new Error('offline')); assert.deepEqual(copy(await fresh), { status: 'unavailable', venues: [] })
  const attempts = run.calls.source
  assert.equal((await api.getMaitredDirectory()).status, 'unavailable'); assert.equal(run.calls.source, attempts)
  run.clock.now += 10_000
  run.control.source = { status: 'disabled', holders: [], places: [] }
  assert.deepEqual(copy(await api.getMaitredDirectory()), { status: 'disabled', venues: [] })
  assert.equal(await api.getMaitredAt('a'), undefined)
})

test('source verification time bounds expiry; legacy/future proof rebuilds, slow reads expire', async () => {
  const run = lane({ stored: { ...snapshot([venue('a')]), verifiedAt: time - 299_000 }, lastRun: new Date(time) })
  const api = run.load('lib/maitred.ts'); assert.equal((await api.getMaitredDirectory()).venues.length, 1)
  assert.equal(run.calls.source, 0)
  run.clock.now += 1_000; run.control.source = { status: 'ready', holders: [], places: [] }
  assert.equal((await api.getMaitredDirectory()).venues.length, 0); assert.equal(run.calls.source, 1)
  for (const config of [{ stored: { venues: [venue('old')] }, lastRun: new Date(time) }, { stored: { ...snapshot([venue('future')]), verifiedAt: time + 1 }, lastRun: new Date(time) }, { stored: { ...snapshot([venue('old-proof')]), verifiedAt: time - 300_000 }, lastRun: new Date(time + 999_000) }]) {
    const candidate = lane(config); const result = await candidate.load('lib/maitred.ts').getMaitredDirectory()
    assert.equal(result.venues.length, 0); assert.equal(candidate.calls.source, 1)
  }
  const slow = lane(); slow.control.source = async () => { slow.clock.now += 300_000; return { status: 'ready', holders: [], places: [] } }
  assert.equal((await slow.load('lib/maitred.ts').getMaitredDirectory()).status, 'unavailable')
})

test('real store rejects legacy, writes current schema once and skips unchanged Maître content', async () => {
  const run = lane(); const db = database({ 'webAggregates/maitred': { payload: { venues: [] } } })
  const store = run.load('lib/aggregates/store.ts')
  assert.equal(await store.readMaitred(db.db), null)
  const data = { maitred: snapshot([venue('a')]), directory: [], index: [], stats: {}, standings: { rows: [], computedAt: 'now' } }
  await store.writeAggregates(db.db, data)
  assert.equal((await store.readMaitred(db.db)).schemaVersion, 2)
  assert.equal(db.writes.filter(([, path]) => path === 'webAggregates/maitred').length, 1)
  await store.writeAggregates(db.db, { ...data, maitred: { ...data.maitred, verifiedAt: time + 1_000 } })
  assert.equal(db.writes.filter(([, path]) => path === 'webAggregates/maitred').length, 1)
  assert.equal(db.data.get('webAggregates/maitred').payload.verifiedAt, time)
  assert.equal((await store.readMaitred(db.db)).verifiedAt, time + 1_000)
  assert.equal(db.writes.filter(([, path]) => path === 'webAggregates/meta').length, 2)
  await assert.rejects(store.writeAggregates(db.db, { ...data, maitred: { venues: [] } }), /Unsupported/)
  assert.deepEqual(run.external, [])
})

test('photos recheck public/moderation/venue/image fields, try the next valid candidate and never scan', async () => {
  const run = lane(); const api = run.load('lib/aggregates/maitred.ts')
  const src = id => `https://firebasestorage.googleapis.com/${id}.jpg`
  const meal = (id, patch = {}) => ({ placeProviderId: 'a', isPublic: true, imageURL: src(id), ...patch })
  const db = database({
    'meals/private': meal('private', { isPublic: false }),
    'meals/hidden': meal('hidden', { moderationStatus: 'hidden' }),
    'meals/moved': meal('moved', { placeProviderId: 'different-place' }),
    'meals/bad-url': meal('bad-url', { imageURL: 'https://untrusted.example/image.jpg' }),
    'meals/valid': meal('full-current', { moderationStatus: 'active', thumbnailUrl: src('thumb-current') }),
    'meals/unused': meal('unused'),
    'meals/full': meal('full-resolution', { placeProviderId: 'b', thumbnailUrl: 'https://untrusted.example/thumb.jpg' }),
  })
  const places = directory(['a', 'b', 'c', 'not-held'])
  places[0].meals = ['private','missing','hidden','moved','bad-url','valid','unused'].map(id => ({ id, src: src('stale'), thumb: src('stale-thumb') }))
  places[1].meals = [{ id: 'private' }, { id: 'full' }]
  places[2].meals = [{ id: 'private' }]
  places[3].meals = [{ id: 'unrelated' }]
  const source = { verifiedAt: time, status: 'ready', holders: ['a','b','c'].map(venue), places: [] }
  const photos = await api.readMaitredPhotos(db.db, source, places)
  const output = api.buildMaitredList(source, places, photos)
  assert.equal(output.venues.find(v => v.placeId === 'a').photo, src('thumb-current'))
  assert.equal(output.venues.find(v => v.placeId === 'b').photo, src('full-resolution'))
  assert.equal(output.venues.find(v => v.placeId === 'c').photo, null)
  assert.equal(db.reads.filter(path => path === 'meals/private').length, 1)
  assert(!db.reads.includes('meals/unused')); assert(!db.reads.includes('meals/unrelated'))
  assert(!db.reads.some(path => path.endsWith('/*')))
  assert.equal(db.reads.length, 7)
  assert.deepEqual(run.external, [])
})

test('expired identity refresh also rereads its old directory photo and fails closed if that read fails', async () => {
  const db = seeded(['retained']); const places = directory(['retained'])
  const oldPhoto = 'https://firebasestorage.googleapis.com/old-public.jpg'
  places[0].meals = [{ id: 'photo', src: oldPhoto, thumb: oldPhoto }]
  db.data.set('meals/photo', { placeProviderId: 'retained', isPublic: true, imageURL: oldPhoto })
  const run = lane({ db: db.db, actualSource: true, directory: places })
  const api = run.load('lib/maitred.ts')
  assert.equal((await api.getMaitredDirectory()).venues[0].photo, oldPhoto)
  run.clock.now += 300_000; db.data.get('meals/photo').isPublic = false
  assert.equal((await api.getMaitredDirectory()).venues[0].photo, null)
  run.clock.now += 300_000
  db.setReadHook(path => { if (path === 'meals/photo') throw new Error('photo provider unavailable') })
  assert.deepEqual(copy(await api.getMaitredDirectory()), { status: 'unavailable', venues: [] })
  assert.equal(db.reads.filter(path => path === 'meals/photo').length, 3)
})

test('actual directory failures remain unavailable, are not cached as empty, and recover through the shared cache', async () => {
  const db = seeded(['retained'])
  const run = lane({ db: db.db, actualSource: true, actualStore: true, actualDirectory: true, memoizeCache: true })
  db.data.set('webAggregates/meta', { lastRunAt: new run.Timestamp(time) })
  db.data.set('webAggregates/placeIndex', { shards: 1 })
  db.data.set('webAggregates/placeIndex/shards/0', { entries: [{ placeId: 'retained' }] })
  db.data.set('webAggregates/places/items/retained', { payload: directory(['retained'])[0] })
  db.setReadHook(path => { if (path === 'webAggregates/placeIndex') throw new Error('directory offline') })
  const api = run.load('lib/maitred.ts'); const places = run.load('lib/place-directory.ts')
  assert.deepEqual(copy(await api.getMaitredDirectory()), { status: 'unavailable', venues: [] })
  assert.deepEqual(copy(await places.getPlaceDirectory()), [])
  assert.equal(await places.getPlaceDirectoryStrict(), null)
  db.setReadHook(null); run.clock.now += 10_000
  assert.equal((await api.getMaitredStateAt('retained')).status, 'held')
  const reads = db.reads.length
  assert.equal((await places.getPlaceDirectory()).length, 1)
  assert.equal((await places.getPlaceDirectoryStrict()).length, 1)
  assert.equal(db.reads.length, reads)
  const empty = lane({ directory: [], source: { status: 'ready', holders: [], places: [] } })
  assert.deepEqual(copy(await empty.load('lib/maitred.ts').getMaitredDirectory()), { status: 'ready', venues: [] })
})

test('unchanged cron proof avoids a cold rescan only when schema and exact content hash match', async () => {
  const db = database(); const run = lane({ db: db.db, actualStore: true })
  const store = run.load('lib/aggregates/store.ts')
  const data = { maitred: snapshot([venue('a')]), directory: [], index: [], stats: {}, standings: { rows: [], computedAt: 'now' } }
  await store.writeAggregates(db.db, data)
  run.clock.now += 600_000
  const nextProof = run.clock.now - 1_000
  await store.writeAggregates(db.db, { ...data, maitred: { ...data.maitred, verifiedAt: nextProof } })
  assert.equal(db.data.get('webAggregates/maitred').payload.verifiedAt, time)
  assert.equal((await store.readMaitred(db.db)).verifiedAt, nextProof)
  assert.equal((await run.load('lib/maitred.ts').getMaitredDirectory()).venues.length, 1)
  assert.equal(run.calls.source, 0)
  const proof = { ...db.data.get('webAggregates/meta').maitredVerification }
  for (const patch of [{ schemaVersion: 1 }, { contentHash: 'wrong-content' }, { verifiedAt: 'invalid' }, { verifiedAt: Infinity }, { verifiedAt: time - 1 }]) {
    db.data.get('webAggregates/meta').maitredVerification = { ...proof, ...patch }
    assert.equal((await store.readMaitred(db.db)).verifiedAt, time)
  }
  db.data.get('webAggregates/meta').maitredVerification = proof
  db.data.get('webAggregates/maitred').payload.venues[0].holderName = 'Different content'
  assert.equal((await store.readMaitred(db.db)).verifiedAt, time)
  delete db.data.get('webAggregates/meta').maitredVerification
  db.data.get('webAggregates/meta').lastRunAt = new run.Timestamp(time + 99_000_000)
  assert.equal((await store.readMaitred(db.db)).verifiedAt, time)
  assert.equal(db.writes.filter(([, path]) => path === 'webAggregates/maitred').length, 1)
  assert.equal(db.writes.filter(([, path]) => path === 'webAggregates/meta').length, 2)
})

test('actual cron carries producer states and read-start proof through store to reader', async () => {
  const db = seeded()
  const run = lane({ db: db.db, actualSource: true, actualStore: true, directory: directory(['retained','transferred','vacant','unresolved']) })
  const cron = run.load('app/api/cron/aggregates/route.ts')
  const response = await cron.GET(new Request('http://localhost/api/cron/aggregates', { headers: { authorization: 'Bearer fixture-cron-token' } }))
  assert.equal(response.status, 200)
  assert.deepEqual(run.calls.directoryIds.sort(), ['retained','transferred'])
  const saved = db.data.get('webAggregates/maitred').payload
  assert.equal(saved.schemaVersion, 2); assert.equal(saved.verifiedAt, time)
  const api = run.load('lib/maitred.ts')
  assert.equal((await api.getMaitredStateAt('transferred')).status, 'held')
  assert.equal((await api.getMaitredStateAt('vacant')).status, 'vacant')
  assert.equal((await api.getMaitredStateAt('unresolved')).status, 'unresolved')
  assert.equal((await api.getMaitredStateAt('missing')).status, 'unavailable')
  assert.deepEqual(run.external, [])
})

function completeDirectoryLane({ aggregateIds = ['catalogue'] } = {}) {
  const db = seeded(['retained', 'transferred'])
  const run = lane({ db: db.db, actualSource: true, actualStore: true, actualDirectory: true, actualCompute: true, memoizeCache: true })
  const slug = run.load('lib/slug.ts')
  const places = aggregateIds.map(placeId => ({
    placeId, slug: slug.placeSlug(`Aggregate ${placeId}`, placeId), hash: slug.shortHash(placeId),
    name: `Aggregate ${placeId}`, where: null, address: '', lat: null, lng: null, cuisine: [], since: null,
    meals: [], indexable: false,
  }))
  const compute = run.load('lib/aggregates/compute.ts')
  db.data.set('webAggregates/meta', { lastRunAt: new run.Timestamp(time) })
  db.data.set('webAggregates/placeIndex', { shards: 1 })
  db.data.set('webAggregates/placeIndex/shards/0', { entries: compute.indexOf(places) })
  for (const place of places) db.data.set(`webAggregates/places/items/${place.placeId}`, { payload: place })
  for (const id of ['retained', 'transferred']) Object.assign(db.data.get(`restaurants/${id}`), {
    displayName: `Current ${id}`, cuisine: { categories: [{ label: 'Local' }] }, latitude: 1, longitude: 2,
  })
  db.data.delete('maitredMenus/transferred')
  const meal = (placeId, patch = {}) => ({ placeProviderId: placeId, locationName: `Old ${placeId}`, isPublic: true,
    moderationStatus: 'active', imageURL: `https://firebasestorage.googleapis.com/${placeId}.jpg`,
    thumbnailUrl: `https://firebasestorage.googleapis.com/${placeId}-thumb.jpg`, caption: 'A memorable lunch',
    mealType: 'Lunch', userName: 'public_diner', createdAt: new run.Timestamp(time - 1_000), ...patch })
  db.data.set('meals/retained-public', meal('retained'))
  db.data.set('meals/retained-private', meal('retained', { isPublic: false }))
  db.data.set('meals/retained-hidden', meal('retained', { moderationStatus: 'hidden' }))
  db.data.set('meals/retained-untrusted', meal('retained', { imageURL: 'https://untrusted.example/photo.jpg' }))
  db.data.set('meals/unrelated-public', meal('unrelated'))
  return { db, run, api: run.load('lib/place-directory.ts'), maitred: run.load('lib/maitred.ts') }
}
const idsOf = values => copy(values.map(value => value.placeId).sort())
const mealQueries = db => db.queries.filter(query => query.path === 'meals')
function assertExactPublicMealQueries(db, expectedIds) {
  const queries = mealQueries(db)
  assert.deepEqual(queries.map(query => query.filters.find(filter => filter.field === 'placeProviderId' && filter.op === '==')?.value).sort(), [...expectedIds].sort())
  assert(queries.every(query => query.filters.some(filter => filter.field === 'isPublic' && filter.op === '==' && filter.value === true)), 'recovery queries only public meals for the exact eligible venue')
}

test('actual index/full/exact/slug routes recover every eligible missing holder, including no published order or meal', async () => {
  const { db, run, api, maitred } = completeDirectoryLane()
  const [index, full, exact] = await Promise.all([api.getPlaceIndex(), api.getPlaceDirectoryStrict(), api.getDirectoryPlaceById('transferred')])
  assert.deepEqual(idsOf(index), ['catalogue', 'retained', 'transferred'])
  assert.deepEqual(idsOf(full), ['catalogue', 'retained', 'transferred'])
  assert.equal(exact.placeId, 'transferred'); assert.equal(exact.name, 'Current transferred')
  assert.equal(exact.meals.length, 0); assert.equal(exact.indexable, false)
  const entry = index.find(place => place.placeId === 'transferred')
  assert.equal((await api.getDirectoryPlace(entry.slug)).placeId, 'transferred')
  assert.equal((await api.getDirectoryPlace(`previous-name-${entry.hash}`)).placeId, 'transferred', 'renamed slugs retain their hash-based destination')
  const retained = await api.getDirectoryPlaceById('retained')
  assert.deepEqual(copy(retained.meals.map(meal => meal.id)), ['retained-public'])
  const publicState = await maitred.getMaitredDirectory()
  assert.equal(publicState.status, 'ready'); assert.deepEqual(idsOf(publicState.venues), ['retained', 'transferred'])
  assert.deepEqual(copy(publicState.venues.find(value => value.placeId === 'transferred').notes), { always: '', another: '', why: '', tip: '' })
  assertExactPublicMealQueries(db, ['retained', 'transferred'])
  assert.equal(db.reads.filter(path => path === 'maitredFeature/current').length, 1, 'directory and holder identity share one verified source read')
  assert.equal(db.writes.length, 0); assert.deepEqual(run.external, [])
})

test('existing aggregate metadata wins and an unrelated or malformed ID never triggers a meal query', async () => {
  const { db, run, api } = completeDirectoryLane({ aggregateIds: ['catalogue', 'retained'] })
  const index = await api.getPlaceIndex()
  const full = await api.getPlaceDirectoryStrict()
  assert.equal(index.find(place => place.placeId === 'retained').name, 'Aggregate retained')
  assert.equal(full.find(place => place.placeId === 'retained').name, 'Aggregate retained')
  assert.equal((await api.getDirectoryPlaceById('retained')).name, 'Aggregate retained')
  const before = mealQueries(db).length
  assert.equal(await api.getDirectoryPlaceById('unrelated'), null)
  assert.equal(await api.getDirectoryPlaceById('unknown'), null)
  assert.equal(await api.getDirectoryPlaceById('bad/path'), null)
  assert.equal(await api.getDirectoryPlace('not-a-valid-slug'), null)
  assert.equal(mealQueries(db).length, before)
  assertExactPublicMealQueries(db, ['transferred'])
  assert.deepEqual(run.external, [])
})

test('per-venue metadata cache keys retain ID arguments and coalesce cold concurrent callers', async () => {
  const { db, run, api } = completeDirectoryLane()
  let release; const gate = new Promise(resolve => { release = resolve })
  db.setReadHook(path => path === 'meals/*' ? gate : undefined)
  const pending = [api.getDirectoryPlaceById('retained'), api.getDirectoryPlaceById('retained'),
    api.getDirectoryPlaceById('transferred'), api.getPlaceIndex(), api.getPlaceDirectoryStrict()]
  await new Promise(resolve => setImmediate(resolve)); release()
  const [first, same, other] = await Promise.all(pending)
  assert.equal(first.placeId, 'retained'); assert.equal(same.placeId, 'retained'); assert.equal(other.placeId, 'transferred')
  assertExactPublicMealQueries(db, ['retained', 'transferred'])
  const metadataCache = run.calls.caches.find(cache => cache.args.some(args => args[0] === 'retained') && cache.args.some(args => args[0] === 'transferred'))
  assert(metadataCache, 'the metadata cache receives distinct place IDs as arguments')
  assert.equal(metadataCache.options.revalidate, 3600)
  assert.deepEqual(metadataCache.misses.map(args => args[0]).sort(), ['retained', 'transferred'])
  const count = mealQueries(db).length
  await Promise.all([api.getPlaceIndex(), api.getPlaceDirectoryStrict(), api.getDirectoryPlaceById('retained'), api.getDirectoryPlaceById('transferred')])
  assert.equal(mealQueries(db).length, count)
  assert.deepEqual(run.external, [])
})

test('opt-out, feature disable and account deletion suppress missing-holder routes after five minutes despite warm metadata', async () => {
  for (const change of ['opt-out', 'disabled', 'profile-deleted', 'deletion-fence']) {
    const { db, run, api, maitred } = completeDirectoryLane()
    assert.equal((await maitred.getMaitredStateAt('retained')).status, 'held')
    assert((await api.getPlaceIndex()).some(place => place.placeId === 'retained'))
    const queryCount = mealQueries(db).length
    if (change === 'opt-out') db.data.set('users/retained-user/maitredSettings/participation', { enabled: false })
    if (change === 'disabled') db.data.set('maitredFeature/current', { enabled: false })
    if (change === 'profile-deleted') db.data.delete('users/retained-user')
    if (change === 'deletion-fence') db.data.set(`accountDeletionFences/${createHash('sha256').update('retained-user').digest('hex')}`, {})
    run.clock.now += 300_000
    const [index, full, exact, state] = await Promise.all([api.getPlaceIndex(), api.getPlaceDirectoryStrict(), api.getDirectoryPlaceById('retained'), maitred.getMaitredStateAt('retained')])
    assert(!index.some(place => place.placeId === 'retained'), change)
    assert(!full.some(place => place.placeId === 'retained'), change)
    assert.equal(exact, null, change)
    assert.equal(state.status, change === 'disabled' ? 'disabled' : 'unavailable', change)
    assert.equal(mealQueries(db).length, queryCount, 'privacy revocation does not need another metadata query')
    assert.deepEqual(run.external, [])
  }
})

test('failed metadata recovery is unavailable and retries rather than caching an empty recovered directory', async () => {
  const { db, run, api, maitred } = completeDirectoryLane()
  db.setReadHook(path => { if (path === 'meals/*') throw new Error('exact public meals unavailable') })
  assert.equal(await api.getDirectoryPlaceById('retained'), null)
  assert.equal(await api.getPlaceDirectoryStrict(), null)
  assert.deepEqual(copy(await maitred.getMaitredDirectory()), { status: 'unavailable', venues: [] })
  db.setReadHook(null); run.clock.now += 10_000
  assert.equal((await api.getDirectoryPlaceById('retained')).name, 'Current retained')
  assert.deepEqual(idsOf(await api.getPlaceDirectoryStrict()), ['catalogue', 'retained', 'transferred'])
  assert.equal((await maitred.getMaitredStateAt('retained')).status, 'held')
  assert(mealQueries(db).length > 2, 'the failed recovery was attempted again')
  assert.deepEqual(run.external, [])
})

test('verified source keeps its read-start time, expires at five minutes and raw cron reads remain fresh', async () => {
  const db = seeded(['retained']); const run = lane(); const api = run.load('lib/aggregates/maitred.ts')
  const first = await api.getVerifiedMaitredSource(db.db)
  assert.equal(first.verifiedAt, time)
  db.data.set('users/retained-user/maitredSettings/participation', { enabled: false })
  run.clock.now += 299_999
  const warm = await api.getVerifiedMaitredSource(db.db)
  assert.equal(warm.verifiedAt, time); assert.equal(warm.holders.length, 1)
  assert.equal(db.reads.filter(path => path === 'maitredFeature/current').length, 1)
  assert.equal((await api.readMaitredSource(db.db)).holders.length, 0, 'cron source bypasses the public five-minute cache')
  run.clock.now += 1
  const expired = await api.getVerifiedMaitredSource(db.db)
  assert.equal(expired.holders.length, 0); assert.equal(expired.verifiedAt, time + 300_000)
  assert.equal(db.reads.filter(path => path === 'maitredFeature/current').length, 3)
  assert.deepEqual(run.external, [])
})

test('verified source coalesces and expired failure cannot revive old identity; a later read retries', async () => {
  const db = seeded(['retained']); const run = lane(); const api = run.load('lib/aggregates/maitred.ts')
  let release; const gate = new Promise(resolve => { release = resolve })
  db.setReadHook(path => path === 'maitredFeature/current' ? gate : undefined)
  const first = api.getVerifiedMaitredSource(db.db); const second = api.getVerifiedMaitredSource(db.db)
  release(); await Promise.all([first, second])
  assert.equal(db.reads.filter(path => path === 'maitredFeature/current').length, 1)
  run.clock.now += 300_000; db.setReadHook(() => { throw new Error('source unavailable') })
  await assert.rejects(api.getVerifiedMaitredSource(db.db), /source unavailable/)
  db.setReadHook(null); run.clock.now += 10_000
  db.data.set('users/retained-user/maitredSettings/participation', { enabled: false })
  const recovered = await api.getVerifiedMaitredSource(db.db)
  assert.equal(recovered.holders.length, 0); assert.equal(recovered.verifiedAt, run.clock.now)
  assert.deepEqual(run.external, [])
})

test('source or supplemental failure preserves known index, slug and claim routes while strict identity fails closed', async () => {
  for (const failingRead of ['source', 'projection']) {
    const { db, run, api, maitred } = completeDirectoryLane()
    db.data.set('claimLinks/prepared-catalogue', { placeId: 'catalogue', displayName: 'Prepared catalogue', area: 'Fixture city' })
    const claims = run.load('lib/claim-venues.ts')
    const knownSlug = db.data.get('webAggregates/places/items/catalogue').payload.slug
    db.setReadHook(path => {
      if (path === (failingRead === 'source' ? 'maitredFeature/current' : 'meals/*')) throw new Error(`${failingRead} unavailable`)
    })
    assert.deepEqual(idsOf(await api.getPlaceIndex()), ['catalogue'], failingRead)
    assert.equal((await api.getDirectoryPlace(knownSlug)).placeId, 'catalogue', failingRead)
    const claimEntries = await claims.getClaimSearchEntries()
    assert.deepEqual(idsOf(claimEntries), ['catalogue'], failingRead)
    assert.equal(claimEntries[0].path, '/claim/prepared-catalogue')
    assert.equal(await api.getPlaceDirectoryStrict(), null, failingRead)
    assert.deepEqual(copy(await maitred.getMaitredDirectory()), { status: 'unavailable', venues: [] }, failingRead)
    assert(mealQueries(db).every(query => query.filters.some(filter => filter.field === 'placeProviderId' && filter.op === '==')), 'partial failure never falls back to an unscoped scan')
    db.setReadHook(null); run.clock.now += 10_000
    assert.deepEqual(idsOf(await api.getPlaceIndex()), ['catalogue', 'retained', 'transferred'], failingRead)
    assert.deepEqual(idsOf(await claims.getClaimSearchEntries()), ['catalogue', 'retained', 'transferred'], failingRead)
    assert.equal((await maitred.getMaitredStateAt('retained')).status, 'held', failingRead)
    assert.equal(db.reads.filter(path => path === 'claimLinks/*').length, 1, 'prepared claim links remain cached during recovery')
    assert.deepEqual(run.external, [])
  }
})

test('claim search includes a newly recovered holder and drops it on expiry without caching the merged list for an hour', async () => {
  const { db, run, api } = completeDirectoryLane()
  db.data.set('claimLinks/prepared-catalogue', { placeId: 'catalogue', displayName: 'Prepared catalogue', area: 'Fixture city' })
  const claims = run.load('lib/claim-venues.ts')
  const search = run.load('app/api/claim-search/route.ts')
  const first = await claims.getClaimSearchEntries()
  assert.deepEqual(idsOf(first), ['catalogue', 'retained', 'transferred'])
  assert.equal(first.find(entry => entry.placeId === 'catalogue').path, '/claim/prepared-catalogue')
  const recovered = await api.getDirectoryPlaceById('transferred')
  const response = await search.GET(new Request('http://localhost/api/claim-search?q=transferred'))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { results: [{ name: 'Current transferred', area: 'Fixture city', path: `/claim/${recovered.slug}` }] })
  assert.equal(db.reads.filter(path => path === 'claimLinks/*').length, 1)
  db.data.set('users/transferred-user/maitredSettings/participation', { enabled: false })
  run.clock.now += 300_000
  const next = await claims.getClaimSearchEntries()
  assert.deepEqual(idsOf(next), ['catalogue', 'retained'])
  const suppressed = await search.GET(new Request('http://localhost/api/claim-search?q=transferred'))
  assert.deepEqual(await suppressed.json(), { results: [] })
  assert.equal(db.reads.filter(path => path === 'claimLinks/*').length, 1)
  assertExactPublicMealQueries(db, ['retained', 'transferred'])
  assert.deepEqual(run.external, [])
})

test('a later Maître reader does not extend a warm source verification window through nested metadata caches', async () => {
  const { db, run, api, maitred } = completeDirectoryLane()
  assert.deepEqual(idsOf(await api.getPlaceIndex()), ['catalogue', 'retained', 'transferred'])
  run.clock.now += 299_000
  assert.equal((await maitred.getMaitredStateAt('retained')).status, 'held')
  const queries = mealQueries(db).length
  db.data.set('users/retained-user/maitredSettings/participation', { enabled: false })
  run.clock.now += 1_000
  assert.equal((await maitred.getMaitredStateAt('retained')).status, 'unavailable')
  assert(!(await api.getPlaceIndex()).some(place => place.placeId === 'retained'))
  assert.equal(mealQueries(db).length, queries, 'metadata remains warm while identity is reverified')
  assert.deepEqual(run.external, [])
})

test('slow verification expires from read start and cannot enter the verified source cache', async () => {
  const db = seeded(['retained']); const run = lane(); const api = run.load('lib/aggregates/maitred.ts')
  db.setReadHook(path => { if (path === 'maitredFeature/current') run.clock.now += 300_000 })
  await assert.rejects(api.getVerifiedMaitredSource(db.db), /expired/)
  db.setReadHook(null)
  const next = await api.getVerifiedMaitredSource(db.db)
  assert.equal(next.verifiedAt, time + 300_000); assert.equal(next.holders.length, 1)
  assert.equal(db.reads.filter(path => path === 'maitredFeature/current').length, 2)
  const other = seeded(['retained'])
  other.data.set('maitredFeature/current', { enabled: false })
  assert.equal((await api.getVerifiedMaitredSource(other.db)).status, 'disabled', 'independent databases never share cached identity')
  assert.deepEqual(run.external, [])
})

test('production per-ID pending work coalesces even when the framework cache adapter does not', async () => {
  const { db, run, api } = completeDirectoryLane()
  run.control.memoizeCache = false
  let release; const gate = new Promise(resolve => { release = resolve })
  db.setReadHook(path => path === 'meals/*' ? gate : undefined)
  const requests = [api.getDirectoryPlaceById('retained'), api.getDirectoryPlaceById('retained'),
    api.getPlaceDirectoryStrict(), api.getPlaceIndex()]
  await new Promise(resolve => setImmediate(resolve)); release()
  const [first, second] = await Promise.all(requests)
  assert.equal(first.placeId, 'retained'); assert.equal(second.placeId, 'retained')
  assertExactPublicMealQueries(db, ['retained', 'transferred'])
  assert.equal(db.reads.filter(path => path === 'maitredFeature/current').length, 1)
  assert.deepEqual(run.external, [])
})

test('warm per-venue metadata expires after one hour without extending five-minute eligibility', async () => {
  const { db, run, api } = completeDirectoryLane()
  assert.equal((await api.getDirectoryPlaceById('retained')).name, 'Current retained')
  db.data.get('restaurants/retained').displayName = 'Renamed restaurant'
  run.clock.now += 3_599_999
  assert.equal((await api.getDirectoryPlaceById('retained')).name, 'Current retained')
  assertExactPublicMealQueries(db, ['retained'])
  run.clock.now += 1
  assert.equal((await api.getDirectoryPlaceById('retained')).name, 'Renamed restaurant')
  assertExactPublicMealQueries(db, ['retained', 'retained'])
  assert.equal(db.reads.filter(path => path === 'maitredFeature/current').length, 2)
  assert.deepEqual(run.external, [])
})
