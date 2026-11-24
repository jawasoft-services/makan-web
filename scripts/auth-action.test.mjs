import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'
import { lane } from './share-v2-test-lane.mjs'

// RM20616 A10 unit 10 (R1) — the account-email action page (/auth/action). Runs the real proxy, page, form
// actions and REST client against a fake Google that records every call. The keys are fake values; no test
// reaches the network or a Firebase project.
const require = createRequire(import.meta.url)
const realReact = require('react')
const { renderToStaticMarkup } = require('react-dom/server')
const { NextRequest } = require('next/server')

const DEV_KEY = 'AIzaFAKE-dev-key-0000000000000000000000'
const PROD_KEY = 'AIzaFAKE-prod-key-000000000000000000000'
const SECRET = 'test-only-signing-secret-0123456789abcdef'
// The keys the server's own calls to Google use. "SECRET" is in each so every "never on the page / in a URL" check catches them.
const DEV_SERVER_KEY = 'SRV-FAKE-dev-server-key-SECRET-00000000'
const PROD_SERVER_KEY = 'SRV-FAKE-prod-server-key-SECRET-0000000'
const LINK_KEYS_ONLY = { AUTH_ACTION_KEY_DEV: DEV_KEY, AUTH_ACTION_KEY_PROD: PROD_KEY, AUTH_ACTION_SECRET: SECRET }
const ENV = { ...LINK_KEYS_ONLY, AUTH_ACTION_SERVER_KEY_DEV: DEV_SERVER_KEY, AUTH_ACTION_SERVER_KEY_PROD: PROD_SERVER_KEY }
/** What a browser sends when a person opens the page (Fetch Metadata). */
const NAVIGATION = { 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'document', 'sec-fetch-site': 'none' }
const CODE = 'OOB-CODE-abcdefghijklmnopqrstuvwxyz0123456789-SECRET'
const PASSWORD = 'n3w-Passw0rd-SECRET'
const EN = JSON.parse(readFileSync('messages/en.json', 'utf8')).SharePages.authAction
const ID = JSON.parse(readFileSync('messages/id.json', 'utf8')).SharePages.authAction
const words = locale => (locale === 'id' ? ID : EN)
const query = (mode, extra = '') => `mode=${mode}&oobCode=${CODE}&apiKey=${DEV_KEY}&lang=en${extra}`

// ---------- the proxy ----------

function ask(path, { env = ENV, headers = {} } = {}) {
  const proxy = lane({ env }).load('proxy.ts').proxy
  const response = proxy(new NextRequest(`https://www.makanofficial.com${path}`, { headers: { host: 'www.makanofficial.com', 'x-forwarded-for': '192.0.2.10', ...headers } }))
  return {
    status: response.status, location: response.headers.get('location'), rewrite: response.headers.get('x-middleware-rewrite'),
    cookie: response.headers.get('set-cookie'), headers: response.headers,
    locale: response.headers.get('x-middleware-request-x-next-intl-locale'),
  }
}
const NOT_FOUND = '/en/auth-action-unknown'
function assertActionHeaders(answer, label, referrer = 'no-referrer') {
  assert.match(answer.headers.get('cache-control') ?? '', /no-store/, label)
  assert.equal(answer.headers.get('referrer-policy'), referrer, label)
  assert.match(answer.headers.get('x-robots-tag') ?? '', /noindex/, label)
}

test('a link with an unknown, missing or empty apiKey gets the site\'s not-found page, never a redirect', () => {
  for (const path of [
    `/auth/action?mode=resetPassword&oobCode=${CODE}&apiKey=AIzaUNKNOWN&lang=en`,
    `/auth/action?mode=verifyEmail&oobCode=${CODE}&lang=en`,
    `/auth/action?mode=signIn&oobCode=${CODE}&apiKey=&continueUrl=https%3A%2F%2Fevil.example%2F`,
    `/auth/action?mode=recoverEmail&oobCode=${CODE}&apiKey=${DEV_KEY.toLowerCase()}`,
    `/id/auth/action?mode=unknownMode&apiKey=${DEV_KEY}x`,
  ]) {
    const answer = ask(path)
    assert.equal(answer.location, null, path)
    assert.equal(new URL(answer.rewrite).pathname, NOT_FOUND, path)
    assert.equal(new URL(answer.rewrite).search, '', path)
    assert.equal(answer.cookie, null, path)
    assertActionHeaders(answer, path)
  }
  // With no keys configured at all, every link is unknown.
  assert.equal(new URL(ask(`/auth/action?${query('resetPassword')}`, { env: {} }).rewrite).pathname, NOT_FOUND)
  // A built mode with no code is not a link either.
  assert.equal(new URL(ask(`/auth/action?mode=resetPassword&apiKey=${DEV_KEY}`).rewrite).pathname, NOT_FOUND)
})

test('any other mode goes on to Firebase\'s own page on that key\'s authDomain, with the query byte for byte', () => {
  const odd = `mode=signIn&oobCode=${CODE}&apiKey=${DEV_KEY}&lang=id&continueUrl=https%3A%2F%2Fwww.makanofficial.com%2Fverified%3Fa%3D1%26b%3D%2520&x=a+b&x=%7E&empty=&flag&%E2%9C%93=%F0%9F%8D%9C`
  for (const [path, host] of [
    [`/auth/action?${odd}`, 'makan-devel.firebaseapp.com'],
    [`/id/auth/action?${odd}`, 'makan-devel.firebaseapp.com'],
    [`/auth/action?${odd.replace(DEV_KEY, PROD_KEY)}`, 'munchies-expo.firebaseapp.com'],
    [`/auth/action?mode=revertSecondFactorAddition&oobCode=${CODE}&apiKey=${DEV_KEY}`, 'makan-devel.firebaseapp.com'],
    [`/auth/action?oobCode=${CODE}&apiKey=${DEV_KEY}`, 'makan-devel.firebaseapp.com'],
    [`/auth/action?mode=&oobCode=${CODE}&apiKey=${DEV_KEY}`, 'makan-devel.firebaseapp.com'],
  ]) {
    const answer = ask(path)
    assert.equal(answer.status, 302, path)
    assert.equal(answer.location, `https://${host}/__/auth/action?${path.slice(path.indexOf('?') + 1)}`, path)
    assert.equal(answer.cookie, null, path)
    assertActionHeaders(answer, path)
  }
  // The authDomain comes from configuration, never from the link; a configured domain must be a bare host,
  // and one of the project's own Firebase hosts or a host under makanofficial.com (review L5).
  for (const good of ['auth.makanofficial.com', 'makan-devel.web.app', 'MAKAN-DEVEL.firebaseapp.com']) {
    assert.equal(new URL(ask(`/auth/action?mode=signIn&apiKey=${DEV_KEY}`, { env: { ...ENV, AUTH_ACTION_DOMAIN_DEV: good } }).location).host, good.toLowerCase(), good)
  }
  for (const bad of ['evil.example/x', 'https://evil.example', 'evil.example?', '@evil.example', 'localhost', 'auth.makan.example', 'evil.web.app', 'evil.firebaseapp.com',
    'munchies-expo.firebaseapp.com', 'evilmakanofficial.com', 'makanofficial.com.evil.example', 'firebaseapp.com', 'web.app']) {
    assert.equal(new URL(ask(`/auth/action?mode=signIn&apiKey=${DEV_KEY}`, { env: { ...ENV, AUTH_ACTION_DOMAIN_DEV: bad } }).rewrite).pathname, NOT_FOUND, bad)
  }
})

test('a link for a built mode leaves its query in an HttpOnly cookie and moves to the address with no query', () => {
  for (const [path, target] of [
    [`/auth/action?${query('resetPassword')}`, '/auth/action'],
    [`/auth/action?${query('resetPassword').replace('lang=en', 'lang=id')}`, '/id/auth/action'],
    [`/auth/action?${query('verifyEmail').replace('lang=en', 'lang=id-ID')}`, '/id/auth/action'],
    [`/auth/action?mode=verifyAndChangeEmail&oobCode=${CODE}&apiKey=${DEV_KEY}`, '/auth/action'],
    [`/id/auth/action?${query('recoverEmail')}`, '/id/auth/action'],
    [`/en/auth/action?${query('resetPassword').replace('lang=en', 'lang=id')}`, '/auth/action'],
    [`/auth/action/?${query('resetPassword').replace('lang=en', 'lang=fr')}`, '/auth/action'],
  ]) {
    const answer = ask(path)
    assert.equal(answer.status, 303, path)
    assert.equal(answer.location, `https://www.makanofficial.com${target}`, path)
    assert.doesNotMatch(answer.location, /oobCode|SECRET/)
    const cookie = answer.cookie
    assert.match(cookie, /^makan_auth_action=[A-Za-z0-9_-]+;/, path)
    assert.match(cookie, new RegExp(`Path=${target.replace(/\//g, '\\/')}(;|$)`), path)
    assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=lax/i); assert.match(cookie, /Secure/i)
    // A session cookie: it does not outlive the browser (review L2).
    assert.doesNotMatch(cookie, /Max-Age|Expires/i, path)
    // base64url is not protection (HttpOnly and the Path are); this only checks the value is the encoded query.
    assert.doesNotMatch(cookie, /SECRET/)
    const { decodeStoredLink } = lane({ env: ENV }).load('lib/auth-action.ts')
    assert.equal(decodeStoredLink(cookie.split(';')[0].split('=')[1]).query, path.slice(path.indexOf('?') + 1))
    assertActionHeaders(answer, path)
  }
  // Secure does not depend on the proxy's X-Forwarded-Proto: a request that reached the server as http still
  // gets a Secure cookie (review L3). Only `next dev` leaves it off.
  const proxy = lane({ env: ENV }).load('proxy.ts').proxy
  const plain = proxy(new NextRequest(`http://www.makanofficial.com/auth/action?${query('resetPassword')}`, { headers: { host: 'www.makanofficial.com' } }))
  assert.match(plain.headers.get('set-cookie'), /Secure/i)
  const devProxy = lane({ env: { ...ENV, NODE_ENV: 'development' } }).load('proxy.ts').proxy
  const dev = devProxy(new NextRequest(`http://localhost:3000/auth/action?${query('resetPassword')}`, { headers: { host: 'localhost:3000' } }))
  assert.doesNotMatch(dev.headers.get('set-cookie'), /Secure/i)
  // With no signing secret (or one too short), the route serves nothing: every link gets the not-found page.
  for (const secret of [undefined, '', 'short-secret']) {
    const answer = ask(`/auth/action?${query('resetPassword')}`, { env: { ...ENV, AUTH_ACTION_SECRET: secret } })
    assert.equal(new URL(answer.rewrite).pathname, NOT_FOUND, String(secret)); assert.equal(answer.cookie, null)
  }
})

