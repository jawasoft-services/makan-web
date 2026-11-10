import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname, relative } from 'node:path'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import ts from 'typescript'
import { createTranslator } from 'next-intl'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const require = createRequire(import.meta.url)
function lane(locale = 'en') {
  const modules = new Map(), messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))
  let requestCaches = new Map()
  const state = { place: null, maitred: { status: 'unavailable' }, row: null, computedAt: '2026-11-09T12:00:00Z', reads: 0, standingsReads: 0, photoReads: 0 }
  function load(file) {
    file = relative(process.cwd(), resolve(file))
    if (modules.has(file)) return modules.get(file)
    const exports = {}; modules.set(file, exports)
    const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
    runInNewContext(code, { exports, URL, console, fetch() { throw Error('No network in source tests') }, require(id) {
      if (id === './MealGallery') return { MealGallery: () => null }
      if (id === 'react/jsx-runtime' || id === 'node:crypto') return require(id)
      if (id === 'react') return { cache: fn => (...args) => {
        if (!requestCaches.has(fn)) requestCaches.set(fn, new Map())
        const cache = requestCaches.get(fn), key = JSON.stringify(args)
        if (!cache.has(key)) cache.set(key, fn(...args))
        return cache.get(key)
      } }
      if (id === 'next-intl/server') return { setRequestLocale() {}, getTranslations: async namespace => createTranslator({ locale, messages, namespace: typeof namespace === 'string' ? namespace : namespace.namespace, onError(error) { throw error } }) }
      if (id === 'next/navigation') return { notFound() { throw Error('NOT_FOUND') }, permanentRedirect(url) { throw Error('REDIRECT:' + url) } }
      if (id === 'next/link') return { default: ({ children, ...props }) => { delete props.prefetch; return createElement('a', props, children) } }
      if (id === 'next/image') return { default: ({ ...props }) => { delete props.fill; delete props.priority; return createElement('img', props) } }
      if (id === '@/components/PlaceMaitred') return { default: ({ state }) => createElement('section', { 'data-maitred': state.status }, state.status === 'held' ? state.venue.notes.always : state.status) }
      if (id.startsWith('@/components/')) return id.endsWith('.module.css') ? { default: new Proxy({}, { get: (_, key) => key }) } : { default: () => null }
      if (id === '@/lib/place-directory') return { getDirectoryPlace: async () => { state.reads++; return state.place }, getPlaceIndex: async () => [] }
      if (id === '@/lib/eat-standings') return { EVIDENCE_FLOOR: 10, CITY_FLOOR: 5, getEatStandings: async () => { state.standingsReads++; return { all: state.row ? [state.row] : [], cities: [], computedAt: state.computedAt } } }
      if (id === '@/lib/place-photo') return { getPlacePhoto: async () => { state.photoReads++; return null } }
      if (id === '@/lib/maitred') return { getMaitredStateAt: async () => state.maitred }
      if (id === '@/lib/thumb') return { thumbUrl: value => value }
      if (id === '@/i18n/paths') return { localizePath: (lang, path) => `${lang === 'id' ? '/id' : ''}${path}` }
      if (id.startsWith('@/lib/')) return load(id.replace('@/', '') + (id === '@/lib/reviews' ? '/index.ts' : '.ts'))
      if (id.startsWith('.')) return load(resolve(dirname(file), id) + '.ts')
      throw Error('Unexpected test dependency: ' + id)
    } }, { filename: file })
    return exports
  }
  return { state, load, nextRequest() { requestCaches = new Map() } }
}
const place = (slug = 'kendal-street-kitchen-f7d46b') => ({
  placeId: 'public-venue', name: 'Kendal Street Kitchen', slug, where: { city: 'London', country: 'United Kingdom' }, cuisine: [], address: '', lat: null, lng: null, since: null, indexable: true, publicMealCount: 9,
  meals: [{ id: 'public-meal', src: '/public.jpg', thumb: '', caption: 'PUBLIC CAPTION', username: 'public_person', at: '2026-11-05T12:00:00Z' }],
})
const props = (locale, slug) => ({ params: Promise.resolve({ locale, slug }) })

