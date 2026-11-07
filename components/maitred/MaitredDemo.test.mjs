import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import * as React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const root = fileURLToPath(new URL('../../', import.meta.url))
const messages = Object.fromEntries(['en', 'id'].map(locale => [locale, JSON.parse(readFileSync(resolve(root, `messages/${locale}.json`), 'utf8'))]))

// Execute the real presentation components and metadata helpers. The public
// directory is a deliberate stub: these tests must never read provider data.
function harness(locale, reducedMotion = false, environment = {}) {
  const events = []
  const frames = new Map()
  const timers = new Map()
  const listeners = new Map()
  const motionListeners = new Map()
  let frameId = 0
  let time = 0
  let runtime
  let rendering = false
  const motion = {
    matches: reducedMotion,
    addEventListener: (name, callback) => motionListeners.set(name, callback),
    removeEventListener: name => motionListeners.delete(name),
  }
  const browserWindow = {
    scrollY: 0, innerHeight: 1000, innerWidth: 1440,
    matchMedia: () => motion,
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: (callback, delay) => { timers.set(++frameId, { callback, due: time + delay }); return frameId },
    clearTimeout: id => timers.delete(id),
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name),
  }
  const initial = value => typeof value === 'function' ? value() : value
  const effect = kind => (callback, dependencies) => {
    if (!rendering) return
    const index = runtime.cursor++
    const slot = runtime.slots[index]
    if (!slot || !dependencies || dependencies.some((value, i) => !Object.is(value, slot.dependencies?.[i]))) {
      runtime.slots[index] = { dependencies, cleanup: slot?.cleanup }
      runtime[kind].push(() => {
        runtime.slots[index].cleanup?.()
        runtime.slots[index].cleanup = callback()
      })
    }
  }
  const hooks = {
    ...React,
    useId: () => 'test-maitred-demo',
    useRef(value) {
      if (!rendering) return { current: value }
      const index = runtime.cursor++
      return runtime.slots[index] ??= { current: value }
    },
    useState(value) {
      if (!rendering) return [initial(value), () => {}]
      const index = runtime.cursor++
      if (!(index in runtime.slots)) runtime.slots[index] = { value: initial(value) }
      return [runtime.slots[index].value, next => {
        const previous = runtime.slots[index].value
        const value = typeof next === 'function' ? next(previous) : next
        if (!Object.is(previous, value)) { runtime.slots[index].value = value; runtime.dirty = true }
      }]
    },
    useEffect: effect('effects'), useLayoutEffect: effect('layouts'), useCallback: callback => callback,
  }
  function commit() {
    let remaining = 20
    while (runtime?.dirty) {
      assert.ok(remaining-- > 0, 'state/effect commits must settle')
      runtime.dirty = false
      runtime.cursor = 0
      rendering = true
      try { runtime.tree = runtime.component(runtime.props) } finally { rendering = false }
      runtime.attach?.(runtime.tree)
      const layouts = runtime.layouts.splice(0)
      const effects = runtime.effects.splice(0)
      layouts.forEach(run => run())
      effects.forEach(run => run())
      runtime.observe?.(runtime.tree)
    }
  }
  function runDueTimers() {
    for (const [id, timer] of [...timers]) {
      if (timer.due > time || !timers.delete(id)) continue
      timer.callback()
      commit()
    }
  }
  const cache = new Map()
  const translate = namespace => {
    const dictionary = namespace.split('.').reduce((value, key) => value[key], messages[locale])
    const lookup = key => {
      const value = key.split('.').reduce((parent, part) => parent?.[part], dictionary)
      assert.notEqual(value, undefined, `${locale}.${namespace}.${key} is missing`)
      return value
    }
    const t = key => { const value = lookup(key); assert.equal(typeof value, 'string'); return value }
    t.raw = lookup
    return t
  }
  const image = input => { const props = { ...input }; delete props.priority; return React.createElement('img', props) }
  const defaults = value => ({ __esModule: true, default: value })
  const modules = {
    react: hooks,
    'react/jsx-runtime': require('react/jsx-runtime'),
    'next/image': defaults(image),
    'next/link': defaults(({ children, ...props }) => React.createElement('a', props, children)),
    'next-intl': { useLocale: () => locale, useTranslations: translate },
    'next-intl/server': { getTranslations: async options => translate(typeof options === 'string' ? options : options.namespace), setRequestLocale: value => assert.equal(value, locale) },
    '@vercel/analytics': { track: (name, payload) => events.push({ name, payload }) },
    '@/components/Footer': defaults(() => React.createElement('footer')),
    '@/components/SiteSchema': defaults(() => null),
    '@/components/home/MaitredShowcase': defaults(({ dedicated }) => React.createElement('section', { 'data-proof-dedicated': dedicated })),
  }
  function load(file) {
    const path = resolve(root, file)
    if (cache.has(path)) return cache.get(path)
    const source = readFileSync(path, 'utf8')
    const exports = {}
    cache.set(path, exports)
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
    runInNewContext(output, { ...environment, exports, URL, window: browserWindow, require: name => {
      if (name in modules) return modules[name]
      if (name.endsWith('.module.css')) return defaults(new Proxy({}, { get: (_, key) => String(key) }))
      const local = name.startsWith('@/') ? resolve(root, name.slice(2)) : name.startsWith('.') ? resolve(dirname(path), name) : null
      assert.ok(local, `Unexpected dependency ${name}; no providers may run`)
      for (const extension of ['.ts', '.tsx']) {
        try { return load(`${local}${extension}`) } catch (error) { if (error.code !== 'ENOENT') throw error }
      }
      throw new Error(`Missing local dependency: ${name}`)
    } })
    return exports
  }
  const api = { events, load, window: browserWindow,
    mount(component, props, attach, observe) {
      runtime = { component, props, attach, observe, slots: [], cursor: 0, effects: [], layouts: [], dirty: true }
      commit()
    },
    tree: () => runtime.tree,
    update(props) { runtime.props = props; runtime.dirty = true; commit() },
    dispatch(name, event = {}) { listeners.get(name)?.({ type: name, ...event }); commit() },
    invoke(callback) { callback(); commit() },
    frames: () => frames.size,
    timers: () => timers.size,
    flushTimers() {
      if (timers.size) time = Math.max(time, ...[...timers.values()].map(timer => timer.due))
      runDueTimers()
    },
    flushFrames() {
      time += 16
      // Only this frame's batch: newly scheduled work belongs to the next frame.
      for (const [id, callback] of [...frames]) {
        if (!frames.delete(id)) continue
        callback(time)
        commit()
      }
      runDueTimers()
    },
    settle(limit = 120) {
      while (frames.size && limit-- > 0) api.flushFrames()
      assert.equal(frames.size, 0, 'animation must settle within the bounded frame budget')
    },
    reduce(value) { motion.matches = value; motionListeners.get('change')?.({ matches: value }); commit() },
    listenerCount: () => listeners.size + motionListeners.size,
    unmount() { runtime.slots.forEach(slot => slot?.cleanup?.()); runtime.dirty = false },
  }
  return api
}