test('the clean address is served by the internal page in its language; the internal address is never public', () => {
  for (const [path, locale] of [['/auth/action', 'en'], ['/id/auth/action', 'id'], ['/en/auth/action', 'en'], ['/auth/action?utm_source=x', 'en']]) {
    const answer = ask(path)
    assert.equal(answer.status, 200, path)
    assert.equal(answer.location, null)
    const rewrite = new URL(answer.rewrite)
    assert.equal(rewrite.pathname, `/auth-action/${locale}`, path)
    assert.equal(rewrite.search, '')
    assert.equal(answer.locale, locale)
    // The clean page has no code in its address: same-origin sends no referrer to any other site.
    assertActionHeaders(answer, path, 'same-origin')
  }
  for (const path of ['/auth-action/en', '/auth-action/id', '/id/auth-action/en', '/AUTH-ACTION/en', '/auth%2Daction/en', '//auth-action//en', '/en/auth-action', '/auth-action']) {
    assert.equal(new URL(ask(path).rewrite).pathname, NOT_FOUND, path)
  }
  // Other addresses are untouched by this rule.
  for (const path of ['/auth', '/auth/actions', '/auth/action/x', '/id/auth/action/x', '/places/auth-actionx', '/support']) {
    assert.doesNotMatch(String(ask(path).rewrite), /auth-action/, path)
  }
})

// ---------- the page, its form actions and the REST client ----------

/**
 * A fake Identity Toolkit: `answers[method]` is a function of the body returning { status, body } or throwing.
 * An answer with `redirectTo` is a redirect to another host: fetch follows it (and gets that host's answer)
 * unless the call said `redirect: "error"`, which makes fetch throw, as Node's fetch does.
 */
function fakeGoogle(answers) {
  const calls = []
  const fetch = async (url, init) => {
    const method = /accounts:(\w+)$/.exec(url)?.[1]
    const body = JSON.parse(init.body)
    calls.push({ url, method, body, init })
    const answer = answers[method]
    if (!answer) throw new Error(`unexpected call ${method}`)
    const given = answer(body)
    if (given.redirectTo) {
      if (init.redirect === 'error') throw new TypeError('fetch failed: unexpected redirect')
      calls.push({ url: given.redirectTo.url, method: 'followed', body, init })
      const after = given.redirectTo.answer
      return { ok: true, status: 200, json: async () => after }
    }
    const { status = 200, body: out = {}, raw } = given
    return { ok: status >= 200 && status < 300, status, json: async () => (raw !== undefined ? JSON.parse(raw) : out) }
  }
  return { fetch, calls }
}
const fail = (message, status = 400) => () => ({ status, body: { error: { code: status, message } } })
const offline = () => { throw new TypeError(`fetch failed ${CODE} ${PASSWORD}`) }
const ok = body => () => ({ body })

