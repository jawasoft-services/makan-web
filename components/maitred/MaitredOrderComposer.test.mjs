import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const directory = dirname(fileURLToPath(import.meta.url))
const cache = new Map()
const defaults = value => ({ __esModule: true, default: value })
const observers = []
class MeasuredContentObserver {
  constructor(callback) { this.callback = callback; observers.push(this) }
  observe(node) { this.node = node }
  disconnect() { this.disconnected = true }
}

// Real presentation and assets, without browser globals, hooks or provider access.
function load(path) {
  if (cache.has(path)) return cache.get(path)
  const exports = {}
  cache.set(path, exports)
  const source = readFileSync(path, 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX,
    target: ts.ScriptTarget.ES2022, esModuleInterop: true,
  } })
  runInNewContext(outputText, { exports, ResizeObserver: MeasuredContentObserver, require: name => {
    if (name === 'react/jsx-runtime') return require(name)
    if (name === 'next/image') return defaults(props => React.createElement('img', props))
    if (name.endsWith('.module.css')) return defaults(new Proxy({}, { get: (_, key) => String(key) }))
    assert.ok(name.startsWith('./'), `Unexpected runtime dependency: ${name}`)
    for (const extension of ['.ts', '.tsx']) {
      try { return load(resolve(dirname(path), `${name}${extension}`)) }
      catch (error) { if (error.code !== 'ENOENT') throw error }
    }
    throw new Error(`Missing local presentation dependency: ${name}`)
  } })
  return exports
}

const Composer = load(resolve(directory, 'MaitredOrderComposer.tsx')).default
const initial = { locale: 'en', openness: 1, typedText: '', preview: false, publishProgress: 0 }
const tree = props => Composer({ ...initial, ...props })
const markup = props => renderToStaticMarkup(tree(props))
function elements(node) {
  if (!React.isValidElement(node)) return []
  if (typeof node.type === 'function') return elements(node.type(node.props))
  return [node, ...React.Children.toArray(node.props.children).flatMap(elements)]
}
const find = (node, predicate) => elements(node).find(predicate)
const named = (node, className) => find(node, element => element.props.className?.split(' ').includes(className))
const action = (node, name) => find(node, element => element.props['data-native-action'] === name)

test('opening and reverse scrubbing set the sheet and scrim directly, with bounded values', () => {
  for (const [openness, expected] of [[0, 0], [.25, .25], [.5, .5], [1, 1], [.5, .5], [0, 0], [-1, 0], [2, 1], [NaN, 0], [Infinity, 0]]) {
    const node = tree({ openness })
    assert.equal(named(node, 'sheet').props.style.transform, `translateY(${(1 - expected) * 100}%)`)
    assert.equal(named(node, 'backdrop').props.style.opacity, expected * .24)
    assert.equal(node.props['aria-hidden'], expected === 0 ? true : undefined)
  }
  assert.equal(markup({ openness: .5 }), markup({ openness: .5 }))
})

for (const [locale, expected] of Object.entries({
  en: { question: 'What’s your go‑to?', field: 'Favourite dish', placeholder: 'e.g. Cheeseburger, extra pickles', preview: 'Preview', private: 'This preview is private. Your pick appears on the restaurant page while you hold the crown.', publish: 'Publish', saving: 'Saving…', change: 'Change dish', usual: 'Your usual order', role: 'Maître d’ at Kendal Street Kitchen' },
  id: { question: 'Apa pesanan andalanmu?', field: 'Hidangan favorit', placeholder: 'mis. Cheeseburger, ekstra acar', preview: 'Pratinjau', private: 'Pratinjau ini hanya untukmu. Pilihanmu tampil di halaman restoran selama kamu memegang mahkota.', publish: 'Publikasikan', saving: 'Menyimpan…', change: 'Ganti hidangan', usual: 'Pesanan biasamu', role: 'Maître d’ di Kendal Street Kitchen' },
})) {
  test(`${locale}: source-owned editor copy, partial typing and Preview availability`, () => {
    const empty = tree({ locale })
    const emptyMarkup = renderToStaticMarkup(empty)
    for (const text of [expected.question, expected.field, expected.placeholder, expected.preview, expected.role, 'Alex Chen']) assert.ok(emptyMarkup.includes(text), text)
    assert.equal(action(empty, 'preview').props['data-native-disabled'], true)
    assert.equal(named(empty, 'arrow').props.children, '\uf133')
    assert.equal(named(empty, 'arrow').props.style.opacity, .55)
    assert.ok(named(empty, 'emptyCaret'))

    const typed = tree({ locale, typedText: 'Harissa p' })
    assert.ok(renderToStaticMarkup(typed).includes('Harissa p'))
    assert.equal(named(typed, 'placeholder'), undefined)
    assert.equal(action(typed, 'preview').props['data-native-disabled'], false)
    assert.equal(named(typed, 'arrow').props.style.opacity, 1)
    assert.ok(named(typed, 'caret'))
    assert.equal(action(tree({ locale, typedText: '  ' }), 'preview').props['data-native-disabled'], true)
  })

  test(`${locale}: private preview precedes publication and preserves authored dish`, () => {
    const node = tree({ locale, preview: true, typedText: 'Harissa prawns' })
    const html = renderToStaticMarkup(node)
    for (const text of [expected.private, expected.publish, expected.change, expected.usual, expected.role, 'Harissa prawns']) assert.ok(html.includes(text), text)
    assert.equal(named(node, 'editorContent').props['aria-hidden'], true)
    assert.equal(named(node, 'editorContent').props.style.opacity, 0)
    assert.equal(named(node, 'previewContent').props['aria-hidden'], undefined)
    assert.equal(named(node, 'previewContent').props.style.opacity, 1)
    assert.equal(action(node, 'publish').props.children, expected.publish)
    assert.equal(action(tree({ locale, preview: true, publishProgress: .5 }), 'publish').props.children, expected.saving)
    assert.ok(html.includes('/redesign/fictional-diners.webp'))
    assert.equal(elements(named(node, 'previewContent')).filter(element => element.type === 'svg').length, 1)
  })
}

