import assert from 'node:assert/strict'
import { readFileSync, statSync } from 'node:fs'
import { test } from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

// Load a TypeScript source file as plain data, with imports stubbed out.
const load = (path, extra = {}) => {
  const source = readFileSync(new URL(path, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const exports = {}
  runInNewContext(code, { exports, require: (name) => (name === '@/lib/links' ? { APP_STORE_URL: 'https://apps.apple.com/app/id1' } : {}), ...extra })
  return exports
}
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')
const press = load('../../lib/press.ts')
const { pressCopy } = load('./press-copy.ts')

const keys = (value, prefix = '') => Object.entries(value).flatMap(([key, child]) =>
  child && typeof child === 'object' && !Array.isArray(child) ? keys(child, `${prefix}${key}.`) : [`${prefix}${key}`])

test('English and Indonesian copy have the same shape and the same number of paragraphs and angles', () => {
  assert.deepEqual(keys(pressCopy.en).sort(), keys(pressCopy.id).sort())
  assert.equal(pressCopy.en.long.length, pressCopy.id.long.length)
  assert.equal(pressCopy.en.angles.length, pressCopy.id.angles.length)
  pressCopy.en.angles.forEach((angle, i) => assert.equal(angle.href, pressCopy.id.angles[i].href))
})

test('every placeholder in the copy is one the page fills', () => {
  const known = new Set(['launched', 'ios', 'version', 'versionDate', 'count', 'legalName', 'registration'])
  for (const locale of ['en', 'id'])
    for (const text of JSON.stringify(pressCopy[locale]).matchAll(/\{(\w+)\}/g)) assert.ok(known.has(text[1]), `${locale}: unknown placeholder {${text[1]}}`)
})

test('the founder bio says London, not Durham, and matches the English page copy', () => {
  assert.doesNotMatch(press.FOUNDER.bio, /Durham/)
  assert.match(press.FOUNDER.bio, /London/)
  assert.equal(pressCopy.en.founderBio, press.FOUNDER.bio)
  assert.doesNotMatch(pressCopy.id.founderBio, /Durham/)
})

test('every download exists in public/ at exactly the size the page prints', () => {
  for (const asset of press.PRESS_ASSETS) {
    for (const file of [asset.file, asset.preview].filter(Boolean))
      assert.ok(statSync(new URL(`../../public${file}`, import.meta.url)).isFile(), `${file} is missing`)
    assert.equal(statSync(new URL(`../../public${asset.file}`, import.meta.url)).size, asset.bytes, `${asset.file}: bytes differ from the file`)
  }
})

test('the page takes its facts from lib/press.ts instead of repeating them', () => {
  const page = read('./PressPage.tsx')
  for (const literal of [press.COMPANY.registration, press.PRESS_EMAIL, press.PRESS_FACTS.version, press.LAUNCH.display, '5,822'])
    assert.ok(!page.includes(literal) && !JSON.stringify(pressCopy).includes(literal), `${literal} is hard-coded`)
})

test('the claims the kit says not to make are absent from both languages', () => {
  const text = JSON.stringify(pressCopy)
  for (const banned of [/5-star|five-star|bintang lima/i, /funded by NYU/i, /Android is available/i, /Imperial.{0,20}(backed|programme)/i, /\bbest\b/i])
    assert.doesNotMatch(text, banned)
})

test('/press is not redirected away to /story any more', () => {
  assert.doesNotMatch(read('../../next.config.ts'), /source:\s*"\/press"/)
})

test('the route is reachable in both languages and is listed in the sitemap, footer and llms.txt', () => {
  assert.match(read('../../i18n/availability.ts'), /"\/press"/)
  assert.match(read('../../app/sitemap.ts'), /localized\("\/press"/)
  assert.match(read('../../components/Footer.tsx'), /\['press', 'press'\]/)
  assert.match(read('../../app/llms.txt/route.ts'), /\/press\)/)
  for (const file of ['en', 'id']) assert.match(read(`../../messages/${file}.json`), /"press": "(Press|Media)"/)
})
