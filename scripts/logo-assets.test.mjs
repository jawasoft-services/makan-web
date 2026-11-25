import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

// The logo rule (Devon, 25 Nov 2026: "always use our logo instead of the text makan if its an asset").
// 1. Makan's emails load their white logo picture from this exact path (munchies-rn functions/emailLogo.js LOGO_URL):
//    a PNG (email apps show no SVG), white on transparent, 640 x 146, derived from the app's wordmark file.
// 2. The preview picture for an unknown place shows the logo file, not the word typed in a font.

const png = readFileSync(new URL('../public/email/makan-logo-white.png', import.meta.url))

test('the email logo is a 640 x 146 PNG with transparency at public/email/makan-logo-white.png', () => {
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a')
  assert.equal(png.subarray(12, 16).toString('ascii'), 'IHDR')
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [640, 146])
  assert.equal(png[25], 6) // colour type 6: RGB with alpha
  assert.ok(png.length < 40_000)
})

test('the unknown-place preview draws the logo file; the place previews keep their domain line', () => {
  const og = readFileSync(new URL('../app/[locale]/places/[slug]/opengraph-image.tsx', import.meta.url), 'utf8')
  assert.match(og, /if \(!place\) return createDecisionSocialImage\("Makan", t\.somewhere, 108, \{ logo: true \}\)/)
  assert.match(og, />makanofficial\.com</)
  const social = readFileSync(new URL('../app/[locale]/_social-image.tsx', import.meta.url), 'utf8')
  assert.match(social, /join\(process\.cwd\(\), "public", "redesign", "logo-orange\.svg"\)/)
  assert.match(social, /<img src=\{logoUri\} alt=\{title\}/)
})
