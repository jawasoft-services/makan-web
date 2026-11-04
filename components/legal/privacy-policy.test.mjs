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
  assert.match(english, /Last updated: 4 November 2026/)
  assert.match(indonesian, /Terakhir diperbarui: 4 November 2026/)
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
