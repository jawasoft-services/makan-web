import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'
import * as jsx from 'react/jsx-runtime'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createTranslator } from 'next-intl'

function load(file, locale, directory = { status: 'ready', venues: [] }) {
  const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))
  const exports = {}
  const translate = value => createTranslator({ locale, messages, namespace: typeof value === 'string' ? value : value.namespace, onError(error) { throw error } })
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
  runInNewContext(code, { exports, require(id) {
    if (id === 'react/jsx-runtime') return jsx
    if (id === 'next-intl/server') return { getTranslations: async value => translate(value), getLocale: async () => locale }
    if (id === 'next/image') return { default: (props) => { const attrs = { ...props }; delete attrs.fill; delete attrs.sizes; return createElement('img', attrs) } }
    if (id === 'next/link') return { default: 'a' }
    if (id === '@/components/motion/Reveal') return { default: ({ children, ...props }) => createElement('div', props, children) }
    if (id === '@/components/home/StoreLink') return { default: ({ children }) => createElement('a', { href: '/app' }, children) }
    if (id === '@/components/standings/public-pages.module.css') return { default: {} }
    if (id === '@/i18n/paths') return { localizePath: (_, path) => `${locale === 'id' ? '/id' : ''}${path}` }
    if (id === '@/lib/maitred') return { getMaitredDirectory: async () => directory }
    if (id === '@/lib/place-photo') return { getPlacePhoto: async () => null }
    throw new Error(`Unexpected import: ${id}`)
  } })
  return exports.default
}
const venue = { placeId: 'public-venue', slug: 'public-venue', name: 'Venue', where: null, holderName: 'Alex', holderPhoto: null, photo: null,
  notes: { always: 'Sambal goreng', another: '', why: '', tip: '' } }
for (const locale of ['en', 'id']) {
  test(`${locale}: place surface requires explicit vacancy and keeps unavailability silent`, async () => {
    const component = load('components/PlaceMaitred.tsx', locale)
    const render = async state => renderToStaticMarkup(await component({ locale, placeName: 'Venue', state, faqHref: '/maitre-d#how-it-is-earned' }))
    assert.equal(await render({ status: 'unavailable' }), '')
    const vacant = await render({ status: 'vacant' })
    assert.match(vacant, locale === 'en' ? /title at Venue is open/ : /di Venue belum terisi/)
    for (const status of ['unresolved', 'disabled']) {
      const output = await render({ status })
      assert.ok(output.length)
      assert.doesNotMatch(output, /title at Venue is open|di Venue belum terisi|Get treated|the seat is yours/)
    }
    const held = await render({ status: 'held', venue })
    assert.match(held, /Sambal goreng/)
    assert.match(held, /Alex/)
    assert.match(held, /href="\/maitre-d#how-it-is-earned"/)
    assert.doesNotMatch(await render({ status: 'held', venue: { ...venue, notes: { ...venue.notes, always: '' } } }), /Sambal goreng/)
  })
  test(`${locale}: directory retains the full collection, authored words and truthful empty states`, async () => {
    const second = { ...venue, placeId: 'second', slug: 'second', name: 'Second venue', holderName: 'Budi', notes: { ...venue.notes, always: '' } }
    const component = load('components/home/MaitredShowcase.tsx', locale, { status: 'ready', venues: [venue, second] })
    const html = renderToStaticMarkup(await component({ dedicated: true }))
    assert.match(html, /Sambal goreng/)
    assert.match(html, /Alex/)
    assert.match(html, /Budi/)
    assert.ok(html.includes(`href="${locale === 'id' ? '/id' : ''}/places/public-venue"`))
    assert.ok(html.includes(`href="${locale === 'id' ? '/id' : ''}/places/second"`))
    for (const status of ['ready', 'unavailable', 'disabled']) {
      const empty = load('components/home/MaitredShowcase.tsx', locale, { status, venues: [] })
      const output = renderToStaticMarkup(await empty({ dedicated: true }))
      assert.ok(output.length)
      assert.doesNotMatch(output, /Alex|Sambal goreng|Nobody runs|seat is yours/)
      assert.equal(await empty({}), null)
    }
  })
}