function pageLane({ google = {}, cookie, scripted = true, env = ENV, address = '192.0.2.20', requestHeaders = NAVIGATION } = {}) {
  const modules = new Map(), logs = [], { fetch, calls } = fakeGoogle(google)
  const jar = new Map(cookie === undefined ? [] : [['makan_auth_action', cookie]])
  const cookieSets = []
  // What useActionState returns while the page is drawn again after an action: the action's own result (Next
  // passes it as the form state with JavaScript off; with JavaScript on the client keeps it). Unset otherwise.
  const formState = { value: undefined }
  const react = { ...realReact, useActionState: (fn, initial) => (formState.value === undefined ? realReact.useActionState(fn, initial) : [formState.value, fn, false]) }
  // The request's headers; a test may change them between calls (another client, another kind of fetch).
  const request = { headers: { 'x-forwarded-for': address, ...requestHeaders } }
  // While a form post is handled (the action, then the page drawn again in its answer): what the post adds to
  // the request. A scripted post carries Next's action header; a plain form post (JavaScript off) is multipart.
  const POST_HEADERS = scripted ? { 'next-action': 'abc', 'content-type': 'text/plain;charset=UTF-8' } : { 'content-type': 'multipart/form-data; boundary=----x' }
  let posting = false
  const loggers = Object.fromEntries(['log', 'info', 'warn', 'error', 'debug'].map(level => [level, (...args) => logs.push(args.map(String).join(' '))]))
  function load(relative) {
    if (modules.has(relative)) return modules.get(relative)
    const exports = {}; modules.set(relative, exports)
    const code = ts.transpileModule(readFileSync(resolve(relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
    const importModule = id => {
      if (id === 'server-only') return {}
      if (id === 'react' || id === 'react/jsx-runtime') return id === 'react' ? react : require(id)
      if (id === 'next/headers') return {
        // As in Next: a cookie an action sets is what the page drawn again after it reads (responseCookiesToRequestCookies).
        cookies: async () => ({ get: name => (jar.has(name) ? { name, value: jar.get(name) } : undefined), set: (name, value, options) => { cookieSets.push({ name, value, ...options }); jar.set(name, value) } }),
        headers: async () => new Headers({ ...request.headers, ...(posting ? POST_HEADERS : {}) }),
      }
      if (id.startsWith('node:')) return require(id)
      if (id === 'next/navigation') return { notFound: () => { throw new Error('NOT_FOUND') }, redirect: url => { throw new Error(`REDIRECT:${url}`) } }
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
  const flow = load('lib/auth-action.ts')
  const linkCookie = q => flow.encodeStoredLink({ query: q })
  async function render(locale = 'en', state) {
    formState.value = state
    try {
      const element = await load('app/auth-action/[locale]/page.tsx').default({ params: Promise.resolve({ locale }) })
      return { html: renderToStaticMarkup(element), thrown: null, element }
    } catch (error) { return { html: '', thrown: error.message, element: null } } finally { formState.value = undefined }
  }
  /** Renders the reset card for a state the form action returned. */
  function card(view, locale = 'en') {
    const ResetFlow = load('app/auth-action/[locale]/ResetFlow.tsx').default
    return renderToStaticMarkup(realReact.createElement(ResetFlow, { initial: view, strings: words(locale), locale, supportHref: locale === 'id' ? '/id/support' : '/support', appPage: '/app' }))
  }
  /** The seal the page would draw for the cookie's link (`at` moves the clock for a send seal). */
  const seal = (purpose, at = Date.now()) => {
    const link = flow.readStoredLink(flow.decodeStoredLink(jar.get('makan_auth_action')), env)
    return load('lib/auth-action-seal.ts').sealFor(purpose, link, at, env)
  }
  // Each post carries the seal its card was drawn with, as the page sends it, unless the test sets `seal`.
  const SEAL_FOR = { save: 'save', forgot: 'send', send: 'send' }
  const action = async (fields, previous = { view: 'choose', email: 'dewi@example.com' }) => {
    const form = new FormData(); for (const [key, value] of Object.entries(fields)) if (value !== null) form.set(key, value)
    if (!('seal' in fields) && SEAL_FOR[fields.intent] && flow.readStoredLink(flow.decodeStoredLink(jar.get('makan_auth_action')), env)) {
      const drawn = seal(SEAL_FOR[fields.intent]); if (drawn) form.set('seal', drawn)
    }
    const setsBefore = cookieSets.length
    posting = true
    try {
      const result = await load('app/auth-action/[locale]/actions.ts').resetFlowAction(previous, form)
      // As in Next: a plain form post (JavaScript off) always answers with the page drawn again; a scripted post
      // gets the page drawn again in the same response when the action set a cookie. Same request, the action's
      // result as the form state. A not-found or redirect there replaces the card, so it is thrown here too.
      if (!scripted || cookieSets.length > setsBefore) {
        after.last = await render(fields.locale === 'id' ? 'id' : 'en', result)
        if (after.last.thrown) throw new Error(after.last.thrown)
      } else after.last = null
      return result
    } finally { posting = false }
  }
  const after = { last: null }
  return { load, render, card, action, seal, calls, logs, jar, cookieSets, request, linkCookie, after, flow, env }
}
const withLink = (mode, google, extra = {}) => {
  const probe = pageLane()
  return pageLane({ google, cookie: probe.linkCookie(query(mode)), ...extra })
}
/** A view without its seal, for comparing the card it names. */
const bare = view => Object.fromEntries(Object.entries(view).filter(([key]) => key !== 'seal'))
const text = html => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, '\'').replace(/&amp;/g, '&')
const quiet = (run, label) => {
  assert.deepEqual(run.logs, [], `${label}: nothing is logged`)
  for (const call of run.calls) {
    assert.doesNotMatch(call.url, /SECRET|oobCode=|newPassword=|password=/, `${label}: the code and the password are never in a URL`)
    assert.equal(call.init.method, 'POST')
    assert.equal(call.url.startsWith('https://identitytoolkit.googleapis.com/v1/accounts:'), true)
    assert.doesNotMatch(call.url, /[?#]|key=|AIza|SRV-/, `${label}: no key and no query in a URL`)
    assert.equal(call.init.headers['X-Goog-Api-Key'], DEV_SERVER_KEY, `${label}: the project's server key, in a header`)
    assert.doesNotMatch(JSON.stringify(call.init.headers) + call.init.body, /AIza/, `${label}: the link's own key is sent nowhere`)
  }
}

const RESET_OK = { resetPassword: body => (body.newPassword ? { body: { email: 'dewi@example.com', requestType: 'PASSWORD_RESET' } } : { body: { email: 'dewi@example.com', requestType: 'PASSWORD_RESET' } }) }

for (const locale of ['en', 'id']) {
  const s = words(locale)

  test(`${locale}: reset link, code good: Choose a new password for the address (si-fp-5)`, async () => {
    const run = withLink('resetPassword', RESET_OK)
    const { html, thrown } = await run.render(locale)
    assert.equal(thrown, null)
    const shown = text(html)
    for (const line of [s.chooseTitle, s.forEmail.replace('{email}', 'dewi@example.com'), s.newPasswordLabel, s.passwordRule, s.savePassword]) assert.ok(shown.includes(line), line)
    assert.match(html, new RegExp(`aria-label="${s.showPassword}"`))
    assert.match(html, /type="password"/); assert.match(html, /autoComplete="new-password"|autocomplete="new-password"/)
    assert.ok(!shown.includes(s.networkError))
    assert.doesNotMatch(html, /SECRET|oobCode|apiKey|AIza/, 'the code and the key never reach the page')
    assert.deepEqual(run.calls.map(call => [call.method, Object.keys(call.body)]), [['resetPassword', ['oobCode']]])
    quiet(run, 'si-fp-5')
  })

  test(`${locale}: reset link timed out: This link has expired. with Send a new link; used: with Open Makan (si-fp-expired)`, async () => {
    // Timed out (Google's EXPIRED_OOB_CODE): Send a new link, which can really send.
    let run = withLink('resetPassword', { resetPassword: fail('EXPIRED_OOB_CODE') })
    let shown = text((await run.render(locale)).html)
    assert.ok(shown.includes(s.expired) && shown.includes(s.sendNewLink) && !shown.includes(s.openMakan), 'EXPIRED_OOB_CODE')
    quiet(run, 'EXPIRED_OOB_CODE')
    // Used, or never real (INVALID_OOB_CODE for both): Open Makan and no Send, which could send nothing
    // (Devon, 24 Nov 2026).
    run = withLink('resetPassword', { resetPassword: fail('INVALID_OOB_CODE') })
    const { html } = await run.render(locale)
    shown = text(html)
    assert.ok(shown.includes(s.expired) && shown.includes(s.openMakan) && !shown.includes(s.sendNewLink), 'INVALID_OOB_CODE')
    assert.doesNotMatch(html, /<form|name="intent"|name="seal"/, 'a used link\'s card has no form')
    quiet(run, 'INVALID_OOB_CODE')
  })

  test(`${locale}: reset link for a disabled or deleted account: This link doesn't work with Contact support (si-fp-7)`, async () => {
    for (const message of ['USER_DISABLED', 'USER_NOT_FOUND', 'EMAIL_NOT_FOUND']) {
      const run = withLink('resetPassword', { resetPassword: fail(message) })
      const { html } = await run.render(locale)
      assert.ok(text(html).includes(s.doesNotWork), message)
      assert.match(html, new RegExp(`href="${locale === 'id' ? '/id/support' : '/support'}"[^>]*>${s.contactSupport}<`))
      assert.ok(!text(html).includes(s.sendNewLink))
      quiet(run, message)
    }
  })

  test(`${locale}: save: success, no connection, weak password, expired, disabled`, async () => {
    // Success: Password changed with Open Makan (si-fp-6); on a computer the button is hidden by CSS (si-fp-13).
    let run = withLink('resetPassword', RESET_OK)
    let view = await run.action({ intent: 'save', password: PASSWORD, email: 'dewi@example.com', locale })
    assert.deepEqual(view, { view: 'changed' })
    assert.deepEqual(run.calls.map(call => call.body), [{ oobCode: CODE, newPassword: PASSWORD }])
    let html = run.card(view, locale)
    for (const line of [s.passwordChanged, s.signInWithNewPassword, s.openMakan]) assert.ok(text(html).includes(line), line)
    assert.match(html, /class="phoneOnly"><a href="\/app"/)
    quiet(run, 'save ok')

    // No connection: the si-fp-8 line; with JavaScript the typed password stays in the field (client state),
    // without it the page is handed the password back to refill the field.
    run = withLink('resetPassword', { resetPassword: offline })
    view = await run.action({ intent: 'save', password: PASSWORD, email: 'dewi@example.com', locale })
    assert.deepEqual(bare(view), { view: 'choose', email: 'dewi@example.com', error: 'network' })
    assert.ok(view.seal, 'the card keeps its seal for the retry')
    html = run.card({ ...view, keep: PASSWORD }, locale)
    assert.ok(text(html).includes(s.networkError) && text(html).includes(s.savePassword))
    assert.match(html, new RegExp(`value="${PASSWORD}"`))
    quiet(run, 'save offline')
    run = withLink('resetPassword', { resetPassword: offline }, { scripted: false })
    assert.equal((await run.action({ intent: 'save', password: PASSWORD, email: 'dewi@example.com', locale })).keep, PASSWORD)

    // Weak: refused before any call when too short; Firebase's own WEAK_PASSWORD gives the same card.
    run = withLink('resetPassword', RESET_OK)
    view = await run.action({ intent: 'save', password: '12345', email: 'dewi@example.com', locale })
    assert.equal(view.error, 'weak'); assert.equal(run.calls.length, 0)
    html = run.card(view, locale)
    assert.match(html, new RegExp(`class="rule wrong"[^>]*>${s.passwordRule}<`))
    run = withLink('resetPassword', { resetPassword: fail('WEAK_PASSWORD : Password should be at least 6 characters') })
    assert.equal((await run.action({ intent: 'save', password: PASSWORD, locale })).error, 'weak')

    // Expired or used while the card was open.
    for (const message of ['EXPIRED_OOB_CODE', 'INVALID_OOB_CODE']) {
      run = withLink('resetPassword', { resetPassword: fail(message) })
      assert.deepEqual(bare(await run.action({ intent: 'save', password: PASSWORD, email: 'dewi@example.com', locale })), { view: 'expired' })
    }
    // Never a password checker: a valid-looking email and password posted with a used or expired code (even
    // claiming an earlier save got no answer) gets the expired card, and no sign-in call is ever made.
    for (const message of ['EXPIRED_OOB_CODE', 'INVALID_OOB_CODE']) {
      run = withLink('resetPassword', { resetPassword: fail(message), signInWithPassword: ok({ idToken: 'x' }) })
      const view = await run.action({ intent: 'save', password: PASSWORD, email: 'someone.else@example.com', pending: '1', locale })
      assert.deepEqual(bare(view), { view: 'expired' }, message)
      assert.deepEqual(run.calls.map(call => call.method), ['resetPassword'])
      quiet(run, 'no oracle')
    }

    // Disabled or deleted while the card was open.
    run = withLink('resetPassword', { resetPassword: fail('USER_DISABLED') })
    assert.deepEqual(await run.action({ intent: 'save', password: PASSWORD, locale }), { view: 'broken' })
  })

  test(`${locale}: Send a new link turns the card into the Forgot password form, then Email sent for every answer`, async () => {
    let run = withLink('resetPassword', {})
    const form = await run.action({ intent: 'forgot', locale }, { view: 'expired' })
    assert.deepEqual(bare(form), { view: 'forgot' })
    assert.equal(run.calls.length, 0)
    const html = run.card(form, locale)
    for (const line of [s.forgotTitle, s.forgotBody, s.emailLabel, s.sendResetLink]) assert.ok(text(html).includes(line), line)
    assert.match(html, /type="email"/)
    // The form carries the expired card's send seal on to Send reset link, in a hidden field.
    assert.match(html, new RegExp(`<input type="hidden" name="seal" value="${form.seal.replace(/[.]/g, '\\.')}"`))

    // Every answer that depends on the address (sent, no account, disabled, limited) is the same Email sent,
    // so the form never tells anyone whether an address has an account.
    const accountAnswers = [ok({ email: 'dewi@example.com' }), fail('EMAIL_NOT_FOUND'), fail('USER_DISABLED'), fail('USER_NOT_FOUND'), fail('TOO_MANY_ATTEMPTS_TRY_LATER'),
      fail('RESET_PASSWORD_EXCEED_LIMIT'), fail('EMAIL_NOT_FOUND : There is no user record')]
    for (const [index, answer] of accountAnswers.entries()) {
      run = withLink('resetPassword', { sendOobCode: answer }, { address: `198.51.100.${index}` })
      const view = await run.action({ intent: 'send', email: ' dewi@example.com ', locale }, { view: 'forgot' })
      assert.deepEqual(view, { view: 'sent' }, `answer ${index}`)
      assert.deepEqual(run.calls.map(call => call.body), [{ requestType: 'PASSWORD_RESET', email: 'dewi@example.com' }])
      quiet(run, `send ${index}`)
    }
    // Google refused or failed the send for a reason that has nothing to do with the account (a key refused
    // by its restrictions, quota, an outage, a body that is not JSON, any other 400): nothing was sent, so the
    // page shows the si-fp-8 line and keeps the address, never Email sent.
    const refusals = [fail('API_KEY_HTTP_REFERRER_BLOCKED', 403), fail('PERMISSION_DENIED', 403), fail('QUOTA_EXCEEDED', 429), fail('TOO_MANY_ATTEMPTS_TRY_LATER', 429),
      fail('INTERNAL_ERROR', 500), fail('UNAVAILABLE', 503), () => ({ status: 502, raw: '<html>bad gateway</html>' }), () => ({ status: 200, raw: 'not json' }),
      fail('INVALID_EMAIL'), fail('MISSING_REQ_TYPE'), fail('API key not valid. Please pass a valid API key.')]
    for (const [index, answer] of refusals.entries()) {
      run = withLink('resetPassword', { sendOobCode: answer }, { address: `198.51.101.${index}` })
      const view = await run.action({ intent: 'send', email: 'dewi@example.com', locale }, { view: 'forgot' })
      assert.deepEqual(bare(view), { view: 'forgot', error: 'network' }, `refusal ${index}`)
      assert.ok(view.seal, 'the form keeps its seal for the retry')
      assert.equal(run.calls.length, 1)
      quiet(run, `refusal ${index}`)
    }
    const sent = run.card({ view: 'sent' }, locale)
    assert.ok(text(sent).includes(s.emailSentTitle) && text(sent).includes(s.emailSentBody))
    assert.doesNotMatch(sent, /<button|<a /, 'Email sent has no button')

    // No answer at all: the si-fp-8 line under the form, the address kept.
    run = withLink('resetPassword', { sendOobCode: offline }, { address: '203.0.113.1' })
    const offlineView = await run.action({ intent: 'send', email: 'dewi@example.com', locale }, { view: 'forgot' })
    assert.deepEqual(bare(offlineView), { view: 'forgot', error: 'network' })
    assert.ok(text(run.card(offlineView, locale)).includes(s.networkError))
    quiet(run, 'send offline')

    // A typo: the invalid-address line, nothing sent.
    run = withLink('resetPassword', { sendOobCode: ok({}) }, { address: '203.0.113.2' })
    const typo = await run.action({ intent: 'send', email: 'dewi.example.com', locale }, { view: 'forgot' })
    assert.equal(typo.error, 'email'); assert.equal(run.calls.length, 0)
    assert.ok(text(run.card(typo, locale)).includes(s.invalidEmail))
  })

  test(`${locale}: verification link: Email verified (si-v-12), expired or used (si-v-13)`, async () => {
    let run = withLink('verifyEmail', { resetPassword: ok({ email: 'dewi@example.com', requestType: 'VERIFY_EMAIL' }), update: ok({ emailVerified: true }) })
    let { html } = await run.render(locale)
    assert.ok(text(html).includes(s.emailVerified) && text(html).includes(s.openMakan))
    assert.deepEqual(run.calls.map(call => [call.method, call.body]), [['resetPassword', { oobCode: CODE }], ['update', { oobCode: CODE }]])
    quiet(run, 'si-v-12')
    for (const message of ['EXPIRED_OOB_CODE', 'INVALID_OOB_CODE']) {
      run = withLink('verifyEmail', { resetPassword: fail(message) })
      html = (await run.render(locale)).html
      assert.ok(text(html).includes(s.expired) && text(html).includes(s.openMakan), message)
      assert.ok(!text(html).includes(s.sendNewLink))
    }
  })

  test(`${locale}: email-change links: Email changed, Email change undone, expired (web-email-*)`, async () => {
    let run = withLink('verifyAndChangeEmail', { resetPassword: ok({ email: 'dewi@example.com', newEmail: 'dewi.lestari@gmail.com', requestType: 'VERIFY_AND_CHANGE_EMAIL' }), update: ok({}) })
    let shown = text((await run.render(locale)).html)
    assert.ok(shown.includes(s.emailChanged) && shown.includes(s.signInWithEmail.replace('{email}', 'dewi.lestari@gmail.com')) && shown.includes(s.openMakan))
    run = withLink('recoverEmail', { resetPassword: ok({ email: 'dewi@example.com', newEmail: 'dewi.lestari@gmail.com', requestType: 'RECOVER_EMAIL' }), update: ok({}) })
    shown = text((await run.render(locale)).html)
    assert.ok(shown.includes(s.emailChangeUndone) && shown.includes(s.emailIsAgain.replace('{email}', 'dewi@example.com')))
    for (const mode of ['verifyAndChangeEmail', 'recoverEmail']) {
      run = withLink(mode, { resetPassword: fail('EXPIRED_OOB_CODE') })
      shown = text((await run.render(locale)).html)
      assert.ok(shown.includes(s.expired) && shown.includes(s.changeEmailAgain) && shown.includes(s.openMakan), mode)
      quiet(run, mode)
    }
    // Checked but then expired when applied.
    run = withLink('recoverEmail', { resetPassword: ok({ email: 'a@b.co', requestType: 'RECOVER_EMAIL' }), update: fail('INVALID_OOB_CODE') })
    assert.ok(text((await run.render(locale)).html).includes(s.changeEmailAgain))
  })
}

test('no usable answer, or a case with no board, hands the link on to Firebase\'s own page with the same query', async () => {
  const firebase = mode => `REDIRECT:https://makan-devel.firebaseapp.com/__/auth/action?${query(mode)}`
  for (const [mode, google] of [
    ['resetPassword', { resetPassword: offline }],
    ['resetPassword', { resetPassword: fail('INTERNAL_ERROR', 500) }],
    ['resetPassword', { resetPassword: fail('API_KEY_HTTP_REFERRER_BLOCKED', 403) }],
    ['resetPassword', { resetPassword: () => ({ status: 200, raw: 'not json' }) }],
    ['resetPassword', { resetPassword: ok({ email: 'a@b.co', requestType: 'VERIFY_EMAIL' }) }],
    ['verifyEmail', { resetPassword: ok({ email: 'a@b.co', requestType: 'PASSWORD_RESET' }) }],
    ['verifyEmail', { resetPassword: fail('USER_DISABLED') }],
    ['verifyEmail', { resetPassword: ok({ email: 'a@b.co', requestType: 'VERIFY_EMAIL' }), update: offline }],
    ['verifyAndChangeEmail', { resetPassword: ok({ email: 'a@b.co', requestType: 'VERIFY_AND_CHANGE_EMAIL' }) }],
    ['recoverEmail', { resetPassword: fail('USER_NOT_FOUND') }],
  ]) {
    const run = withLink(mode, google)
    const { thrown } = await run.render('en')
    assert.equal(thrown, firebase(mode), `${mode} ${JSON.stringify(Object.keys(google))}`)
    quiet(run, mode)
  }
})

test('without the link\'s cookie, or with a cookie for an unknown key, the page is the not-found page', async () => {
  for (const cookie of [undefined, '', 'garbage', Buffer.from('{"q":1}').toString('base64url')]) {
    assert.equal((await pageLane({ cookie }).render('en')).thrown, 'NOT_FOUND', String(cookie))
  }
  const probe = pageLane()
  assert.equal((await pageLane({ cookie: probe.linkCookie(query('resetPassword').replace(DEV_KEY, 'AIzaOTHER')) }).render('en')).thrown, 'NOT_FOUND')
  assert.equal((await pageLane({ cookie: probe.linkCookie(query('resetPassword')), env: {} }).render('en')).thrown, 'NOT_FOUND')
  assert.equal((await pageLane({ cookie: probe.linkCookie(query('signIn')) }).render('en')).thrown, 'NOT_FOUND')
  // A form post without the cookie (left open past a day) gets the expired card, and calls nothing.
  const run = pageLane({ google: {} })
  assert.deepEqual(await run.action({ intent: 'save', password: PASSWORD }), { view: 'expired' })
  assert.equal(run.calls.length, 0)
})

test('no route or action of the page signs in or checks a password', () => {
  for (const file of ['lib/identity-toolkit.ts', 'lib/auth-action-flow.ts', 'app/auth-action/[locale]/actions.ts']) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), /signInWithPassword|signInWith|verifyPassword|lookup/, file)
  }
})

test('the page document: noindex, no referrer, the site title, and no script but its own', async () => {
  const run = pageLane()
  for (const locale of ['en', 'id']) {
    const metadata = await run.load('app/auth-action/[locale]/layout.tsx').generateMetadata({ params: Promise.resolve({ locale }) })
    assert.equal(metadata.title, JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')).Metadata.site.title)
    assert.deepEqual(metadata.robots, { index: false, follow: false, nocache: true })
    assert.equal(metadata.referrer, 'same-origin')
  }
  const files = readdirSync('app/auth-action/[locale]').map(file => `app/auth-action/[locale]/${file}`)
  for (const file of [...files, 'lib/auth-action.ts', 'lib/auth-action-flow.ts', 'lib/auth-action-proxy.ts', 'lib/identity-toolkit.ts']) {
    const source = readFileSync(file, 'utf8')
    assert.doesNotMatch(source, /console\.|SafeAnalytics|website-analytics|googletagmanager|next\/script|<script|Navbar|SmoothScroll|reportError|captureException/, file)
  }
})

test('every action-page string exists in both languages, comes from the approved boards, and stays off other pages\' client payload', () => {
  assert.deepEqual(Object.keys(ID), Object.keys(EN))
  for (const [key, value] of Object.entries(EN)) assert.ok(value && ID[key], key)
  const { STRING_KEYS } = pageLane().load('app/auth-action/[locale]/parts.tsx')
  assert.deepEqual([...STRING_KEYS].sort(), Object.keys(EN).sort())
  // The site's layout leaves the whole SharePages namespace out of the client messages.
  assert.match(readFileSync('app/[locale]/layout.tsx', 'utf8'), /namespace !== "SharePages"/)
})

// ---------- review fixes (REVIEW_RESET_PAGES.md, 24 Nov 2026) ----------

const OTHER_CODE = 'OTHER-CODE-zyxwvutsrqponmlkjihgfedcba9876543210-SECRET'
const sendTo = (run, email, address) => {
  if (address) run.request.headers['x-forwarded-for'] = address
  // Each send comes from a browser holding a live link: one that has sent already holds the done marker,
  // and its posts send nothing (tested below).
  run.jar.set('makan_auth_action', run.linkCookie(query('resetPassword')))
  return run.action({ intent: 'send', email, locale: 'en' }, { view: 'forgot' })
}

test('M1: Send reset link sends only with the seal the page drew for a link Google said had expired', async () => {
  // EXPIRED_OOB_CODE: the expired card carries a send seal. INVALID_OOB_CODE (used, or made up: Google gives
  // one answer for both) shows the card with Open Makan, no Send and no seal.
  let run = withLink('resetPassword', { resetPassword: fail('EXPIRED_OOB_CODE') })
  assert.match((await run.render('en')).html, /<input type="hidden" name="seal" value="[a-z0-9]+\.[A-Za-z0-9_-]{43}"/)
  run = withLink('resetPassword', { resetPassword: fail('INVALID_OOB_CODE') })
  const { html } = await run.render('en')
  assert.ok(text(html).includes(EN.expired) && text(html).includes(EN.openMakan) && !text(html).includes(EN.sendNewLink))
  assert.doesNotMatch(html, /name="seal"|<form/)
  // A save that finds the code expired draws the seal too; one that finds it used does not.
  assert.ok((await withLink('resetPassword', { resetPassword: fail('EXPIRED_OOB_CODE') }).action({ intent: 'save', password: PASSWORD, locale: 'en' })).seal)
  assert.equal((await withLink('resetPassword', { resetPassword: fail('INVALID_OOB_CODE') }).action({ intent: 'save', password: PASSWORD, locale: 'en' })).seal, undefined)

  // Without a valid send seal: the expired card (Open Makan), never Email sent, and nothing asked of Google.
  const probe = withLink('resetPassword', {})
  const otherLink = pageLane({ cookie: probe.linkCookie(query('resetPassword').replace(CODE, OTHER_CODE)) })
  const otherSecret = pageLane({ cookie: probe.linkCookie(query('resetPassword')), env: { ...ENV, AUTH_ACTION_SECRET: 'another-signing-secret-0123456789abcdef' } })
  for (const [label, seal] of [
    ['none', null], ['empty', ''], ['made up', 'zzzzzz.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'], ['a save seal', probe.seal('save')],
    ['drawn for another code', otherLink.seal('send')], ['drawn with another secret', otherSecret.seal('send')],
    ['past its hour', probe.seal('send', Date.now() - 61 * 60 * 1000)], ['with extra parts', `${probe.seal('send')}.x`],
  ]) {
    run = withLink('resetPassword', { sendOobCode: ok({}) })
    assert.deepEqual(await run.action({ intent: 'send', email: 'victim@example.com', seal, locale: 'en' }, { view: 'forgot' }), { view: 'expired' }, label)
    assert.deepEqual(await run.action({ intent: 'send', email: 'not-an-address', seal, locale: 'en' }, { view: 'forgot' }), { view: 'expired' }, label)
    // Send a new link does not open the form either.
    assert.deepEqual(await run.action({ intent: 'forgot', seal, locale: 'en' }, { view: 'expired' }), { view: 'expired' }, label)
    assert.equal(run.calls.length, 0, label)
    assert.deepEqual(run.cookieSets, [], `${label}: the link's cookie is left as it was`)
  }
  // With it: sent.
  run = withLink('resetPassword', { sendOobCode: ok({}) })
  assert.deepEqual(await run.action({ intent: 'send', email: 'dewi@example.com', locale: 'en' }, { view: 'forgot' }), { view: 'sent' })
  assert.equal(run.calls.length, 1)
})

test('M1: at most 3 reset emails an hour to one address and 5 sends an hour from one client, per instance', async () => {
  // One address, many clients (each with its own trusted address): 3 emails, then Email sent with nothing sent.
  let run = withLink('resetPassword', { sendOobCode: ok({}) })
  for (let i = 0; i < 8; i++) assert.deepEqual(await sendTo(run, i % 2 ? ' Victim@Example.com ' : 'victim@example.com', `198.51.100.${i}`), { view: 'sent' })
  assert.equal(run.calls.length, 3)
  // One client, many addresses: 5 sends.
  run = withLink('resetPassword', { sendOobCode: ok({}) })
  for (let i = 0; i < 8; i++) assert.deepEqual(await sendTo(run, `person${i}@example.com`, '203.0.113.7'), { view: 'sent' })
  assert.equal(run.calls.length, 5)
  // A client cannot buy fresh buckets by writing its own first X-Forwarded-For entries: only the last entry,
  // the one the nearest proxy appended, counts.
  run = withLink('resetPassword', { sendOobCode: ok({}) })
  for (let i = 0; i < 8; i++) await sendTo(run, `spoof${i}@example.com`, `10.0.${i}.1, 192.0.2.${i}, 203.0.113.8`)
  assert.equal(run.calls.length, 5)
  quiet(run, 'limits')
})

test('M1: the limiter windows, and the client address it trusts', () => {
  const limit = pageLane().load('lib/auth-action-limit.ts')
  const t0 = Date.UTC(2026, 10, 24, 12), minute = 60_000
  // Per address: 3 an hour, 6 a day.
  const byAddress = at => limit.sendAllowed('a@example.com', `client-${at}`, t0 + at * minute)
  assert.deepEqual([0, 1, 2, 3].map(byAddress), [true, true, true, false])
  assert.deepEqual([61, 62, 63, 64].map(byAddress), [true, true, true, false])
  assert.deepEqual([125, 300, 1439].map(byAddress), [false, false, false])
  assert.equal(byAddress(1441), true)
  // Per client: 5 an hour, 20 a day.
  const byClient = (at, n) => limit.sendAllowed(`c${at}-${n}@example.com`, 'one-client', t0 + at * minute)
  assert.deepEqual([0, 1, 2, 3, 4, 5].map(n => byClient(0, n)), [true, true, true, true, true, false])
  for (const hour of [1, 2, 3]) for (let n = 0; n < 5; n++) assert.equal(byClient(hour * 61, n), true)
  assert.equal(byClient(5 * 61, 0), false, '20 a day')
  // A refused send is not counted against the other key.
  assert.equal(limit.sendAllowed('fresh@example.com', 'another-client', t0), true)
  // Page openings: 30 in 10 minutes.
  const opens = Array.from({ length: 31 }, (_, n) => limit.openAllowed('opener', t0 + n))
  assert.deepEqual([opens.filter(Boolean).length, opens[30]], [30, false])
  assert.equal(limit.openAllowed('opener', t0 + 10 * minute + 1), true)

  const address = (headers, env = {}) => limit.trustedClientAddress(new Headers(headers), env)
  assert.equal(address({ 'x-forwarded-for': '6.6.6.6, 203.0.113.9' }), '203.0.113.9')
  assert.equal(address({ 'x-forwarded-for': ' 203.0.113.9 ' }), '203.0.113.9')
  assert.equal(address({}), 'unknown')
  // App Hosting's own header, read only on App Hosting (FIREBASE_CONFIG set by the platform).
  assert.equal(address({ 'x-fah-client-ip': '198.51.100.4', 'x-forwarded-for': '6.6.6.6, 35.191.1.1' }, { FIREBASE_CONFIG: '{}' }), '198.51.100.4')
  assert.equal(address({ 'x-fah-client-ip': '198.51.100.4', 'x-forwarded-for': '6.6.6.6, 203.0.113.9' }), '203.0.113.9')
  assert.equal(address({ 'x-forwarded-for': '6.6.6.6, 35.191.1.1' }, { FIREBASE_CONFIG: '{}' }), '35.191.1.1')
})

test('M3: verification and email-change codes are applied only for a browser opening the page', async () => {
  const google = {
    verifyEmail: { resetPassword: ok({ email: 'dewi@example.com', requestType: 'VERIFY_EMAIL' }), update: ok({}) },
    verifyAndChangeEmail: { resetPassword: ok({ email: 'dewi@example.com', newEmail: 'dewi.l@example.com', requestType: 'VERIFY_AND_CHANGE_EMAIL' }), update: ok({}) },
    recoverEmail: { resetPassword: ok({ email: 'dewi@example.com', newEmail: 'dewi.l@example.com', requestType: 'RECOVER_EMAIL' }), update: ok({}) },
  }
  for (const mode of Object.keys(google)) {
    for (const [label, requestHeaders] of [
      ['no fetch metadata (a scanner, curl, an old browser)', {}],
      ['a fetch() call', { 'sec-fetch-mode': 'cors', 'sec-fetch-dest': 'empty' }],
      ['a frame', { 'sec-fetch-mode': 'navigate', 'sec-fetch-dest': 'iframe' }],
      ['a no-cors fetch', { 'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': 'document' }],
      ['only the mode', { 'sec-fetch-mode': 'navigate' }],
    ]) {
      const run = withLink(mode, google[mode], { requestHeaders })
      const { thrown } = await run.render('en')
      assert.equal(thrown, `REDIRECT:https://makan-devel.firebaseapp.com/__/auth/action?${query(mode)}`, `${mode}: ${label}`)
      assert.equal(run.calls.length, 0, `${mode}: ${label}: nothing asked of Google, nothing applied`)
    }
    const run = withLink(mode, google[mode])
    assert.equal((await run.render('en')).thrown, null, mode)
    assert.deepEqual(run.calls.map(call => call.method), ['resetPassword', 'update'], mode)
  }
  // A reset link changes nothing by being opened: it is checked and drawn for any request.
  const run = withLink('resetPassword', RESET_OK, { requestHeaders: {} })
  assert.ok(text((await run.render('en')).html).includes(EN.chooseTitle))
})

test('L1: Save password acts only on the link its card was drawn for', async () => {
  const google = { resetPassword: body => ({ body: { email: body.oobCode === CODE ? 'dewi@example.com' : 'mallory@example.com', requestType: 'PASSWORD_RESET' } }) }
  const run = withLink('resetPassword', google)
  const drawn = await run.render('en')
  const seal = /name="seal" value="([^"]+)"/.exec(drawn.html)[1]
  // Another link (a second email, or one planted by another site's top-level navigation) replaces the cookie.
  run.jar.set('makan_auth_action', run.linkCookie(query('resetPassword').replace(CODE, OTHER_CODE)))
  run.calls.length = 0
  const view = await run.action({ intent: 'save', password: PASSWORD, email: 'dewi@example.com', seal, locale: 'en' })
  // The typed password is set on no account: the card is drawn again for the cookie's own link.
  assert.deepEqual(bare(view), { view: 'choose', email: 'mallory@example.com' })
  assert.deepEqual(run.calls.map(call => call.body), [{ oobCode: OTHER_CODE }])
  assert.equal(view.keep, undefined)
  // A post with no seal at all is treated the same way.
  run.calls.length = 0
  assert.equal((await run.action({ intent: 'save', password: PASSWORD, seal: null, locale: 'en' })).view, 'choose')
  assert.ok(run.calls.every(call => !('newPassword' in call.body)))
  // Redrawn for a link that no answer covers: on to Firebase's own page.
  const lost = withLink('resetPassword', { resetPassword: offline })
  await assert.rejects(lost.action({ intent: 'save', password: PASSWORD, seal: 'x', locale: 'en' }), /REDIRECT:https:\/\/makan-devel\.firebaseapp\.com\/__\/auth\/action\?/)
})

test('L2: the link\'s code leaves the cookie once the link is done with, and stays while it is still needed', async () => {
  // The value becomes the done marker, which holds nothing about the link, for ten minutes, with the same attributes.
  const cleared = run => run.cookieSets.filter(set => set.name === 'makan_auth_action' && set.value === 'done' && set.maxAge === 600 && set.httpOnly && set.secure && set.sameSite === 'lax')
  for (const locale of ['en', 'id']) {
    const path = locale === 'id' ? '/id/auth/action' : '/auth/action'
    for (const [label, google, fields] of [
      ['Password changed', RESET_OK, { intent: 'save', password: PASSWORD }],
      ['This link doesn\'t work', { resetPassword: fail('USER_DISABLED') }, { intent: 'save', password: PASSWORD }],
      ['Email sent', { sendOobCode: ok({}) }, { intent: 'send', email: 'dewi@example.com' }],
    ]) {
      const run = withLink('resetPassword', google)
      await run.action({ ...fields, locale })
      assert.deepEqual(cleared(run).map(set => set.path), [path], `${locale} ${label}`)
      assert.equal(run.jar.get('makan_auth_action'), 'done', `${locale} ${label}`)
      assert.doesNotMatch(JSON.stringify(run.cookieSets), /SECRET|OOB|AIza|oobCode|apiKey|dewi/, `${locale} ${label}: nothing about the link`)
    }
    for (const [label, google, fields] of [
      ['no connection', { resetPassword: offline }, { intent: 'save', password: PASSWORD }],
      ['weak', RESET_OK, { intent: 'save', password: '123' }],
      ['expired (Send a new link needs it)', { resetPassword: fail('EXPIRED_OOB_CODE') }, { intent: 'save', password: PASSWORD }],
      ['send refused', { sendOobCode: fail('INTERNAL_ERROR', 500) }, { intent: 'send', email: 'dewi@example.com' }],
      ['the form', {}, { intent: 'forgot' }],
    ]) {
      const run = withLink('resetPassword', google)
      await run.action({ ...fields, locale })
      assert.deepEqual(run.cookieSets, [], `${locale} ${label}`)
    }
  }
})

test('L6: a client opening the page over and over is sent on to Firebase\'s own page, asking Google nothing', async () => {
  const run = withLink('resetPassword', RESET_OK)
  for (let i = 0; i < 30; i++) assert.equal((await run.render('en')).thrown, null, `opening ${i}`)
  assert.equal(run.calls.length, 30)
  assert.equal((await run.render('en')).thrown, `REDIRECT:https://makan-devel.firebaseapp.com/__/auth/action?${query('resetPassword')}`)
  assert.equal(run.calls.length, 30)
  // Another client is not affected.
  run.request.headers['x-forwarded-for'] = '198.51.100.99'
  assert.equal((await run.render('en')).thrown, null)
})

test('L7: an address is put in its line exactly as it is', async () => {
  for (const email of ['a$&b@example.com', "a$'b@example.com", 'a$`b@example.com', 'a$$b@example.com']) {
    const run = withLink('resetPassword', { resetPassword: ok({ email, requestType: 'PASSWORD_RESET' }) })
    assert.ok(text((await run.render('en')).html).includes(EN.forEmail.replace('{email}', () => email)), email)
  }
})

test('server key: a project with none sends every link on to Firebase\'s own page, sets no cookie and asks Google nothing', async () => {
  for (const [env, label] of [[LINK_KEYS_ONLY, 'neither key'], [{ ...LINK_KEYS_ONLY, AUTH_ACTION_SERVER_KEY_PROD: PROD_SERVER_KEY }, 'only the other project\'s'], [{ ...LINK_KEYS_ONLY, AUTH_ACTION_SERVER_KEY_DEV: '   ' }, 'blank']]) {
    for (const mode of ['resetPassword', 'verifyEmail', 'verifyAndChangeEmail', 'recoverEmail', 'signIn']) {
      for (const prefix of ['', '/id']) {
        const answer = ask(`${prefix}/auth/action?${query(mode)}`, { env })
        assert.equal(answer.status, 302, `${label} ${mode}`)
        assert.equal(answer.location, `https://makan-devel.firebaseapp.com/__/auth/action?${query(mode)}`, `${label} ${mode}: the query byte for byte`)
        assert.equal(answer.cookie, null, `${label} ${mode}: no cookie`)
        assertActionHeaders(answer, `${label} ${mode}`)
      }
    }
    // An unknown key is still the not-found page, server key or not.
    assert.equal(new URL(ask(`/auth/action?mode=resetPassword&oobCode=${CODE}&apiKey=AIzaUNKNOWN`, { env }).rewrite).pathname, NOT_FOUND, label)
    // A cookie left from before the key was removed: the page and its posts treat the link as unknown.
    const probe = pageLane()
    const run = pageLane({ env, cookie: probe.linkCookie(query('resetPassword')), google: {} })
    assert.equal((await run.render()).thrown, 'NOT_FOUND', label)
    assert.deepEqual(await run.action({ intent: 'save', password: PASSWORD, seal: '0.x' }), { view: 'expired' }, label)
    assert.deepEqual(await run.action({ intent: 'send', email: 'dewi@example.com', seal: '0.x' }), { view: 'expired' }, label)
    assert.deepEqual(run.calls, [], `${label}: Google is asked nothing`)
    assert.deepEqual(run.logs, [], label)
  }
})

test('server key: it is sent to Google in a header and reaches no redirect, cookie, seal, page or log', async () => {
  const leaked = /SRV-FAKE|server-key/
  for (const path of [`/auth/action?${query('resetPassword')}`, `/id/auth/action?${query('verifyEmail')}`, `/auth/action?${query('signIn')}`, `/auth/action?mode=resetPassword&oobCode=${CODE}&apiKey=AIzaUNKNOWN`, '/auth/action', '/auth-action/en']) {
    const answer = ask(path)
    const all = [...answer.headers.entries()].map(([name, value]) => `${name}: ${value}`).join('\n')
    assert.doesNotMatch(all, leaked, path)
    if (answer.cookie) {
      const stored = Buffer.from(/makan_auth_action=([^;]+)/.exec(answer.cookie)[1], 'base64url').toString('utf8')
      assert.doesNotMatch(stored, leaked, `${path}: the cookie holds the link's query and nothing else`)
    }
  }
  const run = withLink('resetPassword', { ...RESET_OK, sendOobCode: ok({ email: 'dewi@example.com' }) })
  const { html } = await run.render()
  assert.doesNotMatch(html, leaked)
  assert.doesNotMatch(run.seal('save') + run.seal('send'), leaked)
  // The seal is tied to the link's own key and not to the server key: rotating the server key leaves open cards valid.
  const rotated = pageLane({ cookie: run.jar.get('makan_auth_action'), env: { ...ENV, AUTH_ACTION_SERVER_KEY_DEV: 'SRV-FAKE-rotated-SECRET-0000000000000000' } })
  assert.equal(rotated.seal('save'), run.seal('save'))
  const view = await run.action({ intent: 'save', password: PASSWORD, email: 'dewi@example.com' })
  assert.equal(view.view, 'changed')
  assert.doesNotMatch(JSON.stringify(view) + JSON.stringify(run.cookieSets), leaked)
  // Google refusing the server key (restricted, deleted, wrong project) is "no usable answer": Firebase's own page.
  const refused = withLink('resetPassword', { resetPassword: fail('Requests from referer <empty> are blocked.', 403) })
  assert.match((await refused.render()).thrown ?? '', /^REDIRECT:https:\/\/makan-devel\.firebaseapp\.com\/__\/auth\/action\?/)
  assert.doesNotMatch((await refused.render()).thrown, leaked)
  for (const each of [run, refused]) { assert.ok(each.calls.length > 0); quiet(each, 'server key') }
  // A production link is asked about with production's server key, never dev's.
  const prod = pageLane({ google: RESET_OK, cookie: run.linkCookie(query('resetPassword').replace(DEV_KEY, PROD_KEY)) })
  await prod.render()
  assert.deepEqual(prod.calls.map(call => call.init.headers['X-Goog-Api-Key']), [PROD_SERVER_KEY])
})

// ---------- the page drawn again after a form post (the 404 after a successful reset, 24 Nov 2026) ----------

/**
 * Every prop of every element the page returns, as Next would serialise the props it hands a client component
 * into the page's flight data. renderToStaticMarkup never serialises them, so a leak there is invisible to the
 * rendered markup alone (review M10).
 */
function assertNothingSecretInProps(element, label) {
  const seen = new WeakSet()
  const all = JSON.stringify(element, (key, value) => {
    if (realReact.isValidElement(value)) return { type: typeof value.type === 'string' ? value.type : value.type?.name ?? String(value.type), props: value.props }
    if (typeof value === 'function' || typeof value === 'symbol') return undefined
    if (value && typeof value === 'object') { if (seen.has(value)) return '[seen]'; seen.add(value) }
    return value
  })
  assert.ok(all && all.length > 20, `${label}: there are props to check`)
  assert.doesNotMatch(all, /SRV-FAKE|server-key|AIza|OOB-CODE|OTHER-CODE|oobCode|apiKey|test-only-signing-secret|makan-devel|munchies-expo/, `${label}: no key, code, secret or project in the props`)
}

const TERMINAL = [
  ['Password changed', 'changed', RESET_OK, { intent: 'save', password: PASSWORD, email: 'dewi@example.com' }, s => s.passwordChanged],
  ['This link doesn\'t work', 'broken', { resetPassword: fail('USER_DISABLED') }, { intent: 'save', password: PASSWORD }, s => s.doesNotWork],
  ['Email sent', 'sent', { sendOobCode: ok({}) }, { intent: 'send', email: 'dewi@example.com' }, s => s.emailSentTitle],
]

test('after Save password, Send reset link and This link doesn\'t work, the page drawn again shows that card, never the not-found page', async () => {
  for (const locale of ['en', 'id']) {
    const s = words(locale)
    for (const scripted of [true, false]) {
      for (const [label, outcome, google, fields, line] of TERMINAL) {
        const name = `${locale} ${scripted ? 'JavaScript on' : 'JavaScript off'} ${label}`
        const run = withLink('resetPassword', google, { scripted, address: `198.51.102.${TERMINAL.findIndex(each => each[0] === label) * 4 + (scripted ? 0 : 1) + (locale === 'id' ? 2 : 0)}` })
        const liveSeal = run.seal('save')
        let view
        await assert.doesNotReject(async () => { view = await run.action({ ...fields, locale }, fields.intent === 'send' ? { view: 'forgot' } : undefined) }, name)
        assert.equal(view.view, outcome, name)
        const drawn = run.after.last
        assert.ok(drawn, `${name}: the page is drawn again in the action's response`)
        assert.equal(drawn.thrown, null, `${name}: no NOT_FOUND, no redirect`)
        assert.ok(text(drawn.html).includes(line(s)), `${name}: the ${outcome} card`)
        // The page draws the same client component in the same place, so with JavaScript on the client keeps
        // the card the action returned; and drawing it asked Google nothing (operating cost).
        assert.equal(drawn.element.type, run.load('app/auth-action/[locale]/ResetFlow.tsx').default, name)
        assert.equal(run.calls.length, 1, `${name}: one call, the action's own`)
        assertNothingSecretInProps(drawn.element, name)
        // The code has left the browser: the cookie holds the done marker only.
        assert.equal(run.jar.get('makan_auth_action'), 'done', name)

        // A later plain reload: the expired card with Open Makan, no form and no seal, and nothing asked of Google.
        const reload = await run.render(locale)
        assert.equal(reload.thrown, null, `${name}: reload`)
        assert.ok(text(reload.html).includes(s.expired) && text(reload.html).includes(s.openMakan) && !text(reload.html).includes(s.sendNewLink), `${name}: reload`)
        assert.doesNotMatch(reload.html, /name="seal"|<form/, `${name}: reload, no seal and no form`)
        // Any post made with the done marker answers that same card, and never calls Google.
        const before = run.calls.length
        assert.deepEqual(await run.action({ intent: 'forgot', locale }, { view: 'expired' }), { view: 'expired' }, name)
        assert.deepEqual(await run.action({ intent: 'send', email: 'victim@example.com', locale }, { view: 'forgot' }), { view: 'expired' }, name)
        assert.deepEqual(await run.action({ intent: 'send', email: 'not-an-address', locale }, { view: 'forgot' }), { view: 'expired' }, name)
        assert.deepEqual(await run.action({ intent: 'save', password: PASSWORD, seal: liveSeal, locale }), { view: 'expired' }, name)
        assert.equal(run.calls.length, before, `${name}: a done link asks Google nothing`)
        quiet(run, name)
        // Once the marker lapses (ten minutes), the clean address is the not-found page again.
        run.jar.delete('makan_auth_action')
        assert.equal((await run.render(locale)).thrown, 'NOT_FOUND', `${name}: after the marker lapses`)
      }
    }
  }
})

test('with JavaScript off, every other answer is drawn from the action\'s result, asking Google nothing more', async () => {
  for (const locale of ['en', 'id']) {
    const s = words(locale)
    for (const [label, google, fields, previous, check] of [
      ['no connection', { resetPassword: offline }, { intent: 'save', password: PASSWORD, email: 'dewi@example.com' }, undefined, html => text(html).includes(s.networkError) && html.includes(`value="${PASSWORD}"`)],
      ['weak', RESET_OK, { intent: 'save', password: '123' }, undefined, html => /class="rule wrong"/.test(html)],
      ['expired while open', { resetPassword: fail('EXPIRED_OOB_CODE') }, { intent: 'save', password: PASSWORD }, undefined, html => text(html).includes(s.sendNewLink) && /name="seal"/.test(html)],
      ['the form', {}, { intent: 'forgot' }, { view: 'expired' }, html => text(html).includes(s.forgotTitle)],
      ['send refused', { sendOobCode: fail('INTERNAL_ERROR', 500) }, { intent: 'send', email: 'dewi@example.com' }, { view: 'forgot' }, html => text(html).includes(s.networkError)],
    ]) {
      const name = `${locale} ${label}`
      const run = withLink('resetPassword', google, { scripted: false, address: `198.51.103.${label.length + (locale === 'id' ? 100 : 0)}` })
      const view = await run.action({ ...fields, locale }, previous)
      const callsByAction = run.calls.length
      assert.equal(run.after.last.thrown, null, name)
      assert.ok(check(run.after.last.html), `${name}: the action's card`)
      assert.equal(run.calls.length, callsByAction, `${name}: the page drawn again asked Google nothing`)
      assert.equal(view.view === 'changed', false)
      assert.deepEqual(run.cookieSets, [], `${name}: the link is kept`)
      assertNothingSecretInProps(run.after.last.element, name)
    }
  }
  // Two open links, JavaScript off: a Save posted with another link's cookie draws the card for the cookie's
  // link (one check, no password set), and the page drawn again shows that card.
  const google = { resetPassword: body => ({ body: { email: body.oobCode === CODE ? 'dewi@example.com' : 'mallory@example.com', requestType: 'PASSWORD_RESET' } }) }
  const run = withLink('resetPassword', google, { scripted: false })
  const seal = /name="seal" value="([^"]+)"/.exec((await run.render('en')).html)[1]
  run.jar.set('makan_auth_action', run.linkCookie(query('resetPassword').replace(CODE, OTHER_CODE)))
  run.calls.length = 0
  await run.action({ intent: 'save', password: PASSWORD, email: 'dewi@example.com', seal, locale: 'en' })
  assert.deepEqual(run.calls.map(call => call.body), [{ oobCode: OTHER_CODE }])
  assert.ok(text(run.after.last.html).includes(EN.forEmail.replace('{email}', 'mallory@example.com')))
  assert.doesNotMatch(run.after.last.html, new RegExp(PASSWORD))
  // A verification link is never treated as a post's answer: it is checked and applied only on opening.
  const verify = withLink('verifyEmail', { resetPassword: ok({ email: 'a@b.co', requestType: 'VERIFY_EMAIL' }), update: ok({}) })
  verify.request.headers['content-type'] = 'multipart/form-data; boundary=x'
  assert.ok(text((await verify.render('en')).html).includes(EN.emailVerified))
})

