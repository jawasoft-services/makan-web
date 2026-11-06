import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const exports = {}
const source = readFileSync(new URL('./RatingCarousel.tsx', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
runInNewContext(compiled, { exports, require: id => id === '@/lib/links' ? { APP_STORE_URL: 'https://apps.apple.com/app/id6756131450' } : require(id) })

test('rating loop has one named store link, hidden repeated visuals and a native pause control in both languages', () => {
  for (const [locale, label, pause] of [['en', '5.0 stars on the App Store', 'Pause star animation'], ['id', '5.0 bintang di App Store', 'Jeda animasi bintang']]) {
    const tree = exports.default({ rating: 5, locale })
    const html = renderToStaticMarkup(tree)
    const sets = tree.props.children[1].props.children.props.children
    assert.equal(renderToStaticMarkup(sets[0]), renderToStaticMarkup(sets[1]), 'seam must join identical visual sets')
    assert.equal((html.match(/<a /g) || []).length, 1, 'duplicates must not add keyboard stops')
    assert.ok(html.includes(`href="https://apps.apple.com/gb/app/id6756131450" aria-label="${label}"`))
    assert.ok(html.includes('class="rating-track" aria-hidden="true"'))
    assert.ok(html.includes(`type="checkbox" aria-label="${pause}"`))
    assert.equal((html.match(/★/g) || []).length, 30)
    assert.doesNotMatch(html, /From 6|\/ 5|↗/)
  }
})