function allElements(node) {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap(allElements)
  return [node, ...allElements(node.props?.children)]
}

for (const locale of ['en', 'id']) {
  test(`${locale}: phone shows the authorized fictional story within the complete native restaurant screen`, () => {
    const app = harness(locale)
    const Mockup = app.load('components/maitred/MaitredNativeMockup.tsx').default
    const copy = app.load('components/maitred/native-copy.ts').NATIVE_MAITRED_COPY[locale]
    for (const state of ['regulars', 'qualify', 'holder', 'order']) {
      const tree = Mockup({ locale, state })
      const html = renderToStaticMarkup(tree)
      assert.ok(html.includes('role="region"') && html.includes('tabindex="0"'), 'the full restaurant screen must be keyboard scrollable')
      assert.ok(html.includes('data-native-viewport="390x844"'))
      assert.ok(html.includes('data-native-mockup="18d991a75"'))
      assert.ok(html.includes(copy.regularsTab))
      assert.equal(html.includes(copy.orderTab), state !== 'holder', 'new holder has only the Regulars tab until publishing')
      assert.ok(html.includes(copy.countingWindow))
      assert.ok(html.includes('Harissa prawns'), 'the sourced food name stays untranslated')
      assert.ok(!/[\[\]]/.test(html.replace(/<[^>]*>/g, '')), 'finished native illustration content has no fixture brackets')
      assert.ok(html.includes('Kendal Street Kitchen'))
      assert.equal((html.match(/data-illustration-row=/g) || []).length, state === 'regulars' || state === 'qualify' ? 4 : 3, 'native shows top three plus the viewer when outside them')
      assert.ok(html.includes('/redesign/fictional-diners.webp'))
      assert.ok(html.includes('84%') && html.includes('25'))
      assert.ok(html.includes('Closes at 9:30 PM') && html.includes('020 3973 1903'))
      for (const section of ['restaurant-meta', 'address', 'phone', 'website', 'claim', 'your-meals', 'dish-guidance', 'cravings', 'eat-or-yeet', 'friends', 'recent-meals']) assert.ok(html.includes(`data-native-section="${section}"`), section)
      assert.ok(!/<(?:button|input|a)\b/.test(html), 'scaled illustration must not contain unusable tiny interactive controls')
      assert.ok(html.includes('M4 7 L11 12 L17 3 L23 12 L31 6 L28 21 Q17 24 7 21 Z'))
      assert.ok(html.includes('\uf399'), 'information icon uses the app Ionicons glyph')
      if (state === 'regulars' || state === 'qualify') assert.ok(!html.includes(copy.editMenu))
      else if (state === 'holder') {
        assert.ok(html.includes(copy.addMenu))
        assert.ok(!html.includes(copy.editMenu))
        assert.ok(html.includes('data-native-disabled="true"'), 'native Share remains unavailable until a usual order exists')
      } else assert.ok(html.includes(copy.editMenu))
    }
  })

  test(`${locale}: server output provides all four earning explanations and labelled native controls`, () => {
    const app = harness(locale)
    const copy = messages[locale].MaitredPage.demo
    const tree = app.load('components/maitred/MaitredDemo.tsx').default({ copy, locale })
    const html = renderToStaticMarkup(tree)
    const elements = allElements(tree)
    const inputs = elements.filter(element => element.type === 'input')
    assert.equal(inputs.length, 4)
    assert.equal(new Set(inputs.map(input => input.props.name)).size, 1, 'native arrow-key selection requires one radio group')
    assert.equal(inputs.filter(input => input.props.defaultChecked).length, 1)
    assert.equal(inputs.find(input => input.props.defaultChecked).props.value, 'save', 'the demo must not initially imply a title was awarded')
    const panels = elements.filter(element => element.props?.['data-demo-panel'])
    for (const input of inputs) {
      assert.equal(input.props.type, 'radio')
      assert.ok(elements.some(element => element.type === 'label' && element.props.htmlFor === input.props.id))
      assert.ok(elements.some(element => element.props?.id === input.props['aria-labelledby']))
      assert.ok(elements.some(element => element.props?.id === input.props['aria-describedby']))
      assert.ok(panels.some(panel => panel.props['data-demo-panel'] === input.props.value && panel.props.id === input.props['aria-controls']))
      input.props.onChange()
    }
    for (const step of copy.steps) assert.ok(html.includes(step.body), 'no-JS readers retain every earning rule')
    assert.ok(html.includes(copy.legend))
    assert.ok(!/\bdemo\b/i.test(html.replace(/<[^>]*>/g, '')), 'visible and screen-reader explanation contains no Demo label')
    assert.ok(html.includes('Kendal Street Kitchen · @ridorichard'))
    assert.equal(app.events.length, 4)
    for (const { name, payload } of app.events) {
      assert.equal(name, 'Maitre d Demo Step Selected')
      assert.deepEqual(Object.keys(payload).sort(), ['locale', 'location', 'step'], 'analytics carry no personal identifiers or progress')
      assert.equal(payload.locale, locale)
      assert.equal(payload.location, 'maitre-d')
    }
  })

  test(`${locale}: complete page retains separate live proof, FAQ, stores and localized handoffs`, async () => {
    const app = harness(locale)
    const pageModule = app.load('app/[locale]/maitre-d/page.tsx')
    const params = Promise.resolve({ locale })
    const page = await pageModule.default({ params })
    const html = renderToStaticMarkup(page)
    assert.equal((html.match(/<h1\b/g) || []).length, 1)
    assert.ok(!/\bdemo\b/i.test(html.replace(/<[^>]*>/g, '')), 'the finished page has no Demo badge or spoken label')
    const eyebrow = allElements(page).find(element => element.type === 'p' && element.props.className === 'eyebrow')
    assert.equal(eyebrow.props.children[0].props.children, 'Maître d’', 'expressive lettering preserves one accessible name')
    assert.equal(eyebrow.props.children[1].props['aria-hidden'], 'true', 'the crown flourish is decorative')
    assert.ok(html.includes('data-proof-dedicated="true"'), 'do not replace the complete public proof collection with demo content')
    assert.equal((html.match(/<details\b/g) || []).length, 7)
    const questions = allElements(page).filter(element => element.type === 'details')
    assert.deepEqual([...new Set(questions.map(question => question.props.name))], ['maitred-faq'], 'one native exclusive FAQ group must work without hydration')
    assert.equal(questions.filter(question => question.props.open).length, 1)
    assert.equal(questions[0].props.open, true, 'the counting-rule handoff retains its initially open answer')
    assert.deepEqual(questions.map(question => question.props.id), Array.from({ length: 7 }, (_, index) => `maitred-question-${index + 1}`))
    const countingAnswer = questions[0].props.children[1]
    assert.equal(countingAnswer.type, 'p')
    assert.equal(countingAnswer.props.id, 'maitred-counting-rules', 'the fragment must target content inside details so native navigation reveals a previously closed answer')
    assert.equal(allElements(page).filter(element => element.props?.id === 'maitred-counting-rules').length, 1)
    assert.ok(allElements(page).some(element => element.type === 'a' && element.props.href === '#maitred-counting-rules'))
    assert.deepEqual(questions.map(question => {
      const [summary, answer] = question.props.children
      return { question: summary.props.children[0], answer: answer.props.children[0] }
    }), messages[locale].MaitredPage.faqs, 'all seven source questions and answers stay unchanged')
    for (const id of ['how-it-is-earned', 'questions', 'download']) assert.ok(html.includes(`id="${id}"`))
    const prefix = locale === 'id' ? '/id' : ''
    const privacyLink = allElements(questions[4]).find(element => element.props?.href === `${prefix}/privacy-policy#maitred-visibility`)
    assert.equal(privacyLink?.props.children, messages[locale].MaitredPage.privacyLink, 'the visibility answer links to the complete localized disclosure')
    assert.ok(html.includes(`href="${prefix}/app"`))
    assert.ok(html.includes(`href="${prefix}/partner"`))
    assert.ok(html.includes('href="https://apps.apple.com/app/id6756131450"'))
    assert.ok(html.includes('href="https://play.google.com/store/apps/details?id=com.makanofficial.makanapp"'))
    assert.equal(pageModule.dynamic, 'force-dynamic', 'personal public proof must not acquire a full-route ISR lifetime')
    const metadata = await pageModule.generateMetadata({ params })
    assert.equal(metadata.alternates.canonical, `https://www.makanofficial.com${prefix}/maitre-d`)
    assert.equal(metadata.alternates.languages.id, 'https://www.makanofficial.com/id/maitre-d')
    assert.equal(metadata.openGraph.images[0].url, `https://www.makanofficial.com${prefix}/maitre-d/opengraph-image`)
  })
}