test('review L2: nothing the page hands its components carries a key, a code or the signing secret', async () => {
  const cases = [
    ['choose', withLink('resetPassword', RESET_OK)],
    ['expired with a seal', withLink('resetPassword', { resetPassword: fail('EXPIRED_OOB_CODE') })],
    ['broken', withLink('resetPassword', { resetPassword: fail('USER_DISABLED') })],
    ['verified', withLink('verifyEmail', { resetPassword: ok({ email: 'dewi@example.com', requestType: 'VERIFY_EMAIL' }), update: ok({}) })],
    ['email changed', withLink('verifyAndChangeEmail', { resetPassword: ok({ email: 'dewi@example.com', newEmail: 'd2@example.com', requestType: 'VERIFY_AND_CHANGE_EMAIL' }), update: ok({}) })],
    ['done', pageLane({ cookie: 'done' })],
  ]
  for (const [label, run] of cases) {
    for (const locale of ['en', 'id']) {
      const { element, thrown } = await run.render(locale)
      assert.equal(thrown, null, label)
      assertNothingSecretInProps(element, `${label} ${locale}`)
    }
  }
  // The link a page or action handles holds no server key at all: it is looked up by project name at call time.
  const run = withLink('resetPassword', RESET_OK)
  const link = run.flow.readStoredLink(run.flow.decodeStoredLink(run.jar.get('makan_auth_action')), ENV)
  assert.doesNotMatch(JSON.stringify(link), /SRV-FAKE/)
  assert.deepEqual(Object.keys(link.project).sort(), ['apiKey', 'authDomain', 'name'])
  // A server key removed after the link was read: no call, and the link goes on to Firebase's own page.
  const removed = withLink('resetPassword', RESET_OK, { env: { ...ENV } })
  const toolkit = removed.load('lib/identity-toolkit.ts')
  delete removed.env.AUTH_ACTION_SERVER_KEY_DEV
  assert.deepEqual(await toolkit.checkCode('dev', CODE), { ok: false, reason: 'unavailable' })
  assert.equal(removed.calls.length, 0)
})

