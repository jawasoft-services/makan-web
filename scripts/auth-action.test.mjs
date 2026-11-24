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
const ENV = { AUTH_ACTION_KEY_DEV: DEV_KEY, AUTH_ACTION_KEY_PROD: PROD_KEY }
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
  // The authDomain comes from configuration, never from the link; a configured domain must be a bare host.
  assert.equal(new URL(ask(`/auth/action?mode=signIn&apiKey=${DEV_KEY}`, { env: { ...ENV, AUTH_ACTION_DOMAIN_DEV: 'auth.makan.example' } }).location).host, 'auth.makan.example')
  for (const bad of ['evil.example/x', 'https://evil.example', 'evil.example?', '@evil.example', 'localhost']) {
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
    assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=lax/i); assert.match(cookie, /Secure/i); assert.match(cookie, /Max-Age=86400/)
    assert.doesNotMatch(cookie, /SECRET/, 'the cookie value is encoded, not the code in clear')
    const { decodeStoredLink } = lane({ env: ENV }).load('lib/auth-action.ts')
    assert.equal(decodeStoredLink(cookie.split(';')[0].split('=')[1]).query, path.slice(path.indexOf('?') + 1))
    assertActionHeaders(answer, path)
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

/** A fake Identity Toolkit: `answers[method]` is a function of the body returning { status, body } or throwing. */
function fakeGoogle(answers) {
  const calls = []
  const fetch = async (url, init) => {
    const method = /accounts:(\w+)\?/.exec(url)?.[1]
    const body = JSON.parse(init.body)
    calls.push({ url, method, body, init })
    const answer = answers[method]
    if (!answer) throw new Error(`unexpected call ${method}`)
    const { status = 200, body: out = {}, raw } = answer(body)
    return { ok: status >= 200 && status < 300, status, json: async () => (raw !== undefined ? JSON.parse(raw) : out) }
  }
  return { fetch, calls }
}
const fail = (message, status = 400) => () => ({ status, body: { error: { code: status, message } } })
const offline = () => { throw new TypeError(`fetch failed ${CODE} ${PASSWORD}`) }
const ok = body => () => ({ body })