function controller(locale = 'en', reducedMotion = false, restored = 'save') {
  const app = harness(locale, reducedMotion)
  const steps = ['save', 'qualify', 'lead', 'share']
  let checked = restored
  const reveals = []
  const history = []
  const inputs = steps.map((value, index) => ({
    value, get checked() { return checked === value }, set checked(valueChecked) { if (valueChecked) checked = value },
    closest: () => ({ getBoundingClientRect: () => ({ top: 1050 + index * 600 - app.window.scrollY, height: 100 }) }),
  }))
  const screen = { scrollTop: 0, scrollTo(options) { reveals.push(options); this.scrollTop = options.top } }
  const panels = steps.map(demoPanel => ({ dataset: { demoPanel }, inert: false,
    querySelector: selector => selector === '[role="region"]' ? screen : { offsetTop: selector.includes('your-meals') ? 900 : 400 },
  }))
  const node = {
    getBoundingClientRect: () => ({ top: 1000 - app.window.scrollY, bottom: 3500 - app.window.scrollY }),
    querySelectorAll: selector => selector === '[data-demo-panel]' ? panels : inputs,
    querySelector: selector => selector === '[data-demo-scene]' ? { getBoundingClientRect: () => ({ bottom: 620 }) }
      : panels.find(panel => selector.includes(`"${panel.dataset.demoPanel}"`)),
  }
  const snapshot = tree => {
    const panel = allElements(tree).find(element => element.props?.['data-demo-panel'] === 'save')
    return panel.props.children.props
  }
  const Demo = app.load('components/maitred/MaitredDemo.tsx').default
  app.mount(Demo, { copy: messages[locale].MaitredPage.demo, locale }, tree => { tree.props.ref.current = node }, tree => {
    const { viewerDays: days, state } = snapshot(tree)
    history.push({ days, state })
  })
  const radio = index => allElements(app.tree()).filter(element => element.type === 'input')[index]
  return { ...app, panels, screen, reveals, history, checked: () => checked,
    snapshot: () => snapshot(app.tree()),
    click(index) { checked = steps[index]; app.invoke(() => radio(index).props.onChange()) },
    reselect(keyboard = false) {
      const input = radio(steps.indexOf(checked))
      app.invoke(() => keyboard ? input.props.onKeyDown({ key: ' ', currentTarget: { checked: true } }) : input.props.onPointerDown({ currentTarget: { checked: true } }))
    },
    scroll(y, settle = true) { app.window.scrollY = y; app.dispatch('scroll'); if (settle) app.settle() },
  }
}