test('review L1: a redirect from Identity Toolkit is no usable answer; the key and the body are never sent on', async () => {
  const elsewhere = { url: 'https://evil.example/collect', answer: { email: 'dewi@example.com', requestType: 'PASSWORD_RESET' } }
  for (const status of [302, 307, 308]) {
    const run = withLink('resetPassword', { resetPassword: () => ({ redirectTo: elsewhere, status }), sendOobCode: () => ({ redirectTo: elsewhere, status }) })
    assert.equal((await run.render('en')).thrown, `REDIRECT:https://makan-devel.firebaseapp.com/__/auth/action?${query('resetPassword')}`, String(status))
    assert.ok(run.calls.every(call => call.method !== 'followed'), `${status}: not followed`)
    assert.ok(run.calls.every(call => call.init.redirect === 'error'))
    assert.deepEqual(bare(await run.action({ intent: 'send', email: 'dewi@example.com', locale: 'en' }, { view: 'forgot' })), { view: 'forgot', error: 'network' })
    assert.ok(run.calls.every(call => call.method !== 'followed'))
  }
})

// ---------- review L2 and L3 of the 404 fix (REVIEW_RESET_404_FIX.md) ----------

test('review L2: the new password is in no answer and no page drawn after a post, except a JavaScript-off weak or no-connection Save', async () => {
  const SHORT = 'Qz7kW' // shorter than the minimum: refused before Google is asked
  const save = password => ({ intent: 'save', password, email: 'dewi@example.com' })
  // Every outcome of every intent. Each post carries the new password, even where its card has no password
  // field, so a field echoed by mistake is caught too. `kept` marks the one approved case.
  const CASES = [
    ['Save: changed', link => link(RESET_OK), save(PASSWORD), undefined, 'changed', false],
    ['Save: this link doesn\'t work', link => link({ resetPassword: fail('USER_DISABLED') }), save(PASSWORD), undefined, 'broken', false],
    ['Save: too short', link => link(RESET_OK), save(SHORT), undefined, 'choose', true],
    ['Save: Google says weak', link => link({ resetPassword: fail('WEAK_PASSWORD : Password should be at least 6 characters') }), save(PASSWORD), undefined, 'choose', true],
    ['Save: no connection', link => link({ resetPassword: offline }), save(PASSWORD), undefined, 'choose', true],
    ['Save: expired', link => link({ resetPassword: fail('EXPIRED_OOB_CODE') }), save(PASSWORD), undefined, 'expired', false],
    ['Save: used', link => link({ resetPassword: fail('INVALID_OOB_CODE') }), save(PASSWORD), undefined, 'expired', false],
    ['Save: another link\'s card', link => link(RESET_OK), { ...save(PASSWORD), seal: '0.another-card' }, undefined, 'choose', false],
    ['Save: done link', (_, done) => done(), save(PASSWORD), undefined, 'expired', false],
    ['Send a new link', link => link({}), { intent: 'forgot', password: PASSWORD }, { view: 'expired' }, 'forgot', false],
    ['Send a new link: done link', (_, done) => done(), { intent: 'forgot', password: PASSWORD }, { view: 'expired' }, 'expired', false],
    ['Send a new link: no seal', link => link({}), { intent: 'forgot', password: PASSWORD, seal: '' }, { view: 'expired' }, 'expired', false],
    ['Send reset link: no seal', link => link({ sendOobCode: ok({}) }), { intent: 'send', email: 'dewi@example.com', password: PASSWORD, seal: '' }, { view: 'forgot' }, 'expired', false],
    ['Send reset link: sent', link => link({ sendOobCode: ok({}) }), { intent: 'send', email: 'dewi@example.com', password: PASSWORD }, { view: 'forgot' }, 'sent', false],
    ['Send reset link: refused', link => link({ sendOobCode: fail('INTERNAL_ERROR', 500) }), { intent: 'send', email: 'dewi@example.com', password: PASSWORD }, { view: 'forgot' }, 'forgot', false],
    ['Send reset link: not an address', link => link({}), { intent: 'send', email: 'not-an-address', password: PASSWORD }, { view: 'forgot' }, 'forgot', false],
    ['Send reset link: done link', (_, done) => done(), { intent: 'send', email: 'dewi@example.com', password: PASSWORD }, { view: 'forgot' }, 'expired', false],
    ['an unknown intent', link => link(RESET_OK), { intent: 'other', password: PASSWORD }, undefined, 'choose', false],
  ]
  for (const locale of ['en', 'id']) {
    for (const scripted of [true, false]) {
      for (const [label, make, fields, previous, outcome, kept] of CASES) {
        const name = `${locale} ${scripted ? 'JavaScript on' : 'JavaScript off'} ${label}`
        const run = make(google => withLink('resetPassword', google, { scripted }), () => pageLane({ cookie: 'done', scripted }))
        const typed = fields.password
        const view = await run.action({ ...fields, locale }, previous)
        assert.equal(view.view, outcome, name)
        // With JavaScript off the page is always drawn again in the post's answer.
        if (!scripted) assert.ok(run.after.last, `${name}: the page drawn again`)
        const drawn = run.after.last?.html ?? ''
        // What the client draws from the answer with JavaScript on.
        const card = run.card(view, locale)
        if (kept && !scripted) {
          assert.equal(view.keep, typed, `${name}: handed back so it need not be typed again`)
          assert.ok(drawn.includes(`value="${typed}"`), `${name}: in the field drawn again`)
        } else {
          assert.equal(JSON.stringify(view).includes(typed), false, `${name}: not in the action's answer`)
          assert.equal(drawn.includes(typed), false, `${name}: not in the page drawn again`)
          assert.equal(card.includes(typed), false, `${name}: not in the card drawn from the answer`)
        }
      }
    }
  }
})

