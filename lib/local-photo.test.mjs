import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'

const mod = {}
runInNewContext(ts.transpileModule(readFileSync('lib/local-photo.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: mod })
const { localPhoto } = mod

test('local photos resolve to a generated size at least twice their CSS width', () => {
  assert.equal(localPhoto('/redesign/prawns.jpg', 85), '/static-images/v1/redesign-photos/prawns-320.webp')
  assert.equal(localPhoto('/redesign/prawns.jpg', 334), '/static-images/v1/redesign-photos/prawns-1024.webp')
  assert.equal(localPhoto('/redesign/prawns.jpg', 900), '/static-images/v1/redesign-photos/prawns-1280.webp')
  assert.equal(localPhoto('/redesign/native/picks-plaza-khao-gaeng.jpg', 362), '/static-images/v1/redesign-native/picks-plaza-khao-gaeng-1024.webp')
  assert.equal(localPhoto('/redesign/native/reference-feed-id.png', 310), '/static-images/v1/redesign-native/reference-feed-id-640.webp')
  assert.equal(localPhoto('/blog/kendal-street-kitchen/tiramisu.jpg', 180), '/static-images/v1/blog/kendal-street-kitchen/tiramisu-480.webp')
})

test('anything without generated sizes comes back unchanged', () => {
  for (const src of ['/redesign/logo.svg', '/redesign/native/makan-mark.png', '/redesign/native/reference-map-en.png', '/blog/other/a.jpg', 'https://example.com/a.jpg']) assert.equal(localPhoto(src, 300), src)
})

test('every size a page can ask for exists on disk', () => {
  const sources = [...readFileSync('components/partner/owner-native-data.ts', 'utf8').matchAll(/'(\/redesign\/[^']+\.jpg)'/g)].map(m => m[1])
  for (const src of ['/redesign/prawns.jpg', '/redesign/dining.jpg', '/redesign/tiramisu.jpg', '/redesign/native/reference-feed-en.png', '/redesign/native/reference-feed-id.png', ...sources]) {
    for (const css of [85, 150, 334, 600]) assert.ok(existsSync(`public${localPhoto(src, css)}`), `${src} @${css}`)
  }
})
