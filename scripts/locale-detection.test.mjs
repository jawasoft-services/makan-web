// Devon, 28 Nov 2026: "the website should be in whatever language the persons system is on, british people in
// indonesia should be shown english not indonesian". The browser's language decides; only an explicit pick in a
// language switcher (MAKAN_LANG) is remembered; a visit never sets a cookie; the old NEXT_LOCALE cookie no longer
// counts. No geo or IP. next-intl's middleware cannot load in plain Node (the test lane stands it in), so this checks
// our code here, and scripts/check-locale-detection.mjs checks the whole chain against a running server.
import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { lane } from './share-v2-test-lane.mjs'

const require = createRequire(import.meta.url)
const { NextRequest } = require('next/server')
const run = lane({ env: {} })
const { proxy, withLanguagePick } = run.load('proxy.ts')

const request = (path, headers = {}) => new NextRequest(`https://www.makanofficial.com${path}`, { headers: { host: 'www.makanofficial.com', 'sec-fetch-dest': 'document', ...headers } })

test('next-intl no longer reads or writes a locale cookie: Accept-Language decides', () => {
  const source = readFileSync('i18n/routing.ts', 'utf8')
  assert.match(source, /localeDetection: true/)
  assert.match(source, /localeCookie: false/)
  assert.doesNotMatch(source, /NEXT_LOCALE"/)
})

test('an explicit pick (MAKAN_LANG) stands in for the browser language; nothing else does', () => {
  const lang = r => r.headers.get('accept-language')
  assert.equal(lang(withLanguagePick(request('/', { 'accept-language': 'en-GB', cookie: 'MAKAN_LANG=id' }))), 'id')
  assert.equal(lang(withLanguagePick(request('/', { 'accept-language': 'id-ID', cookie: 'MAKAN_LANG=en' }))), 'en')
  assert.equal(lang(withLanguagePick(request('/', { 'accept-language': 'en-GB', cookie: 'NEXT_LOCALE=id' }))), 'en-GB', 'the old cookie does not count')
  assert.equal(lang(withLanguagePick(request('/', { 'accept-language': 'en-GB', cookie: 'MAKAN_LANG=fr' }))), 'en-GB', 'an unknown value is ignored')
  assert.equal(lang(withLanguagePick(request('/', { 'accept-language': 'en-GB,en;q=0.9,id;q=0.8' }))), 'en-GB,en;q=0.9,id;q=0.8', 'no pick: untouched')
})

test('no visit sets a language cookie, including an untranslated /id address', () => {
  for (const [path, headers] of [['/', { 'accept-language': 'en-GB' }], ['/', { 'accept-language': 'id-ID' }], ['/id', { 'accept-language': 'en-GB' }], ['/id/partner', {}], ['/id/blog', { 'accept-language': 'id-ID' }], ['/', { cookie: 'NEXT_LOCALE=id' }]]) {
    assert.equal(proxy(request(path, headers)).headers.get('set-cookie'), null, path)
  }
  const untranslated = proxy(request('/id/blog', { 'accept-language': 'en-GB' }))
  assert.equal(untranslated.status, 307); assert.equal(new URL(untranslated.headers.get('location')).pathname, '/blog')
})

test('the language switchers are the only writers of MAKAN_LANG, and nothing writes NEXT_LOCALE', () => {
  for (const file of ['components/LanguageSwitcher.tsx', 'components/site/LocaleLink.tsx']) assert.match(readFileSync(file, 'utf8'), /document\.cookie = `\$\{LANG_COOKIE\}=/, file)
  for (const file of ['proxy.ts', 'i18n/routing.ts', 'components/LanguageSwitcher.tsx', 'components/site/LocaleLink.tsx']) assert.doesNotMatch(readFileSync(file, 'utf8'), /NEXT_LOCALE=|cookies\.set\("NEXT_LOCALE"/, file)
})
