import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Run the real TypeScript helpers in a sandbox: no bundler, no Firebase, no network.
function loadModule(file, sandbox = {}) {
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  })
  const exports = {}
  runInNewContext(outputText, { exports, URL, URLSearchParams, Request, Headers, Buffer, process: { env: {} }, ...sandbox, require() { return {} } }, { filename: file })
  return exports
}

const { safeJsonLd } = loadModule('lib/safe-json-ld.ts')

test('safeJsonLd: a </script> payload can never close the element', () => {
  const attack = '</script><script>alert(1)</script>'
  const out = safeJsonLd({ '@type': 'Restaurant', name: attack })
  assert.doesNotMatch(out, /<|>/)
  assert.equal(JSON.parse(out).name, attack)
})

test('safeJsonLd: U+2028 / U+2029 and & are escaped as \\uXXXX', () => {
  const ls = String.fromCharCode(0x2028), ps = String.fromCharCode(0x2029)
  const name = `A${ls}B${ps}C & D`
  const out = safeJsonLd({ name })
  assert.ok(!out.includes(ls) && !out.includes(ps) && !out.includes('&'))
  assert.match(out, /\\u2028/)
  assert.match(out, /\\u2029/)
  assert.match(out, /\\u0026/)
  assert.equal(JSON.parse(out).name, name)
})

test('safeJsonLd: an imageURL and cuisine label payload survive as data only', () => {
  const imageURL = 'https://firebasestorage.googleapis.com/v0/b/x/o/m.jpg?alt=media&token=1"></script><img src=x onerror=alert(1)>'
  const schema = { image: [imageURL], servesCuisine: ['Padang</script>', 'Sate'] }
  const out = safeJsonLd(schema)
  assert.doesNotMatch(out, /<\/script|<img/)
  assert.deepEqual(JSON.parse(out), schema)
})

const { thumbSource } = loadModule('lib/thumb.ts')
const BUCKET = 'https://firebasestorage.googleapis.com/v0/b/munchies-expo.firebasestorage.app/o/'

test('thumbSource: accepts the real bucket and keeps only alt and token', () => {
  const real = `${BUCKET}Meals%2Fuid%2Fphoto.jpg?alt=media&token=abc-123`
  assert.equal(thumbSource(real), real)
  assert.equal(thumbSource(`${BUCKET}Meals%2Fa.jpg?token=t&alt=media&evil=1#frag`), `${BUCKET}Meals%2Fa.jpg?alt=media&token=t`)
  assert.equal(thumbSource(`${BUCKET}Meals%2Fa.jpg`), `${BUCKET}Meals%2Fa.jpg`)
  assert.equal(thumbSource('https://firebasestorage.googleapis.com/v0/b/other/../munchies-expo.firebasestorage.app/o/a.jpg'), `${BUCKET}a.jpg`, 'dot segments resolve before the bucket check')
})

test('thumbSource: rejects look-alike buckets, http, other hosts and junk', () => {
  for (const bad of [
    'https://firebasestorage.googleapis.com/v0/b/munchies-expo-evil.firebasestorage.app/o/a.jpg?alt=media',
    'https://firebasestorage.googleapis.com/v0/b/munchies-expo.firebasestorage.app.evil.com/o/a.jpg',
    'http://firebasestorage.googleapis.com/v0/b/munchies-expo.firebasestorage.app/o/a.jpg',
    'https://firebasestorage.googleapis.com:8443/v0/b/munchies-expo.firebasestorage.app/o/a.jpg',
    'https://firebasestorage.googleapis.com.evil.com/v0/b/munchies-expo.firebasestorage.app/o/a.jpg',
    'https://evil.com/v0/b/munchies-expo.firebasestorage.app/o/a.jpg',
    'https://firebasestorage.googleapis.com/v0/b/munchies-expo.firebasestorage.app/o',
    'not a url', '',
  ]) assert.equal(thumbSource(bad), null, bad)
})

const { rateLimited, clientAddress } = loadModule('lib/rate-limit.ts')
const from = (ip) => new Request('https://www.makanofficial.com/api/x', { headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` } })

test('rateLimited: a burst is allowed, the next request is not, and the bucket refills', () => {
  const limit = { burst: 3, perMinute: 60 }
  let now = 1_000_000
  for (let i = 0; i < 3; i++) assert.equal(rateLimited(from('1.1.1.1'), 't', limit, now), false)
  assert.equal(rateLimited(from('1.1.1.1'), 't', limit, now), true)
  assert.equal(rateLimited(from('2.2.2.2'), 't', limit, now), false, 'another address has its own bucket')
  now += 1000
  assert.equal(rateLimited(from('1.1.1.1'), 't', limit, now), false, 'one token refills per second')
  assert.equal(rateLimited(from('1.1.1.1'), 't', limit, now), true)
})

test('clientAddress: first forwarded hop, then x-real-ip, then unknown', () => {
  assert.equal(clientAddress(from('3.3.3.3')), '3.3.3.3')
  assert.equal(clientAddress(new Request('https://x', { headers: { 'x-real-ip': '4.4.4.4' } })), '4.4.4.4')
  assert.equal(clientAddress(new Request('https://x')), 'unknown')
})

const { isAllowedOrigin } = loadModule('lib/api-validation.ts')
const OURS = ['https://www.makanofficial.com']
const post = (headers) => new Request('https://www.makanofficial.com/api/contact', { method: 'POST', headers })

test('isAllowedOrigin: Origin OR Sec-Fetch-Site proves same-site; neither rejects', () => {
  assert.equal(isAllowedOrigin(post({ origin: 'https://www.makanofficial.com' }), OURS), true)
  assert.equal(isAllowedOrigin(post({ 'sec-fetch-site': 'same-origin' }), OURS), true, 'Safari: no Origin')
  assert.equal(isAllowedOrigin(post({ 'sec-fetch-site': 'same-site' }), OURS), true)
  assert.equal(isAllowedOrigin(post({ origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' }), OURS), false)
  assert.equal(isAllowedOrigin(post({ 'sec-fetch-site': 'cross-site' }), OURS), false)
  assert.equal(isAllowedOrigin(post({ 'sec-fetch-site': 'none' }), OURS), false)
  assert.equal(isAllowedOrigin(post({}), OURS), false, 'curl with neither header')
})
