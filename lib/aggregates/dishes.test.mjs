import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

import { buildPlaceDishes, foldName, needsRatingOrder, parseStoredDishes, readAnswer, readRatedNames } from './dishes.ts'
import { dishPagesOn } from '../dish-pages.ts'

// RM20616 dish pages U1 — the `dishes` on each place aggregate. The pure rules first, then the real hourly cron
// (app/api/cron/aggregates/route.ts with the real compute, store and dish modules) against an in-memory Firestore
// that records every read, field mask, select and write. Nothing here reaches a network or a real project.

const order = (...names) => names.map((name, i) => ({ name, rank: i + 1 }))

test('the dish pages switch is on only for the exact value "1"', () => {
  const before = process.env.DISH_PAGES
  try {
    delete process.env.DISH_PAGES
    assert.equal(dishPagesOn(), false)
    for (const value of ['', '0', 'true', 'TRUE', 'on', 'yes', ' 1', '1 ', '01', 'false']) {
      process.env.DISH_PAGES = value
      assert.equal(dishPagesOn(), false, JSON.stringify(value))
    }
    process.env.DISH_PAGES = '1'
    assert.equal(dishPagesOn(), true)
  } finally {
    if (before === undefined) delete process.env.DISH_PAGES
    else process.env.DISH_PAGES = before
  }
})

test('the rated list follows dishRatingOrder, best first, with the answer left out and the ranks not kept', () => {
  assert.deepEqual(readRatedNames(order('Nasi campur ayam betutu', 'Nasi goreng udang', 'Sate', 'Mie goreng'), 'Nasi campur ayam betutu'),
    ['Nasi goreng udang', 'Sate', 'Mie goreng'])
  // Ties share a rank and keep the server's order.
  assert.deepEqual(readRatedNames([{ name: 'A b', rank: 1 }, { name: 'C d', rank: 1 }, { name: 'E f', rank: 3 }], 'x'), ['A b', 'C d', 'E f'])
  // The answer is matched folded (case, accents, punctuation), as the app matches names.
  assert.deepEqual(readRatedNames(order('Nasi Campur, Ayam Betutu!', 'Sate lilit'), 'nasi campur ayam betutu'), ['Sate lilit'])
  const dishes = buildPlaceDishes({ name: 'Sate', maitred: false }, order('Sate', 'Lawar', 'Babi guling'), null)
  assert.deepEqual(dishes, { answer: { name: 'Sate', maitred: false }, rated: ['Lawar', 'Babi guling'] })
  assert.doesNotMatch(JSON.stringify(dishes), /rank|price|amount|count/)
})

test('fewer than two rated names is no list; folded duplicates and names over 140 characters are dropped; at most 10 stay', () => {
  assert.deepEqual(readRatedNames(order('Sate'), 'Lawar'), [])
  assert.deepEqual(readRatedNames([], 'Lawar'), [])
  assert.deepEqual(readRatedNames(order('Sate', 'SATE', 'Saté'), 'Lawar'), [], 'one distinct name')
  assert.deepEqual(readRatedNames(order('Sate', 'x'.repeat(141)), 'Lawar'), [])
  assert.deepEqual(readRatedNames(order('Sate', 'x'.repeat(140)), 'Lawar'), ['Sate', 'x'.repeat(140)])
  const many = Array.from({ length: 14 }, (_, i) => `Dish ${i + 1}`)
  assert.deepEqual(readRatedNames(order(...many), 'Dish 2'), [1, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => `Dish ${n}`))
  // Two names where one is the answer: one row (the page shows rows only beside an answer).
  assert.deepEqual(readRatedNames(order('Sate', 'Lawar'), 'Sate'), ['Lawar'])
})

test('an order the app would not read is no order at all', () => {
  for (const bad of [null, 'Sate', {}, [null], [{ name: 'Sate' }], [{ name: 'Sate', rank: 1 }, { name: '', rank: 2 }],
    [{ name: 'Sate', rank: 2 }, { name: 'Lawar', rank: 3 }], [{ name: 'Sate', rank: 1 }, { name: 'Lawar', rank: 0 }], [{ name: 'Sate', rank: 1.5 }, { name: 'Lawar', rank: 2 }]]) {
    assert.deepEqual(readRatedNames(bad, 'x'), [], JSON.stringify(bad))
  }
})

