// Usage: node scripts/check-locale-detection.mjs https://www.makanofficial.com
// Devon, 28 Nov 2026: the site follows the visitor's system language; only an explicit switcher pick (MAKAN_LANG)
// is remembered; the old NEXT_LOCALE cookie no longer counts; no visit sets a cookie; /id addresses show Bahasa.
import assert from 'node:assert/strict'
const base = new URL(process.argv[2] ?? 'http://localhost:3000')
const cases = [
  ['/', 'en-GB', '', 200, null],
  ['/', 'id-ID', '', 307, '/id'],
  ['/', 'en-GB,en;q=0.9,id;q=0.8', '', 200, null],
  ['/', 'en-GB', 'NEXT_LOCALE=id', 200, null],
  ['/', 'id-ID', 'NEXT_LOCALE=en', 307, '/id'],
  ['/', 'en-GB', 'MAKAN_LANG=id', 307, '/id'],
  ['/', 'id-ID', 'MAKAN_LANG=en', 200, null],
  ['/partner', 'id-ID', '', 307, '/id/partner'],
  ['/id', 'en-GB', '', 200, null],
  ['/id/blog', 'en-GB', '', 307, '/blog'],
]
let failed = 0
for (const [path, lang, cookie, status, to] of cases) {
  const response = await fetch(new URL(path, base), { redirect: 'manual', headers: { 'accept-language': lang, 'sec-fetch-dest': 'document', ...(cookie ? { cookie } : {}) } })
  const where = response.headers.get('location'), got = where ? new URL(where, base).pathname : null
  const setCookie = response.headers.get('set-cookie') ?? ''
  const ok = response.status === status && got === to && !/NEXT_LOCALE|MAKAN_LANG/.test(setCookie)
  if (!ok) failed++
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${path} [${lang}${cookie ? '; ' + cookie : ''}] -> ${response.status}${got ? ' ' + got : ''}${setCookie ? ' set-cookie: ' + setCookie.split(';')[0] : ''}`)
}
assert.equal(failed, 0, `${failed} case(s) failed`)
