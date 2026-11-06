// RM20320 — the privacy policy matches what Makan now does with the taste picture, in both languages.
// Run: node --test components/legal/privacy-policy.test.mjs
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const english = readFileSync(new URL('../../app/[locale]/privacy-policy/page.tsx', import.meta.url), 'utf8')
const indonesian = readFileSync(new URL('./PrivacyPolicyId.tsx', import.meta.url), 'utf8')

const sectionNumbers = (source) => [...source.matchAll(/(?:<h2[^>]*>|Section title=")(\d{1,2})\. /g)].map((match) => Number(match[1]))
const page = (source) => source.replace(/\s+/g, ' ')

test('both languages have the same fourteen numbered sections', () => {
  const expected = Array.from({ length: 14 }, (_, index) => index + 1)
  assert.deepEqual(sectionNumbers(english), expected)
  assert.deepEqual(sectionNumbers(indonesian), expected)
})

test('the page serves the Indonesian text at /id and English everywhere else', () => {
  assert.match(english, /import PrivacyPolicyId from '@\/components\/legal\/PrivacyPolicyId'/)
  assert.match(english, /if \(locale === 'id'\) return <PrivacyPolicyId \/>/)
  assert.match(english, /path: '\/id\/privacy-policy'/)
})

test('both carry the same date and the same update notes', () => {
  assert.match(english, /Last updated: 6 November 2026/)
  assert.match(indonesian, /Terakhir diperbarui: 6 November 2026/)
  for (const date of ['4 November 2026', '30 Agustus 2026', '6 September 2026']) assert.ok(indonesian.includes(date), date)
  for (const date of ['4 November 2026', '30 August 2026', '6 September 2026']) assert.ok(english.includes(date), date)
})

test('the taste picture is no longer described as private to the person alone, or as something to object to or switch off', () => {
  const en = page(english)
  assert.doesNotMatch(en, /shown only to you/i)
  assert.doesNotMatch(en, /shown to nobody but you/i)
  assert.doesNotMatch(en, /object to us building it/i)
  assert.doesNotMatch(en, /private picture of your taste \(section 2\.7\)\.\*\*/i)
  const id = page(indonesian)
  assert.doesNotMatch(id, /hanya ditampilkan kepadamu|hanya kepadamu/i)
  assert.doesNotMatch(id, /menolak kami menyusunnya/i)
})

test('both say what friends and the public can see, and that there is no setting', () => {
  const en = page(english)
  assert.match(en, /You agree on 4 of 6 dishes/)
  assert.match(en, /taste match with your friends/)
  assert.match(en, /public rankings/)
  assert.match(en, /no setting to switch it off/)
  assert.match(en, /Share my taste/)
  const id = page(indonesian)
  assert.match(id, /Kalian sepakat soal 4 dari 6 hidangan/)
  assert.match(id, /kecocokan selera dengan temanmu/)
  assert.match(id, /peringkat publik/)
  assert.match(id, /tidak ada pengaturan untuk mematikannya/)
  assert.match(id, /Bagikan seleraku/)
})

test('the taste picture rests on contract, not legitimate interests, in both languages', () => {
  const en = page(english)
  assert.match(en, /contract<\/strong> covers your account, the core features and the picture of your taste/)
  assert.doesNotMatch(en, /legitimate interests<\/strong> covers the private taste picture/)
  assert.doesNotMatch(en, /The private picture of your taste \(section 2\.7\)\.<\/strong>\{' '\} We rely on legitimate interests/)
  const id = page(indonesian)
  assert.match(id, /kontrak<\/strong> mencakup akunmu, fitur inti, serta gambaran seleramu/)
})

test('the Indonesian page is a translation, not a copy: no English policy sentences left in it', () => {
  const id = page(indonesian)
  for (const sentence of ['We do not sell personal data', 'Data controller', 'You must be at least 13', 'Your Rights', 'Privacy Policy']) {
    assert.ok(!id.includes(sentence), sentence)
  }
})

test('access, export and deletion rights stay in both languages', () => {
  assert.match(page(english), /ask for a copy of it/)
  assert.match(page(english), /deleted when you delete your account/)
  assert.match(page(indonesian), /meminta salinannya/)
  assert.match(page(indonesian), /dihapus saat kamu menghapus akunmu/)
})

// Grok j208669 P1: the Indonesian page must be reachable. proxy.ts sends every /id path that is not an
// Indonesian route to the English path, so the route has to be declared, and every link must follow it.
const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('/id/privacy-policy is a declared Indonesian route, not an English-only one', () => {
  assert.match(read('../../i18n/availability.ts'), /"\/privacy-policy",/)
  const check = read('../../scripts/check-i18n.mjs')
  assert.match(check, /'"\/privacy-policy"',\n  '"\/story"',/)
  assert.doesNotMatch(check.slice(check.indexOf('for (const englishOnlyPath')), /privacy-policy/)
})

test('every privacy link and the sitemap follow the language', () => {
  const localizedPolicyHref = /href=\{[^}]*localizePath\(locale, (['"])\/privacy-policy\1\)[^}]*\}/
  for (const path of [
    '../Footer.tsx', '../DeletionRequestPage.tsx',
    '../../app/[locale]/contact/ContactForm.tsx', '../../app/[locale]/support/page.tsx',
  ]) assert.match(read(path), localizedPolicyHref, path)
  assert.match(read('../../app/sitemap.ts'), /localized\("\/privacy-policy"/)
  assert.doesNotMatch(read('../../scripts/check-site-navigation.mjs'), /\['\/blog', '\/privacy-policy'/)
})

test('the Indonesian page links home to /id, and both name the counted meals', () => {
  const homeLink = indonesian.match(/<Link\s+href=(['"])\/id\1[^>]*>([\s\S]*?)<\/Link>/)?.[2]
  assert.equal(homeLink?.replace(/<[^>]+>/g, "").trim(), "Kembali ke beranda")
  assert.match(page(english), /counts only your public and friends-only meals/)
  assert.match(page(indonesian), /yang publik dan yang hanya-teman/)
})

test('the routing code (the one proxy.ts uses) accepts /id/privacy-policy', async () => {
  const { isIndonesianRoute } = await import('../../i18n/availability.ts')
  assert.equal(isIndonesianRoute('/id/privacy-policy'), true)
  assert.equal(isIndonesianRoute('/privacy-policy'), true)
  assert.equal(isIndonesianRoute('/id/tos'), false)
})

// Grok j208684: the sitemap helper must accept "yearly" (tsc and next build), the partner page links to the
// localized policy, and both languages say drinks are left out of the match.
test('the sitemap helper types "yearly", and the partner form links to the localized policy', () => {
  assert.match(read('../../app/sitemap.ts'), /changeFrequency: "weekly" \| "monthly" \| "yearly"/)
  const partner = read('../../app/[locale]/partner/PartnerForm.tsx')
  assert.match(partner, /href=\{localizePath\(locale, '\/privacy-policy'\)\}/)
  assert.doesNotMatch(partner, /href="\/privacy-policy"/)
  assert.match(partner, /href="\/tos"/)
})

test('both languages say drinks are left out of the match', () => {
  assert.match(page(english), /leaves out drinks/)
  assert.match(page(indonesian), /minuman tidak ikut/)
})
