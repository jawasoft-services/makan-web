import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTranslator } from 'next-intl'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const require = createRequire(import.meta.url)
function load(path, dependencies, globals = {}) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText, {
    exports, URL, ...globals, require(name) {
      if (name in dependencies) return dependencies[name]
      if (name === 'react/jsx-runtime') return require(name)
      if (name.startsWith('@/components/') || name === 'next/image') return { default: () => null }
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  return exports
}
const metadata = load('lib/site-metadata.ts', {})
const places = [
  { placeId: 'photos', slug: 'cafe-photos', name: 'Café', city: 'London', indexable: true, meals: 2, privateSentinel: 'DO NOT SERIALIZE' },
  { placeId: 'votes', slug: 'meal-votes', name: 'Meal', city: 'Jakarta', indexable: false, meals: 1 },
  { placeId: 'thin', slug: 'thin', name: 'Thin', city: null, indexable: false, meals: 1 },
]
const standings = { all: [{ placeId: 'votes', matchups: 1 }, { placeId: 'thin', matchups: 0 }], cities: [] }
const readers = { '@/lib/place-directory': { getPlaceIndex: async () => places }, '@/lib/eat-standings': { getEatStandings: async () => standings } }
const reviews = [{ slug: 'old', dateModified: '2026-06-16' }, { slug: 'new', dateModified: '2026-11-09' }]
class SourceDate extends Date { constructor(...args) { assert(args.length, 'Sitemap must not manufacture a current update date'); super(...args) } }
const sitemap = load('app/sitemap.ts', { ...readers, '@/lib/reviews': { getAllReviews: () => reviews } }, { Date: SourceDate }).default

for (const locale of ['en', 'id']) test(`${locale}: directory metadata and every linked venue agree with sitemap eligibility`, async () => {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))
  const route = load('app/[locale]/places/page.tsx', { ...readers,
    '@/lib/site-metadata': metadata,
    '@/components/places/RestaurantDirectory': { default: 'directory' },
    'next-intl/server': { setRequestLocale() {}, getTranslations: async () => createTranslator({ locale, messages, namespace: 'PlaceDirectory', onError(error) { throw error } }) },
  })
  const result = await route.generateMetadata({ params: Promise.resolve({ locale }) })
  assert.equal(result.alternates.canonical, `https://www.makanofficial.com${locale === 'id' ? '/id' : ''}/places`)
  assert.equal(result.alternates.languages.en, 'https://www.makanofficial.com/places')
  assert.equal(result.alternates.languages.id, 'https://www.makanofficial.com/id/places')
  const tree = await route.default({ params: Promise.resolve({ locale }) })
  function find(node) {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) return node.map(find).find(Boolean)
    if (node.type === 'directory') return node
    return find(node.props?.children)
  }
  const directory = find(tree)
  assert.deepEqual(Array.from(directory.props.entries, row => row.placeId).sort(), ['photos', 'votes'])
  assert(directory.props.entries.every(entry => Object.keys(entry).sort().join(',') === 'city,name,placeId,slug'))
  const links = new Set((await sitemap()).map(entry => entry.url))
  for (const entry of directory.props.entries) assert(links.has(`https://www.makanofficial.com${locale === 'id' ? '/id' : ''}/places/${entry.slug}`))
  assert.doesNotMatch(renderToStaticMarkup(tree), /DO NOT SERIALIZE/)
})

test('sitemap keeps verified article dates, takes the latest modified article for the blog, and never reads the current clock', async () => {
  const result = await sitemap()
  assert.equal(result.find(entry => entry.url.endsWith('/blog')).lastModified.toISOString(), '2026-11-09T00:00:00.000Z')
  assert.equal(result.find(entry => entry.url.endsWith('/blog/old')).lastModified.toISOString(), '2026-06-16T00:00:00.000Z')
  for (const entry of result.filter(entry => !entry.url.includes('/blog'))) assert.equal(entry.lastModified, undefined)
  assert(result.some(entry => entry.url === 'https://www.makanofficial.com/places'))
  assert(result.some(entry => entry.url === 'https://www.makanofficial.com/id/places'))
})

test('structured data and the machine-readable index reuse the accepted homepage description', async () => {
  const english = JSON.parse(readFileSync('messages/en.json', 'utf8'))
  const indonesian = JSON.parse(readFileSync('messages/id.json', 'utf8'))
  const press = load('lib/press.ts', { '@/lib/links': { APP_STORE_URL: 'https://apps.apple.com/app/id6756131450' } })
  const descriptions = { '@/messages/en.json': { default: english }, '@/messages/id.json': { default: indonesian } }
  const schema = load('components/SiteSchema.tsx', { ...descriptions,
    '@/lib/press': press, '@/lib/links': { APP_STORE_URL: 'https://apps.apple.com/app/id6756131450' },
    '@/lib/site-metadata': metadata, '@/lib/safe-json-ld': { safeJsonLd: JSON.stringify },
  })
  for (const [locale, messages] of [['en', english], ['id', indonesian]]) {
    const graph = JSON.parse(schema.default({ locale }).props.dangerouslySetInnerHTML.__html)['@graph']
    for (const type of ['Organization', 'WebSite', 'MobileApplication']) assert.equal(graph.find(item => item['@type'] === type).description, messages.Redesign.intro)
    assert.equal(graph.find(item => item['@type'] === 'MobileApplication').offers.price, '0')
    assert(!graph.some(item => item.aggregateRating), 'never invent a site rating from App Store reviews')
  }
  const llms = load('app/llms.txt/route.ts', { ...descriptions, '@/lib/press': press,
    '@/lib/links': { APP_STORE_URL: 'https://apps.apple.com/app/id6756131450' },
    '@/lib/reviews': { getAllReviews: () => [{ slug: 'one', restaurant: { name: 'One' }, metaDescription: 'A first-hand meal story.' }] },
  }, { Response })
  const text = await llms.GET().text()
  assert(text.includes('> ' + english.Redesign.intro))
  assert(text.includes('https://www.makanofficial.com/places'))
  assert(text.includes(english.Redesign.restaurantbody))
  assert.doesNotMatch(text, /an Eat every time/)
})

test('an unavailable directory does not invent a zero-restaurant claim and recovers when its reader returns', async () => {
  let available = []
  const messages = JSON.parse(readFileSync('messages/en.json', 'utf8'))
  const route = load('app/[locale]/places/page.tsx', { ...readers,
    '@/lib/place-directory': { getPlaceIndex: async () => available },
    '@/lib/site-metadata': metadata, '@/components/places/RestaurantDirectory': { default: 'directory' },
    'next-intl/server': { setRequestLocale() {}, getTranslations: async () => createTranslator({ locale: 'en', namespace: 'PlaceDirectory', messages }) },
  })
  let html = renderToStaticMarkup(await route.default({ params: Promise.resolve({ locale: 'en' }) }))
  assert(html.includes(messages.PlaceDirectory.unavailable))
  assert(!html.includes('<directory'))
  available = places
  html = renderToStaticMarkup(await route.default({ params: Promise.resolve({ locale: 'en' }) }))
  assert(html.includes('<directory'))
  assert(!html.includes(messages.PlaceDirectory.unavailable))
})