test('reviews match stable venue hashes after a rename, never a similar name at another venue', () => {
  const registry = lane().load('lib/reviews/index.ts')
  assert.equal(registry.getReviewForPlace('renamed-venue-f7d46b').slug, 'kendal-street-kitchen')
  assert.equal(registry.getReviewForPlace('uli-new-name-8d3501').slug, 'uli-marylebone')
  assert.equal(registry.getReviewForPlace('kendal-street-kitchen-abcdef'), undefined)
  assert.equal(registry.getReviewForPlace('kendal-street-kitchen'), undefined)
  assert.equal(registry.getReviewForPlace('no-hash'), undefined)
})

for (const locale of ['en', 'id']) {
  test(`${locale}: firsthand advice has attribution, visit date, historical bill and a working editorial route`, async () => {
    const run = lane(locale); run.state.place = place()
    const route = run.load('app/[locale]/places/[slug]/page.tsx')
    const [metadata, body] = await Promise.all([route.generateMetadata(props(locale, run.state.place.slug)), route.default(props(locale, run.state.place.slug))])
    const html = renderToStaticMarkup(body)
    assert.match(html, /Our standouts were the harissa prawns/)
    assert.match(html, /lang="en"/)
    assert.match(html, /Devon Makepeace/)
    assert.match(html, /datetime="2026-06-15"/i)
    assert.match(html, /£82.13/)
    assert.match(html, /href="\/blog\/kendal-street-kitchen"/)
    assert(html.indexOf('id="what-to-order"') < html.indexOf('id="meals"'))
    assert(html.indexOf('id="meals"') < html.indexOf('data-maitred="unavailable"'))
    assert.equal(run.state.reads, 1, 'Metadata and body must share one venue read')
    assert.equal(run.state.standingsReads, 1, 'Metadata, body and city lookup must share standings')
    assert.equal(run.state.photoReads, 1)
    assert.match(metadata.description, /15 (June|Juni) 2026/)
    assert.equal(metadata.alternates.canonical, `https://www.makanofficial.com${locale === 'id' ? '/id' : ''}/places/${run.state.place.slug}`)
  })

  test(`${locale}: only a published usual moves above meals; all other states retain the food-first route`, async () => {
    const run = lane(locale); run.state.place = place('other-venue-abcdef')
    const route = run.load('app/[locale]/places/[slug]/page.tsx')
    for (const status of ['vacant', 'unavailable', 'disabled', 'unresolved', 'held']) {
      run.state.maitred = status === 'held' ? { status, venue: { notes: { always: '' } } } : { status }
      run.nextRequest()
      const html = renderToStaticMarkup(await route.default(props(locale, run.state.place.slug)))
      assert.doesNotMatch(html, /id="what-to-order"|Our standouts/)
      assert(html.indexOf('id="meals"') < html.indexOf('data-maitred='))
    }
    run.state.maitred = { status: 'held', venue: { notes: { always: 'PUBLISHED USUAL' } } }; run.nextRequest()
    const html = renderToStaticMarkup(await route.default(props(locale, run.state.place.slug)))
    assert(html.indexOf('PUBLISHED USUAL') < html.indexOf('id="meals"'))
    assert.equal((html.match(/data-maitred=/g) || []).length, 1)
    assert.doesNotMatch(html, /href="\/blog\//)
  })

  test(`${locale}: removed venues disappear on the next request and old slugs redirect before rendering advice`, async () => {
    const run = lane(locale); run.state.place = place(); const route = run.load('app/[locale]/places/[slug]/page.tsx')
    await route.default(props(locale, run.state.place.slug))
    run.state.place = null; run.nextRequest()
    assert.deepEqual(Object.keys(await route.generateMetadata(props(locale, 'kendal-street-kitchen-f7d46b'))), [])
    await assert.rejects(route.default(props(locale, 'kendal-street-kitchen-f7d46b')), /NOT_FOUND/)
    run.state.place = place('new-name-f7d46b'); run.nextRequest()
    await assert.rejects(route.default(props(locale, 'kendal-street-kitchen-f7d46b')), /REDIRECT:/)
    const html = renderToStaticMarkup(await route.default(props(locale, 'new-name-f7d46b')))
    assert.match(html, /Our standouts were the harissa prawns/)
  })
}

test('both article pages link to the mapped venue and share real photos without rewriting the authored review', async () => {
  const run = lane(), registry = run.load('lib/reviews/index.ts'), article = run.load('components/blog/ReviewArticle.tsx'), blog = run.load('app/[locale]/blog/[slug]/page.tsx')
  for (const review of registry.getAllReviews()) {
    const html = renderToStaticMarkup(article.ReviewArticle({ review }))
    assert(html.includes(`/places/${review.restaurant.makanSlug}`))
    assert(html.toLowerCase().includes('datetime="' + review.visitDate + '"'))
    const meta = await blog.generateMetadata({ params: Promise.resolve({ slug: review.slug }) })
    assert.equal(meta.openGraph.images[0].url, 'https://www.makanofficial.com' + review.meals.find(m => m.photo).photo)
    assert.equal(meta.twitter.images[0].url, meta.openGraph.images[0].url)
    assert.equal(meta.openGraph.modifiedTime, review.dateModified)
  }
  assert.match(renderToStaticMarkup(article.ReviewArticle({ review: registry.getReview('uli-marylebone') })), /didn&#x27;t feel the food justified the cost/)
})

test('article schema connects to the same venue, founder and organization entities and never invents ratings', () => {
  const run = lane(), registry = run.load('lib/reviews/index.ts'), schema = run.load('components/blog/ReviewSchema.tsx')
  for (const review of registry.getAllReviews()) {
    const graph = JSON.parse(schema.ReviewSchema({ review }).props.dangerouslySetInnerHTML.__html)['@graph']
    const article = graph.find(n => n['@type'] === 'BlogPosting')
    assert.equal(article.about['@id'], 'https://www.makanofficial.com/places/' + review.restaurant.makanSlug + '#restaurant')
    const restaurant = graph.find(n => n['@type'] === 'Restaurant' && n['@id'] === article.about['@id'])
    assert.deepEqual(restaurant.image, article.image)
    assert(!graph.some(n => n['@type'] === 'Review'), 'Unscored editorial articles must not emit incomplete review snippets')
    assert.equal(article.author['@id'], 'https://www.makanofficial.com/#founder')
    assert.equal(article.publisher['@id'], 'https://www.makanofficial.com/#organization')
    assert(!graph.some(n => n.reviewRating || n.aggregateRating))
  }
})

test('ranked and below-floor body states retain their standings after the gallery', async () => {
  const run = lane(); run.state.place = place('other-venue-abcdef'); const route = run.load('app/[locale]/places/[slug]/page.tsx')
  for (const row of [{ placeId: 'public-venue', rank: 2, cityRank: null, eats: 11, yeets: 4, matchups: 15, eatRate: 11 / 15 }, { placeId: 'public-venue', rank: null, cityRank: null, eats: 1, yeets: 1, matchups: 2, eatRate: .5 }]) {
    run.state.row = row; run.nextRequest(); const html = renderToStaticMarkup(await route.default(props('en', run.state.place.slug)))
    assert(html.indexOf('id="meals"') < html.indexOf('class="standing"'))
    assert.match(html, row.rank ? /#2 in the Eat or Yeet standings/ : /2\/10/)
  }
})

test('unknown modification dates stay absent and EN/ID venue pages identify the same restaurant separately from the page', async () => {
  const ids = []
  for (const locale of ['en', 'id']) {
    const run = lane(locale); run.state.place = place(); run.state.computedAt = ''
    const html = renderToStaticMarkup(await run.load('app/[locale]/places/[slug]/page.tsx').default(props(locale, run.state.place.slug)))
    const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1])
    assert.equal(schema.subjectOf.dateModified, undefined)
    assert.notEqual(schema['@id'], schema.subjectOf['@id'])
    assert.equal(schema.subjectOf.mainEntity['@id'], schema['@id'])
    ids.push(schema['@id'])
  }
  assert.equal(ids[0], ids[1])
})
