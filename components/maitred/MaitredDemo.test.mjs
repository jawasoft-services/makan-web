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
  const effects = []
  const scheduled = new Map()
  const frames = new Map()
  const listeners = new Map()
  let timerId = 0
  const browserWindow = {
    scrollY: 0, innerHeight: 1000, innerWidth: 1440,
    matchMedia: () => ({ matches: reducedMotion }),
    setTimeout: callback => { scheduled.set(++timerId, callback); return timerId },
    clearTimeout: id => scheduled.delete(id),
    requestAnimationFrame: callback => { frames.set(++timerId, callback); return timerId },
    cancelAnimationFrame: id => frames.delete(id),
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: name => listeners.delete(name),
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
    react: { ...React, useId: () => 'test-maitred-demo', useRef: current => ({ current }), useEffect: effect => effects.push(effect), useCallback: callback => callback },
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
  return { events, effects, load, window: browserWindow,
    dispatch: (name, event = {}) => listeners.get(name)?.(event),
    frames: () => frames.size,
    flushFrames: () => { for (const [id, callback] of frames) { frames.delete(id); callback() } },
    pending: () => scheduled.size,
    flush: () => { for (const [id, callback] of scheduled) { scheduled.delete(id); callback() } } }
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

for (const reducedMotion of [false, true]) test(`earning controls reveal their native content, reduced motion ${reducedMotion}`, () => {
  const app = harness('en', reducedMotion)
  const tree = app.load('components/maitred/MaitredDemo.tsx').default({ copy: messages.en.MaitredPage.demo, locale: 'en' })
  const calls = []
  const sections = []
  const screens = Object.fromEntries(['save', 'qualify', 'lead', 'share'].map(step => [step, {
    scrollTop: 0,
    scrollTo(options) { calls.push({ panel: `[data-demo-panel="${step}"]`, ...options }); this.scrollTop = options.top },
  }]))
  const panelNodes = ['save', 'qualify', 'lead', 'share'].map(step => ({ dataset: { demoPanel: step }, inert: false }))
  tree.props.ref.current = {
    dataset: {},
    getBoundingClientRect: () => ({ top: 1000, bottom: 2000 }),
    querySelectorAll: () => panelNodes,
    querySelector(panel) {
      if (panel === 'input:checked') return { value: 'save' }
      const step = panel.match(/data-demo-panel="([^"]+)"/)[1]
      if (panel.endsWith(' [role="region"]')) return screens[step]
      return { querySelector(selector) {
        if (selector === '[role="region"]') return screens[step]
        sections.push(selector)
        return { offsetTop: selector.includes('your-meals') ? 900 : 400 }
      } }
    },
  }
  const cleanups = app.effects.map(effect => effect())
  assert.deepEqual(panelNodes.filter(panel => !panel.inert).map(panel => panel.dataset.demoPanel), ['save'])
  assert.equal(calls[0].panel, '[data-demo-panel="save"]')
  assert.equal(calls[0].top, 772, 'initial save step exposes the personal meal history')
  assert.equal(calls[0].behavior, 'instant')
  const inputs = allElements(tree).filter(element => element.type === 'input')
  let previous = 'save'
  for (const input of inputs) {
    screens[previous].scrollTop = 453.5
    const start = calls.length
    input.props.onChange()
    assert.deepEqual(panelNodes.filter(panel => !panel.inert).map(panel => panel.dataset.demoPanel), [input.props.value], 'only the active panel is focusable during the crossfade')
    assert.equal(calls[start].panel, `[data-demo-panel="${previous}"]`)
    assert.equal(calls[start].top, 453.5, 'stop the previous animation at its current position')
    assert.equal(calls[start + 1].panel, `[data-demo-panel="${input.props.value}"]`)
    assert.equal(calls[start + 1].top, 453.5, 'the next panel starts at precisely the same scroll position')
    assert.equal(app.pending(), reducedMotion ? 0 : 1)
    app.flush()
    assert.equal(calls.at(-1).top, input.props.value === 'save' ? 772 : 176)
    assert.equal(calls.at(-1).behavior, reducedMotion ? 'instant' : 'smooth')
    previous = input.props.value
  }
  assert.deepEqual(sections.slice(1), ['your-meals', 'maitred', 'maitred', 'maitred'].map(section => `[data-native-section="${section}"]`))
  const save = allElements(tree).find(element => element.type === 'input')
  const beforeRestore = calls.length
  save.props.onPointerDown({ currentTarget: { checked: false } })
  assert.equal(calls.length, beforeRestore, 'an unselected pointer waits for the native change event')
  save.props.onPointerDown({ currentTarget: { checked: true } })
  save.props.onKeyDown({ key: ' ', currentTarget: { checked: true } })
  assert.equal(calls.length, beforeRestore + 2, 'reselecting the active step restores its focus after manual phone scrolling')
  assert.ok(calls.slice(-2).every(call => call.panel === '[data-demo-panel="save"]' && call.top === 772))
  if (!reducedMotion) {
    inputs[1].props.onChange()
    inputs[2].props.onChange()
    inputs[3].props.onChange()
    assert.equal(app.pending(), 1, 'rapid changes retain only the latest destination')
    const beforeFlush = calls.length
    app.flush()
    assert.equal(calls.length, beforeFlush + 1)
    assert.equal(calls.at(-1).panel, '[data-demo-panel="share"]')
    const panels = allElements(tree).find(element => element.props?.className === 'panels')
    for (const handler of ['onWheel', 'onTouchStart', 'onKeyDown']) {
      inputs[1].props.onChange()
      panels.props[handler]()
      assert.equal(app.pending(), 0, 'manual phone navigation cancels the delayed automatic scroll')
    }
    inputs[1].props.onChange()
    cleanups.forEach(cleanup => cleanup?.())
    assert.equal(app.pending(), 0, 'unmount cancels delayed movement')
  }
})

