import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { createTranslator } from 'next-intl'

const routeFile = 'app/[locale]/places/[slug]/page.tsx'
const unusedImports = new Set([
  'react/jsx-runtime', 'next/navigation', 'next/image', 'next/link',
  '@/components/Footer', '@/components/PlaceMaitred', '@/components/SiteSchema',
  '@/components/home/StoreLink', '@/components/map/PlacesMapLoader',
  '@/lib/place-photo', '@/i18n/paths', '@/lib/thumb',
])

// Execute the real metadata exports with fixture readers; no database or paid provider imports.
function loadModule(file, dependencies = {}) {
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  })
  const exports = {}
  runInNewContext(outputText, {
    exports, URL,
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

async function render(locale, place, row = null) {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))
  const route = loadModule(routeFile, {
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
    assert.equal(result.title, 'Mata Berawa, Berawa, Bali | Makan')
    assert.equal(result.description, locale === 'en'
      ? 'Mata Berawa, Berawa, Bali, Indonesia. See 2 public meals saved by diners, with food photos.'
      : 'Mata Berawa, Berawa, Bali, Indonesia. Lihat 2 makanan publik yang disimpan pengunjung, lengkap dengan foto.')
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