for (const reducedMotion of [false, true]) test(`persistent phone follows every whole day and reverses, reduced motion ${reducedMotion}`, () => {
  const app = controller('en', reducedMotion)
  app.settle()
  assert.equal(app.tree().props['data-motion-ready'], true)
  assert.deepEqual(app.panels.filter(panel => !panel.inert).map(panel => panel.dataset.demoPanel), ['save'])
  assert.ok(allElements(app.tree()).filter(element => element.type === 'input').every(input => input.props['aria-controls'] === 'test-maitred-demo-save-phone'))
  const phoneType = allElements(app.tree()).find(element => element.props?.['data-demo-panel'] === 'save').props.children.type
  const samples = [[600, 1], [1200, 2], [1300, 3], [1400, 4], [1500, 5], [1600, 6], [1700, 7], [1800, 8]]
  for (const [y, days] of [...samples, ...[...samples].reverse()]) {
    app.scroll(y)
    assert.equal(app.snapshot().viewerDays, days)
    assert.equal(app.snapshot().state, days < 2 ? 'regulars' : days < 8 ? 'qualify' : 'holder')
    assert.equal(app.tree().props['data-story-holder'], days === 8 || undefined)
    assert.equal(allElements(app.tree()).find(element => element.props?.['data-demo-panel'] === 'save').props.children.type, phoneType, 'the phone component remains mounted across milestones')
    assert.equal(app.snapshot().standings.props.days, days, 'animated rows and surrounding phone share one count')
  }
  app.scroll(2400)
  assert.equal(app.snapshot().state, 'order')
  assert.equal(app.snapshot().viewerDays, 8)
  assert.equal(app.events.length, 0, 'automatic story progress never sends click analytics')
  if (reducedMotion) assert.ok(app.reveals.every(call => call.behavior === 'instant'))
  app.unmount()
  assert.equal(app.listenerCount(), 0)
})

