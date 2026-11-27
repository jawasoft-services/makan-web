import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { lane } from './share-v2-test-lane.mjs'

// RM20616 O1 — the page behind the approval text's link, makanofficial.com/d/{code} (boards own-n1 to own-n7,
// option B). Runs the real proxy, page, cards and callable client against a fake fetch that records every call.
// No test reaches the network or a Firebase project.
const require = createRequire(import.meta.url)
const realReact = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { NextRequest } = require('next/server')

const BASE = '8d3035dac01391b51b06f99e4e38eeea5bc55382'
const atBase = path => {
  try { return execFileSync('git', ['show', `${BASE}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch { return null }
}
const baseAvailable = atBase('proxy.ts') !== null

const CODE = 'k7m2qx9p'
const ON = { NOTICE_LINK_PAGE: '1' }
const PLACE = 'Warung Nasi Bu Komang'
const EN = JSON.parse(readFileSync('messages/en.json', 'utf8')).SharePages.noticeLink
const ID = JSON.parse(readFileSync('messages/id.json', 'utf8')).SharePages.noticeLink
const words = locale => (locale === 'id' ? ID : EN)
const PROD_RESOLVE = 'https://us-central1-munchies-expo.cloudfunctions.net/resolveNoticeLink'
const PROD_REPORT = 'https://us-central1-munchies-expo.cloudfunctions.net/reportNoticeLink'
const DEV_RESOLVE = 'https://us-central1-makan-devel.cloudfunctions.net/resolveNoticeLink'

// ---------- the approved words (boards own-n1 to own-n7 and DECISIONS.md, 24 Nov 2026) ----------

test('the page uses the approved words only, in English and Bahasa', () => {
  assert.deepEqual(EN, {
    claimedTitle: '{place} was claimed on Makan',
    tellUs: 'Not right? Tell us',
    whatsWrong: 'What’s wrong?',
    looksAtIt: 'Makan looks at it before anything changes. {place} isn’t told who asked.',
    reasonOwner: 'I own this restaurant',
    reasonStaff: 'I work here and we didn’t claim it',
    reasonOther: 'Something else',
    anythingElse: 'ANYTHING ELSE (OPTIONAL)',
    send: 'Send',
    gotIt: 'We’ve got it',
    willLook: 'Makan will look at it within 2 working days and contact you on the restaurant’s phone.',
    doesNotWork: 'This link doesn’t work',
    contactSupport: 'Contact support',
    nobodyRuns: 'Nobody will run this page on Makan until someone claims it again.',
    ownThisPlace: 'Own this place? Claim it',
    networkError: 'Network error. Please check your connection and try again.',
    tooMany: 'Too many attempts. Please wait a moment and try again.',
  })
  assert.deepEqual(ID, {
    claimedTitle: '{place} telah diklaim di Makan',
    tellUs: 'Tidak benar? Beri tahu kami',
    whatsWrong: 'Apa yang salah?',
    looksAtIt: 'Makan memeriksanya sebelum ada yang berubah. {place} tidak diberi tahu siapa yang meminta.',
    reasonOwner: 'Aku pemilik restoran ini',
    reasonStaff: 'Aku kerja di sini dan kami tidak mengklaimnya',
    reasonOther: 'Yang lain',
    anythingElse: 'LAINNYA (OPSIONAL)',
    send: 'Kirim',
    gotIt: 'Sudah kami terima',
    willLook: 'Makan akan memeriksanya dalam 2 hari kerja dan menghubungimu lewat nomor telepon restoran.',
    doesNotWork: 'Tautan ini tidak berfungsi',
    contactSupport: 'Hubungi dukungan',
    nobodyRuns: 'Tidak ada yang mengelola halaman ini di Makan sampai ada yang mengklaimnya lagi.',
    ownThisPlace: 'Pemilik tempat ini? Klaim',
    networkError: 'Terjadi masalah jaringan. Periksa koneksimu lalu coba lagi.',
    tooMany: 'Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi.',
  })
})

// ---------- the proxy ----------

function ask(path, { env = ON, headers = {} } = {}, source = () => null) {
  const proxy = lane({ env, source }).load('proxy.ts').proxy
  const response = proxy(new NextRequest(`https://www.makanofficial.com${path}`, { headers: { host: 'www.makanofficial.com', 'x-forwarded-for': '192.0.2.10', ...headers } }))
  return {
    status: response.status, location: response.headers.get('location'), rewrite: response.headers.get('x-middleware-rewrite'),
    intl: response.headers.get('x-test-intl'), locale: response.headers.get('x-middleware-request-x-next-intl-locale'),
    cache: response.headers.get('cache-control'), referrer: response.headers.get('referrer-policy'), robots: response.headers.get('x-robots-tag'),
    // The expiry is a clock reading; two calls a second apart differ only there.
    cookie: response.headers.get('set-cookie')?.replace(/Expires=[^;]+/, 'Expires=…') ?? null,
  }
}
const rewritten = answer => (answer.rewrite ? new URL(answer.rewrite).pathname : null)
function assertNoticeHeaders(answer, label) {
  assert.match(answer.cache ?? '', /no-store/, label)
  assert.equal(answer.referrer, 'no-referrer', label)
  assert.match(answer.robots ?? '', /noindex/, label)
}

test('switch on: /d/{code} is served by the internal page in its language, with no-store, no-referrer and noindex', () => {
  for (const [path, locale, headers] of [
    [`/d/${CODE}`, 'en', {}],
    [`/d/${CODE}/`, 'en', {}],
    [`/en/d/${CODE}`, 'en', { 'accept-language': 'id-ID,id;q=0.9' }],
    [`/id/d/${CODE}`, 'id', {}],
    [`/id/d/${CODE}`, 'id', { cookie: 'NEXT_LOCALE=en' }],
    // The unprefixed link (the one in the text) follows the site's locale rules: the visitor's saved choice, then the browser's language.
    [`/d/${CODE}`, 'id', { 'accept-language': 'id-ID,id;q=0.9,en;q=0.8' }],
    [`/d/${CODE}`, 'id', { 'accept-language': 'in' }],
    [`/d/${CODE}`, 'en', { 'accept-language': 'en-GB,id;q=0.5' }],
    [`/d/${CODE}`, 'en', { 'accept-language': 'id;q=0.3,en;q=0.9' }],
    [`/d/${CODE}`, 'en', { 'accept-language': 'fr-FR' }],
    [`/d/${CODE}`, 'id', { cookie: 'NEXT_LOCALE=id', 'accept-language': 'en' }],
    [`/d/${CODE}`, 'en', { cookie: 'NEXT_LOCALE=en', 'accept-language': 'id' }],
  ]) {
    const answer = ask(path, { headers })
    const label = `${path} ${JSON.stringify(headers)}`
    assert.equal(answer.status, 200, label)
    assert.equal(answer.location, null, label)
    assert.equal(rewritten(answer), `/notice-link/${locale}/${CODE}`, label)
    assert.equal(new URL(answer.rewrite).search, '', label)
    assert.equal(answer.locale, locale, label)
    assert.equal(answer.cookie, null, label)
    assertNoticeHeaders(answer, label)
  }
  // A code typed in capitals is the same code: the alphabet is lower-case only, so nothing is ambiguous.
  assert.equal(rewritten(ask(`/d/${CODE.toUpperCase()}`)), `/notice-link/en/${CODE}`)
  // The query never travels into the page.
  assert.equal(new URL(ask(`/d/${CODE}?utm_source=sms`).rewrite).search, '')
})

test('switch on: a malformed code is answered by the page as a link that does not work, never passed on as typed', () => {
  for (const path of ['/d/abc', '/d/k7m2qx9', '/d/k7m2qx9pp', '/d/k7m2qx0p', '/d/k7m2qxop', '/d/k7m2qx1p', '/d/k7m2qxlp', '/d/k7m2qxip',
    '/d/k7m2-x9p', `/d/${CODE}%2Fx`, `/id/d/${'a'.repeat(300)}`, '/d/k7m2qx9%70']) {
    const answer = ask(path)
    const target = rewritten(answer)
    assert.match(target ?? '', /^\/notice-link\/(en|id)\/-$/, path)
    assertNoticeHeaders(answer, path)
  }
  // An address that cannot be decoded gets the site's not-found page (the share pages' guard answers it first).
  assert.match(rewritten(ask('/d/%ZZ')) ?? '', /-unknown$/)
  // Not this route's address: left to the site.
  for (const path of ['/d', '/d/', `/d/${CODE}/x`, `/dx/${CODE}`, `/places/d/${CODE}`]) {
    assert.doesNotMatch(String(ask(path).rewrite), /notice-link/, path)
  }
})

test('the internal address is never public, with the switch on or off: it gets what an unknown page gets', () => {
  for (const env of [ON, {}]) {
    for (const path of [`/notice-link/en/${CODE}`, `/notice-link/id/${CODE}`, '/notice-link', `/id/notice-link/en/${CODE}`, `/NOTICE-LINK/en/${CODE}`,
      `/notice%2Dlink/en/${CODE}`, `//notice-link//en/${CODE}`, `/en/notice-link/en/${CODE}`, `/x/%2e%2e/notice-link/en/${CODE}`]) {
      const answer = ask(path, { env })
      assert.equal(rewritten(answer), '/en/notice-link-unknown', `${path} ${JSON.stringify(env)}`)
      assert.equal(new URL(answer.rewrite).search, '')
      assertNoticeHeaders(answer, path)
    }
    // One that cannot be decoded: the share pages' guard answers it first, with the same not-found page.
    assert.match(rewritten(ask('/notice-link/%E0%A4%A', { env })) ?? '', /-unknown$/)
  }
})

const PATHS = ['/', '/id', '/en', '/support', '/id/support', '/app', '/id/app', '/places', '/claim/x', '/verified', '/auth/action',
  `/d/${CODE}`, `/id/d/${CODE}`, `/en/d/${CODE}`, '/d/abc', '/d', `/d/${CODE}/x`, `/d/${CODE.toUpperCase()}`]

test('switch off: the proxy sends every address exactly where main\'s proxy sent it (the site\'s not-found page for /d/)', { skip: !baseAvailable && `commit ${BASE} is not in this clone` }, () => {
  const main = path => ask(path, { env: {}, headers: { 'accept-language': 'id' } }, file => (file === 'proxy.ts' ? atBase('proxy.ts') : null))
  for (const env of [{}, { NOTICE_LINK_PAGE: '' }, { NOTICE_LINK_PAGE: '0' }, { NOTICE_LINK_PAGE: 'true' }, { NOTICE_LINK_PAGE: 'on' }]) {
    for (const path of PATHS) assert.deepEqual(ask(path, { env, headers: { 'accept-language': 'id' } }), main(path), `${path} ${JSON.stringify(env)}`)
  }
  // And with the switch on, every other address still goes where it went.
  for (const path of PATHS.filter(path => !/^\/(?:(?:en|id)\/)?d\/[^/]+\/?$/.test(path))) assert.deepEqual(ask(path), main(path), `on: ${path}`)
})

// ---------- a loader for the page, its cards and the client ----------

/** Loads a repository module as the app would, with `env` as process.env, a fake fetch, and every console call recorded. */
function moduleLane({ env = ON, answers = {} } = {}) {
  const modules = new Map(), logs = [], calls = []
  const fetch = async (url, init) => {
    calls.push({ url, init, body: JSON.parse(init.body) })
    const name = url.slice(url.lastIndexOf('/') + 1)
    const answer = answers[name]
    if (!answer) throw new Error(`unexpected call ${name}`)
    return answer(JSON.parse(init.body).data)
  }
  const loggers = Object.fromEntries(['log', 'info', 'warn', 'error', 'debug', 'trace'].map(level => [level, (...args) => logs.push(args.map(String).join(' '))]))
  function load(relative) {
    if (modules.has(relative)) return modules.get(relative)
    const exports = {}; modules.set(relative, exports)
    const code = ts.transpileModule(readFileSync(resolve(relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
    const importModule = id => {
      if (id === 'server-only') return {}
      if (id === 'react') return realReact
      if (id === 'react/jsx-runtime') return require(id)
      if (id === 'next/navigation') return { notFound: () => { throw new Error('NOT_FOUND') }, redirect: url => { throw new Error(`REDIRECT:${url}`) } }
      if (id === 'next/server') return require(id)
      if (id === 'next-intl') return { hasLocale: (locales, value) => locales.includes(value) }
      if (id === 'next-intl/server') return { getTranslations: async ({ locale, namespace }) => {
        const strings = namespace.split('.').reduce((part, key) => part[key], JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')))
        const t = key => strings[key]; t.raw = key => { assert.ok(key in strings, `missing ${key}`); return strings[key] }; return t
      } }
      if (id === 'next/font/local') return { default: () => ({ variable: 'font' }) }
      if (id === '@/i18n/routing') return { routing: { locales: ['en', 'id'], defaultLocale: 'en' } }
      if (id.endsWith('.css')) return { default: new Proxy({}, { get: (_, key) => key }) }
      if (id.startsWith('@/') || id.startsWith('.')) {
        const base = id.startsWith('@/') ? id.slice(2) : resolve(dirname(relative), id).replace(`${process.cwd()}/`, '')
        for (const file of [`${base}.ts`, `${base}.tsx`, base]) { try { readFileSync(file); return load(file) } catch (error) { if (error.code !== 'ENOENT' && error.code !== 'EISDIR') throw error } }
      }
      throw new Error(`unexpected import ${id} from ${relative}`)
    }
    new Function('exports', 'require', 'fetch', 'console', 'process', code)(exports, importModule, fetch, loggers, { env, cwd: () => process.cwd() })
    return exports
  }
  return { load, logs, calls, fetch, env }
}

const PAGE = 'app/notice-link/[locale]/[code]/page.tsx'
const LAYOUT = 'app/notice-link/[locale]/layout.tsx'
const CARD = 'app/notice-link/[locale]/NoticeCard.tsx'
const text = html => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ')
const json = (body, status = 200) => () => ({ ok: status >= 200 && status < 300, status, json: async () => body })
const callableError = (status, reason, http = 400) => json({ error: { status, message: reason, details: { reason } } }, http)

/** None of the boards' words: before the server has answered, the page says nothing about the link. */
function assertNoDrawnWords(html, locale) {
  for (const line of Object.values(words(locale))) {
    for (const part of line.split('{place}')) if (part.trim()) assert.ok(!text(html).includes(part.trim()), line)
  }
}

async function renderPage(run, locale, code) {
  try {
    const element = await run.load(PAGE).default({ params: Promise.resolve({ locale, code }) })
    return { html: renderToStaticMarkup(element), thrown: null }
  } catch (error) { return { html: '', thrown: error.message } }
}

test('switch off: the page itself is the site\'s not-found page, whatever the address', async () => {
  for (const env of [{}, { NOTICE_LINK_PAGE: '0' }, { NOTICE_LINK_PAGE: 'yes' }]) {
    for (const locale of ['en', 'id']) {
      const run = moduleLane({ env })
      assert.equal((await renderPage(run, locale, CODE)).thrown, 'NOT_FOUND', `${locale} ${JSON.stringify(env)}`)
      assert.deepEqual(run.calls, [])
    }
  }
  assert.equal((await renderPage(moduleLane(), 'fr', CODE)).thrown, 'NOT_FOUND')
})

test('switch on: the page\'s HTML carries no restaurant name and asks nothing of the server; the browser asks', async () => {
  for (const locale of ['en', 'id']) {
    const run = moduleLane()
    const { html, thrown } = await renderPage(run, locale, CODE)
    assert.equal(thrown, null)
    assert.deepEqual(run.calls, [], 'the website\'s server never calls the function')
    assert.ok(!html.includes(PLACE))
    assertNoDrawnWords(html, locale)
    assert.deepEqual(run.logs, [])
  }
  // A malformed code draws the card for a link that does not work, before any call.
  for (const locale of ['en', 'id']) {
    for (const code of ['-', 'abc', 'k7m2qx0p', `${CODE}x`]) {
      const run = moduleLane()
      const { html } = await renderPage(run, locale, code)
      assert.ok(text(html).includes(words(locale).doesNotWork), code)
      assert.ok(text(html).includes(words(locale).contactSupport), code)
      assert.deepEqual(run.calls, [])
    }
  }
})

test('the page\'s own document: noindex, no referrer, no analytics or other script', async () => {
  for (const locale of ['en', 'id']) {
    const metadata = await moduleLane().load(LAYOUT).generateMetadata({ params: Promise.resolve({ locale }) })
    assert.deepEqual(metadata.robots, { index: false, follow: false, nocache: true })
    assert.equal(metadata.referrer, 'no-referrer')
  }
  const source = ['app/notice-link/[locale]/layout.tsx', 'app/notice-link/[locale]/[code]/page.tsx', 'app/notice-link/[locale]/NoticeFlow.tsx', CARD].map(file => readFileSync(file, 'utf8')).join('\n')
  assert.doesNotMatch(source, /gtag|googletagmanager|GoogleAnalytics|website-analytics|analytics-url|next\/script/)
})

// ---------- the cards, one per board ----------

function card(view, locale = 'en', extra = {}) {
  const { NoticeCard } = moduleLane().load(CARD)
  const html = renderToStaticMarkup(realReact.createElement(NoticeCard, {
    view, strings: words(locale), supportHref: locale === 'id' ? '/id/support' : '/support', appHref: locale === 'id' ? '/id/app' : '/app',
    onTellUs: () => {}, onSend: () => {}, busy: false, ...extra,
  }))
  return { html, shown: text(html) }
}

for (const locale of ['en', 'id']) {
  const s = words(locale)
  const fill = line => line.replace('{place}', PLACE)

  test(`${locale}: current (own-n1, own-n4): the claimed title and Not right? Tell us, nothing about who claimed it`, () => {
    const { html, shown } = card({ view: 'current', placeName: PLACE }, locale)
    assert.ok(shown.includes(fill(s.claimedTitle)))
    assert.match(html, new RegExp(`<button[^>]*type="button"[^>]*>${s.tellUs.replace('?', '\\?')}</button>`))
    assert.match(html, /\/auth-action\/pot\.mp4/)
    for (const other of [s.whatsWrong, s.gotIt, s.doesNotWork, s.nobodyRuns]) assert.ok(!shown.includes(other))
  })

  test(`${locale}: the report form (own-n2): three reasons with the first chosen, the optional note, Send`, () => {
    const { html, shown } = card({ view: 'form', placeName: PLACE }, locale)
    for (const line of [s.whatsWrong, fill(s.looksAtIt), s.reasonOwner, s.reasonStaff, s.reasonOther, s.anythingElse, s.send]) assert.ok(shown.includes(line), line)
    const radios = [...html.matchAll(/<input[^>]*type="radio"[^>]*>/g)].map(match => match[0])
    assert.equal(radios.length, 3)
    assert.deepEqual(radios.map(radio => /value="(\w+)"/.exec(radio)[1]), ['owner', 'staff', 'other'])
    assert.ok(/checked=""/.test(radios[0]) && !/checked/.test(radios[1]) && !/checked/.test(radios[2]))
    assert.match(html, /<textarea[^>]*maxLength="500"|<textarea[^>]*maxlength="500"/i)
    assert.match(html, /<button[^>]*type="submit"/)
    assert.ok(!shown.includes(s.networkError) && !shown.includes(s.tooMany))
    // The approved red lines, above Send.
    for (const [error, line] of [['network', s.networkError], ['tooMany', s.tooMany]]) {
      const drawn = card({ view: 'form', placeName: PLACE, error }, locale)
      assert.ok(drawn.shown.includes(line), error)
      assert.ok(drawn.html.indexOf(line) < drawn.html.indexOf('type="submit"'), `${error} above Send`)
      assert.match(drawn.html, /role="alert"/)
    }
    // While the report is on its way Send is busy and cannot be pressed again.
    assert.match(card({ view: 'form', placeName: PLACE }, locale, { busy: true }).html, /<button[^>]*type="submit"[^>]*disabled=""|<button[^>]*disabled=""[^>]*type="submit"/)
  })

  test(`${locale}: reported and sent (own-n3): We've got it and the approved line, no button`, () => {
    const { html, shown } = card({ view: 'reported' }, locale)
    assert.ok(shown.includes(s.gotIt) && shown.includes(s.willLook))
    assert.doesNotMatch(html, /<button|<a /)
    assert.ok(!shown.includes(PLACE))
  })

  test(`${locale}: invalid (own-n6): This link doesn't work and Contact support, which opens the support page`, () => {
    const { html, shown } = card({ view: 'invalid' }, locale)
    assert.ok(shown.includes(s.doesNotWork))
    assert.match(html, new RegExp(`<a[^>]*href="${locale === 'id' ? '/id/support' : '/support'}"[^>]*>${s.contactSupport}</a>`))
    assert.match(html, /\/notice-link\/places\.mp4/)
  })

  test(`${locale}: unclaimed (own-n7): the restaurant's name, the approved line and Own this place? Claim it`, () => {
    const { html, shown } = card({ view: 'unclaimed', placeName: PLACE }, locale)
    assert.ok(shown.includes(PLACE) && shown.includes(s.nobodyRuns))
    assert.match(html, new RegExp(`<a[^>]*href="${locale === 'id' ? '/id/app' : '/app'}"[^>]*>${s.ownThisPlace.replace('?', '\\?')}</a>`))
    assert.match(html, /\/notice-link\/gone\.mp4/)
  })

  test(`${locale}: before the answer and when the lookup fails, the card shows no drawn state's words but the approved red line`, () => {
    const waiting = card({ view: 'loading' }, locale)
    assertNoDrawnWords(waiting.html, locale)
    assert.match(waiting.html, /aria-busy="true"/)
    for (const [error, line] of [['network', s.networkError], ['tooMany', s.tooMany]]) {
      const drawn = card({ view: 'blocked', error }, locale)
      assert.ok(drawn.shown.includes(line))
      assert.match(drawn.html, /role="alert"/)
    }
  })
}

test('a place name is text, never markup', () => {
  const { html } = card({ view: 'current', placeName: '<img src=x onerror=alert(1)> $& $\' Warung' })
  assert.ok(!html.includes('<img src=x'))
  assert.ok(html.includes('$&amp; $&#x27; Warung') || html.includes('$&amp; $\' Warung'))
})

// ---------- the client: the format check, the calls and the server's answers ----------

const flow = (options = {}) => {
  const run = moduleLane(options)
  return { run, lib: run.load('lib/notice-link.ts') }
}

test('the format check refuses a bad code before any network call', async () => {
  for (const code of [null, undefined, '', 'abc', 'k7m2qx9', 'k7m2qx9pp', 'k7m2qx0p', 'k7m2qxop', 'k7m2qx1p', 'k7m2qxlp', 'k7m2qxip', 'k7m2 x9p', 'k7m2qx9p\n', 42, {}]) {
    const { run, lib } = flow({ answers: {} })
    assert.deepEqual(await lib.resolveNotice(run.fetch, PROD_RESOLVE, code), { view: 'invalid' }, String(code))
    assert.deepEqual(await lib.sendReport(run.fetch, PROD_REPORT, code, { reason: 'owner', note: '' }, PLACE), { view: 'invalid' }, String(code))
    assert.deepEqual(run.calls, [], String(code))
  }
  const { lib } = flow()
  assert.equal(lib.noticeCode('K7M2QX9P'), CODE)
  assert.equal(lib.noticeCode(CODE), CODE)
  assert.equal(lib.noticeCode('k7m2qx9%70'), null, 'no decoding here: the proxy reads the address')
})

test('the browser calls the function\'s own URL: one POST with { data }, no credentials, no referrer, no cache', async () => {
  const { run, lib } = flow({ answers: { resolveNoticeLink: json({ result: { state: 'current', placeName: PLACE } }) } })
  assert.deepEqual(await lib.resolveNotice(run.fetch, PROD_RESOLVE, CODE), { view: 'current', placeName: PLACE })
  assert.equal(run.calls.length, 1)
  const [call] = run.calls
  assert.equal(call.url, PROD_RESOLVE)
  assert.equal(call.init.method, 'POST')
  assert.equal(call.init.headers['Content-Type'], 'application/json')
  assert.deepEqual(call.body, { data: { code: CODE } })
  assert.equal(call.init.credentials, 'omit')
  assert.equal(call.init.referrerPolicy, 'no-referrer')
  assert.equal(call.init.cache, 'no-store')
  // Which project comes from configuration, production unless it names the dev project.
  assert.deepEqual(flow({ env: {} }).lib.functionUrls(), { resolve: PROD_RESOLVE, report: PROD_REPORT })
  for (const value of ['', 'prod', 'makan-devel-x', 'MAKAN-DEVEL', 'evil.example']) assert.equal(flow({ env: { NOTICE_LINK_PROJECT: value } }).lib.functionUrls().resolve, PROD_RESOLVE, value)
  assert.equal(flow({ env: { NOTICE_LINK_PROJECT: 'makan-devel' } }).lib.functionUrls().resolve, DEV_RESOLVE)
})

test('the server\'s answers to a lookup map to the drawn states', async () => {
  for (const [answer, view] of [
    [json({ result: { state: 'current', placeName: PLACE } }), { view: 'current', placeName: PLACE }],
    [json({ result: { state: 'reported', placeName: PLACE } }), { view: 'reported' }],
    [json({ result: { state: 'unclaimed', placeName: PLACE } }), { view: 'unclaimed', placeName: PLACE }],
    [json({ result: { state: 'invalid' } }), { view: 'invalid' }],
    [json({ result: { state: 'current' } }), { view: 'current', placeName: '' }],
    [json({ result: { state: 'current', placeName: 7 } }), { view: 'current', placeName: '' }],
    [callableError('RESOURCE_EXHAUSTED', 'too_many', 429), { view: 'blocked', error: 'tooMany' }],
    [callableError('FAILED_PRECONDITION', 'off'), { view: 'invalid' }],
    [callableError('INVALID_ARGUMENT', 'code'), { view: 'blocked', error: 'network' }],
    [callableError('INTERNAL', 'unexpected', 500), { view: 'blocked', error: 'network' }],
    [json({ result: { state: 'something new' } }), { view: 'blocked', error: 'network' }],
    [json({ nothing: true }), { view: 'blocked', error: 'network' }],
    [() => ({ ok: false, status: 502, json: async () => { throw new SyntaxError(`bad json ${CODE}`) } }), { view: 'blocked', error: 'network' }],
    [() => { throw new TypeError(`fetch failed ${CODE}`) }, { view: 'blocked', error: 'network' }],
  ]) {
    const { run, lib } = flow({ answers: { resolveNoticeLink: answer } })
    assert.deepEqual(await lib.resolveNotice(run.fetch, PROD_RESOLVE, CODE), view, JSON.stringify(view))
    assert.deepEqual(run.logs, [], 'nothing is logged')
  }
})

test('the server\'s answers to a report map to the drawn states', async () => {
  for (const [answer, view] of [
    [json({ result: { state: 'reported' } }), { view: 'reported' }],
    [json({ result: { state: 'invalid' } }), { view: 'invalid' }],
    [json({ result: { state: 'unclaimed', placeName: 'Renamed Warung' } }), { view: 'unclaimed', placeName: 'Renamed Warung' }],
    [json({ result: { state: 'unclaimed' } }), { view: 'unclaimed', placeName: PLACE }],
    [callableError('RESOURCE_EXHAUSTED', 'too_many', 429), { view: 'form', placeName: PLACE, error: 'tooMany' }],
    [callableError('RESOURCE_EXHAUSTED', 'daily_limit', 429), { view: 'form', placeName: PLACE, error: 'tooMany' }],
    [callableError('FAILED_PRECONDITION', 'off'), { view: 'invalid' }],
    [callableError('INVALID_ARGUMENT', 'note'), { view: 'form', placeName: PLACE, error: 'network' }],
    [callableError('INTERNAL', 'unexpected', 500), { view: 'form', placeName: PLACE, error: 'network' }],
    [() => { throw new TypeError(`fetch failed ${CODE}`) }, { view: 'form', placeName: PLACE, error: 'network' }],
  ]) {
    const { run, lib } = flow({ answers: { reportNoticeLink: answer } })
    assert.deepEqual(await lib.sendReport(run.fetch, PROD_REPORT, CODE, { reason: 'staff', note: '  Not us  ' }, PLACE), view, JSON.stringify(view))
    assert.deepEqual(run.calls.map(call => call.body), [{ data: { code: CODE, reason: 'staff', note: 'Not us' } }])
    assert.deepEqual(run.logs, [])
  }
  // An empty note is left out; an unknown reason is never sent.
  const { run, lib } = flow({ answers: { reportNoticeLink: json({ result: { state: 'reported' } }) } })
  await lib.sendReport(run.fetch, PROD_REPORT, CODE, { reason: 'owner', note: '   ' }, PLACE)
  assert.deepEqual(run.calls.map(call => call.body), [{ data: { code: CODE, reason: 'owner' } }])
  assert.deepEqual(await lib.sendReport(run.fetch, PROD_REPORT, CODE, { reason: 'boss', note: '' }, PLACE), { view: 'form', placeName: PLACE, error: 'network' })
  assert.equal(run.calls.length, 1)
})

test('the report form posts once: a second press while it is on its way, or after it was sent, sends nothing', async () => {
  let release
  const { run, lib } = flow({ answers: { reportNoticeLink: () => new Promise(done => { release = () => done({ ok: true, status: 200, json: async () => ({ result: { state: 'reported' } }) }) }) } })
  const send = lib.reportSender(input => lib.sendReport(run.fetch, PROD_REPORT, CODE, input, PLACE))
  const first = send({ reason: 'owner', note: '' })
  assert.ok(first)
  assert.equal(send({ reason: 'owner', note: '' }), null)
  assert.equal(send({ reason: 'other', note: 'x' }), null)
  release()
  assert.deepEqual(await first, { view: 'reported' })
  assert.equal(send({ reason: 'owner', note: '' }), null)
  assert.equal(run.calls.length, 1)
  // After a failed send the person may try again; that try is one call too.
  const failing = flow({ answers: { reportNoticeLink: () => { throw new TypeError('offline') } } })
  const again = failing.lib.reportSender(input => failing.lib.sendReport(failing.run.fetch, PROD_REPORT, CODE, input, PLACE))
  assert.deepEqual(await again({ reason: 'owner', note: '' }), { view: 'form', placeName: PLACE, error: 'network' })
  assert.ok(again({ reason: 'owner', note: '' }))
  assert.equal(failing.run.calls.length, 2)
})

test('the code is never written to a log, an error report or a URL query', () => {
  for (const file of ['lib/notice-link.ts', 'lib/notice-link-proxy.ts', PAGE, LAYOUT, CARD, 'app/notice-link/[locale]/NoticeFlow.tsx']) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /console\.|reportError|captureException|navigator\.sendBeacon/, file)
  }
  // The proxy changed by one call only, and logs nothing either.
  assert.doesNotMatch(readFileSync('proxy.ts', 'utf8'), /console\./)
})
