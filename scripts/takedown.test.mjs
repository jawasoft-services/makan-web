import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTranslator } from 'next-intl'
import ts from 'typescript'
import { lane, PLACE, MEAL, KEY, MEAL_ROUTE, PROFILE_ROUTE, venue } from './share-v2-test-lane.mjs'

// RM20616 dish pages U2 — a venue's takedown (Devon, 27 Nov 2026: "Page only", then "Yes, plain-text name"). A venue in
// config/webListing has no page: /places/<slug> is not found and leaves the sitemap and the A–Z directory. It stays in
// the standings and the Maître d' listings as it is, its name in plain text where it was a link, and its address leaves
// the standings' search markup. An absent or malformed document hides nothing. Not behind any switch.

const require = createRequire(import.meta.url)
const BASE = '2b6fbe2'
const atBase = path => { try { return execFileSync('git', ['show', `${BASE}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch { return null } }
const baseAvailable = atBase('package.json') !== null
const copy = value => JSON.parse(JSON.stringify(value))

/** Runs a module with exactly the dependencies given; anything else fails the test. */
function load(path, deps, { source = null, globals = {} } = {}) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(source ?? readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, URL, Intl, ...globals, require(name) {
      if (name in deps) return deps[name]
      if (name === 'react/jsx-runtime' || name === 'react') return require(name)
      throw new Error(`Unexpected dependency of ${path}: ${name}`)
    },
  })
  return exports
}

// ── The list itself ───────────────────────────────────────────────────────────────────────────────────────────────

test('the takedown list: place ids only, an absent or malformed document hides nothing, other entries still count', () => {
  const { parseWebListing } = lane().load('lib/web-listing.ts')
  assert.deepEqual([...parseWebListing({ hidden: ['ChIJabc', 'fixture_kendal_0001'] })], ['ChIJabc', 'fixture_kendal_0001'])
  assert.deepEqual([...parseWebListing({ hidden: ['ChIJabc', 42, null, '', 'has space', 'a/b', { id: 'x' }, 'ChIJabc'] })], ['ChIJabc'])
  for (const bad of [undefined, null, 'ChIJabc', [], {}, { hidden: 'ChIJabc' }, { hidden: { ChIJabc: true } }, { hidden: null }]) assert.equal(parseWebListing(bad).size, 0, JSON.stringify(bad))
})

test('the readers read the list once an hour per server; a failed read keeps the last list and is not retried for a minute', async () => {
  const run = lane(); run.useCache()
  const { getHiddenPlaceIds } = run.load('lib/web-listing.ts')
  assert.equal((await getHiddenPlaceIds()).size, 0, 'no document: nothing hidden')
  assert.deepEqual(run.reads, ['config/webListing'])
  run.seed.set('config/webListing', { hidden: [PLACE] })
  assert.equal((await getHiddenPlaceIds()).size, 0, 'within the hour the cached answer stands')
  assert.deepEqual(run.reads, ['config/webListing'], 'one read, shared by every page')
  run.state.clock += 3_600_000
  assert.deepEqual([...await getHiddenPlaceIds()], [PLACE])
  // Review L2: a failed read keeps the takedown it already knew (stale on error, never fail closed or forget it)...
  run.state.clock += 3_600_000
  run.failures.add('config/webListing')
  run.reads.length = 0
  assert.deepEqual([...await getHiddenPlaceIds()], [PLACE])
  assert.deepEqual(run.reads, ['config/webListing'])
  assert.deepEqual(run.logs, ['web-listing: takedown list unavailable; using the last list read.'])
  // ...and is not retried by every request for about a minute.
  for (let i = 0; i < 5; i++) assert.deepEqual([...await getHiddenPlaceIds()], [PLACE])
  run.state.clock += 59_000
  assert.deepEqual([...await getHiddenPlaceIds()], [PLACE])
  assert.deepEqual(run.reads, ['config/webListing'], 'no read while the failure is remembered')
  run.state.clock += 2_000
  run.failures.delete('config/webListing'); run.seed.set('config/webListing', { hidden: [] })
  assert.equal((await getHiddenPlaceIds()).size, 0, 'after a minute it reads again, and a lifted takedown lifts')
  assert.deepEqual(run.reads, ['config/webListing', 'config/webListing'])
})

test('a server that has never read the list hides nothing while it cannot read it, and retries after a minute', async () => {
  const run = lane(); run.useCache(); run.failures.add('config/webListing'); run.seed.set('config/webListing', { hidden: [PLACE] })
  const { getHiddenPlaceIds } = run.load('lib/web-listing.ts')
  assert.equal((await getHiddenPlaceIds()).size, 0, 'fail open: a whole directory of 404s would be worse')
  assert.equal((await getHiddenPlaceIds()).size, 0)
  assert.deepEqual(run.reads, ['config/webListing'])
  assert.deepEqual(run.logs, ['web-listing: takedown list unavailable; hiding nothing.'])
  run.state.clock += 61_000; run.failures.delete('config/webListing')
  assert.deepEqual([...await getHiddenPlaceIds()], [PLACE])
})

test('fixtures: MAKAN_WEBSITE_FIXTURE_TAKEDOWN=1 takes the fixture restaurant down, with no database', async () => {
  const on = lane({ fixtures: true, env: { MAKAN_WEBSITE_FIXTURE_TAKEDOWN: '1' } })
  assert.deepEqual([...await on.load('lib/web-listing.ts').getHiddenPlaceIds()], ['fixture_kendal_0001'])
  for (const env of [{}, { MAKAN_WEBSITE_FIXTURE_TAKEDOWN: '0' }, { MAKAN_WEBSITE_FIXTURE_TAKEDOWN: 'true' }]) {
    assert.equal((await lane({ fixtures: true, env }).load('lib/web-listing.ts').getHiddenPlaceIds()).size, 0, JSON.stringify(env))
  }
})

// ── The index of pages (lib/place-directory.ts) ───────────────────────────────────────────────────────────────────

const hashOf = id => createHash('sha1').update(id).digest('hex').slice(0, 6)
const record = (id, name) => ({ placeId: id, slug: `x-${hashOf(id)}`, hash: hashOf(id), name, where: { city: 'Pererenan', country: 'Indonesia' }, address: '', lat: null, lng: null,
  cuisine: [], since: null, publicMealCount: 2, meals: [{ id: `${id}-meal`, src: 'https://firebasestorage.googleapis.com/x.jpg', thumb: '', caption: '', mealType: '', username: '', at: '2026-11-01T00:00:00.000Z' }], indexable: true })
const NAMES = { 'p-one': 'Warung Satu', 'p-two': 'Warung Dua', 'p-three': 'Warung Tiga' }

function directoryLane({ listing, failListing = false, source = null, fixtures = false, fixtureEnv = {} } = {}) {
  const reads = [], recovered = [], logs = []
  const db = { doc: path => ({ get: async () => {
    reads.push(path)
    if (failListing && path === 'config/webListing') throw new Error('read unavailable')
    return { exists: path === 'config/webListing' && listing !== undefined, data: () => listing }
  } }) }
  // The stored aggregate lists p-one and p-two; p-three is a public venue it does not list yet (the reader recovers it).
  const stored = { 'p-one': record('p-one', NAMES['p-one']), 'p-two': record('p-two', NAMES['p-two']) }
  const index = Object.values(stored).map(({ placeId, slug, hash, name, where, indexable, publicMealCount }) => ({ placeId, slug, hash, name, city: where.city, indexable, meals: publicMealCount }))
  const env = { MAKAN_WEBSITE_FIXTURES: fixtures ? '1' : '0', ...fixtureEnv }
  const fixturesModule = load('lib/website-fixtures.ts', { 'server-only': {}, 'node:crypto': { createHash } }, { globals: { process: { env } } })
  const cache = { 'next/cache': { unstable_cache: fn => fn } }
  const webListing = load('lib/web-listing.ts', { '@/lib/website-fixtures': fixturesModule, 'server-only': {}, ...cache, '@/lib/firebase-admin': { getDb: () => db } },
    { globals: { console: { error: (...args) => logs.push(args.join(' ')) } } })
  const deps = {
    '@/lib/website-fixtures': fixturesModule, 'server-only': {}, ...cache,
    '@/lib/firebase-admin': { getDb: () => db },
    '@/lib/public-venues': { getPublicVenues: async () => Object.keys(NAMES).map(placeId => ({ placeId, name: NAMES[placeId], publicMealCount: 2, lat: null, lng: null })), getExcludedPublicVenueIds: async () => [] },
    '@/lib/eat-standings': { getEatStandings: async () => ({ rows: [], all: [], cities: [] }) },
    '@/lib/slug': load('lib/slug.ts', { 'node:crypto': { createHash } }),
    '@/lib/aggregates/compute': { computePlaceDirectory: async () => { throw new Error('no live scan here') },
      computePlaceDirectoryForPlace: async (_db, id) => { recovered.push(id); return record(id, NAMES[id]) },
      indexOf: directory => directory.map(p => ({ placeId: p.placeId, slug: p.slug, hash: p.hash, name: p.name, city: p.where?.city ?? null, indexable: p.indexable, meals: p.publicMealCount ?? p.meals.length })) },
    '@/lib/aggregates/maitred': { getVerifiedMaitredSource: async () => ({ holders: [] }) },
    '@/lib/aggregates/store': { MAX_AGE_MS: 7_200_000, readLastRun: async () => new Date(Date.now() - 60_000), readPlaceIndex: async () => index,
      readPlace: async (_db, id) => { reads.push(`webAggregates/places/items/${id}`); return stored[id] ?? null },
      readPlaces: async (_db, ids) => new Map(ids.filter(id => stored[id]).map(id => [id, stored[id]])) },
    '@/lib/web-listing': webListing,
    '@/lib/aggregates/types': load('lib/aggregates/types.ts', {}),
  }
  const api = load('lib/place-directory.ts', deps, { source, globals: { console: { error: (...args) => logs.push(args.join(' ')), warn() {} } } })
  return { api, reads, recovered, logs }
}
const ids = list => copy(list.map(entry => entry.placeId))

test('a venue taken down leaves the index of pages: not found by its address, gone from the sitemap and the A–Z input', async () => {
  const run = directoryLane({ listing: { hidden: ['p-one'] } })
  assert.deepEqual(ids(await run.api.getPlaceIndex()), ['p-two', 'p-three'])
  assert.equal(await run.api.getDirectoryPlace(`warung-satu-${hashOf('p-one')}`), null, 'both place pages call this and answer not found')
  assert.ok(await run.api.getDirectoryPlace(`warung-dua-${hashOf('p-two')}`))
  // Its record stays, for the standings' photos and the Maître d' join; nothing links to it.
  assert.equal((await run.api.getDirectoryPlaceById('p-one'))?.placeId, 'p-one')
  assert.ok(ids(await run.api.getPlaceDirectoryStrict()).includes('p-one'))
})

test('a venue taken down that the stored index does not list is never recovered (no read) only to be dropped', async () => {
  const run = directoryLane({ listing: { hidden: ['p-three'] } })
  assert.deepEqual(ids(await run.api.getPlaceIndex()), ['p-one', 'p-two'])
  assert.deepEqual(run.recovered, [])
  assert.ok(!run.reads.includes('webAggregates/places/items/p-three'))
  const open = directoryLane()
  assert.deepEqual(ids(await open.api.getPlaceIndex()), ['p-one', 'p-two', 'p-three'])
  assert.deepEqual(open.recovered, ['p-three'])
})

test('no takedown document, a malformed one, or an unreadable one: the index is exactly what main serves, plus the one cached read', { skip: !baseAvailable && `commit ${BASE} is not in this clone` }, async () => {
  for (const options of [{}, { listing: {} }, { listing: { hidden: 'p-one' } }, { listing: { hidden: [] } }, { failListing: true }]) {
    const main = directoryLane({ source: atBase('lib/place-directory.ts') })
    const expected = copy(await main.api.getPlaceIndex())
    const run = directoryLane(options)
    assert.deepEqual(copy(await run.api.getPlaceIndex()), expected, JSON.stringify(options))
    assert.deepEqual(run.reads.filter(path => path !== 'config/webListing'), main.reads, JSON.stringify(options))
    assert.deepEqual(run.recovered, main.recovered)
    assert.deepEqual(copy(await run.api.getDirectoryPlace(`x-${hashOf('p-one')}`)), copy(await main.api.getDirectoryPlace(`x-${hashOf('p-one')}`)))
  }
  assert.deepEqual(directoryLane({ failListing: true }).logs, [])
  const failed = directoryLane({ failListing: true }); await failed.api.getPlaceIndex()
  assert.deepEqual(failed.logs, ['web-listing: takedown list unavailable; hiding nothing.'])
})

test('fixtures: the taken-down fixture restaurant leaves the index of pages', async () => {
  const on = directoryLane({ fixtures: true, fixtureEnv: { MAKAN_WEBSITE_FIXTURE_TAKEDOWN: '1' } })
  assert.deepEqual(ids(await on.api.getPlaceIndex()), ['fixture_cafe_000002'])
  assert.equal(await on.api.getDirectoryPlace('kendal-street-kitchen-f10001'), null)
  const off = directoryLane({ fixtures: true })
  assert.deepEqual(ids(await off.api.getPlaceIndex()), ['fixture_kendal_0001', 'fixture_cafe_000002'])
})

test('the sitemap drops a taken-down venue\'s two addresses and nothing else', async () => {
  const sitemapOf = async run => (await load('app/sitemap.ts', { '@/lib/place-directory': run.api, '@/lib/reviews': { getAllReviews: () => [] },
    '@/lib/eat-standings': { getEatStandings: async () => ({ all: [], cities: [] }) } }).default()).map(entry => entry.url)
  const before = await sitemapOf(directoryLane()), after = await sitemapOf(directoryLane({ listing: { hidden: ['p-one'] } }))
  const gone = before.filter(url => !after.includes(url))
  assert.equal(gone.length, 2)
  assert.ok(gone.every(url => /\/places\/warung-satu-[0-9a-f]{6}$/.test(url)) && gone.some(url => url.includes('/id/places/')))
  assert.ok(after.every(url => before.includes(url)))
})

// ── Every link to a page: plain text for a venue taken down, unchanged otherwise ──────────────────────────────────

const paths = { '@/i18n/paths': { localizePath: (locale, path) => `${locale === 'id' ? '/id' : ''}${path}` } }
const link = { 'next/link': { default: ({ href, className, children }) => createElement('a', { href, className }, children) } }
const row = (id, rank) => ({ placeId: id, slug: `${id}-abc123`, name: `Venue ${id}`, eats: 8, yeets: 2, ties: 0, matchups: 10, eatRate: 0.8, since: null,
  where: { city: 'Pererenan', country: 'Indonesia' }, lat: null, lng: null, publicMeals: 2, recentCaptions: [], rank, cityRank: rank })
const rows = [row('one', 1), row('two', 2)]

test('standings board: the row stays (rank, name, area, score), the name is plain text; with nothing hidden it is main\'s markup', { skip: !baseAvailable && `commit ${BASE} is not in this clone` }, () => {
  const deps = { ...paths, ...link, './filter-standings': { filterStandings: list => list.map((row, i) => ({ row, rank: i + 1 })) } }
  const now = load('components/standings/StandingsTable.tsx', deps).default
  const main = load('components/standings/StandingsTable.tsx', deps, { source: atBase('components/standings/StandingsTable.tsx') }).default
  const props = { rows, locale: 'en', labels: { eats: 'Eats', yeets: 'Yeets' }, caption: 'Standings' }
  assert.equal(renderToStaticMarkup(createElement(now, props)), renderToStaticMarkup(createElement(main, props)))
  const html = renderToStaticMarkup(createElement(now, { ...props, unlinked: ['one'] }))
  assert.match(html, /<span class="rk">1<\/span>.*<span class="nm"><b>Venue one<\/b><small>Pererenan · Indonesia<\/small><\/span>.*80%.*8 Eats · 2 Yeets/)
  assert.doesNotMatch(html, /\/places\/one-abc123/)
  assert.match(html, /<a href="\/places\/two-abc123">Venue two<\/a>/)
})

test('standings pages: the table gets only the hidden rows, and their address leaves the JSON-LD (both pages, both languages)', async () => {
  const messages = locale => JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))
  const standings = { rows, all: rows, cities: [{ slug: 'pererenan', city: 'Pererenan', country: 'Indonesia', rows }], belowFloor: 0, matchups: 20, countries: 1, computedAt: '2026-11-20T00:00:00.000Z' }
  const tables = []
  const deps = hidden => ({ ...paths, ...link,
    'next-intl/server': { setRequestLocale() {}, getTranslations: async value => { const locale = typeof value === 'object' ? value.locale : 'en'; const t = createTranslator({ locale, messages: messages(locale), namespace: typeof value === 'object' ? value.namespace : value }); const fn = (k, v) => t(k, v); fn.rich = (k, v) => t.rich(k, v); return fn } },
    'next/image': { default: () => null }, 'next/navigation': { notFound: () => { throw new Error('NOT_FOUND') } },
    '@/components/SiteSchema': { default: () => null }, '@/components/site/text': { em: c => c, SLOT: '{SLOT}', withSlot: s => s },
    '@/components/standings/StandingsTable': { default: props => { tables.push(props); return null } },
    '@/components/standings/standings-photos': { getStandingsPhotos: async () => ({ thumbs: {}, mosaic: [] }) },
    '@/lib/site-metadata': { createPageMetadata: () => ({}), SITE_URL: 'https://www.makanofficial.com' },
    '@/lib/eat-standings': { CITY_FLOOR: 5, EVIDENCE_FLOOR: 10, getEatStandingsSnapshot: async () => ({ standings, checkedAt: '2026-11-20T00:00:00.000Z' }), getEatStandings: async () => standings, getCityStanding: async () => ({ city: standings.cities[0], standings }) },
    '@/lib/place-directory': { getPlaceIndex: async () => [] },
    '@/lib/safe-json-ld': { safeJsonLd: JSON.stringify },
    '@/lib/web-listing': { getHiddenPlaceIds: async () => new Set(hidden), withoutPage: lane().load('lib/web-listing.ts').withoutPage },
  })
  const schemaOf = tree => {
    let found = null
    const walk = node => { if (!node || typeof node !== 'object') return; if (Array.isArray(node)) return node.forEach(walk); if (node.props?.type === 'application/ld+json') found = JSON.parse(node.props.dangerouslySetInnerHTML.__html); walk(node.props?.children) }
    walk(tree); return found
  }
  for (const [route, params] of [['app/[locale]/standings/page.tsx', {}], ['app/[locale]/standings/[city]/page.tsx', { city: 'pererenan' }]]) {
    for (const locale of ['en', 'id']) {
      const prefix = locale === 'id' ? '/id' : ''
      tables.length = 0
      const open = await load(route, deps([])).default({ params: Promise.resolve({ locale, ...params }) })
      renderToStaticMarkup(open)
      assert.ok(tables.length && tables.every(props => !('unlinked' in props)), `${route}: no prop when nothing is hidden`)
      const items = schemaOf(open).mainEntity.itemListElement
      assert.deepEqual(items.map(item => item.url), [`https://www.makanofficial.com${prefix}/places/one-abc123`, `https://www.makanofficial.com${prefix}/places/two-abc123`])
      tables.length = 0
      const hidden = await load(route, deps(['one', 'elsewhere'])).default({ params: Promise.resolve({ locale, ...params }) })
      renderToStaticMarkup(hidden)
      assert.ok(tables.every(props => JSON.stringify(props.unlinked) === '["one"]'), `${route}: only this page's hidden rows`)
      const after = schemaOf(hidden).mainEntity.itemListElement
      assert.equal(after.length, 2, 'the row stays')
      assert.equal(after[0].url, undefined); assert.equal(after[0].item.url, undefined); assert.equal(after[0].item.name, 'Venue one')
      assert.equal(after[1].url, `https://www.makanofficial.com${prefix}/places/two-abc123`)
      assert.doesNotMatch(JSON.stringify(after), /one-abc123/)
    }
  }
})

