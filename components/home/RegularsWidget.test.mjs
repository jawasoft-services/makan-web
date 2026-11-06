import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const widgetPath = 'components/home/RegularsWidget.tsx'
const compile = path => ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: {
  module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022,
} }).outputText

// Render the real shared illustration and portrait payload, without Next's image server.
function load(file, cache = new Map()) {
  const path = resolve(file)
  if (cache.has(path)) return cache.get(path)
  const exports = {}
  cache.set(path, exports)
  runInNewContext(compile(path), { exports, require(id) {
    if (id === 'next/image') return { default: props => createElement('img', props) }
    if (id.endsWith('.module.css')) return { default: new Proxy({}, { get: (_, key) => key }) }
    if (id.startsWith('@/')) return load(`${id.slice(2)}.tsx`, cache)
    if (id.startsWith('./')) return load(resolve(dirname(path), `${id}.ts`), cache)
    return require(id)
  } })
  return exports
}

function props(locale = 'en') {
  const copy = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')).Redesign.widget
  return { locale, labels: [copy.regularsLabel, copy.usualLabel], label: copy.widgetLabel,
    rulesLabel: copy.rulesLabel, rules: { title: copy.rulesTitle, qualify: copy.rulesQualify, holder: copy.rulesHolder, usual: copy.rulesUsual } }
}

for (const locale of ['en', 'id']) {
  test(`${locale}: both tabs contain the shared populated illustration and profile-photo asset`, () => {
    const Widget = load(widgetPath).default
    const html = renderToStaticMarkup(createElement(Widget, props(locale)))
    assert.equal((html.match(/role="tab"/g) ?? []).length, 2)
    assert.equal((html.match(/role="tabpanel"/g) ?? []).length, 2)
    assert.match(html, /fictional-diners\.webp/)
    assert.match(html, /data-illustration-row="alex"/)
    assert.match(html, /data-illustration-row="jamie"/)
    assert.match(html, /data-illustration-row="sam"/)
    assert.match(html, /Jamie Morgan/)
    assert.match(html, /Sam Rivera/)
    assert.match(html, /Harissa prawns/)
    assert.match(html, /Kendal Street Kitchen/)
    assert.doesNotMatch(html, /regulars-(?:en|id)\.webp|usual-order(?:-id)?\.webp|mockup-assets/)
  })
}

// Exercise the actual event handlers and state transitions with stable hook slots.
function harness(overrides = {}) {
  const slots = []
  let cursor = 0
  let tree
  let focused
  const hooks = {
    useId: () => 'widget',
    useRef(initial) { const index = cursor++; return slots[index] ??= { current: initial } },
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = initial
      return [slots[index], next => { slots[index] = typeof next === 'function' ? next(slots[index]) : next }]
    },
  }
  const content = () => null
  const jsx = (type, props) => ({ type, props })
  const exports = {}
  runInNewContext(compile(widgetPath), { exports, require(id) {
    if (id === 'react') return hooks
    if (id === 'react/jsx-runtime') return { jsx, jsxs: jsx }
    if (id === '@/components/maitred/MaitredIllustration') return { MaitredCardContent: content }
    throw new Error(`Unexpected import: ${id}`)
  } })
  function all(element) {
    if (!element || typeof element !== 'object') return []
    if (Array.isArray(element)) return element.flatMap(all)
    return [element, ...all(element.props?.children)]
  }
  const render = () => {
    cursor = 0
    tree = exports.default({ ...props(), ...overrides })
    for (const element of all(tree)) {
      if (element.type !== 'button') continue
      const node = { focus: () => { focused = element.props.id ?? 'info' } }
      if (typeof element.props.ref === 'function') element.props.ref(node)
      else if (element.props.ref) element.props.ref.current = node
    }
  }
  render()
  const find = role => all(tree).filter(element => element.props?.role === role)
  const info = () => all(tree).find(element => element.type === 'button' && element.props['aria-expanded'] !== undefined)
  return {
    tabs: () => find('tab'), panels: () => find('tabpanel'), rules: () => find('region')[0],
    payloads: () => all(tree).filter(element => element.type === content).map(element => element.props),
    focus: () => focused,
    clickTab(index) { find('tab')[index].props.onClick(); render() },
    clickInfo() { info().props.onClick(); render() },
    key(key) {
      let prevented = false
      find('tab').find(element => element.props['aria-selected']).props.onKeyDown({ key, preventDefault() { prevented = true } })
      render()
      return prevented
    },
    escape() { tree.props.onKeyDown({ key: 'Escape' }); render() },
  }
}

test('tab selection retains default usual order, explicit locale, roving focus and arrow/Home/End controls', () => {
  const app = harness({ locale: 'id' })
  const selected = () => app.tabs().findIndex(element => element.props['aria-selected'])
  assert.equal(selected(), 1)
  assert.equal(app.panels()[1].props.hidden, false)
  assert.equal(app.tabs()[1].props.tabIndex, 0)
  assert.equal(app.tabs()[0].props.tabIndex, -1)
  assert.deepEqual(JSON.parse(JSON.stringify(app.payloads())), [
    { locale: 'id', stage: 'order', tab: 'regulars' }, { locale: 'id', stage: 'order', tab: 'order' },
  ])
  for (const [key, index] of [['ArrowLeft', 0], ['ArrowRight', 1], ['Home', 0], ['End', 1]]) {
    assert.equal(app.key(key), true)
    assert.equal(selected(), index)
    assert.equal(app.focus(), `widget-tab-${index}`)
    assert.equal(app.panels()[index].props.hidden, false)
  }
  assert.equal(app.key('Tab'), false)
  assert.equal(selected(), 1)
  assert.equal(harness({ initialTab: 0 }).tabs()[0].props['aria-selected'], true)
})

test('information toggles without discarding content, Escape restores focus, and choosing a tab closes it', () => {
  const app = harness()
  const before = app.payloads()
  app.clickInfo()
  assert.equal(app.rules().props.hidden, false)
  for (const panel of app.panels()) {
    assert.equal(panel.props['aria-hidden'], true)
    assert.equal(panel.props.className, 'invisible', 'content preserves its layout space behind the rules')
  }
  assert.deepEqual(app.payloads(), before)
  app.escape()
  assert.equal(app.rules().props.hidden, true)
  assert.equal(app.focus(), 'info')
  assert.equal(app.panels()[1].props['aria-hidden'], undefined)
  app.clickInfo()
  app.clickTab(0)
  assert.equal(app.rules().props.hidden, true)
  assert.equal(app.tabs()[0].props['aria-selected'], true)
})
