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
function harness({ hash = '', reducedMotion = false, initialY = 0 } = {}) {
  const effects = []
  const pendingEffects = []
  const clicks = new Map()
  const events = new Map()
  const timers = new Map()
  const scrolls = []
  const nativeScrolls = []
  const nativeAnchorScrolls = []
  const historyWrites = []
  const history = { scrollRestoration: 'auto', pushState: (_state, _unused, value) => { historyWrites.push(value); location.hash = value } }
  let timerId = 0
  let effectIndex = 0
  let destroyed = false
  const outer = { open: false, parentElement: null }
  const inner = { open: false, parentElement: { closest: () => outer } }
  const answer = { closest: () => inner, scrollIntoView: options => nativeAnchorScrolls.push({ target: answer, options, innerOpen: inner.open, outerOpen: outer.open }) }
  const section = { closest: () => null, scrollIntoView: options => nativeAnchorScrolls.push({ target: section, options }) }
  const location = { hash, pathname: '/maitre-d' }
  const document = {
    hidden: false,
    getElementById: id => ({ answer, section })[id] ?? null,
    addEventListener: (name, fn) => clicks.set(name, fn),
    removeEventListener: (name, fn) => { if (clicks.get(name) === fn) clicks.delete(name) },
  }
  const window = {
    scrollY: initialY,
    matchMedia: () => ({ matches: reducedMotion }),
    scrollTo: options => { nativeScrolls.push({ ...options }); window.scrollY = options.top },
    setTimeout: (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id },
    clearTimeout: id => timers.delete(id),
    addEventListener: (name, fn) => events.set(name, fn),
    removeEventListener: (name, fn) => { if (events.get(name) === fn) events.delete(name) },
  }
  class Lenis {
    constructor() { this.actualScroll = this.targetScroll = window.scrollY }
    scrollTo(target, options) {
      scrolls.push({ target, options, innerOpen: inner.open, outerOpen: outer.open })
      this.targetScroll = target
      if (typeof target === 'number' && options.immediate) window.scrollY = this.actualScroll = target
    }
    destroy() { destroyed = true }
  }
  const exports = {}
  vm.runInNewContext(compiled, {
    exports, window, document, location,
    history,
    require: name => {
      if (name === 'react') return { useEffect: (run, dependencies) => {
        const previous = effects[effectIndex]
        if (!previous || dependencies.some((value, index) => !Object.is(value, previous.dependencies[index]))) {
          const effect = { run, dependencies, cleanup: previous?.cleanup }
          effects[effectIndex] = effect
          pendingEffects.push(effect)
        }
        effectIndex++
      } }
      if (name === 'next/navigation') return { usePathname: () => location.pathname }
      if (name === 'lenis') return { default: Lenis }
      throw new Error(`Unexpected dependency ${name}`)
    },
  })
  const render = () => {
    effectIndex = 0
    exports.default()
    for (const effect of pendingEffects.splice(0)) {
      effect.cleanup?.()
      effect.cleanup = effect.run()
    }
  }
  render()
  assert.equal(history.scrollRestoration, 'manual', 'native Back restoration must not race route resets')
  return {
    outer, inner, answer, section, scrolls, nativeScrolls, nativeAnchorScrolls, historyWrites, window, document,
    rerender(pathname = location.pathname, hash = location.hash) {
      location.pathname = pathname
      location.hash = hash
      render()
    },
    setPosition(actual, target = actual) {
      window.scrollY = actual
      if (window.__lenis) Object.assign(window.__lenis, { actualScroll: actual, targetScroll: target })
    },
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
      effects.forEach(effect => effect.cleanup?.())
      assert.equal(clicks.size, 0)
      assert.equal(events.size, 0)
      assert.equal(window.__lenis, undefined)
      assert.equal(destroyed, !reducedMotion)
      assert.equal(history.scrollRestoration, 'auto', 'unmount restores the browser setting')
    },
  }
}

