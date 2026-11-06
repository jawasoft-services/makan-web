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
function harness(locale) {
  const events = []
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
    react: { ...React, useId: () => 'test-maitred-demo' },
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
    runInNewContext(output, { exports, URL, require: name => {
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
  return { events, load }
}

function allElements(node) {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap(allElements)
  return [node, ...allElements(node.props?.children)]
}

for (const locale of ['en', 'id']) {
  test(`${locale}: phone reproduces source states without fabricated standings or app controls`, () => {
    const app = harness(locale)
    const Mockup = app.load('components/maitred/MaitredNativeMockup.tsx').default
    const copy = app.load('components/maitred/native-copy.ts').NATIVE_MAITRED_COPY[locale]
    for (const state of ['regulars', 'holder', 'order']) {
      const tree = Mockup({ locale, state })
      const html = renderToStaticMarkup(tree)
      assert.equal(tree.props['aria-hidden'], 'true', 'educational controls outside the illustration provide the accessible explanation')
      assert.ok(html.includes('data-native-viewport="390x844"'))
      assert.ok(html.includes('data-native-mockup="18d991a75"'))
      assert.ok(html.includes(copy.regularsTab))
      assert.ok(html.includes(copy.orderTab))
      assert.ok(html.includes(copy.countingWindow))
      assert.equal(html.includes('[Harissa prawns]'), state !== 'holder', 'a new holder has no published dish; illustrative dish stays bracketed and untranslated')
      assert.equal((html.match(/>—</g) || []).length, 2, 'unavailable rank and days use the native missing-data rendering')
      assert.equal((html.match(/class="regularRow/g) || []).length, 1, 'do not invent rival identities or counts')
      assert.ok(!/<(?:button|input|a)\b/.test(html), 'scaled illustration must not contain unusable tiny interactive controls')
      assert.ok(html.includes('M4 7 L11 12 L17 3 L23 12 L31 6 L28 21 Q17 24 7 21 Z'))
      assert.ok(html.includes('\uf399'), 'information icon uses the app Ionicons glyph')
      if (state === 'regulars') assert.ok(!html.includes(copy.editMenu))
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
      assert.ok(panels.some(panel => panel.props['data-demo-panel'] === input.props.value))
      input.props.onChange()
    }
    for (const step of copy.steps) assert.ok(html.includes(step.body), 'no-JS readers retain every earning rule')
    assert.ok(html.includes(copy.legend))
    assert.ok(html.includes('Kendal Street Kitchen · @ridorichard'))
    assert.equal(copy.dish, messages.en.MaitredPage.demo.dish, 'the sourced dish name is not silently translated')
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
      return { question: summary.props.children[0], answer: answer.props.children }
    }), messages[locale].MaitredPage.faqs, 'all seven source questions and answers stay unchanged')
    for (const id of ['how-it-is-earned', 'questions', 'download']) assert.ok(html.includes(`id="${id}"`))
    const prefix = locale === 'id' ? '/id' : ''
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