test('click animation counts through intermediate days and a new choice continues from its current state', () => {
  const app = controller()
  app.settle()
  app.scroll(600)
  app.click(2)
  assert.equal(app.frames(), 1)
  app.flushFrames()
  assert.equal(app.frames(), 1, 'a frame flush must not drain newly scheduled frames')
  assert.equal(app.snapshot().viewerDays, 1, 'one frame cannot teleport from one to eight')
  app.settle()
  assert.deepEqual([...new Set(app.history.map(snapshot => snapshot.days))], [1, 2, 3, 4, 5, 6, 7, 8])
  assert.equal(app.snapshot().state, 'holder')
  app.click(0)
  app.flushFrames()
  const interrupted = app.snapshot().viewerDays
  assert.ok(interrupted > 1 && interrupted < 8)
  app.click(2)
  assert.equal(app.snapshot().viewerDays, interrupted, 'retargeting starts from the currently displayed count')
  assert.equal(app.frames(), 1, 'interruptions share the pending animation frame')
  app.settle()
  assert.equal(app.snapshot().viewerDays, 8)
  assert.equal(app.events.length, 3)
  assert.ok(app.events.every(event => Object.keys(event.payload).sort().join(',') === 'locale,location,step'))
  app.unmount()
})

test('scroll interruption cancels a stale click destination, while tiny scrolls preserve explicit choice', () => {
  const app = controller()
  app.settle()
  app.scroll(600)
  app.click(3)
  app.flushFrames()
  app.scroll(601, false)
  app.settle()
  assert.equal(app.snapshot().state, 'order', 'tiny movement inside the held reading step does not undo a click')
  app.click(0)
  app.flushFrames()
  app.flushTimers()
  app.scroll(1200, false)
  app.settle()
  assert.equal(app.snapshot().viewerDays, 2)
  assert.equal(app.snapshot().state, 'qualify', 'scroll crossing a new step boundary replaces the click destination')
  const final = app.snapshot()
  app.flushFrames()
  assert.equal(app.snapshot(), final, 'no stale callback changes the settled story')
  app.unmount()
})

test('viewport changes recompute geometry, the mobile reading line follows the phone, and off-section scroll does nothing', () => {
  const app = controller('en', true)
  app.settle()
  app.scroll(1200)
  assert.equal(app.snapshot().viewerDays, 2)
  app.window.innerHeight = 1400
  app.dispatch('resize')
  assert.equal(app.snapshot().viewerDays, 4, 'resize must recompute even when scrollY is unchanged')
  app.window.innerHeight = 1000
  app.window.innerWidth = 390
  app.dispatch('resize')
  assert.equal(app.snapshot().viewerDays, 5, 'mobile reads halfway between the sticky phone bottom and the viewport bottom')
  app.scroll(5000)
  assert.equal(app.snapshot().viewerDays, 5)
  app.unmount()
})

