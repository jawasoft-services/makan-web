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
function harness(locale, reducedMotion = false) {
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
    getComputedStyle: node => ({ top: `${node.top}px` }),
    requestAnimationFrame: callback => { frames.set(++frameId, callback); return frameId },
    cancelAnimationFrame: id => frames.delete(id),
    setTimeout: callback => { timers.set(++frameId, callback); return frameId },
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
    runInNewContext(output, { exports, URL, window: browserWindow, require: name => {
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
    dispatch(name, event = {}) { listeners.get(name)?.({ type: name, ...event }); commit() },
    invoke(callback) { callback(); commit() },
    frames: () => frames.size,
    timers: () => timers.size,
    flushFrames() {
      time += 16
      // Only this frame's batch: newly scheduled work belongs to the next frame.
      for (const [id, callback] of [...frames]) {
        if (!frames.delete(id)) continue
        callback(time)
        commit()
      }
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
    const stage = elements.find(element => element.props?.['data-story-stage'] !== undefined)
    assert.ok(stage, 'the instructions and phone share one pinned stage')
    const stageElements = allElements(stage)
    assert.deepEqual(stageElements.filter(element => element.type === 'input'), inputs, 'all four controls remain together beside the phone')
    assert.ok(stageElements.some(element => element.props?.['data-demo-scene'] !== undefined))
    const scrollTrack = elements.find(element => element.props?.['data-story-track'] !== undefined)
    assert.ok(scrollTrack && !stageElements.includes(scrollTrack), 'scroll distance stays outside the pinned stage')
    assert.equal(new Set(inputs.map(input => input.props.name)).size, 1, 'native arrow-key selection requires one radio group')
    assert.equal(inputs.filter(input => input.props.defaultChecked).length, 1)
    assert.equal(inputs.find(input => input.props.defaultChecked).props.value, 'save', 'the demo must not initially imply a title was awarded')
    const panels = elements.filter(element => element.props?.['data-demo-panel'])
    assert.equal(panels.length, 4, 'server output retains a native phone for every no-JavaScript choice')
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

function controller(locale = 'en', reducedMotion = false, restored = 'save', { initialY = 0, lenis = false, delayedLenis = false } = {}) {
  const app = harness(locale, reducedMotion)
  const steps = ['save', 'qualify', 'lead', 'share']
  let checked = restored
  const reveals = [], pageScrolls = [], history = [], checkedWrites = []
  const lenisListeners = new Map()
  const scene = { height: 620, bottom: 9999 }
  const stage = { top: 400 }
  const track = { height: 2400, getBoundingClientRect() { return { height: this.height } } }
  app.window.scrollY = initialY
  app.window.scrollTo = options => {
    pageScrolls.push({ target: 'window', ...options })
    if (options.behavior === 'instant') app.window.scrollY = options.top
  }
  const scroller = lenis ? {
    actualScroll: initialY, targetScroll: initialY,
    on(name, callback) { lenisListeners.set(name, callback); return () => lenisListeners.delete(name) },
    scrollTo(top, options) {
      pageScrolls.push({ target: 'lenis', top, ...options })
      this.targetScroll = top
      if (options.immediate) app.window.scrollY = this.actualScroll = top
    },
  } : undefined
  if (!delayedLenis) app.window.__lenis = scroller
  const inputs = steps.map(value => ({
    value, get checked() { return checked === value }, set checked(valueChecked) {
      checkedWrites.push([value, valueChecked])
      if (valueChecked) checked = value
    },
  }))
  const screen = { scrollTop: 0, scrollTo(options) { reveals.push(options); this.scrollTop = options.top } }
  const panels = steps.map(demoPanel => ({ dataset: { demoPanel }, inert: false,
    querySelector: selector => selector === '[data-story-screen]' ? screen : { offsetTop: selector.includes('your-meals') ? 900 : 400 },
  }))
  let mountedPanels = panels
  const node = {
    contains: target => target === node || target === screen || inputs.includes(target) || mountedPanels.includes(target),
    getBoundingClientRect: () => ({ top: 1000 - app.window.scrollY, bottom: 1000 + scene.height + track.height - app.window.scrollY }),
    querySelectorAll: selector => selector === '[data-demo-panel]' ? mountedPanels : inputs,
    querySelector: selector => selector === '[data-demo-scene]' ? { getBoundingClientRect: () => scene }
      : selector === '[data-story-stage]' ? stage
      : selector === '[data-story-track]' ? track
      : mountedPanels.find(panel => selector.includes(`"${panel.dataset.demoPanel}"`)),
  }
  const snapshot = tree => allElements(tree).find(element => element.props?.['data-demo-panel'] === 'save').props.children.props
  app.mount(app.load('components/maitred/MaitredDemo.tsx').default, { copy: messages[locale].MaitredPage.demo, locale }, tree => {
    tree.props.ref.current = node
    const panelIds = allElements(tree).map(element => element.props?.['data-demo-panel'])
    mountedPanels = panels.filter(panel => panelIds.includes(panel.dataset.demoPanel))
  }, tree => {
    const { viewerDays: days, state, story } = snapshot(tree)
    history.push({ days, state, progress: story?.progress })
  })
  const radio = index => allElements(app.tree()).filter(element => element.type === 'input')[index]
  return { ...app, root: node, get panels() { return mountedPanels }, screen, scene, stage, track, reveals, pageScrolls, history, checkedWrites, checked: () => checked,
    listenerCount: () => app.listenerCount() + lenisListeners.size,
    installLenis() { app.window.__lenis = scroller },
    lenisEvent(name, event) { app.invoke(() => lenisListeners.get(name)?.(event)) },
    snapshot: () => snapshot(app.tree()),
    click(index) { checked = steps[index]; app.invoke(() => radio(index).props.onChange()) },
    reselect(keyboard = false) {
      const input = radio(steps.indexOf(checked))
      app.invoke(() => keyboard ? input.props.onKeyDown({ key: ' ', currentTarget: { checked: true } }) : input.props.onPointerDown({ currentTarget: { checked: true } }))
    },
    scroll(y, flush = true) {
      app.window.scrollY = y
      if (app.window.__lenis) {
        app.window.__lenis.actualScroll = y
        app.invoke(() => lenisListeners.get('scroll')?.())
      } else app.dispatch('scroll')
      if (flush) app.flushFrames()
    },
  }
}

for (const reducedMotion of [false, true]) test(`persistent phone scrubs every whole day and reverses, reduced motion ${reducedMotion}`, () => {
  const app = controller('en', reducedMotion)
  assert.equal(app.panels.length, 4)
  app.flushFrames()
  assert.equal(app.tree().props['data-motion-ready'], true)
  assert.equal(app.tree().props['data-lenis-prevent'], undefined, 'page scrolling keeps the existing sitewide smoothing')
  assert.deepEqual(app.panels.filter(panel => !panel.inert).map(panel => panel.dataset.demoPanel), ['save'])
  assert.deepEqual(allElements(app.tree()).filter(element => element.props?.['data-demo-panel']).map(element => element.props['data-demo-panel']), ['save'], 'hydration removes the three fallback phones')
  assert.ok(allElements(app.tree()).filter(element => element.type === 'input').every(input => input.props['aria-controls'] === 'test-maitred-demo-save-phone'))
  const phoneType = allElements(app.tree()).find(element => element.props?.['data-demo-panel'] === 'save').props.children.type
  const samples = [[600, 1], [930, 2], [1200, 2], [1300, 3], [1400, 4], [1500, 5], [1600, 6], [1700, 7], [1800, 8]]
  for (const [y, days] of [...samples, ...[...samples].reverse()]) {
    app.scroll(y)
    assert.equal(app.snapshot().viewerDays, days)
    assert.equal(app.snapshot().state, days < 2 ? 'regulars' : days < 8 ? 'qualify' : 'holder')
    assert.equal(app.tree().props['data-story-holder'], days === 8 || undefined)
    assert.equal(allElements(app.tree()).find(element => element.props?.['data-demo-panel'] === 'save').props.children.type, phoneType)
    assert.equal(app.snapshot().standings.props.days, days)
    assert.equal(app.snapshot().locked, true)
    assert.equal(app.checked(), app.snapshot().story.step, 'the active control follows the same story snapshot as the phone')
    assert.equal(app.frames(), 0, 'the current scroll frame must never schedule continuation')
    assert.equal(app.timers(), 0)
  }
  app.scroll(2400)
  assert.equal(app.snapshot().story.progress, 2.5, 'the editor keeps twice the scroll distance of each earning interval')
  assert.equal(app.checked(), 'share')
  assert.equal(app.snapshot().state, 'holder', 'selecting step four while typing does not publish')
  app.scroll(2796)
  assert.equal(app.snapshot().state, 'holder', 'publication begins only after progress2.83')
  app.scroll(2880)
  assert.equal(app.snapshot().state, 'order')
  app.scroll(3000)
  assert.equal(app.snapshot().story.editorOpen, 0)
  assert.equal(app.events.length, 0)
  assert.ok(app.reveals.every(call => call.behavior === 'instant'), 'camera is scrubbed even when normal motion is enabled')
  app.unmount()
  assert.equal(app.listenerCount(), 0)
})

test('all four pinned controls stay present and their highlight follows each chapter forward and backward', () => {
  const app = controller()
  app.flushFrames()
  const samples = [[600, 'save'], [929, 'save'], [930, 'qualify'], [1499, 'qualify'], [1500, 'lead'], [1895, 'lead'], [1896, 'share'], [2040, 'share'], [3000, 'share']]
  for (const [y, step] of [...samples, ...[...samples].reverse()]) {
    app.scroll(y)
    const stage = allElements(app.tree()).find(element => element.props?.['data-story-stage'] !== undefined)
    assert.deepEqual(allElements(stage).filter(element => element.type === 'input').map(input => input.props.value), ['save', 'qualify', 'lead', 'share'])
    assert.equal(app.checked(), step)
    assert.equal(app.snapshot().story.step, step)
    const mobileDescription = allElements(stage).find(element => element.props?.className === 'mobileDescription')
    const descriptions = allElements(mobileDescription).filter(element => element.type === 'p')
    assert.deepEqual(descriptions.map(element => element.props.children), messages.en.MaitredPage.demo.steps.map(candidate => candidate.body), 'all four descriptions remain in the layout to reserve the tallest height')
    assert.deepEqual(descriptions.filter(element => element.props['data-current']).map(element => element.props.children), [messages.en.MaitredPage.demo.steps.find(candidate => candidate.id === step).body])
    if (y === 2040) assert.equal(app.snapshot().state, 'holder', 'the sharing instruction follows the open editor before publication')
  }
  app.unmount()
})

test('scroll bursts share one frame, stopping freezes it and reversing revisits the identical snapshot', () => {
  const app = controller()
  app.flushFrames()
  app.scroll(1700, false)
  app.scroll(1750, false)
  app.dispatch('scroll')
  assert.equal(app.frames(), 1)
  app.flushFrames()
  const stopped = app.snapshot()
  assert.ok(Math.abs(stopped.story.dayProgress - 7.5) < 1e-9)
  assert.equal(stopped.viewerDays, 7)
  assert.equal(app.frames(), 0)
  const count = app.history.length
  for (let i = 0; i < 10; i++) app.flushFrames()
  assert.equal(app.snapshot(), stopped, 'elapsed frames without scrolling cannot move the scene')
  assert.equal(app.history.length, count)
  assert.equal(app.timers(), 0)
  app.scroll(3000)
  app.scroll(1750)
  assert.deepEqual({ ...app.snapshot().story }, { ...stopped.story })
  assert.deepEqual({ ...app.snapshot().standings.props }, { ...stopped.standings.props })
  app.unmount()
})

for (const lenis of [false, true]) test(`fast overshoots clamp to the first and final story, Lenis ${lenis}`, () => {
  const app = controller('en', false, 'save', { lenis })
  app.flushFrames()
  app.scroll(2040)
  assert.equal(app.snapshot().story.progress, 2.2)
  for (const [y, progress, step, state] of [[0, 0, 'save', 'regulars'], [5000, 3, 'share', 'order'], [0, 0, 'save', 'regulars']]) {
    app.scroll(y)
    assert.equal(app.snapshot().story.progress, progress)
    assert.equal(app.checked(), step)
    assert.equal(app.snapshot().state, state)
  }
  app.unmount()
})

for (const delayedLenis of [false, true]) test(`Lenis follows actual position in its own frame and unsubscribes, delayed setup ${delayedLenis}`, () => {
  const app = controller('en', false, 'save', { lenis: true, delayedLenis })
  if (delayedLenis) {
    assert.equal(app.window.__lenis, undefined, 'the demo effect can precede sitewide scroller setup')
    app.installLenis()
  }
  app.flushFrames()
  assert.equal(app.listenerCount(), 4, 'only resize, motion preference and the two Lenis subscriptions remain')
  app.window.scrollY = 1700
  app.dispatch('scroll')
  assert.equal(app.frames(), 0, 'native scroll events cannot schedule a second update behind Lenis')
  assert.equal(app.snapshot().story.progress, 0)
  app.scroll(1750, false)
  assert.equal(app.snapshot().viewerDays, 7, 'the Lenis event publishes without another animation frame')
  assert.equal(app.frames(), 0)
  const stopped = app.snapshot()
  for (let i = 0; i < 10; i++) app.flushFrames()
  assert.equal(app.snapshot(), stopped)
  app.scroll(2400, false)
  app.scroll(1750, false)
  assert.deepEqual({ ...app.snapshot().story }, { ...stopped.story })
  assert.equal(app.frames(), 0)
  app.unmount()
  assert.equal(app.listenerCount(), 0)
  const count = app.history.length
  app.scroll(3000)
  app.lenisEvent('virtual-scroll', { deltaY: -100, event: { type: 'wheel', target: app.root } })
  assert.equal(app.history.length, count)
  assert.equal(app.pageScrolls.length, 0, 'unmounted Lenis callbacks cannot change the page')
})

test('wheel reversal cancels only opposite Lenis momentum inside the story', () => {
  const app = controller('en', false, 'save', { lenis: true })
  app.flushFrames()
  app.scroll(1700, false)
  const scroller = app.window.__lenis
  for (const [pending, deltaY] of [[300, -40], [-300, 40]]) {
    scroller.targetScroll = scroller.actualScroll + pending
    app.lenisEvent('virtual-scroll', { deltaY, event: { type: 'wheel', ctrlKey: false, target: app.screen } })
    assert.deepEqual(app.pageScrolls.at(-1), { target: 'lenis', top: 1700, immediate: true, force: true })
    assert.equal(scroller.targetScroll, scroller.actualScroll, 'old momentum clears at the current page position')
    assert.equal(app.window.scrollY, 1700)
  }
  assert.equal(app.pageScrolls.length, 2)
  for (const { name, pending = 300, deltaY = -40, event = {} } of [
    { name: 'same downward direction', deltaY: 40 },
    { name: 'same upward direction', pending: -300 },
    { name: 'no outstanding momentum', pending: 0 },
    { name: 'zero wheel delta', deltaY: 0 },
    { name: 'touch event', event: { type: 'touchmove' } },
    { name: 'zoom gesture', event: { ctrlKey: true } },
    { name: 'outside the story', event: { target: {} } },
  ]) {
    scroller.targetScroll = scroller.actualScroll + pending
    app.lenisEvent('virtual-scroll', { deltaY, event: { type: 'wheel', ctrlKey: false, target: app.root, ...event } })
    assert.equal(app.pageScrolls.length, 2, name)
    assert.equal(scroller.targetScroll, scroller.actualScroll + pending, name)
  }
  assert.equal(app.frames(), 0)
  assert.equal(app.timers(), 0)
  app.unmount()
  assert.equal(app.listenerCount(), 0)
})

for (const lenis of [false, true]) test(`step clicks and keyboard selection follow smooth page travel, Lenis ${lenis}`, () => {
  const app = controller('en', false, 'save', { lenis })
  app.flushFrames()
  const destinations = [600, 1200, 1800, 3000]
  const steps = ['save', 'qualify', 'lead', 'share']
  const startProgress = 1 + 34 / 600
  for (let index = 0; index < 4; index++) {
    app.scroll(1234, false)
    if (lenis) app.dispatch('resize')
    assert.equal(app.frames(), 1)
    const writes = app.checkedWrites.length
    app.click(index)
    assert.deepEqual(app.checkedWrites.slice(writes), steps.map(step => [step, step === 'qualify']), 'reset every radio to actual page progress, including React tracking of automatic unchecking')
    assert.equal(app.frames(), 0, 'selection cancels stale pending position work')
    assert.equal(app.window.scrollY, 1234, 'requesting a destination does not jump the page')
    assert.ok(Math.abs(app.snapshot().story.progress - startProgress) < 1e-9)
    assert.equal(app.checked(), 'qualify', 'the highlight stays with actual movement rather than the requested destination')
    const { duration, easing, ...request } = app.pageScrolls.at(-1)
    assert.deepEqual(request, lenis
      ? { target: 'lenis', top: destinations[index], immediate: false, force: true, lerp: 0 }
      : { target: 'window', top: destinations[index], behavior: 'smooth' })
    if (lenis) {
      assert.equal(app.window.__lenis.targetScroll, destinations[index])
      assert.ok(Number.isFinite(duration) && duration >= 1.2)
      assert.deepEqual([0, .25, .5, .75, 1].map(easing), [0, .25, .5, .75, 1], 'readable pacing uses linear easing')
    }
    const waiting = app.snapshot()
    for (let frame = 0; frame < 5; frame++) app.flushFrames()
    assert.equal(app.snapshot(), waiting, 'the component cannot animate independently of actual page movement')
    app.scroll((1234 + destinations[index]) / 2)
    assert.ok(app.snapshot().story.progress > Math.min(startProgress, index) && app.snapshot().story.progress < Math.max(startProgress, index), 'forward and reverse travel pass through an intermediate story frame')
    assert.equal(app.checked(), app.snapshot().story.step)
    app.scroll(destinations[index])
    assert.equal(app.snapshot().story.progress, index)
    assert.equal(app.checked(), steps[index])
    assert.equal(app.timers(), 0)
  }
  app.scroll(1500)
  app.reselect(true)
  assert.equal(app.pageScrolls.at(-1).top, 1800, 'Space on the selected instruction requests its endpoint')
  assert.equal(app.window.scrollY, 1500)
  assert.equal(app.snapshot().story.progress, 1.5)
  app.scroll(1650)
  assert.equal(app.snapshot().story.progress, 1.75)
  app.reselect()
  assert.equal(app.pageScrolls.at(-1).top, 1800, 'pointer reselection shares the keyboard destination')
  assert.equal(app.window.scrollY, 1650)
  app.scroll(1800)
  assert.equal(app.snapshot().story.progress, 2)
  assert.equal(app.events.length, 4, 'reselecting with Space or pointer does not fabricate a selection event')
  assert.ok(app.events.every(event => Object.keys(event.payload).sort().join(',') === 'locale,location,step'))
  app.scroll(1750)
  assert.ok(app.snapshot().story.progress < 2, 'manual scrolling continues to drive the story after arrival')
  app.unmount()
})

for (const lenis of [false, true]) test(`selection can retarget an unfinished smooth journey in either direction, Lenis ${lenis}`, () => {
  const app = controller('en', false, 'save', { lenis })
  app.flushFrames()
  app.scroll(600)
  app.click(3)
  assert.equal(app.pageScrolls.at(-1).top, 3000)
  if (lenis) assert.equal(app.pageScrolls.at(-1).duration, 12)
  assert.equal(app.snapshot().story.progress, 0)
  app.scroll(1500, false)
  app.click(0)
  assert.equal(app.pageScrolls.at(-1).top, 600)
  if (lenis) assert.equal(app.pageScrolls.at(-1).duration, 3.75, 'retargeting times the journey from actual progress rather than the abandoned destination')
  assert.equal(app.window.scrollY, 1500)
  assert.equal(app.snapshot().story.progress, 1.5)
  assert.equal(app.checked(), 'lead')
  app.scroll(1200, false)
  app.click(2)
  assert.equal(app.pageScrolls.at(-1).top, 1800)
  if (lenis) {
    assert.equal(app.window.__lenis.targetScroll, 1800)
    assert.equal(app.pageScrolls.at(-1).duration, 2.5)
  }
  assert.equal(app.window.scrollY, 1200)
  assert.equal(app.snapshot().story.progress, 1)
  assert.equal(app.checked(), 'qualify')
  app.scroll(1500)
  assert.equal(app.snapshot().story.progress, 1.5)
  app.scroll(1800)
  assert.equal(app.snapshot().story.progress, 2)
  assert.equal(app.checked(), 'lead')
  assert.equal(app.frames(), 0)
  assert.equal(app.timers(), 0)
  app.unmount()
})

test('selection gives the full usual-order sequence seven seconds in either direction and scales partial travel', () => {
  const app = controller('en', false, 'save', { lenis: true })
  app.flushFrames()
  const destinations = [600, 1200, 1800, 3000]
  for (const [y, index, duration] of [
    [600, 1, 2.5], [1200, 2, 2.5], [1800, 3, 7],
    [3000, 2, 7], [1800, 1, 2.5], [1200, 0, 2.5],
    [600, 3, 12], [3000, 0, 12],
    [2400, 3, 3.5], [2400, 2, 3.5], [2400, 1, 6],
    [2940, 3, 1.2], [1170, 1, 1.2],
  ]) {
    app.scroll(y)
    const before = app.snapshot().story.progress
    app.click(index)
    const { easing, ...request } = app.pageScrolls.at(-1)
    assert.deepEqual(request, { target: 'lenis', top: destinations[index], immediate: false, force: true, duration, lerp: 0 })
    assert.deepEqual([0, .1, .5, .9, 1].map(easing), [0, .1, .5, .9, 1])
    assert.equal(app.window.scrollY, y)
    assert.equal(app.snapshot().story.progress, before, 'duration config never advances the story ahead of the page')
    assert.equal(app.frames(), 0)
    assert.equal(app.timers(), 0)
  }
  app.unmount()
})

for (const lenis of [false, true]) test(`reduced motion reaches each selected endpoint immediately, Lenis ${lenis}`, () => {
  const app = controller('en', true, 'save', { lenis })
  app.flushFrames()
  const destinations = [600, 1200, 1800, 3000]
  const steps = ['save', 'qualify', 'lead', 'share']
  for (const index of [0, 1, 2, 3, 2, 1, 0]) {
    app.scroll(1234, false)
    if (lenis) app.dispatch('resize')
    app.click(index)
    assert.equal(app.frames(), 0)
    assert.equal(app.window.scrollY, destinations[index])
    assert.equal(app.snapshot().story.progress, index)
    assert.equal(app.checked(), steps[index])
    assert.deepEqual(app.checkedWrites.slice(-4), steps.map((step, candidate) => [step, candidate === index]))
    const { duration, easing, ...request } = app.pageScrolls.at(-1)
    assert.deepEqual(request, lenis
      ? { target: 'lenis', top: destinations[index], immediate: true, force: true, lerp: 0 }
      : { target: 'window', top: destinations[index], behavior: 'instant' })
    if (lenis) {
      assert.ok(Number.isFinite(duration) && duration >= 1.2, 'immediate mode overrides the configured reading duration')
      assert.equal(easing(.5), .5)
    }
    app.scroll(destinations[index])
    assert.equal(app.snapshot().story.progress, index, 'the next scroll event retains the selected endpoint')
  }
  app.unmount()
})

test('responsive scroll geometry uses the sticky stage top and track height, independent of the phone position', () => {
  const app = controller('en', true)
  app.flushFrames()
  app.scroll(1200)
  assert.equal(app.snapshot().viewerDays, 2)
  app.window.innerHeight = 1400
  app.window.innerWidth = 390
  app.dispatch('resize')
  assert.equal(app.frames(), 1)
  app.flushFrames()
  assert.equal(app.snapshot().story.progress, 1, 'viewport changes alone do not move the pinned stage timeline')
  app.stage.top = 200
  app.track.height = 3200
  app.dispatch('resize')
  app.flushFrames()
  assert.equal(app.snapshot().story.progress, .5, 'resize reads the current CSS sticky inset and scroll distance')
  const mobileProgress = app.snapshot().story.progress
  app.scene.bottom = -5000
  app.dispatch('resize')
  app.flushFrames()
  assert.equal(app.snapshot().story.progress, mobileProgress)
  app.click(2)
  assert.equal(app.window.scrollY, 2400, 'the destination includes the new sticky inset and half the new track height')
  app.dispatch('scroll')
  app.flushFrames()
  assert.equal(app.snapshot().story.progress, 2)
  app.scroll(5000)
  assert.equal(app.snapshot().viewerDays, 8, 'scrolling beyond the section clamps to the completed story')
  assert.equal(app.snapshot().state, 'order')
  app.unmount()
})

test('camera follows position directly and reduced motion snaps without starting a clock', () => {
  const app = controller()
  app.flushFrames()
  app.scroll(1110) // Progress .85: half-way camera travel.
  assert.ok(Math.abs(app.reveals.at(-1).top - 474) < 1e-8)
  assert.equal(app.reveals.at(-1).behavior, 'instant')
  const snapshot = app.snapshot()
  app.reduce(true)
  assert.equal(app.snapshot().story.progress, snapshot.story.progress)
  assert.equal(app.snapshot().reducedMotion, true)
  assert.equal(app.reveals.at(-1).top, 176)
  assert.equal(app.frames(), 0)
  assert.equal(app.timers(), 0)
  app.reduce(false)
  assert.ok(Math.abs(app.reveals.at(-1).top - 474) < 1e-8)
  app.scroll(1750, false)
  assert.equal(app.frames(), 1)
  app.unmount()
  assert.equal(app.frames(), 0)
  assert.equal(app.listenerCount(), 0)
  const history = app.history.length
  app.dispatch('scroll')
  app.flushFrames()
  assert.equal(app.history.length, history)
  const beforeHydration = controller()
  assert.equal(beforeHydration.frames(), 1)
  beforeHydration.unmount()
  assert.equal(beforeHydration.frames(), 0)
})

test('hydration uses actual page position before, within and beyond the story instead of restored radio state', () => {
  for (const [initialY, restored, step, days, state] of [[0, 'share', 'save', 1, 'regulars'], [1200, 'share', 'qualify', 2, 'qualify'], [5000, 'save', 'share', 8, 'order']]) {
    const app = controller('en', false, restored, { initialY })
    app.flushFrames()
    assert.equal(app.snapshot().viewerDays, days)
    assert.equal(app.snapshot().state, state)
    assert.equal(app.checked(), step)
    app.unmount()
  }
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
    assert.ok(renderToStaticMarkup(history).includes(days === 1 ? 'once' : days === 2 ? 'twice' : `${days} times`))
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

for (const locale of ['en', 'id']) test(`${locale}: only the earning phone is locked and the second meal lands beside the prawns`, () => {
  const app = harness(locale)
  const Mockup = app.load('components/maitred/MaitredNativeMockup.tsx').default
  const { storyAtProgress } = app.load('components/maitred/maitred-story.ts')
  const frame = (progress, reducedMotion = false) => {
    const story = storyAtProgress(progress)
    const tree = Mockup({ locale, state: story.state, viewerDays: story.days, story, locked: true, reducedMotion })
    const elements = allElements(tree)
    const region = elements.find(element => element.props?.['data-story-screen'])
    assert.equal(region.props.tabIndex, undefined)
    assert.equal(region.props['data-lenis-prevent'], undefined, 'wheel/touch must continue to the page instead of an inner scroller')
    assert.ok(!region.props['aria-label'].includes('Scroll for restaurant details'))
    const history = elements.find(element => element.props?.['data-native-section'] === 'your-meals')
    const thumbnailComponent = allElements(history).find(element => element.props?.landing !== undefined)
    const images = allElements(thumbnailComponent.type(thumbnailComponent.props)).filter(element => element.props?.src)
    assert.equal(images.length, 2)
    assert.equal(images[0].props.alt, 'Harissa prawns')
    assert.equal(images[0].props.style, undefined, 'the existing prawn meal remains in place')
    assert.equal(images[1].props.alt, 'Carbonara and mushroom risotto')
    assert.equal(images[1].props['data-landing-meal'], true)
    return { history: renderToStaticMarkup(history), landing: { ...images[1].props.style }, hidden: images[1].props['aria-hidden'] }
  }
  const start = frame(0), halfway = frame(.3), landed = frame(.55)
  assert.equal(start.landing.opacity, 0)
  assert.equal(start.hidden, true)
  assert.ok(start.history.includes('once'))
  assert.ok(halfway.history.includes('once'))
  assert.notDeepEqual(halfway.landing, start.landing)
  assert.notDeepEqual(halfway.landing, landed.landing)
  assert.equal(landed.landing.opacity, 1)
  const landedTransform = landed.landing.transform.match(/-?\d+(?:\.\d+)?/g).map(Number)
  assert.deepEqual(landedTransform.slice(0, 3), [0, 0, 0])
  assert.ok(Math.abs(landedTransform[3] - 1) < 1e-9)
  assert.equal(landed.hidden, undefined)
  assert.ok(landed.history.includes('twice'))
  assert.deepEqual(frame(.3), halfway, 'revisiting a partial landing restores the exact frame')
  assert.deepEqual(frame(.3, true).landing, start.landing)
  assert.deepEqual(frame(.55, true).landing, landed.landing)
  const staticPhone = Mockup({ locale, state: 'order' })
  const staticRegion = allElements(staticPhone).find(element => element.props?.role === 'region')
  assert.equal(staticRegion.props.tabIndex, 0, 'the separate hero phone retains its existing scrolling')
  assert.equal(staticRegion.props['data-story-screen'], undefined)
})

for (const locale of ['en', 'id']) test(`${locale}: usual-order editor, private preview and published card consume one reversible timeline`, () => {
  const app = harness(locale)
  const Mockup = app.load('components/maitred/MaitredNativeMockup.tsx').default
  const { storyAtProgress } = app.load('components/maitred/maitred-story.ts')
  const { NATIVE_ORDER_COMPOSER_COPY } = app.load('components/maitred/composer-copy.ts')
  const copy = NATIVE_ORDER_COMPOSER_COPY[locale]
  const at = (progress, reducedMotion = false) => {
    const story = storyAtProgress(progress)
    const tree = Mockup({ locale, state: story.state, viewerDays: story.days, story, locked: true, reducedMotion })
    const elements = allElements(tree)
    const composer = elements.find(element => element.props?.typedText !== undefined && element.props?.openness !== undefined)
    const card = elements.find(element => element.props?.publication !== undefined && element.props?.stage !== undefined)
    return { story, composer: { ...composer.props }, html: renderToStaticMarkup(composer), card: { ...card.props } }
  }
  const opening = at(2.14)
  assert.ok(opening.composer.openness > 0 && opening.composer.openness < 1)
  assert.equal(opening.composer.typedText, '')
  assert.ok(opening.html.includes(copy.orderQuestion))
  const typing = at(2.37)
  assert.equal(typing.composer.typedText, 'Harissa')
  assert.equal(typing.composer.preview, false)
  assert.equal(typing.card.publication, 0)
  const preview = at(2.6)
  assert.equal(preview.composer.typedText, 'Harissa prawns')
  assert.equal(preview.composer.preview, true)
  assert.ok(preview.html.includes(copy.notPublished))
  assert.equal(preview.card.stage, 'holder')
  assert.equal(preview.card.publication, 0)
  const saving = at(2.74)
  assert.ok(saving.composer.publishProgress > 0 && saving.composer.publishProgress < 1)
  assert.ok(saving.html.includes(copy.saving))
  assert.equal(saving.card.stage, 'holder')
  const reveal = at(2.89)
  assert.ok(reveal.composer.openness > 0 && reveal.composer.openness < 1)
  assert.ok(reveal.card.publication > 0 && reveal.card.publication < 1)
  assert.equal(reveal.card.stage, 'order')
  const done = at(3)
  assert.equal(done.composer.openness, 0)
  assert.equal(done.card.publication, 1)
  assert.equal(done.card.tab, 'order')
  assert.deepEqual(at(2.37).composer, typing.composer)
  const reducedOpening = at(2.14, true)
  assert.ok([0, 1].includes(reducedOpening.composer.openness))
  assert.ok([0, 1].includes(at(2.89, true).card.publication))
  assert.equal(app.frames(), 0)
  assert.equal(app.timers(), 0)
})

test('standings retain four stable actors, native row heights and one crown at every endpoint', () => {
  const app = harness('en')
  const Standings = app.load('components/maitred/MaitredStandings.tsx').default
  const render = days => Standings({ locale: 'en', state: days < 8 ? 'qualify' : 'holder', days, dayProgress: days })
  const actorIds = tree => allElements(tree).filter(element => element.props?.['data-illustration-row']).map(element => element.key).sort()
  for (const days of [1, 2, 3, 4, 5, 6, 7, 8, 7, 1]) {
    const tree = render(days)
    const rows = allElements(tree).filter(element => element.props?.['data-illustration-row'])
    assert.deepEqual(actorIds(tree), ['alex', 'jamie', 'maya', 'sam'])
    assert.equal(rows.filter(row => !row.props['aria-hidden']).length, days < 4 ? 4 : 3)
    assert.equal(tree.props.style.height, days < 4 ? 184 : 140)
    const holder = rows.find(row => row.props['data-illustration-holder'])
    assert.equal(holder.props['data-illustration-row'], days === 8 ? 'alex' : 'jamie')
    assert.equal(holder.props.style.height, 52)
    assert.ok(rows.every(row => row.props.style.zIndex === (row.props['data-illustration-row'] === 'alex' ? 2 : 1)), 'the opaque viewer card passes above other profiles at a paused crossover')
    assert.equal(holder.props.style.transform, 'translateY(0px)')
    assert.ok(rows.filter(row => !row.props['data-illustration-holder']).every(row => row.props.style.height === 40))
    assert.equal(allElements(tree).filter(element => element.props?.['data-moving-crown']).length, 1)
    assert.equal((renderToStaticMarkup(tree).match(/<svg\b/g) ?? []).length, 1)
  }
  assert.equal(app.frames(), 0)
  assert.equal(app.timers(), 0)
})

test('fractional row and crown positions freeze and reverse exactly, while reduced motion snaps', () => {
  const app = harness('en')
  const Standings = app.load('components/maitred/MaitredStandings.tsx').default
  const visual = (value, reducedMotion = false) => {
    const days = Math.floor(value)
    const tree = Standings({ locale: 'en', state: days < 8 ? 'qualify' : 'holder', days, dayProgress: value, reducedMotion })
    return JSON.parse(JSON.stringify({
      height: tree.props.style.height,
      rows: allElements(tree).filter(element => element.props?.['data-illustration-row']).map(row => ({ id: row.props['data-illustration-row'], style: row.props.style })).sort((a, b) => a.id.localeCompare(b.id)),
      crown: allElements(tree).find(element => element.props?.['data-moving-crown']).props.style,
    }))
  }
  const seven = visual(7), midway = visual(7.5), eight = visual(8)
  assert.notDeepEqual(midway.rows, seven.rows)
  assert.notDeepEqual(midway.rows, eight.rows)
  assert.notDeepEqual(midway.crown, seven.crown, 'the crown is partway through its flight before the new title lands')
  assert.ok(midway.rows.filter(row => ['alex', 'jamie'].includes(row.id)).every(row => row.style.height === 46))
  const positions = [1, 2, 3.25, 3.5, 4, 4.5, 5, 7, 7.25, 7.5, 7.75, 8]
  const forward = positions.map(value => visual(value))
  assert.deepEqual([...positions].reverse().map(value => visual(value)).reverse(), forward)
  for (const position of [3.5, 4.5, 7.5]) {
    const paused = visual(position)
    visual(8)
    visual(1)
    assert.deepEqual(visual(position), paused)
    assert.deepEqual(visual(position, true), visual(Math.floor(position), true))
  }
  assert.equal(app.frames(), 0)
  assert.equal(app.timers(), 0)
})