for (const reducedMotion of [false, true]) test(`new routes open at the top while same-path rerenders preserve position, reduced motion ${reducedMotion}`, () => {
  const app = harness({ reducedMotion, initialY: 1600 })
  assert.equal(app.window.scrollY, 0, 'initial entry resets before the scroller is constructed')
  assert.deepEqual(app.nativeScrolls, [{ top: 0, left: 0, behavior: 'instant' }])
  const scroller = app.window.__lenis
  for (const pathname of ['/partner', '/maitre-d']) {
    app.setPosition(1750, 2100)
    const before = { lenis: app.scrolls.length, native: app.nativeScrolls.length }
    app.rerender()
    assert.equal(app.window.scrollY, 1750, 'same-page rendering must not restart the story')
    assert.equal(app.scrolls.length, before.lenis)
    assert.equal(app.nativeScrolls.length, before.native)
    if (scroller) assert.equal(scroller.targetScroll, 2100)
    app.rerender(pathname, '')
    assert.equal(app.window.scrollY, 0)
    assert.equal(app.window.__lenis, scroller, 'route changes retain the existing scroller')
    if (reducedMotion) {
      assert.deepEqual(app.nativeScrolls.at(-1), { top: 0, left: 0, behavior: 'instant' })
      assert.equal(app.scrolls.length, 0)
    } else {
      assert.equal(app.scrolls.at(-1).target, 0)
      assert.deepEqual({ ...app.scrolls.at(-1).options }, { immediate: true, force: true })
      assert.equal(scroller.actualScroll, 0)
      assert.equal(scroller.targetScroll, 0, 'the previous page momentum cannot pull the new route away from the top')
      assert.equal(app.nativeScrolls.length, 1, 'active Lenis owns subsequent route resets')
    }
  }
  app.cleanup()
})

for (const reducedMotion of [false, true]) test(`hash routes preserve anchor navigation instead of resetting to the top, reduced motion ${reducedMotion}`, () => {
  const app = harness({ reducedMotion })
  app.runTimers(0)
  app.setPosition(1750, 2100)
  const before = { lenis: app.scrolls.length, native: app.nativeScrolls.length }
  app.rerender('/partner', '#answer')
  assert.equal(app.window.scrollY, 1750)
  assert.equal(app.scrolls.length, before.lenis)
  assert.equal(app.nativeScrolls.length, before.native)
  app.hashChange('#answer')
  if (reducedMotion) {
    assert.equal(app.scrolls.length, before.lenis)
    assert.equal(app.nativeAnchorScrolls.at(-1).target, app.answer)
    assert.equal(app.nativeAnchorScrolls.at(-1).innerOpen, true)
    assert.equal(app.nativeAnchorScrolls.at(-1).outerOpen, true)
  }
  else {
    assert.equal(app.scrolls.at(-1).target, app.answer)
    assert.equal(app.scrolls.at(-1).innerOpen, true)
    assert.equal(app.scrolls.at(-1).outerOpen, true)
  }
  assert.equal(app.nativeScrolls.length, before.native)
  app.cleanup()
})

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

test('reduced motion keeps router history and reveals disclosures with instant native scrolling', () => {
  const app = harness({ hash: '#answer', reducedMotion: true })
  assert.equal(app.window.__lenis, undefined)
  app.runTimers(0)
  assert.equal(app.nativeAnchorScrolls.at(-1).target, app.answer)
  assert.equal(app.inner.open, true)
  assert.equal(app.outer.open, true)
  assert.equal(app.click('#section').defaultPrevented, true)
  app.runTimers(0)
  assert.deepEqual(app.historyWrites, ['#section'])
  assert.equal(app.nativeAnchorScrolls.at(-1).target, app.section)
  assert.deepEqual({ ...app.nativeAnchorScrolls.at(-1).options }, { behavior: 'instant', block: 'start' })
  assert.equal(app.scrolls.length, 0)
  app.cleanup()
})

for (const reducedMotion of [false, true]) test(`repeated section clicks do not add duplicate Back destinations, reduced motion ${reducedMotion}`, () => {
  const app = harness({ reducedMotion })
  app.runTimers(0)
  app.click('#section')
  app.runTimers(0)
  app.click('#section')
  app.runTimers(0)
  assert.deepEqual(app.historyWrites, ['#section'])
  assert.equal((reducedMotion ? app.nativeAnchorScrolls : app.scrolls).at(-1).target, app.section)
  app.cleanup()
})
