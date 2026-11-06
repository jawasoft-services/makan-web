import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import vm from 'node:vm'
import ts from 'typescript'

const source = readFileSync(new URL('./SmoothScroll.tsx', import.meta.url), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} }).outputText

// Run the actual component effects/handlers. Only the DOM boundary and Lenis
// are replaced; no exported helper or separate implementation is under test.
function harness({ hash = '', reducedMotion = false } = {}) {
  const effects = []
  const clicks = new Map()
  const events = new Map()
  const timers = new Map()
  const scrolls = []
  const historyWrites = []
  let timerId = 0
  let destroyed = false
  const outer = { open: false, parentElement: null }
  const inner = { open: false, parentElement: { closest: () => outer } }
  const answer = { closest: () => inner }
  const section = { closest: () => null }
  const location = { hash, pathname: '/maitre-d' }
  const document = {
    hidden: false,
    getElementById: id => ({ answer, section })[id] ?? null,
    addEventListener: (name, fn) => clicks.set(name, fn),
    removeEventListener: (name, fn) => { if (clicks.get(name) === fn) clicks.delete(name) },
  }
  const window = {
    matchMedia: () => ({ matches: reducedMotion }),
    scrollTo: () => {},
    setTimeout: (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id },
    clearTimeout: id => timers.delete(id),
    addEventListener: (name, fn) => events.set(name, fn),
    removeEventListener: (name, fn) => { if (events.get(name) === fn) events.delete(name) },
  }
  class Lenis {
    scrollTo(target, options) { scrolls.push({ target, options, innerOpen: inner.open, outerOpen: outer.open }) }
    destroy() { destroyed = true }
  }
  const exports = {}
  vm.runInNewContext(compiled, {
    exports, window, document, location,
    history: { pushState: (_state, _unused, value) => { historyWrites.push(value); location.hash = value } },
    require: name => {
      if (name === 'react') return { useEffect: fn => effects.push(fn) }
      if (name === 'next/navigation') return { usePathname: () => location.pathname }
      if (name === 'lenis') return { default: Lenis }
      throw new Error(`Unexpected dependency ${name}`)
    },
  })
  exports.default()
  const cleanups = effects.map(effect => effect()).filter(Boolean)
  return {
    outer, inner, answer, section, scrolls, historyWrites, window, document,
    runTimers(delay) {
      for (const [id, timer] of [...timers]) {
        if (timer.delay === delay) { timers.delete(id); timer.fn() }
      }
    },
    click(href, extra = {}) {
      const anchor = { getAttribute: () => href, closest: () => null }
      const event = { button: 0, target: { closest: () => anchor }, defaultPrevented: false,
        preventDefault() { this.defaultPrevented = true }, ...extra }
      clicks.get('click')?.(event)
      return event
    },
    hashChange(value) { location.hash = value; events.get('hashchange')?.() },
    cleanup() {
      cleanups.forEach(cleanup => cleanup())
      assert.equal(clicks.size, 0)
      assert.equal(events.size, 0)
      assert.equal(window.__lenis, undefined)
      assert.equal(destroyed, !reducedMotion)
    },
  }
}

test('same-page anchor reveals all enclosing details before Lenis measures and keeps ordinary anchors working', () => {
  const app = harness()
  app.runTimers(0)
  assert.equal(app.click('#answer').defaultPrevented, true)
  app.runTimers(0)
  const scroll = app.scrolls.at(-1)
  assert.equal(scroll.target, app.answer)
  assert.equal(scroll.innerOpen, true)
  assert.equal(scroll.outerOpen, true)
  assert.equal(scroll.options.immediate, false)
  assert.deepEqual(app.historyWrites, ['#answer'])
  app.click('/maitre-d#section')
  app.runTimers(0)
  assert.equal(app.scrolls.at(-1).target, app.section)
  for (const [href, extra] of [['/partner#answer', {}], ['#missing', {}], ['#answer', { ctrlKey: true }]]) {
    assert.equal(app.click(href, extra).defaultPrevented, false)
  }
  app.cleanup()
})

test('initial hash, delayed landing and hash changes use the same disclosure reveal path', () => {
  const app = harness({ hash: '#answer' })
  app.runTimers(0)
  assert.equal(app.scrolls.length, 1)
  assert.equal(app.scrolls[0].innerOpen, true)
  assert.equal(app.scrolls[0].outerOpen, true)
  assert.equal(app.scrolls[0].options.immediate, true)
  app.inner.open = app.outer.open = false
  app.runTimers(600)
  assert.equal(app.scrolls.length, 2)
  assert.equal(app.scrolls[1].innerOpen, true)
  assert.equal(app.scrolls[1].outerOpen, true)
  app.inner.open = app.outer.open = false
  app.document.hidden = true
  app.hashChange('#answer')
  assert.equal(app.scrolls.at(-1).innerOpen, true)
  assert.equal(app.scrolls.at(-1).outerOpen, true)
  assert.equal(app.scrolls.at(-1).options.immediate, true)
  app.cleanup()
})

test('reduced motion leaves anchors and disclosure reveal to the browser', () => {
  const app = harness({ hash: '#answer', reducedMotion: true })
  assert.equal(app.window.__lenis, undefined)
  assert.equal(app.click('#answer').defaultPrevented, false)
  app.runTimers(0)
  assert.equal(app.scrolls.length, 0)
  app.cleanup()
})
