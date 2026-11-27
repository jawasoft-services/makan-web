import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import vm from 'node:vm'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTranslator } from 'next-intl'
import ts from 'typescript'
import { venue } from './share-v2-test-lane.mjs'

// RM20616 dish pages, review L6 (Devon, 27 Nov 2026: "Same rule everywhere"). While the place page's dish answers are
// shown (DISH_PAGES and SHARE_V2_PAGES on), every Maître d' card that names a dish under "What to order here" names the
// app's answer, the dish the venue's own page shows, never the holder's free text. A card shows a regular's pick, so it
// names the answer only when the answer IS the Maître d's pick; otherwise it names no dish (the partner page and the home
// stickers then leave the venue out, as they leave out a holder with no usual today; the home showcase lists it among
// "others", which show no dish). A venue with no `dishes` (not computed, opted out) names none either. Off: main's cards.

const require = createRequire(import.meta.url)
const BASE = '2b6fbe2'
const atBase = path => { try { return execFileSync('git', ['show', `${BASE}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch { return null } }
const baseAvailable = atBase('package.json') !== null
const ON = { DISH_PAGES: '1', SHARE_V2_PAGES: '1' }
const OFFS = [{}, { DISH_PAGES: '1' }, { SHARE_V2_PAGES: '1' }, { DISH_PAGES: '0', SHARE_V2_PAGES: '1' }]

function load(path, deps, { source = null, env = {} } = {}) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(source ?? readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, URL, Intl, process: { env }, require(name) {
      if (name in deps) return deps[name]
      if (name === 'react/jsx-runtime' || name === 'react') return require(name)
      throw new Error(`Unexpected dependency of ${path}: ${name}`)
    },
  })
  return exports
}
const dishPages = env => load('lib/dish-pages.ts', { '@/lib/share-v2': load('lib/share-v2.ts', {}, { env }) }, { env })
const translator = locale => value => createTranslator({ locale, messages: JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')), namespace: typeof value === 'string' ? value : value.namespace })
const paths = { '@/i18n/paths': { localizePath: (locale, path) => `${locale === 'id' ? '/id' : ''}${path}` } }
const link = { 'next/link': { default: ({ href, className, children }) => createElement('a', { href, className }, children) } }
const image = { 'next/image': { default: ({ src, alt }) => createElement('img', { src, alt }) } }

// Four held venues: the Maître d's pick is the app's answer; an Eat or Yeet answer; no answer; no `dishes` (not computed
// or opted out). Every holder wrote a free-text pick.
const card = (id, always) => ({ ...venue, placeId: id, slug: `${id}-abc123`, name: `Venue ${id}`, where: { city: 'London', country: 'United Kingdom' }, photo: null, notes: { always, another: '', why: '', tip: '' } })
const VENUES = [card('pick', 'Harissa prawns, the big ones'), card('eoy', 'FREE TEXT EOY'), card('none', 'FREE TEXT NONE'), card('raw', 'FREE TEXT RAW')]
const DISHES = { pick: { answer: { name: 'Harissa prawns', maitred: true }, rated: [] }, eoy: { answer: { name: 'Sate lilit', maitred: false }, rated: [] }, none: { answer: null, rated: [] } }
const place = id => ({ placeId: id, slug: `${id}-abc123`, name: `Venue ${id}`, where: { city: 'London', country: 'United Kingdom' }, meals: [], ...(DISHES[id] ? { dishes: DISHES[id] } : {}) })

test('home (the live AgrHome page): its data passes the answers to the cards only while they are shown', async () => {
  const seen = []
  const deps = env => ({ 'server-only': {}, 'next/cache': { unstable_cache: fn => fn },
    '@/lib/agr-home-shape': { buildAgrData: input => { seen.push(input); return {} } },
    '@/lib/eat-standings': { getEatStandings: async () => ({ rows: [], all: [], countries: 0 }) },
    '@/lib/maitred': { getMaitredDirectory: async () => ({ status: 'ready', venues: VENUES }) },
    '@/lib/place-directory': { getPlaceDirectory: async () => VENUES.map(v => place(v.placeId)) },
    '@/lib/makan-stats': { getRecentPublicMeals: async () => [] }, '@/lib/public-venues': { getPublicVenues: async () => [] },
    '@/lib/thumb': load('lib/thumb.ts', {}), '@/lib/dish-pages': dishPages(env),
    '@/messages/en.json': { default: JSON.parse(readFileSync('messages/en.json', 'utf8')) }, '@/messages/id.json': { default: JSON.parse(readFileSync('messages/id.json', 'utf8')) } })
  await load('lib/agr-home-data.ts', deps(ON), { env: ON }).getAgrHomeData('en')
  assert.deepEqual(Object.fromEntries(seen[0].dishAnswers), { pick: DISHES.pick.answer, eoy: DISHES.eoy.answer, none: null })
  for (const env of OFFS) {
    seen.length = 0
    await load('lib/agr-home-data.ts', deps(env), { env }).getAgrHomeData('en')
    assert.ok(!('dishAnswers' in seen[0]), JSON.stringify(env))
  }
  // And the cards it makes from them (lib/agr-home-shape.test.mjs has the rule's cases).
  const { buildAgrData } = load('lib/agr-home-shape.ts', { '@/components/agr/plates': { PLATES: [] }, '@/lib/thumb': load('lib/thumb.ts', {}), '@/lib/dish-pages': dishPages({}) })
  const answers = new Map(VENUES.map(v => [v.placeId, DISHES[v.placeId]?.answer ?? null]).filter(([id]) => DISHES[id]))
  const data = buildAgrData({ locale: 'en', meals: [], standings: { rows: [], all: [], countries: 0 }, venues: [], maitred: VENUES, t: {}, dishAnswers: answers })
  assert.deepEqual(JSON.parse(JSON.stringify(data.stickers)).map(s => [s.venue, s.dish]), [['Venue pick', 'Harissa prawns']])
})

const partnerDeps = (locale, env) => ({ ...paths, ...link, ...image,
  'next-intl/server': { setRequestLocale() {}, getTranslations: async value => translator(locale)(value) },
  '@/components/SiteSchema': { default: () => null }, '@/components/site/text': { em: chunks => createElement('em', null, chunks) },
  '@/lib/site-metadata': { createPageMetadata: () => ({}), SITE_URL: 'https://www.makanofficial.com' },
  '@/lib/eat-standings': { getEatStandings: async () => ({ rows: [], all: [], cities: [] }) },
  '@/lib/maitred': { getMaitredDirectory: async () => ({ status: 'ready', venues: VENUES }) },
  '@/lib/place-directory': { getPlaceDirectory: async () => VENUES.map(v => place(v.placeId)) },
  '@/lib/reviews': { getAllReviews: () => [] }, '@/lib/thumb': load('lib/thumb.ts', {}), '@/lib/local-photo': load('lib/local-photo.ts', {}),
  './PartnerForm': { default: () => null }, './FindRestaurant': { default: () => null }, './owners.css': {},
  '@/lib/web-listing': { getHiddenPlaceIds: async () => new Set() }, '@/lib/dish-pages': dishPages(env),
})
const PARTNER = 'app/[locale]/partner/page.tsx'

test('partner page, the featured usual orders: the app\'s answer when it is the Maître d\'s pick; no other card; off as main', { skip: !baseAvailable && `commit ${BASE} is not in this clone` }, async () => {
  for (const locale of ['en', 'id']) {
    const render = async (env, source = null) => renderToStaticMarkup(await load(PARTNER, partnerDeps(locale, env), { source, env }).default({ params: Promise.resolve({ locale }) }))
    const dishes = html => [...html.matchAll(/<span class="mddish">([^<]*)<\/span>/g)].map(m => m[1])
    const on = await render(ON)
    assert.deepEqual(dishes(on), ['Harissa prawns'])
    assert.doesNotMatch(on, /FREE TEXT|Sate lilit|the big ones/)
    const main = await render({}, atBase(PARTNER))
    assert.deepEqual(dishes(main), ['Harissa prawns, the big ones', 'FREE TEXT EOY', 'FREE TEXT NONE'])
    for (const env of OFFS) assert.equal(await render(env), main, `${locale} ${JSON.stringify(env)}: main's markup`)
  }
})

const showcaseDeps = (locale, env) => ({ ...paths, ...link, ...image,
  'next-intl/server': { getTranslations: async value => translator(locale)(value), getLocale: async () => locale },
  '@/components/motion/Reveal': { default: ({ children, ...props }) => createElement('div', props, children) },
  '@/lib/maitred': { getMaitredDirectory: async () => ({ status: 'ready', venues: VENUES }) },
  '@/lib/place-directory': { getPlaceDirectory: async () => VENUES.map(v => place(v.placeId)) },
  '@/lib/place-photo': { getPlacePhoto: async () => null }, '@/lib/verified-menu-price': { getVerifiedMenuPrice: () => null },
  '@/lib/thumb': load('lib/thumb.ts', {}), '@/lib/local-photo': load('lib/local-photo.ts', {}),
  '@/lib/web-listing': { getHiddenPlaceIds: async () => new Set() }, '@/lib/dish-pages': dishPages(env),
})
const SHOWCASE = 'components/home/MaitredShowcase.tsx'

test('home Maître d\' showcase: a pick card names the app\'s answer when it is the Maître d\'s pick; the rest are listed with no dish; off as main', { skip: !baseAvailable && `commit ${BASE} is not in this clone` }, async () => {
  for (const locale of ['en', 'id']) {
    const render = async (env, source = null) => renderToStaticMarkup(await load(SHOWCASE, showcaseDeps(locale, env), { source, env }).default({}))
    const on = await render(ON)
    assert.match(on, />Harissa prawns<\/span>/)
    assert.doesNotMatch(on, /FREE TEXT|Sate lilit|the big ones/)
    for (const id of ['eoy', 'none', 'raw']) assert.match(on, new RegExp(`>Venue ${id}</span>`), `${id} is still listed, with no dish`)
    const main = await render({}, atBase(SHOWCASE))
    assert.match(main, /FREE TEXT EOY/)
    for (const env of OFFS) assert.equal(await render(env), main, `${locale} ${JSON.stringify(env)}: main's markup`)
  }
})
