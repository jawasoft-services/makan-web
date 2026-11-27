import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { createTranslator } from 'next-intl'

const routeFile = 'app/[locale]/places/[slug]/page.tsx'
const unusedImports = new Set([
  'react/jsx-runtime', 'next/navigation', 'next/image', 'next/link',
  '@/components/PlayfulArrow', '@/components/Footer', '@/components/PlaceMaitred', '@/components/SiteSchema',
  '@/components/home/StoreLink', '@/components/map/PlacesMapLoader',
  '@/lib/place-photo', '@/lib/maitred', '@/i18n/paths', '@/lib/thumb', '@/lib/safe-json-ld',
  '@/components/standings/public-pages.module.css',
  // RM20773: the rebuilt place page's own parts.
  '@/components/places/PlaceSeat', '@/components/site/StoreButtons', '@/lib/local-photo',
])

// Execute the real metadata exports with fixture readers; no database or paid provider imports.
function loadModule(file, dependencies = {}, env = {}) {
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  })
  const exports = {}
  runInNewContext(outputText, {
    exports, URL, process: { env },
    require(id) {
      if (id in dependencies) return dependencies[id]
      assert.ok(unusedImports.has(id), `Unexpected import: ${id}`)
      return {}
    },
  }, { filename: file })
  return exports
}

const metadata = loadModule('lib/site-metadata.ts')
const base = {
  placeId: 'fixture', name: 'Mata Berawa', slug: 'mata-berawa-147116',
  where: { city: 'Berawa, Bali', country: 'Indonesia' },
  meals: [{ caption: 'PRIVATE SENTINEL', username: 'PRIVATE USER' }, {}], indexable: true,
}

async function render(locale, place, row = null, env = {}) {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))
  const route = loadModule(routeFile, {
    'react': { cache: fn => fn },
    '@/lib/reviews': { getReviewForPlace: () => undefined },
    // RM20616 U4: the dev App Clip banner (off unless APP_CLIP_DEV_BANNER=1).
    '@/lib/app-clip': loadModule('lib/app-clip.ts', {}, env),
    '@/lib/links': loadModule('lib/links.ts'),
    '@/lib/site-metadata': metadata,
    '@/lib/place-directory': { getDirectoryPlace: async () => place },
    '@/lib/eat-standings': { getEatStandings: async () => ({ all: row ? [row] : [] }) },
    'next-intl/server': {
      getTranslations: async () => createTranslator({
        locale, messages, namespace: 'Places', onError(error) { throw error },
      }),
    },
  })
  return route.generateMetadata({ params: Promise.resolve({ locale, slug: 'old-name-147116' }) })
}