const translator = locale => value => createTranslator({ locale, messages: JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')), namespace: typeof value === 'string' ? value : value.namespace })
const surfaceDeps = (locale, hidden, extra = {}) => ({ ...paths, ...link,
  'next-intl/server': { getTranslations: async value => translator(locale)(value), getLocale: async () => locale },
  'next/image': { default: ({ src, alt }) => createElement('img', { src, alt }) },
  '@/components/motion/Reveal': { default: ({ children, ...props }) => createElement('div', props, children) },
  '@/lib/web-listing': { getHiddenPlaceIds: async () => new Set(hidden) }, ...extra })

test('home standings preview: the row stays, the name is plain text; with nothing hidden it is main\'s markup', { skip: !baseAvailable && `commit ${BASE} is not in this clone` }, async () => {
  for (const locale of ['en', 'id']) {
    const deps = hidden => surfaceDeps(locale, hidden, { '@/lib/eat-standings': { EVIDENCE_FLOOR: 10, getEatStandings: async () => ({ rows }) } })
    const render = async (hidden, source = null) => renderToStaticMarkup(await load('components/home/StandingsPreview.tsx', deps(hidden), { source }).default())
    assert.equal(await render([]), await render([], atBase('components/home/StandingsPreview.tsx')))
    const html = await render(['one'])
    assert.match(html, /<span class="block truncate[^"]*">Venue one<\/span>/)
    assert.doesNotMatch(html, /\/places\/one-abc123/)
    assert.match(html, /href="(\/id)?\/places\/two-abc123"/)
  }
})

test('Maître d\' listings: a pick card and an "others" row stay, with the name in plain text and no link to the page', { skip: !baseAvailable && `commit ${BASE} is not in this clone` }, async () => {
  const pick = { ...venue, placeId: 'one', slug: 'one-abc123', name: 'Venue one', notes: { always: 'Sambal goreng', another: '', why: '', tip: '' } }
  const other = { ...venue, placeId: 'two', slug: 'two-abc123', name: 'Venue two', notes: { always: '', another: '', why: '', tip: '' } }
  const thumb = load('lib/thumb.ts', {}), localPhoto = load('lib/local-photo.ts', {})
  for (const locale of ['en', 'id']) {
    const deps = hidden => surfaceDeps(locale, hidden, { '@/lib/maitred': { getMaitredDirectory: async () => ({ status: 'ready', venues: [pick, other] }) },
      '@/lib/dish-pages': { dishAnswersShown: () => false, maitredCardDish: () => null }, '@/lib/place-directory': { getPlaceDirectory: async () => { throw new Error('not read') } },
      '@/lib/place-photo': { getPlacePhoto: async () => null }, '@/lib/verified-menu-price': { getVerifiedMenuPrice: () => null },
      '@/lib/thumb': thumb, '@/lib/local-photo': localPhoto })
    const render = async (hidden, source = null) => renderToStaticMarkup(await load('components/home/MaitredShowcase.tsx', deps(hidden), { source }).default({}))
    assert.equal(await render([]), await render([], atBase('components/home/MaitredShowcase.tsx')))
    const html = await render(['one', 'two'])
    assert.doesNotMatch(html, /\/places\//)
    assert.match(html, />Venue one<\/span>/); assert.match(html, />Venue two<\/span>/); assert.match(html, /Sambal goreng/)
    assert.doesNotMatch(html, /absolute inset-0/, 'the card is not one big link any more')
  }
})

test('a diner\'s public crown rows: the row stays with the crown, the name in plain text', async () => {
  for (const locale of ['en', 'id']) {
    const run = lane(); run.state.hidden = [PLACE]
    const out = await run.page(PROFILE_ROUTE, { locale, slug: `dewi-l-${KEY}` })
    assert.match(out.html, /<span class="crownRow"><img src="\/redesign\/maitred-crown.svg"[^>]*\/>Warung Bu Sri<\/span>/)
    assert.doesNotMatch(out.html, /\/places\//)
    const shown = await lane().page(PROFILE_ROUTE, { locale, slug: `dewi-l-${KEY}` })
    assert.match(shown.html, /<a href="(\/id)?\/places\/warung-bu-sri-abc123" class="crownRow">/)
  }
})

test('a public meal page\'s venue line: the name in plain text (Share v2 page; today\'s page is in leaf-data.test.mjs)', async () => {
  for (const locale of ['en', 'id']) {
    const run = lane(); run.state.hidden = [PLACE]
    const out = await run.page(MEAL_ROUTE, { locale, id: MEAL })
    assert.match(out.html, /<p class="meta">Warung Bu Sri<\/p>/)
    assert.doesNotMatch(out.html, /\/places\//)
    assert.match((await lane().page(MEAL_ROUTE, { locale, id: MEAL })).html, /class="placeLink">Warung Bu Sri<\/a>/)
  }
  const fixture = lane({ fixtures: true, env: { SHARE_V2_PAGES: '1', MAKAN_WEBSITE_FIXTURE_TAKEDOWN: '1' } })
  const out = await fixture.page(MEAL_ROUTE, { locale: 'en', id: 'fixture-public-meal' })
  assert.match(out.html, /<p class="meta">Kendal Street Kitchen<\/p>/)
  assert.doesNotMatch(out.html, /\/places\//)
})

// Not one of the six points; the same principle (Devon's six points; the controller confirms these calls with him):
// the owner page's featured restaurant and featured usual orders never feature a venue taken down (the ranks shown
// stay real), and its city list keeps the row with the name in plain text, like the standings.
test('the owner page: the featured card and usual orders pass over a venue taken down; the city list keeps its row in plain text', { skip: !baseAvailable && `commit ${BASE} is not in this clone` }, async () => {
  const meals = id => [1, 2, 3].map(n => ({ id: `${id}-${n}`, src: `/redesign/${id}-${n}.jpg`, thumb: '', caption: '', mealType: '', username: '', at: '' }))
  const place = id => ({ placeId: id, slug: `${id}-abc123`, name: `Venue ${id}`, where: { city: 'London', country: 'United Kingdom' }, meals: meals(id) })
  const london = [row('one', 1), row('two', 2)].map(r => ({ ...r, where: { city: 'London', country: 'United Kingdom' } }))
  const standings = { rows: london, all: london, cities: [{ slug: 'london', city: 'London', country: 'United Kingdom', rows: london }] }
  const usual = id => ({ ...venue, placeId: id, slug: `${id}-abc123`, name: `Venue ${id}`, where: { city: 'London', country: 'United Kingdom' }, notes: { always: `Usual of ${id}`, another: '', why: '', tip: '' } })
  const deps = (hidden, locale) => ({ ...paths, ...link,
    'next-intl/server': { setRequestLocale() {}, getTranslations: async value => translator(locale)(value) },
    'next/image': { default: ({ src, alt }) => createElement('img', { src, alt }) },
    '@/components/SiteSchema': { default: () => null }, '@/components/site/text': { em: chunks => createElement('em', null, chunks) },
    '@/lib/site-metadata': { createPageMetadata: () => ({}), SITE_URL: 'https://www.makanofficial.com' },
    '@/lib/eat-standings': { getEatStandings: async () => standings },
    '@/lib/maitred': { getMaitredDirectory: async () => ({ status: 'ready', venues: [usual('one'), usual('two')] }) },
    '@/lib/place-directory': { getPlaceDirectory: async () => [place('one'), place('two')] },
    '@/lib/reviews': { getAllReviews: () => [] }, '@/lib/thumb': load('lib/thumb.ts', {}), '@/lib/local-photo': load('lib/local-photo.ts', {}),
    './PartnerForm': { default: () => null }, './FindRestaurant': { default: () => null }, './owners.css': {},
    '@/lib/web-listing': { getHiddenPlaceIds: async () => new Set(hidden) },
    // Dish answers not shown (the switches off): scripts/maitred-cards.test.mjs covers them on this page.
    '@/lib/dish-pages': load('lib/dish-pages.ts', { '@/lib/share-v2': load('lib/share-v2.ts', {}, { globals: { process: { env: {} } } }) }, { globals: { process: { env: {} } } }),
  })
  for (const locale of ['en', 'id']) {
    const render = async (hidden, source = null) => renderToStaticMarkup(await load('app/[locale]/partner/page.tsx', deps(hidden, locale), { source }).default({ params: Promise.resolve({ locale }) }))
    assert.equal(await render([]), await render([], atBase('app/[locale]/partner/page.tsx')), 'nothing hidden: main\'s markup')
    const before = await render([])
    assert.match(before, /href="(\/id)?\/places\/one-abc123" class="pd-shot"/); assert.match(before, /Usual of one/)
    const html = await render(['one'])
    assert.doesNotMatch(html, /\/places\/one-abc123/)
    assert.match(html, /href="(\/id)?\/places\/two-abc123" class="pd-shot"/, 'the next restaurant with three photos is featured')
    assert.match(html, /#2/, 'with its real rank')
    assert.doesNotMatch(html, /Usual of one/); assert.match(html, /Usual of two/)
    assert.match(html, /<li><span class="pd-n">1<\/span>Venue one<\/li>/)
    assert.match(html, /<li><span class="pd-n">2<\/span><a href="(\/id)?\/places\/two-abc123">Venue two<\/a><\/li>/)
  }
})