function pageLane({ google = {}, cookie, scripted = true, env = ENV, address = '192.0.2.20' } = {}) {
  const modules = new Map(), logs = [], { fetch, calls } = fakeGoogle(google)
  const jar = new Map(cookie === undefined ? [] : [['makan_auth_action', cookie]])
  const loggers = Object.fromEntries(['log', 'info', 'warn', 'error', 'debug'].map(level => [level, (...args) => logs.push(args.map(String).join(' '))]))
  function load(relative) {
    if (modules.has(relative)) return modules.get(relative)
    const exports = {}; modules.set(relative, exports)
    const code = ts.transpileModule(readFileSync(resolve(relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
    const importModule = id => {
      if (id === 'server-only') return {}
      if (id === 'react' || id === 'react/jsx-runtime') return id === 'react' ? realReact : require(id)
      if (id === 'next/headers') return { cookies: async () => ({ get: name => (jar.has(name) ? { name, value: jar.get(name) } : undefined) }), headers: async () => new Headers({ 'x-forwarded-for': address, ...(scripted ? { 'next-action': 'abc' } : {}) }) }
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
  async function render(locale = 'en') {
    try {
      const element = await load('app/auth-action/[locale]/page.tsx').default({ params: Promise.resolve({ locale }) })
      return { html: renderToStaticMarkup(element), thrown: null }
    } catch (error) { return { html: '', thrown: error.message } }
  }
  /** Renders the reset card for a state the form action returned. */
  function card(view, locale = 'en') {
    const ResetFlow = load('app/auth-action/[locale]/ResetFlow.tsx').default
    return renderToStaticMarkup(realReact.createElement(ResetFlow, { initial: view, strings: words(locale), locale, supportHref: locale === 'id' ? '/id/support' : '/support', appPage: '/app' }))
  }
  const action = async (fields, previous = { view: 'choose', email: 'dewi@example.com' }) => {
    const form = new FormData(); for (const [key, value] of Object.entries(fields)) form.set(key, value)
    return load('app/auth-action/[locale]/actions.ts').resetFlowAction(previous, form)
  }
  return { load, render, card, action, calls, logs, jar, linkCookie }
}
const withLink = (mode, google, extra = {}) => {
  const probe = pageLane()
  return pageLane({ google, cookie: probe.linkCookie(query(mode)), ...extra })
}
const text = html => html.replace(/<[^>]+>/g, ' ').replace(/&#x27;|&#39;/g, '\'').replace(/&amp;/g, '&')
const quiet = (run, label) => {
  assert.deepEqual(run.logs, [], `${label}: nothing is logged`)
  for (const call of run.calls) {
    assert.doesNotMatch(call.url, /SECRET|oobCode=|newPassword=|password=/, `${label}: the code and the password are never in a URL`)
    assert.equal(call.init.method, 'POST')
    assert.equal(call.url.startsWith('https://identitytoolkit.googleapis.com/v1/accounts:'), true)
    assert.ok(call.url.endsWith(`?key=${DEV_KEY}`), 'the link\'s own key')
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

  test(`${locale}: reset link expired or used: This link has expired. with Send a new link (si-fp-expired)`, async () => {
    for (const message of ['EXPIRED_OOB_CODE', 'INVALID_OOB_CODE']) {
      const run = withLink('resetPassword', { resetPassword: fail(message) })
      const shown = text((await run.render(locale)).html)
      assert.ok(shown.includes(s.expired) && shown.includes(s.sendNewLink), message)
      quiet(run, message)
    }
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
    assert.deepEqual(view, { view: 'choose', email: 'dewi@example.com', error: 'network' })
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
      assert.deepEqual(await run.action({ intent: 'save', password: PASSWORD, email: 'dewi@example.com', locale }), { view: 'expired' })
    }
    // Never a password checker: a valid-looking email and password posted with a used or expired code (even
    // claiming an earlier save got no answer) gets the expired card, and no sign-in call is ever made.
    for (const message of ['EXPIRED_OOB_CODE', 'INVALID_OOB_CODE']) {
      run = withLink('resetPassword', { resetPassword: fail(message), signInWithPassword: ok({ idToken: 'x' }) })
      const view = await run.action({ intent: 'save', password: PASSWORD, email: 'someone.else@example.com', pending: '1', locale })
      assert.deepEqual(view, { view: 'expired' }, message)
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
    assert.deepEqual(form, { view: 'forgot' })
    assert.equal(run.calls.length, 0)
    const html = run.card(form, locale)
    for (const line of [s.forgotTitle, s.forgotBody, s.emailLabel, s.sendResetLink]) assert.ok(text(html).includes(line), line)
    assert.match(html, /type="email"/)

    const answers = [ok({ email: 'dewi@example.com' }), fail('EMAIL_NOT_FOUND'), fail('USER_DISABLED'), fail('USER_NOT_FOUND'), fail('TOO_MANY_ATTEMPTS_TRY_LATER'),
      fail('RESET_PASSWORD_EXCEED_LIMIT'), fail('INTERNAL_ERROR', 500), fail('API_KEY_HTTP_REFERRER_BLOCKED', 403), () => ({ status: 502, raw: '<html>bad gateway</html>' })]
    for (const [index, answer] of answers.entries()) {
      run = withLink('resetPassword', { sendOobCode: answer }, { address: `198.51.100.${index}` })
      const view = await run.action({ intent: 'send', email: ' dewi@example.com ', locale }, { view: 'forgot' })
      assert.deepEqual(view, { view: 'sent' }, `answer ${index}`)
      assert.deepEqual(run.calls.map(call => call.body), [{ requestType: 'PASSWORD_RESET', email: 'dewi@example.com' }])
      quiet(run, `send ${index}`)
    }
    const sent = run.card({ view: 'sent' }, locale)
    assert.ok(text(sent).includes(s.emailSentTitle) && text(sent).includes(s.emailSentBody))
    assert.doesNotMatch(sent, /<button|<a /, 'Email sent has no button')

    // No answer at all: the si-fp-8 line under the form, the address kept.
    run = withLink('resetPassword', { sendOobCode: offline }, { address: '203.0.113.1' })
    const offlineView = await run.action({ intent: 'send', email: 'dewi@example.com', locale }, { view: 'forgot' })
    assert.deepEqual(offlineView, { view: 'forgot', error: 'network' })
    assert.ok(text(run.card(offlineView, locale)).includes(s.networkError))
    quiet(run, 'send offline')

    // A typo: the invalid-address line, nothing sent.
    run = withLink('resetPassword', { sendOobCode: ok({}) }, { address: '203.0.113.2' })
    const typo = await run.action({ intent: 'send', email: 'dewi.example.com', locale }, { view: 'forgot' })
    assert.equal(typo.error, 'email'); assert.equal(run.calls.length, 0)
    assert.ok(text(run.card(typo, locale)).includes(s.invalidEmail))

    // Past the per-address limit: still Email sent, and no more email requests.
    run = withLink('resetPassword', { sendOobCode: ok({}) }, { address: `203.0.113.${locale === 'en' ? 50 : 51}` })
    for (let i = 0; i < 8; i++) assert.deepEqual(await run.action({ intent: 'send', email: 'dewi@example.com', locale }, { view: 'forgot' }), { view: 'sent' })
    assert.ok(run.calls.length <= 5, `${run.calls.length} sends`)
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
