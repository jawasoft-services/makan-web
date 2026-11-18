import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const compile = (path, imports) => {
  const exports = {}
  const code = ts.transpileModule(readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  new Function('exports', 'require', code)(exports, id => { assert.ok(id in imports, `Forbidden provider: ${id}`); return imports[id] })
  return exports
}

test('both locales and OG paths share the existing profile token bucket; unrelated routes remain unaffected', () => {
  const availability = compile('i18n/availability.ts', {})
  const limits = compile('lib/rate-limit.ts', { 'server-only': {} })
  const next = require('next/server')
  const middleware = () => request => next.NextResponse.next()
  const { proxy } = compile('proxy.ts', {
    'next-intl/middleware': { default: middleware }, 'next-intl/routing': { defineRouting: value => value },
    'next/server': next, '@/i18n/availability': availability, '@/i18n/routing': { routing: {} }, '@/lib/rate-limit': limits,
  })
  const request = path => new next.NextRequest(`https://www.makanofficial.com${path}`, { headers: { host: 'www.makanofficial.com', 'x-forwarded-for': '192.0.2.10' } })
  for (const path of ['/u/dewi-k3f9q2x7', '/id/u/dewi-k3f9q2x7', '/u/dewi-k3f9q2x7/opengraph-image']) {
    assert.equal(availability.isIndonesianRoute(path), true)
    const response = proxy(request(path))
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, follow')
  }
  let response
  for (let i = 0; i < 60; i++) response = proxy(request('/id/u/dewi-k3f9q2x7/opengraph-image'))
  assert.equal(response.status, 429)
  assert.equal(response.headers.get('retry-after'), '2')
  assert.equal(proxy(request('/places')).status, 200)
})

test('no profile URLs are added to the sitemap or a public directory', () => {
  assert.doesNotMatch(readFileSync('app/sitemap.ts', 'utf8'), /getPublicProfile|publicProfileKeys|\/u\//)
  assert.doesNotMatch(readFileSync('lib/public-profile.ts', 'utf8'), /db\.(?:doc|collection)\(['"`]webAggregates/)
})
