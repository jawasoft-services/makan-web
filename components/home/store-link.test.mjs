import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import { test } from 'node:test'
import ts from 'typescript'
import * as jsx from 'react/jsx-runtime'

test('both stores track once with only location and locale and preserve the caller action', () => {
  const events = []
  const clicks = []
  const exports = {}
  const code = ts.transpileModule(readFileSync('components/home/StoreLink.tsx', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  runInNewContext(code, { exports, require(id) {
    if (id === 'react/jsx-runtime') return jsx
    if (id === 'next-intl') return { useLocale: () => 'id', useTranslations: () => key => key }
    if (id === 'next/image') return { default: 'img' }
    if (id === '@/lib/website-analytics') return { track: (...args) => events.push(args) }
    if (id === '@/lib/links') return { APP_STORE_URL: 'https://apps.apple.com/app/id6756131450', GOOGLE_PLAY_URL: 'https://play.google.com/store/apps/details?id=com.makanofficial.makanapp' }
    throw new Error(`Unexpected import: ${id}`)
  } })
  const buttons = exports.default({ location: 'maitred-page', children: 'Get Makan', onStoreClick: event => clicks.push(event) }).props.children
  assert.match(buttons[0].props.href, /^https:\/\/apps\.apple\.com\//)
  assert.match(buttons[1].props.href, /^https:\/\/play\.google\.com\//)
  buttons.forEach((button, index) => button.props.onClick(index))
  assert.deepEqual(JSON.parse(JSON.stringify(events)), [
    ['App Store CTA Clicked', { location: 'maitred-page', locale: 'id' }],
    ['Google Play CTA Clicked', { location: 'maitred-page', locale: 'id' }],
  ])
  assert.deepEqual(clicks, [0, 1])
})