test('motion preference changes settle pending animation and cleanup removes listeners and queued frames', () => {
  const app = controller()
  app.settle()
  app.click(3)
  app.flushFrames()
  assert.equal(app.frames(), 1)
  app.reduce(true)
  assert.equal(app.frames(), 0)
  assert.equal(app.snapshot().state, 'order')
  assert.equal(app.reveals.at(-1).behavior, 'instant')
  app.reduce(false)
  app.click(0)
  assert.equal(app.frames(), 1)
  app.unmount()
  assert.equal(app.frames(), 0)
  assert.equal(app.timers(), 0)
  assert.equal(app.listenerCount(), 0)
  const history = app.history.length
  app.dispatch('scroll')
  app.flushFrames()
  assert.equal(app.history.length, history)
  const beforeHydration = controller()
  assert.equal(beforeHydration.frames(), 1)
  beforeHydration.unmount()
  assert.equal(beforeHydration.frames(), 0, 'unmount also cancels initial hydration work')
})

test('browser focus scrolling cannot replace a clicked lead endpoint with a seven-day intermediate state', () => {
  const app = controller()
  app.settle()
  app.scroll(600)
  app.click(2)
  app.flushFrames()
  assert.equal(app.timers(), 1)
  app.scroll(1716, false) // The focused row moves the reading line to progress1.86.
  app.settle()
  assert.equal(app.snapshot().viewerDays, 8)
  assert.equal(app.snapshot().state, 'holder', 'the explicit target must reach eight despite browser focus scrolling')
  app.flushTimers()
  assert.equal(app.timers(), 0)
  app.scroll(1717)
  assert.equal(app.snapshot().viewerDays, 8, 'small movement inside the settled reading step retains the chosen endpoint')
  app.scroll(1200)
  assert.equal(app.snapshot().viewerDays, 2, 'a later user scroll across a boundary resumes normal progress')
  app.unmount()
})

test('restored selection hydrates into the persistent phone and reselecting restores its detail', () => {
  const app = controller('en', false, 'share')
  app.settle()
  assert.equal(app.snapshot().state, 'order')
  assert.equal(app.snapshot().viewerDays, 8)
  assert.equal(app.checked(), 'share')
  app.screen.scrollTop = 1500
  app.reselect()
  assert.equal(app.reveals.at(-1).top, 176)
  app.screen.scrollTop = 1200
  app.reselect(true)
  assert.equal(app.reveals.at(-1).top, 176)
  app.settle()
  assert.equal(app.events.length, 0, 'restoring an active step does not fabricate a selection event')
  app.unmount()
})

test('neither public language catalogue contains a Demo label', () => {
  const strings = value => typeof value === 'string' ? [value]
    : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : []
  for (const locale of ['en', 'id']) {
    assert.ok(!strings(messages[locale]).some(value => /\bdemo\b/i.test(value)), `${locale}: remove fixture labels rather than hiding them behind another caller`)
    assert.deepEqual(Object.keys(messages[locale].MaitredPage.demo).sort(), ['legend', 'steps'], 'discard unused phone copy after source-matched mockup conversion')
  }
})

for (const locale of ['en', 'id']) {
  test(`${locale}: illustrated table moves through qualifying, crown transfer and separate order publication`, () => {
    const { illustrationTable, illustrationViewerMeals, MaitredCardContent, ILLUSTRATION_DINERS, ILLUSTRATION_EOY } = harness(locale).load('components/maitred/MaitredIllustration.tsx')
    assert.equal(ILLUSTRATION_DINERS.length, 6)
    for (const [stage, count] of [['regulars', 1], ['qualify', 2], ['holder', 8], ['order', 8]]) {
      const meals = illustrationViewerMeals(stage)
      assert.equal(meals.length, count)
      assert.ok(meals.every(meal => meal.name === 'Alex Chen'), 'the personal history never borrows other diners’ meal records')
      assert.equal(new Set(meals.map(meal => meal.dishId)).size >= 2, stage !== 'regulars', 'comparison needs distinct experienced dishes')
    }
    const save = illustrationTable('regulars'), qualify = illustrationTable('qualify'), lead = illustrationTable('holder'), published = illustrationTable('order')
    assert.equal(save.rows.find(x => x.isYou).days, 1)
    assert.equal(qualify.rows.find(x => x.isYou).days, 2)
    assert.equal(qualify.holder.name, 'Jamie Morgan', 'two days qualifies but does not confer the title')
    assert.equal(qualify.rows.find(x => x.isYou).rank, 6)
    assert.equal(lead.holder.name, 'Alex Chen')
    assert.equal(lead.rows[0].days, 8)
    assert.equal(published.holder.name, lead.holder.name)
    assert.equal(lead.rows.filter(x => x.isHolder).length, 1)
    assert.equal(lead.rows.length, 3)
    assert.equal(renderToStaticMarkup(MaitredCardContent({ locale, stage: 'holder', tab: 'regulars' })).includes('Harissa prawns'), false)
    assert.ok(renderToStaticMarkup(MaitredCardContent({ locale, stage: 'order', tab: 'order' })).includes('Harissa prawns'))
    const score = ILLUSTRATION_EOY
    assert.equal(score.eat + score.yeet + score.tied, score.comparisons)
    assert.equal(score.eat / score.comparisons * 100, score.percent)
  })
}