for (const locale of ['en', 'id']) {
  test(`${locale}: public photos, location and canonical/social parity`, async () => {
    const result = await render(locale, base)
    assert.equal(result.title, locale === 'en'
      ? 'Mata Berawa, Berawa, Bali: meals & what to order | Makan'
      : 'Mata Berawa, Berawa, Bali: makanan & pilihan pesanan | Makan')
    assert.equal(result.description, locale === 'en'
      ? 'See what diners ate at Mata Berawa, Berawa, Bali, Indonesia: 2 public meals, original food photos and their captions on Makan.'
      : 'Lihat makanan yang dibagikan pengunjung di Mata Berawa, Berawa, Bali, Indonesia: 2 makanan publik, foto asli, dan caption mereka di Makan.')
    const path = `${locale === 'id' ? '/id' : ''}/places/${base.slug}`
    assert.equal(result.alternates.canonical, metadata.SITE_URL + path)
    assert.equal(result.alternates.languages.en, `${metadata.SITE_URL}/places/${base.slug}`)
    assert.equal(result.alternates.languages.id, `${metadata.SITE_URL}/id/places/${base.slug}`)
    assert.equal(result.alternates.languages['x-default'], result.alternates.languages.en)
    assert.equal(result.openGraph.title, result.title)
    assert.equal(result.twitter.description, result.description)
    assert.equal(result.openGraph.images[0].url, metadata.SITE_URL + path + '/opengraph-image')
    assert.equal(result.robots, undefined)
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE SENTINEL|PRIVATE USER/)
  })

  test(`${locale}: ranked one-meal and zero-photo states retain evidence`, async () => {
    const row = { placeId: base.placeId, rank: 2, eats: 11, matchups: 15 }
    const one = await render(locale, { ...base, meals: [{}] }, row)
    assert.match(one.description, locale === 'en' ? /1 public meal photo; #2/ : /Foto dari 1 makanan publik; peringkat #2/)
    assert.match(one.description, /11 Eat/)
    const zero = await render(locale, { ...base, meals: [] }, row)
    assert.match(zero.description, locale === 'en' ? /0 public meal photos/ : /Foto dari 0 makanan publik/)
    assert.match(zero.description, /#2/)
  })

  test(`${locale}: missing location and empty evidence stay honest`, async () => {
    const result = await render(locale, { ...base, name: 'A & B’s <Kitchen>', where: null, meals: [] })
    assert.equal(result.title, 'A & B’s <Kitchen> | Makan')
    assert.equal(result.description, locale === 'en'
      ? 'A & B’s <Kitchen>. No public meal photos are available yet.'
      : 'A & B’s <Kitchen>. Belum ada foto makanan publik.')
  })

  test(`${locale}: below-floor rank stays absent and index eligibility is preserved`, async () => {
    const thin = { ...base, indexable: false, meals: [{}] }
    const result = await render(locale, thin)
    assert.equal(result.robots.index, false)
    assert.equal(result.robots.follow, true)
    const comparison = await render(locale, thin, { placeId: base.placeId, rank: null, matchups: 1, eats: 1 })
    assert.equal(comparison.robots, undefined)
    assert.doesNotMatch(comparison.description, /standings|peringkat|#null/)
  })

  test(`${locale}: deleted or unavailable restaurant has no metadata`, async () => {
    assert.equal(Object.keys(await render(locale, null)).length, 0)
  })
}

// RM20616 U4 — the dev App Clip's Smart App Banner. Off (unset or any value but "1"), the metadata is
// exactly what the page returned before: no banner at all. On, one apple-itunes-app tag names the clip.
for (const locale of ['en', 'id']) {
  test(`${locale}: the App Clip banner adds nothing with APP_CLIP_DEV_BANNER off, and one tag with it on`, async () => {
    const before = await render(locale, base)
    for (const value of ['', '0', 'true', ' 1', '1 ']) {
      assert.deepEqual(await render(locale, base, null, { APP_CLIP_DEV_BANNER: value }), before, JSON.stringify(value))
    }
    assert.equal(before.other, undefined)
    assert.equal(before.itunes, undefined)
    const on = await render(locale, base, null, { APP_CLIP_DEV_BANNER: '1' })
    const path = `${locale === 'id' ? '/id' : ''}/places/${base.slug}`
    // Compared field by field: the object comes from the module's own VM context.
    assert.deepEqual(Object.keys(on.other), ['apple-itunes-app'])
    assert.equal(on.other['apple-itunes-app'], `app-id=6756131450, app-clip-bundle-id=com.makanofficial.makandev.Clip, app-argument=${metadata.SITE_URL}${path}`)
    assert.equal(on.itunes, undefined)
    const { other, ...rest } = on
    assert.ok(other)
    assert.equal(JSON.stringify(rest), JSON.stringify(before))
    // The robots rule for a thin page still applies with the banner on.
    const thin = await render(locale, { ...base, indexable: false, meals: [{}] }, null, { APP_CLIP_DEV_BANNER: '1' })
    assert.equal(thin.robots.index, false)
    assert.equal(thin.robots.follow, true)
    assert.ok(thin.other)
  })
}
