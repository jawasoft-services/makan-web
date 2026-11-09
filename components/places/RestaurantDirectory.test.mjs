import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'
import { createTranslator } from 'next-intl'

const compile = path => ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
const matching = { exports: {} }
vm.runInNewContext(compile('lib/claim-search.ts'), { exports: matching.exports })
const entries = [
  { placeId: 'cafe', name: 'Café Satu', slug: 'cafe-satu-123', city: 'Jakarta' },
  { placeId: 'london', name: 'Kendal Street Kitchen', slug: 'kendal-456', city: 'London' },
  { placeId: 'unicode', name: '丰浩园餐厅', slug: 'restaurant-789', city: null },
]

function render(locale) {
  let value = '', tree
  const jsx = (type, props) => ({ type, props })
  const exports = {}
  vm.runInNewContext(compile('components/places/RestaurantDirectory.tsx'), { exports,
    fetch() { throw new Error('Directory filtering must not make a request') },
    require(name) {
      if (name === 'react') return { useId: () => 'search', useState: () => [value, next => { value = next }] }
      if (name === 'react/jsx-runtime') return { jsx, jsxs: jsx }
      if (name === 'next-intl') return { useTranslations: () => createTranslator({ locale, namespace: 'PlaceDirectory', messages: JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')) }) }
      if (name === 'next/link') return { default: 'a' }
      if (name === '@/components/PlayfulArrow') return { default: 'svg' }
      if (name === '@/lib/claim-search') return matching.exports
      if (name === '@/i18n/paths') return { localizePath: (locale, path) => locale === 'id' ? '/id' + path : path }
      if (name.endsWith('.module.css')) return { default: {} }
      throw new Error(`Unexpected dependency: ${name}`)
    },
  })
  const draw = () => { tree = exports.default({ entries, locale }) }
  const nodes = node => !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)]
  draw()
  return { nodes: () => nodes(tree), search(query) { nodes(tree).find(n => n.type === 'input').props.onChange({ target: { value: query } }); draw() }, clear() { nodes(tree).find(n => n.type === 'button').props.onClick(); draw() } }
}

for (const locale of ['en', 'id']) test(`${locale}: all restaurant anchors render before a search without prefetching`, () => {
  const app = render(locale), links = app.nodes().filter(n => n.type === 'a')
  assert.equal(links.length, entries.length)
  assert.deepEqual(links.map(n => n.props.href), entries.map(e => `${locale === 'id' ? '/id' : ''}/places/${e.slug}`))
  assert(links.every(n => n.props.prefetch === false))
  const input = app.nodes().find(n => n.type === 'input')
  assert.equal(app.nodes().find(n => n.type === 'label').props.htmlFor, input.props.id)
  assert.equal(app.nodes().find(n => n.props?.role === 'status').props.children, locale === 'id' ? '3 restoran ditampilkan' : '3 restaurants shown')
})

test('search handles accents, multiple words, city and Unicode without rewriting restaurant names', () => {
  const app = render('en')
  for (const [query, expected] of [['CAFE jakarta', 'Café Satu'], ['kendal london', 'Kendal Street Kitchen'], ['丰浩园', '丰浩园餐厅']]) {
    app.search(query)
    assert.equal(app.nodes().filter(n => n.type === 'a').length, 1)
    assert.equal(app.nodes().find(n => n.type === 'strong').props.children, expected)
  }
  app.search('missing place')
  assert.equal(app.nodes().filter(n => n.type === 'a').length, 0)
  assert.equal(app.nodes().find(n => n.props?.role === 'status').props.children, '0 restaurants shown')
  app.clear()
  assert.equal(app.nodes().filter(n => n.type === 'a').length, 3)
})