for (const locale of ['en', 'id']) test(`${locale}: each intermediate count keeps ranking, history, ownership and menu state synchronized`, () => {
  const app = harness(locale)
  const { illustrationTable, illustrationViewerMeals } = app.load('components/maitred/MaitredIllustration.tsx')
  const { NATIVE_MAITRED_COPY, NATIVE_RESTAURANT_COPY } = app.load('components/maitred/native-copy.ts')
  const copy = NATIVE_MAITRED_COPY[locale]
  const restaurantCopy = NATIVE_RESTAURANT_COPY[locale]
  const Mockup = app.load('components/maitred/MaitredNativeMockup.tsx').default
  const expectedRanks = [6, 6, 4, 3, 2, 2, 2, 1]
  for (const days of [1, 2, 3, 4, 5, 6, 7, 8, 7]) {
    const state = days < 2 ? 'regulars' : days < 8 ? 'qualify' : 'holder'
    const table = illustrationTable(state, days)
    const viewer = table.rows.find(person => person.isYou)
    assert.equal(viewer.days, days)
    assert.equal(viewer.rank, expectedRanks[days - 1])
    assert.equal(table.rows.length, days < 4 ? 4 : 3)
    assert.equal(table.holder.id, days === 8 ? 'alex' : 'jamie')
    assert.equal(table.own, days === 8)
    assert.equal(table.rows.filter(person => person.isHolder).length, 1)
    if (days === 7) assert.deepEqual(Array.from(table.rows, person => person.id), ['jamie', 'alex', 'sam'], 'the incumbent sorts first on a tie')
    const meals = illustrationViewerMeals(state, days)
    assert.equal(meals.length, days)
    assert.ok(meals.every(meal => meal.name === 'Alex Chen'))
    const tree = Mockup({ locale, state, viewerDays: days })
    const elements = allElements(tree)
    const history = elements.find(element => element.props?.['data-native-section'] === 'your-meals')
    assert.ok(renderToStaticMarkup(history).includes(days === 1 ? 'once' : `${days} times`))
    const meta = elements.find(element => element.props?.['data-native-section'] === 'restaurant-meta')
    assert.ok(renderToStaticMarkup(meta).includes(`${36 + days} meals`))
    const action = elements.find(element => element.props?.className === 'decisionAction')
    assert.equal(action.props.children, days === 1 ? restaurantCopy.saveMeal : restaurantCopy.eatOrYeet)
    const html = renderToStaticMarkup(tree)
    assert.equal(html.includes(copy.addMenu), days === 8, 'owner actions begin only at the clear lead')
    assert.equal(html.includes('data-native-disabled="true"'), days === 8)
    assert.ok(!html.includes(copy.editMenu))
    if (days < 8) assert.ok(html.includes(restaurantCopy.maitredEvidence.replace('{{name}}', 'Jamie Morgan')))
  }
  const published = renderToStaticMarkup(Mockup({ locale, state: 'order', viewerDays: 8 }))
  assert.ok(published.includes(copy.editMenu))
  assert.ok(published.includes('data-native-disabled="false"'))
})

