import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { lane } from './share-v2-test-lane.mjs'

// RM20616 O2 Q8 — the weekly owner email's two buttons, /o/table-card?b=<businessId> and /o/thanks?b=<businessId>.
// Devon: "Existing \"Open in app\" page (Recommended)". With OWNER_EMAIL_LINKS=1 both hand on to the site's
// existing /app page (a phone goes to its store; anything else to the home page's store badges and QR code),
// in the visitor's language. With the switch absent they are what they were on makan-web main 8b52a4e: the
// site's not-found page. The business id is checked, never passed on, never logged.
const BASE = '8b52a4e4aaefc77dc6909bab4700ce2aecbe4d17'
const require = createRequire(import.meta.url)
const { NextRequest } = require('next/server')
const atBase = path => {
  try { return execFileSync('git', ['show', `${BASE}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }) } catch { return null }
}
const baseAvailable = atBase('proxy.ts') !== null

const ID = 'biz0000000001'
const FIRESTORE_ID = 'Ab3dEf6hIj9kLm2nOp5q'

function answer(proxy, path, headers = {}) {
  const response = proxy(new NextRequest(`https://www.makanofficial.com${path}`, { headers: { host: 'www.makanofficial.com', 'x-forwarded-for': '192.0.2.10', ...headers } }))
  return { status: response.status, location: response.headers.get('location'), rewrite: response.headers.get('x-middleware-rewrite'), intl: response.headers.get('x-test-intl'), robots: response.headers.get('x-robots-tag'), cookie: response.headers.get('set-cookie'), cache: response.headers.get('cache-control') }
}
const proxyWith = env => lane({ env }).load('proxy.ts').proxy

const GOOD = [`/o/table-card?b=${ID}`, `/o/thanks?b=${ID}`, `/id/o/table-card?b=${ID}`, `/id/o/thanks?b=${ID}`, `/o/table-card?b=${FIRESTORE_ID}`, `/id/o/thanks?b=${FIRESTORE_ID}&utm_source=email`]
const BAD_B = ['', '?', '?b=', '?b=short', `?b=${'a'.repeat(41)}`, `?b=${ID}-x`, `?b=${ID}%00`, `?b=%3Cscript%3Ealert(1)%3C%2Fscript%3E`, '?b=..%2F..%2Fetc', `?b=${ID}&b=${FIRESTORE_ID}`, `?B=${ID}`, `?b=${ID}%20`, `?b=biz%E2%80%8B000000001`]
const BAD = ['/o/table-card', '/o/thanks', '/id/o/table-card', '/id/o/thanks'].flatMap(path => BAD_B.map(query => `${path}${query}`))
const NEIGHBOURS = ['/o', '/id/o', '/o/', '/o/table-card/x', `/o/table-card/x?b=${ID}`, `/o/other?b=${ID}`, `/O/table-card?b=${ID}`, `/o/Thanks?b=${ID}`, `/o/table-card.html?b=${ID}`, `/x/o/table-card?b=${ID}`, `/id/id/o/thanks?b=${ID}`,
  '/', '/id', '/app', '/id/app', '/places', '/places/warung-bu-sri-abc123', '/p/ChIJknownplace01', '/invite/abcdefghijkl', '/verified', '/claim/x']
const OFF = [{}, { OWNER_EMAIL_LINKS: '' }, { OWNER_EMAIL_LINKS: '0' }, { OWNER_EMAIL_LINKS: 'true' }, { OWNER_EMAIL_LINKS: 'on' }, { OWNER_EMAIL_LINKS: ' 1' }, { OWNER_EMAIL_LINKS: '1 ' }, { OWNER_EMAIL_LINKS: '01' }]

test('switch off: the two addresses, and every address near them, are answered exactly as main 8b52a4e answers them', { skip: !baseAvailable && 'commit 8b52a4e is not in this clone' }, () => {
  const main = lane({ env: {}, source: path => (path === 'proxy.ts' ? atBase('proxy.ts') : null) }).load('proxy.ts').proxy
  for (const env of OFF) {
    const now = proxyWith(env)
    for (const path of [...GOOD, ...BAD, ...NEIGHBOURS]) {
      assert.deepEqual(answer(now, path), answer(main, path), `${path} with ${JSON.stringify(env)}`)
      assert.deepEqual(answer(now, path, { host: 'makanofficial.com' }), answer(main, path, { host: 'makanofficial.com' }), `apex ${path}`)
    }
  }
})

test('switch off: an email link reaches the not-found page, never the app page', () => {
  // There is no page under /o, so a request the proxy passes on (or sends to English) ends at the site's 404.
  assert.equal(existsSync('app/[locale]/o'), false)
  assert.equal(existsSync('app/o'), false)
  for (const env of OFF) {
    const proxy = proxyWith(env)
    for (const path of GOOD) {
      const response = answer(proxy, path)
      assert.equal(response.rewrite, null, path)
      assert.doesNotMatch(String(response.location), /\/app(\?|$)/, path)
      if (path.startsWith('/id/')) assert.equal(new URL(response.location).pathname, path.slice(3).split('?')[0], path)
      else assert.equal(response.intl, path.split('?')[0], path)
    }
  }
})

test('switch on: each address, in each language, hands on to the existing /app page and drops the business id', () => {
  const proxy = proxyWith({ OWNER_EMAIL_LINKS: '1' })
  for (const path of GOOD) {
    const response = answer(proxy, path)
    const location = new URL(response.location)
    assert.equal(response.status, 307, path)
    assert.equal(location.origin, 'https://www.makanofficial.com', path)
    assert.equal(location.pathname, path.startsWith('/id/') ? '/id/app' : '/app', path)
    assert.equal(location.search, '', path)
    assert.equal(location.hash, '', path)
    assert.doesNotMatch(response.location, new RegExp(`${ID}|${FIRESTORE_ID}`), path)
    assert.equal(response.rewrite, null, path)
    // The switch is read per request: a cached redirect would outlive turning it off.
    assert.equal(response.cache, 'private, no-store', path)
  }
  // /en/... is still stripped first (308), and the address it lands on is then handed on.
  const en = answer(proxy, `/en/o/thanks?b=${ID}`)
  assert.equal(en.status, 308)
  assert.equal(new URL(en.location).pathname, '/o/thanks')
  // The apex host is still sent to www first, with its query, as every other address is.
  const apex = answer(proxy, `/o/table-card?b=${ID}`, { host: 'makanofficial.com' })
  assert.equal(apex.status, 308)
  assert.equal(apex.location, `https://www.makanofficial.com/o/table-card?b=${ID}`)
  // The page it hands on to exists in both languages.
  assert.match(readFileSync('app/[locale]/app/route.ts', 'utf8'), /\{ locale: "en" \}, \{ locale: "id" \}/)
})

test('switch on: a missing or bad business id is refused (the address is answered as with the switch off)', () => {
  const on = proxyWith({ OWNER_EMAIL_LINKS: '1' })
  const off = proxyWith({})
  for (const path of BAD) {
    const response = answer(on, path)
    assert.deepEqual(response, answer(off, path), path)
    assert.doesNotMatch(String(response.location), /\/app(\?|$)/, path)
  }
})

test('switch on: nothing else moves', () => {
  const on = proxyWith({ OWNER_EMAIL_LINKS: '1' })
  const off = proxyWith({})
  for (const path of NEIGHBOURS) assert.deepEqual(answer(on, path), answer(off, path), path)
})

test('the business id is never logged', () => {
  // The lane hands every loaded module a console that records each call; the real console is watched too.
  const calls = []
  const methods = ['log', 'info', 'warn', 'error', 'debug', 'trace']
  const saved = Object.fromEntries(methods.map(name => [name, console[name]]))
  for (const name of methods) console[name] = (...args) => calls.push(args.map(String).join(' '))
  try {
    for (const env of [{}, { OWNER_EMAIL_LINKS: '1' }]) {
      const run = lane({ env })
      const proxy = run.load('proxy.ts').proxy
      for (const path of [...GOOD, ...BAD]) answer(proxy, path)
      calls.push(...run.logs)
    }
  } finally {
    for (const name of methods) console[name] = saved[name]
  }
  assert.deepEqual(calls.filter(line => line.includes(ID) || line.includes(FIRESTORE_ID)), [])
  assert.doesNotMatch(readFileSync('lib/owner-email-links.ts', 'utf8'), /console\./)
})

test('the switch is on only for the exact value "1"', () => {
  const on = env => lane({ env }).load('lib/owner-email-links.ts').ownerEmailLinksOn()
  assert.equal(on({}), false)
  for (const value of ['', '0', 'true', 'on', ' 1', '1 ', '01']) assert.equal(on({ OWNER_EMAIL_LINKS: value }), false, JSON.stringify(value))
  assert.equal(on({ OWNER_EMAIL_LINKS: '1' }), true)
})