test('the answer is the app\'s dishToOrder as written: none for an opted-out venue, and nothing malformed', () => {
  assert.deepEqual(readAnswer({ dishToOrder: { name: ' Nasi campur ayam betutu ', maitred: true } }), { name: 'Nasi campur ayam betutu', maitred: true })
  assert.equal(readAnswer({ dishToOrder: { name: 'Sate', maitred: false }, dishNamesPolicy: 'venue_opt_out' }), null)
  for (const bad of [undefined, {}, { dishToOrder: null }, { dishToOrder: 'Sate' }, { dishToOrder: ['Sate'] }, { dishToOrder: { name: 'Sate' } },
    { dishToOrder: { name: 'Sate', maitred: 'yes' } }, { dishToOrder: { name: '  ', maitred: false } }, { dishToOrder: { name: '!!', maitred: false } },
    { dishToOrder: { name: 'x'.repeat(141), maitred: false } }]) assert.equal(readAnswer(bad), null, JSON.stringify(bad))
  // No answer, no rows, whatever the menu says.
  assert.deepEqual(buildPlaceDishes(null, order('Sate', 'Lawar'), null), { answer: null, rated: [] })
})

test('an "Es …" iced dessert is food (Devon, 25 Nov 2026): the website keeps no drink list that would drop one', () => {
  // Drinks are the server's to filter (functions/venueMenus/schema.js isDrinkName; dishToOrder never names one).
  // The website shows what the server wrote, so an iced dessert the server rates is listed like any dish.
  assert.deepEqual(readRatedNames(order('Es teler', 'Es campur', 'Es cendol'), 'Es teler'), ['Es campur', 'Es cendol'])
  assert.deepEqual(readAnswer({ dishToOrder: { name: 'Es teler', maitred: false } }), { name: 'Es teler', maitred: false })
  assert.doesNotMatch(readFileSync('lib/aggregates/dishes.ts', 'utf8'), /isDrinkName|DRINK_|\bdrinks?\s*[=:(]/)
})

test('the stored list stands until the answer changes or the daily pass, and a stored value is read defensively', () => {
  const answer = { name: 'Sate', maitred: false }
  const stored = { answer, rated: ['Lawar', 'Babi guling'] }
  assert.equal(needsRatingOrder(answer, stored, false), false)
  assert.equal(needsRatingOrder(answer, stored, true), true)
  assert.equal(needsRatingOrder(answer, null, false), true)
  assert.equal(needsRatingOrder({ name: 'Sate', maitred: true }, stored, false), true)
  assert.equal(needsRatingOrder({ name: 'Lawar', maitred: false }, stored, false), true)
  assert.equal(needsRatingOrder(null, stored, true), false, 'no answer: the menu is never read')
  assert.deepEqual(buildPlaceDishes(answer, undefined, stored), stored)
  assert.deepEqual(buildPlaceDishes({ name: 'Lawar', maitred: false }, undefined, stored), { answer: { name: 'Lawar', maitred: false }, rated: [] })
  assert.deepEqual(parseStoredDishes(stored), stored)
  assert.deepEqual(parseStoredDishes({ answer: null, rated: [] }), { answer: null, rated: [] })
  for (const bad of [null, [], {}, { answer: null }, { answer: 'Sate', rated: [] }, { answer, rated: [1] }]) assert.equal(parseStoredDishes(bad), null, JSON.stringify(bad))
  assert.equal(foldName('Nasi Goreng — Udang!'), 'nasi goreng udang')
})

// ── The real cron, in memory ─────────────────────────────────────────────────────────────────────────────────────

const STORAGE = 'https://firebasestorage.googleapis.com/v0/b/munchies-expo.firebasestorage.app/o/'
const BASE = '2b6fbe2'
const atBase = path => { try { return execFileSync('git', ['show', `${BASE}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch { return null } }
const baseAvailable = atBase('package.json') !== null

function seed() {
  const data = new Map()
  const meal = (id, placeProviderId, caption, n) => data.set(`meals/${id}`, { placeProviderId, locationName: 'Tagged name', createdAt: { _seconds: 1_790_000_000 + n }, isPublic: true,
    moderationStatus: 'active', imageURL: `${STORAGE}${id}.jpg`, thumbnailUrl: '', caption, mealType: 'Dinner', userID: `user-${id}` })
  meal('m1', 'p-answer', 'Nasi goreng udang tonight', 1); meal('m2', 'p-answer', 'Sate with friends', 2)
  meal('m3', 'p-maitred', 'Lawar at lunch', 3); meal('m4', 'p-maitred', 'Babi guling again', 4)
  meal('m5', 'p-none', 'Mie goreng here', 5); meal('m6', 'p-none', 'Nasi campur again', 6)
  meal('m7', 'p-optout', 'Sate lilit lunch', 7); meal('m8', 'p-optout', 'Lawar for two', 8)
  meal('m9', 'p-test', 'Test meal here', 9); meal('m10', 'p-test', 'Another test meal', 10)
  const venue = (id, extra) => data.set(`restaurants/${id}`, { displayName: `Venue ${id}`, state: 'active', publicMealCount: 2, ...extra })
  venue('p-answer', { dishToOrder: { name: 'Nasi campur ayam betutu', maitred: false } })
  venue('p-maitred', { dishToOrder: { name: 'Babi guling', maitred: true } })
  venue('p-none', {})
  venue('p-optout', { dishToOrder: { name: 'Sate lilit', maitred: false }, dishNamesPolicy: 'venue_opt_out' })
  venue('p-test', { isTestVenue: true, dishToOrder: { name: 'Test dish', maitred: false } })
  const menu = (id, names) => data.set(`venueMenus/${id}`, { dishRatingOrder: order(...names),
    sections: [{ title: 'MENU SECTIONS MUST NOT BE READ', items: names.map(name => ({ name, price: { amount: 45000, currency: 'IDR' } })) }] })
  menu('p-answer', ['Nasi campur ayam betutu', 'Nasi goreng udang', 'Sate', 'Mie goreng'])
  menu('p-maitred', ['Lawar', 'Babi guling'])
  menu('p-none', ['Mie goreng', 'Nasi campur'])
  menu('p-optout', ['Sate lilit', 'Lawar'])
  menu('p-test', ['Test dish', 'Other test dish'])
  for (let i = 1; i <= 10; i++) data.set(`users/user-m${i}`, { username: `diner_${i}` })
  data.set('eatEvidenceAggregateState/p-answer', { eat: 6, yeet: 2, tie: 0 })
  return data
}

function lane({ env = {}, base = false, clock = Date.UTC(2026, 10, 27, 12, 5) } = {}) {
  const data = seed(), reads = [], masks = [], selects = [], writes = [], failures = new Set(), errors = []
  const time = { now: clock }
  class ClockDate extends Date { constructor(...args) { super(...(args.length ? args : [time.now])) } static now() { return time.now } }
  class Timestamp { constructor(ms) { this.ms = ms } static now() { return new Timestamp(time.now) } toDate() { return new Date(this.ms) } toMillis() { return this.ms } }
  const snapshot = (path, value) => ({ id: path.split('/').at(-1), exists: value !== undefined, data: () => value === undefined ? undefined : JSON.parse(JSON.stringify(value)) })
  const read = async path => { reads.push(path); if (failures.has(path)) throw new Error('read unavailable'); return snapshot(path, data.get(path)) }
  const ref = path => ({ path, id: path.split('/').at(-1), get: () => read(path), collection: name => collection(`${path}/${name}`) })
  const collection = path => {
    const query = { doc: id => ref(`${path}/${id}`), where: () => query,
      select: (...fields) => { selects.push({ path, fields }); return query },
      get: async () => ({ docs: await Promise.all([...data.keys()].filter(key => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/')).map(read)) }) }
    return query
  }
  const db = { collection, doc: ref, getAll: (...refs) => {
    const mask = refs.at(-1)?.fieldMask
    if (mask) refs.pop()
    masks.push({ collection: refs[0]?.path.split('/')[0], mask: mask ? [...mask] : null })
    return Promise.all(refs.map(async value => {
      const result = await read(value.path)
      return mask && result.exists ? snapshot(value.path, Object.fromEntries(mask.filter(key => key in result.data()).map(key => [key, result.data()[key]]))) : result
    }))
  }, bulkWriter() {
    const queue = []
    return { onWriteError() {}, set: (reference, value) => new Promise(done => queue.push(() => { writes.push(['set', reference.path, JSON.parse(JSON.stringify(value))]); data.set(reference.path, value); done() })),
      delete: reference => new Promise(done => queue.push(() => { writes.push(['delete', reference.path]); data.delete(reference.path); done() })),
      async close() { for (const task of queue.splice(0)) task() } }
  } }
  const modules = new Map()
  const processLike = { env: { CRON_SECRET: 'test-secret', ...env } }
  function load(relative) {
    let file = resolve(relative)
    if (!existsSync(file) && existsSync(`${file}.ts`)) file += '.ts'
    if (modules.has(file)) return modules.get(file)
    const exports = {}; modules.set(file, exports)
    const name = file.replace(`${process.cwd()}/`, '')
    const text = (base && atBase(name)) || readFileSync(file, 'utf8')
    const code = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
    runInNewContext(code, { exports, Date: ClockDate, process: processLike, console: { warn() {}, error: (...args) => errors.push(String(args[0])), log() {} }, Buffer,
      fetch() { throw new Error('External requests forbidden') },
      require(id) {
        if (id === 'node:crypto') return { createHash, timingSafeEqual: (a, b) => a.equals(b) }
        if (id === 'server-only') return {}
        if (id === 'firebase-admin/firestore') return { Timestamp }
        if (id === 'next/server') return { NextResponse: { json: (body, init) => ({ body, status: init?.status ?? 200 }) } }
        if (id === 'next/cache') return { unstable_cache: fn => fn }
        if (id === '@/lib/website-fixtures') return { WEBSITE_FIXTURES: false }
        if (id === '@/lib/firebase-admin') return { getDb: () => db }
        if (id === '@/lib/place-city') return { getPlaceSeed: () => undefined, hasSeededWhere: () => false, isFoodVenue: () => true, placeLabel: () => null,
          getPlaceWhere: async ids => new Map(ids.map(id => [id, { city: 'Pererenan', country: 'Indonesia' }])) }
        if (id === '@/lib/aggregates/compute') return { ...load('lib/aggregates/compute.ts'),
          computeEatStandings: async () => ({ rows: [], all: [], cities: [], belowFloor: 0, matchups: 0, countries: 0, computedAt: '' }),
          computePlaceStats: async () => ({ places: 600, recentMeals: 500, mealCount: 581, topPlaces: [] }) }
        if (id === '@/lib/aggregates/maitred') return { ...load('lib/aggregates/maitred.ts'),
          readMaitredSource: async () => ({ verifiedAt: time.now, status: 'ready', holders: [], places: [] }) }
        if (id.startsWith('@/')) return load(id.slice(2))
        if (id.startsWith('.')) return load(resolve(dirname(file), id))
        throw new Error(`Unexpected external module: ${id}`)
      },
    }, { filename: file })
    return exports
  }
  const run = async (status = 200) => {
    const response = await load('app/api/cron/aggregates/route.ts').GET(new Request('https://www.makanofficial.com/api/cron/aggregates', { headers: { authorization: 'Bearer test-secret' } }))
    assert.equal(response.status, status, JSON.stringify(response.body))
    return response.body
  }
  const stored = id => { const value = data.get(`webAggregates/places/items/${id}`)?.payload; return value && JSON.parse(JSON.stringify(value)) }
  const reset = () => { reads.length = 0; masks.length = 0; selects.length = 0; writes.length = 0 }
  return { data, reads, masks, selects, writes, failures, errors, time, run, stored, reset }
}
const ON = { DISH_PAGES: '1' }
const menuReads = run => run.reads.filter(path => path.startsWith('venueMenus/'))

test('switch on: each place gets its dishes, read through the restaurant read it already made and the menu\'s order alone', async () => {
  const run = lane({ env: ON })
  await run.run()
  assert.deepEqual(run.stored('p-answer').dishes, { answer: { name: 'Nasi campur ayam betutu', maitred: false }, rated: ['Nasi goreng udang', 'Sate', 'Mie goreng'] })
  assert.deepEqual(run.stored('p-maitred').dishes, { answer: { name: 'Babi guling', maitred: true }, rated: ['Lawar'] })
  assert.deepEqual(run.stored('p-none').dishes, { answer: null, rated: [] })
  // M2 (review, 27 Nov 2026): no `dishes` at all, so the page draws no block (the app shows no decision section for it).
  assert.equal(run.stored('p-optout').dishes, undefined, 'a venue that opted out of dish names gets no dishes')
  assert.ok(run.stored('p-optout').meals.length, 'its page and meals stay')
  assert.equal(run.stored('p-test'), undefined, 'a test venue has no page and no dishes')
  // The answer rode on the restaurant read: no read of its own.
  const restaurantMasks = run.masks.filter(m => m.collection === 'restaurants')
  assert.equal(restaurantMasks.length, 1)
  assert.ok(restaurantMasks[0].mask.includes('dishToOrder') && restaurantMasks[0].mask.includes('dishNamesPolicy'))
  // The menu: only `dishRatingOrder`, only for the two places with an answer.
  assert.deepEqual(run.masks.filter(m => m.collection === 'venueMenus'), [{ collection: 'venueMenus', mask: ['dishRatingOrder'] }])
  assert.deepEqual(menuReads(run).sort(), ['venueMenus/p-answer', 'venueMenus/p-maitred'])
  for (const id of ['p-answer', 'p-maitred', 'p-none', 'p-optout']) assert.doesNotMatch(JSON.stringify(run.stored(id)), /MENU SECTIONS|45000|IDR|rank/)
  // The stored places are read once (hashes and dishes together), and the writer does not read them again.
  assert.deepEqual(run.selects.filter(s => s.path === 'webAggregates/places/items'), [{ path: 'webAggregates/places/items', fields: ['contentHash', 'payload.dishes'] }])
})

test('switch on: the menu is read again only when an answer changes or in the 03 UTC run, and an unchanged place is not written', async () => {
  const run = lane({ env: ON })
  await run.run()
  run.reset()
  await run.run()
  assert.deepEqual(menuReads(run), [], 'same hour, same answers: no menu read')
  assert.deepEqual(run.writes.filter(([, path]) => path.startsWith('webAggregates/places/items/')), [], 'unchanged hash: no write')
  // The rating order changed on the server, but the answer did not: the stored list stands until the daily pass.
  run.data.get('venueMenus/p-answer').dishRatingOrder = order('Sate', 'Nasi campur ayam betutu', 'Mie goreng')
  run.reset(); run.time.now = Date.UTC(2026, 10, 27, 13, 5)
  await run.run()
  assert.deepEqual(menuReads(run), [])
  assert.deepEqual(run.stored('p-answer').dishes.rated, ['Nasi goreng udang', 'Sate', 'Mie goreng'])
  // The 03 UTC run reads every answered place's order once.
  run.reset(); run.time.now = Date.UTC(2026, 10, 28, 3, 5)
  await run.run()
  assert.deepEqual(menuReads(run).sort(), ['venueMenus/p-answer', 'venueMenus/p-maitred'])
  assert.deepEqual(run.stored('p-answer').dishes.rated, ['Sate', 'Mie goreng'])
  assert.deepEqual(run.writes.filter(([, path]) => path.startsWith('webAggregates/places/items/')).map(([, path]) => path), ['webAggregates/places/items/p-answer'])
  // A changed answer reads that place's menu only.
  run.data.get('restaurants/p-maitred').dishToOrder = { name: 'Lawar', maitred: false }
  run.reset(); run.time.now = Date.UTC(2026, 10, 28, 4, 5)
  await run.run()
  assert.deepEqual(menuReads(run), ['venueMenus/p-maitred'])
  assert.deepEqual(run.stored('p-maitred').dishes, { answer: { name: 'Lawar', maitred: false }, rated: ['Babi guling'] })
  // An answer that goes away takes its rows with it, with no menu read.
  delete run.data.get('restaurants/p-maitred').dishToOrder
  run.reset(); run.time.now = Date.UTC(2026, 10, 28, 5, 5)
  await run.run()
  assert.deepEqual(menuReads(run), [])
  assert.deepEqual(run.stored('p-maitred').dishes, { answer: null, rated: [] })
})

test('switch on: a run\'s reads are the switch-off run\'s plus the menus it needs, and nothing more', async () => {
  const off = lane(), on = lane({ env: ON })
  await off.run(); await on.run()
  assert.deepEqual(on.reads.filter(path => !path.startsWith('venueMenus/') && path !== 'config/webListing').sort(), off.reads.sort())
  assert.equal(menuReads(on).length, 2)
  assert.equal(on.reads.filter(path => path === 'config/webListing').length, 1, 'the takedown list: one read per run')
})

for (const value of [undefined, '', '0', 'true', 'on', ' 1']) {
  test(`switch off (DISH_PAGES=${JSON.stringify(value)}): the cron reads, masks and writes exactly what main's cron did`, { skip: !baseAvailable && `commit ${BASE} is not in this clone` }, async () => {
    const env = value === undefined ? {} : { DISH_PAGES: value }
    const now = lane({ env }), main = lane({ env, base: true })
    await now.run(); await main.run()
    assert.ok(now.reads.length > 20 && now.writes.length > 5, 'the comparison covers a real run')
    assert.deepEqual(now.reads, main.reads)
    assert.deepEqual(now.masks, main.masks)
    assert.deepEqual(now.selects, main.selects)
    const strip = writes => writes.map(([kind, path, value]) => [kind, path, value && { ...value, updatedAt: null, lastRunAt: null }])
    assert.deepEqual(strip(now.writes), strip(main.writes))
    assert.ok(!JSON.stringify(now.writes).includes('dishes'))
    assert.deepEqual(menuReads(now), [])
  })
}

test('the makan-devel dry run refuses every other project and has no write in it', () => {
  const source = readFileSync('scripts/dish-pages-dry-run.mjs', 'utf8')
  assert.doesNotMatch(source, /\.(set|update|delete|create|add)\(|bulkWriter|\.batch\(|runTransaction|fetch\(|aggregates\/route|computePlaceDirectory/)
  assert.match(source, /fieldMask: RATING_ORDER_FIELDS/)
  for (const project of [undefined, '', 'munchies-expo', 'MAKAN-DEVEL']) {
    const result = spawnSync(process.execPath, ['scripts/dish-pages-dry-run.mjs'], { env: { PATH: process.env.PATH, ...(project === undefined ? {} : { FIREBASE_PROJECT_ID: project }) }, encoding: 'utf8' })
    assert.equal(result.status, 2, String(project))
    assert.match(result.stderr, /Refusing: set FIREBASE_PROJECT_ID=makan-devel/)
  }
})

// RM20616 dish pages U2 — the takedown, in the cron: a venue taken down gets no dishes and no menu read. Its place
// document itself stays (the standings and Maître d' listings join on it); the readers drop its page.
test('switch on: a venue taken down gets no dishes and no menu read; a missing or malformed list hides nothing', async () => {
  const run = lane({ env: ON })
  run.data.set('config/webListing', { hidden: ['p-answer', 42, 'bad id!'] })
  await run.run()
  assert.equal(run.stored('p-answer').dishes, undefined)
  assert.ok(run.stored('p-answer').meals.length, 'the record stays for the listings')
  assert.deepEqual(menuReads(run), ['venueMenus/p-maitred'])
  assert.deepEqual(run.stored('p-maitred').dishes.answer, { name: 'Babi guling', maitred: true })
  for (const listing of [undefined, null, {}, { hidden: 'p-answer' }, { hidden: [{ id: 'p-answer' }] }, { hidden: [] }]) {
    const other = lane({ env: ON })
    if (listing !== undefined) other.data.set('config/webListing', listing)
    await other.run()
    assert.deepEqual(other.stored('p-answer').dishes.rated, ['Nasi goreng udang', 'Sate', 'Mie goreng'], JSON.stringify(listing))
    assert.equal(other.reads.filter(path => path === 'config/webListing').length, 1)
  }
})

// Review L3: the cron uses the list only to skip dishes for venues whose pages the readers already hide, so a failed read
// must never cost the hourly refresh of the standings, directory and Maître d' aggregates.
test('switch on: if the takedown list cannot be read the run logs it and carries on; switch off, it is never read', async () => {
  const run = lane({ env: ON })
  run.data.set('config/webListing', { hidden: ['p-maitred'] })
  await run.run()
  run.reset(); run.failures.add('config/webListing'); run.time.now += 3_600_000
  await run.run(200)
  assert.deepEqual(run.errors, ['aggregates: takedown list unavailable; dishes computed as if nothing were hidden.'])
  assert.ok(run.writes.some(([, path]) => path === 'webAggregates/meta'), 'the heartbeat and the aggregates are written')
  assert.deepEqual(run.stored('p-answer').dishes.rated, ['Nasi goreng udang', 'Sate', 'Mie goreng'])
  const off = lane()
  off.failures.add('config/webListing')
  await off.run()
  assert.ok(!off.reads.includes('config/webListing'))
})
