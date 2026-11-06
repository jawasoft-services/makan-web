import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import ts from 'typescript'
import * as jsx from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'

function load(file) {
  const exports = {}
  const code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText
  runInNewContext(code, { exports, require(id) {
    if (id === 'react/jsx-runtime') return jsx
    if (id === 'next/link') return { default: 'a' }
    if (id === '@/components/legal/MaitredPrivacyDisclosure') return load('components/legal/MaitredPrivacyDisclosure.tsx')
    if (id === '@/components/legal/PrivacyPolicyId') return load('components/legal/PrivacyPolicyId.tsx')
    if (id === '@/components/Footer' || id === '@/components/PlayfulArrow') return { default: () => null }
    if (id === '@/components/utility.module.css') return { default: {} }
    if (id === '@/lib/site-metadata') return { createPageMetadata: value => value }
    throw new Error(`Unexpected dependency: ${id}`)
  } })
  return exports
}

for (const locale of ['en', 'id']) {
  test(`${locale}: complete policy renders the public-role disclosure and real controls`, async () => {
    const Page = load('app/[locale]/privacy-policy/page.tsx').default
    const html = renderToStaticMarkup(await Page({ params: Promise.resolve({ locale }) }))
    assert.equal((html.match(/id="maitred-visibility"/g) || []).length, 1)
    assert.ok(html.includes('mailto:support@makanofficial.com'))
    const disclosure = html.slice(html.indexOf('id="maitred-visibility"'), html.indexOf('</div>', html.indexOf('id="maitred-visibility"')))
    for (const phrase of locale === 'en'
      ? ['without signing in', 'only when you publish', 'Friends-only meals can count', 'five minutes', 'staff recognise you is separate', 'while signed out', 'saved meals stay']
      : ['tanpa masuk ke akun', 'hanya muncul saat kamu menerbitkan', 'Makanan hanya-teman dapat dihitung', 'lima menit', 'staf restoran mengenalimu bersifat terpisah', 'Pemblokiran dalam aplikasi', 'makanan tersimpan tetap']) assert.ok(disclosure.includes(phrase), phrase)
    assert.match(html, locale === 'en' ? /Public Maître d’ cards \(section 5\)/ : /Kartu publik Maître d’ \(bagian 5\)/)
    assert.doesNotMatch(disclosure, /web-only switch|pengaturan khusus situs|immediately erase|langsung menghapus/)
    const faq = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')).MaitredPage.faqs[4]
    assert.match(faq.answer, locale === 'en' ? /only when you publish/ : /hanya muncul saat kamu menerbitkan/)
  })
}