test('editor and private preview remain mounted through a directly scrubbed height and content blend', () => {
  const half = tree({ previewProgress: .5, typedText: 'Harissa prawns' })
  assert.equal(named(half, 'sheet').props.style.height, 'calc(75% * 0.5 + var(--preview-height, 633px) * 0.5)')
  for (const [previewProgress, expected] of [[0, 0], [.25, .25], [.75, .75], [1, 1], [.25, .25], [-1, 0], [2, 1], [NaN, 0]]) {
    const node = tree({ previewProgress, preview: expected >= .5 })
    assert.ok(named(node, 'field'))
    assert.ok(named(node, 'privatePreview'))
    assert.equal(named(node, 'editorContent').props.style.opacity, 1 - expected)
    assert.equal(named(node, 'previewContent').props.style.opacity, expected)
    assert.equal(named(node, 'editorContent').props['aria-hidden'], expected >= .5 ? true : undefined)
    assert.equal(named(node, 'previewContent').props['aria-hidden'], expected < .5 ? true : undefined)
    if (expected === 1) assert.equal(named(node, 'sheet').props.style.height, 'auto')
  }
  assert.equal(named(tree({ preview: false }), 'previewContent').props.style.opacity, 0)
  assert.equal(named(tree({ preview: true }), 'previewContent').props.style.opacity, 1)
})

test('source-space content measurement follows wrapping changes and disconnects on unmount', () => {
  const preview = named(tree({ previewProgress: .5 }), 'previewContent')
  const measurements = new Map()
  const node = { offsetHeight: 452, parentElement: { style: { setProperty: (name, value) => measurements.set(name, value) } } }
  const cleanup = preview.props.ref(node)
  const observer = observers.at(-1)
  assert.equal(measurements.get('--preview-height'), '452px')
  assert.equal(observer.node, node)
  node.offsetHeight = 476
  observer.callback()
  assert.equal(measurements.get('--preview-height'), '476px')
  assert.equal(named(tree({ previewProgress: .75 }), 'previewContent').props.ref, preview.props.ref, 'scrubbing cannot replace the measurement subscription')
  cleanup()
  assert.equal(observer.disconnected, true)
  assert.equal(preview.props.ref(null), undefined)
})

test('publish feedback is reversible, prop-driven and never creates an operable form', () => {
  const before = markup({ preview: true, publishProgress: 0 })
  const halfway = tree({ preview: true, publishProgress: .5 })
  assert.equal(action(halfway, 'publish').props.style.opacity, .65)
  assert.equal(action(halfway, 'publish').props.style.transform, 'scale(0.985)')
  markup({ preview: true, publishProgress: 1 })
  assert.equal(markup({ preview: true, publishProgress: 0 }), before)
  assert.equal(action(tree({ preview: true, publishProgress: NaN }), 'publish').props.children, 'Publish')
  for (const props of [{}, { typedText: 'Harissa prawns' }, { preview: true }, { preview: true, publishProgress: .5 }]) {
    for (const element of elements(tree(props))) {
      assert.ok(!['button', 'input', 'textarea', 'select', 'form', 'a'].includes(element.type), 'the illustrated controls cannot capture focus or submit')
      assert.ok(!Object.keys(element.props).some(key => /^on[A-Z]/.test(key)), 'no event handlers or hidden publication effects')
      assert.equal(element.props.tabIndex, undefined)
      assert.equal(element.props.autoFocus, undefined)
    }
  }
})