for (const reducedMotion of [false, true]) test(`measured rows retain actors and a single crown through transfer and reversal, reduced motion ${reducedMotion}`, () => {
  const observers = []
  const animations = []
  const rowNodes = new Map()
  let orderedRows = []
  const crown = {
    style: {}, visualTransform: undefined,
    getAnimations: () => animations.filter(animation => !animation.cancelled),
    animate(keyframes, options) {
      const animation = { keyframes, options, cancelled: false, cancel() { this.cancelled = true } }
      animations.push(animation)
      return animation
    },
  }
  const node = {
    style: {}, dataset: {},
    querySelector: selector => { assert.equal(selector, '[data-moving-crown]'); return crown },
    querySelectorAll: selector => { assert.equal(selector, '[data-illustration-row]'); return orderedRows },
  }
  const app = harness('en', reducedMotion, {
    getComputedStyle: target => { assert.equal(target, crown); return { transform: crown.visualTransform ?? crown.style.transform ?? 'none' } },
    ResizeObserver: class {
      constructor(callback) { this.callback = callback; this.targets = []; this.disconnected = false; observers.push(this) }
      observe(target) { this.targets.push(target) }
      disconnect() { this.disconnected = true }
    },
  })
  const Standings = app.load('components/maitred/MaitredStandings.tsx').default
  function attach(tree) {
    tree.props.ref.current = node
    const elements = allElements(tree).filter(element => element.props?.['data-illustration-row'])
    orderedRows = elements.map(element => {
      const id = element.props['data-illustration-row']
      assert.equal(element.key, id, 'stable person identity is the React key')
      if (!rowNodes.has(element.key)) rowNodes.set(element.key, { id, style: {}, dataset: {},
        getAttribute(name) { return name === 'aria-hidden' && this.hidden ? 'true' : null },
        querySelector(selector) { assert.equal(selector, '[data-row-avatar]'); return { offsetTop: this.dataset.illustrationHolder ? 4 : 6 } },
      })
      const row = rowNodes.get(element.key)
      row.hidden = element.props['aria-hidden'] === true
      row.dataset.illustrationHolder = element.props['data-illustration-holder'] ? 'true' : undefined
      row.offsetHeight = row.dataset.illustrationHolder ? 52 : 40
      return row
    })
  }
  const update = days => app.update({ locale: 'en', state: days < 8 ? 'qualify' : 'holder', days })
  const positions = () => Object.fromEntries(orderedRows.map(row => [row.id, row.style.transform]))
  app.mount(Standings, { locale: 'en', state: 'regulars', days: 1 }, attach)
  const originalNodes = new Map(rowNodes)
  assert.deepEqual(positions(), { jamie: 'translateY(0px)', sam: 'translateY(56px)', maya: 'translateY(100px)', alex: 'translateY(144px)' })
  assert.equal(node.style.height, '184px')
  assert.equal(crown.style.transform, 'translateY(2px)')
  assert.equal(animations.length, 0)
  assert.equal(node.dataset.positioned, 'true')
  update(4)
  assert.equal(rowNodes.get('maya').hidden, true)
  assert.equal(rowNodes.get('alex').style.transform, 'translateY(100px)')
  assert.equal(node.style.height, '140px', 'hidden Maya contributes no extra row to native top-three sizing')
  update(7)
  assert.equal(rowNodes.get('jamie').dataset.illustrationHolder, 'true')
  assert.equal(rowNodes.get('alex').style.transform, 'translateY(56px)')
  assert.equal(animations.length, 0, 'tying seven does not transfer or animate the crown')
  update(8)
  assert.equal(rowNodes.get('alex').dataset.illustrationHolder, 'true')
  assert.equal(rowNodes.get('alex').style.transform, 'translateY(0px)')
  assert.equal(rowNodes.get('jamie').style.transform, 'translateY(56px)')
  assert.equal(allElements(app.tree()).filter(element => element.props?.['data-moving-crown']).length, 1)
  assert.equal((renderToStaticMarkup(app.tree()).match(/<svg\b/g) ?? []).length, 1, 'rows do not duplicate the moving crown')
  assert.equal(animations.length, reducedMotion ? 0 : 1)
  orderedRows[0].offsetHeight = 60
  observers.at(-1).callback()
  assert.equal(node.style.height, '148px', 'ResizeObserver uses newly measured row height')
  assert.equal(animations.length, reducedMotion ? 0 : 1)
  if (!reducedMotion) assert.equal(animations[0].cancelled, false, 'a resize must not cancel an in-flight transfer')
  crown.visualTransform = 'matrix(1, 0, 0, 1, 0, -9)'
  update(7)
  assert.equal(rowNodes.get('jamie').dataset.illustrationHolder, 'true')
  assert.equal(animations.length, reducedMotion ? 0 : 2)
  if (!reducedMotion) {
    assert.equal(animations[0].cancelled, true)
    assert.equal(animations[1].keyframes[0].transform, crown.visualTransform, 'reverse transfer starts at the currently visible crown position')
    assert.equal(animations[1].keyframes.at(-1).transform, 'translateY(2px)')
  }
  update(1)
  assert.equal(rowNodes.get('maya').hidden, false)
  assert.equal(node.style.height, '184px')
  assert.equal(rowNodes.size, 4)
  for (const [id, row] of originalNodes) assert.equal(rowNodes.get(id), row)
  assert.ok(observers.slice(0, -1).every(observer => observer.disconnected))
  app.unmount()
  assert.ok(observers.every(observer => observer.disconnected))
})