test('hydration positions a restored selection instead of the hidden default panel', () => {
  const app = harness('en')
  const tree = app.load('components/maitred/MaitredDemo.tsx').default({ copy: messages.en.MaitredPage.demo, locale: 'en' })
  let revealed
  tree.props.ref.current = { dataset: {}, querySelectorAll: () => [], querySelector(selector) {
    if (selector === 'input:checked') return { value: 'lead' }
    revealed = selector
    return { querySelector: () => null }
  } }
  app.effects.forEach(effect => effect())
  assert.equal(revealed, '[data-demo-panel="lead"]')
})

test('page scrolling selects the nearest story step without changing focus or emitting click analytics', () => {
  const app = harness('en')
  const tree = app.load('components/maitred/MaitredDemo.tsx').default({ copy: messages.en.MaitredPage.demo, locale: 'en' })
  const steps = ['save', 'qualify', 'lead', 'share']
  let checked = 'save'
  const inputs = steps.map((value, index) => ({ value,
    get checked() { return checked === value },
    set checked(next) { if (next) checked = value },
    closest: () => ({ getBoundingClientRect: () => ({ top: 1050 + index * 160 - app.window.scrollY, height: 100 }) }),
  }))
  const screens = steps.map(() => ({ scrollTop: 0, scrollTo({ top }) { this.scrollTop = top } }))
  const panels = steps.map((step, index) => ({ dataset: { demoPanel: step }, inert: false,
    querySelector: selector => selector === '[role="region"]' ? screens[index] : { offsetTop: 400 },
  }))
  tree.props.ref.current = { dataset: {},
    getBoundingClientRect: () => ({ top: 1000 - app.window.scrollY, bottom: 1800 - app.window.scrollY }),
    querySelectorAll: selector => selector === '[data-demo-panel]' ? panels : inputs,
    querySelector(selector) {
      if (selector === 'input:checked') return inputs.find(input => input.checked)
      if (selector === '[data-demo-scene]') return { getBoundingClientRect: () => ({ bottom: 620 }) }
      const index = steps.indexOf(selector.match(/data-demo-panel="([^"]+)"/)[1])
      return selector.endsWith(' [role="region"]') ? screens[index] : panels[index]
    },
  }
  const cleanups = app.effects.map(effect => effect())
  const scroll = y => { app.window.scrollY = y; app.dispatch('scroll'); app.flushFrames() }
  scroll(300)
  assert.equal(checked, 'save', 'scrolling before the story leaves it alone')
  for (const [index, step] of steps.entries()) {
    scroll(600 + index * 160)
    assert.equal(checked, step)
    assert.deepEqual(panels.filter(panel => !panel.inert).map(panel => panel.dataset.demoPanel), [step])
  }
  scroll(760)
  assert.equal(checked, 'qualify', 'scrolling back reverses the story')
  const radio = allElements(tree).find(element => element.type === 'input' && element.props.value === 'share')
  checked = 'share'
  radio.props.onChange()
  app.dispatch('scroll')
  app.flushFrames()
  assert.equal(checked, 'share', 'an explicit click stays selected until the page actually moves')
  assert.equal(app.events.length, 1, 'only the explicit click sends analytics')
  scroll(761)
  assert.equal(checked, 'share', 'a tiny scroll cannot undo the click until the next story boundary')
  scroll(920)
  assert.equal(checked, 'lead')
  app.window.innerWidth = 390
  scroll(450)
  assert.equal(checked, 'qualify', 'mobile follows the reading area below the sticky phone')
  app.window.innerWidth = 1440
  scroll(2000)
  assert.equal(checked, 'qualify', 'scrolling after the story leaves the completed selection alone')
  app.window.scrollY = 800
  app.dispatch('scroll')
  app.window.scrollY = 810
  app.dispatch('scroll')
  assert.equal(app.frames(), 1, 'scroll events share one pending animation frame')
  cleanups.forEach(cleanup => cleanup?.())
  assert.equal(app.frames(), 0)
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