test('review L3: a post\'s page drawn again is not a page opening; the opening limit still applies to openings', async () => {
  const run = withLink('resetPassword', RESET_OK, { scripted: false, address: '198.51.104.7' })
  // 31 JavaScript-off posts from one client, past the 30 openings allowed in 10 minutes: every one is drawn.
  const posts = [
    { intent: 'forgot' },
    { intent: 'save', password: '123', email: 'dewi@example.com' },
    { intent: 'send', email: 'not-an-address' },
  ]
  for (let i = 0; i < 31; i++) {
    const fields = posts[i % posts.length]
    await assert.doesNotReject(run.action({ ...fields, locale: 'en' }, fields.intent === 'save' ? undefined : { view: 'forgot' }), `post ${i + 1}`)
    assert.equal(run.after.last.thrown, null, `post ${i + 1}: drawn, not sent on to Firebase's page`)
  }
  assert.equal(run.calls.length, 0, 'the posts and their pages asked Google nothing')
  // The same client's openings are still counted: 30 drawn, the 31st sent on to Firebase's own page.
  for (let i = 0; i < 30; i++) assert.equal((await run.render('en')).thrown, null, `opening ${i + 1}`)
  assert.equal((await run.render('en')).thrown, `REDIRECT:https://makan-devel.firebaseapp.com/__/auth/action?${query('resetPassword')}`, 'opening 31')
})
