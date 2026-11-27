import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync, readFileSync } from 'node:fs'

// RM20616 A10 unit 10 (R2): the password-reset email Firebase sends, built from the approved board si-fp-4
// (layout A) and its no-picture fallback (layout C). Devon chose English for everyone and layout A first,
// with layout C as the fallback (RESET_PLAN.md R2). Firebase fills %LINK% and %EMAIL% when it sends.

const root = new URL('../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

const TEMPLATES = ['docs/email/reset-password.html', 'docs/email/reset-password-c.html']

// The only words a reader may see: approved board copy (spec/strings.json entries 125, 126, 129, 133;
// "Reset password" and "Makan" are existing app literals drawn on si-fp-4), the full stop after the address,
// and the address Firebase puts in %EMAIL%.
const APPROVED = [
  'Reset your Makan password', // subject, also the document title
  'Reset your password',
  'Tap the button to choose a new password for',
  '%EMAIL%',
  '.',
  'Reset password',
  'The link works for 1 hour. Didn’t ask for this? You can ignore this email.',
]
const APPROVED_ALT = ['', 'Makan']

// The site's own colour tokens for this frame (the auth-action pages draw the same boards).
const tokenCss = read('app/auth-action/[locale]/auth-action.module.css')
const pageBlock = tokenCss.match(/\.page\s*\{([^}]*)\}/)[1]
const TOKENS = new Set([...pageBlock.matchAll(/--[\w-]+:\s*(#[0-9a-fA-F]{6})/g)].map((m) => m[1].toLowerCase()))

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rsquo: '’' }
const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)

const visibleText = (html) =>
  decode(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<head[\s\S]*?<\/head>/i, (head) => (head.match(/<title>[\s\S]*?<\/title>/i) ?? [''])[0])
      .replace(/<[^>]+>/g, '\u0000'),
  )
    .split('\u0000')
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean)

const count = (s, needle) => s.split(needle).length - 1

test('the site tokens for the email frame are readable', () => {
  for (const hex of ['#ff9932', '#fff7ef', '#fffffe', '#f3e6d8', '#11181d', '#5b6b75']) assert.ok(TOKENS.has(hex), hex)
})

for (const path of TEMPLATES) {
  test(`${path} exists`, () => assert.ok(existsSync(new URL(path, root)), path))
  if (!existsSync(new URL(path, root))) continue
  const html = read(path)

  test(`${path}: %LINK% once, as the Reset password button's href`, () => {
    assert.equal(count(html, '%LINK%'), 1)
    const anchors = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)]
    assert.equal(anchors.length, 1, 'one link only: the button')
    const [, attrs, inner] = anchors[0]
    assert.match(attrs, /\bhref="%LINK%"/)
    assert.equal(decode(inner.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim(), 'Reset password')
  })

  test(`${path}: %EMAIL% once, in bold`, () => {
    assert.equal(count(html, '%EMAIL%'), 1)
    assert.match(html, /<b\b[^>]*>%EMAIL%<\/b>/)
  })

  test(`${path}: no script, no stylesheet, no style block, no event handlers, no shadows`, () => {
    assert.doesNotMatch(html, /<script/i)
    assert.doesNotMatch(html, /<link\b[^>]*rel="?stylesheet/i)
    assert.doesNotMatch(html, /<link\b/i)
    assert.doesNotMatch(html, /<style/i)
    assert.doesNotMatch(html, /@import|@font-face|fonts\.googleapis/i)
    assert.doesNotMatch(html, /\son\w+\s*=/i)
    assert.doesNotMatch(html, /shadow/i)
  })

  test(`${path}: tables for layout, at most 600 px wide`, () => {
    assert.match(html, /<table\b/i)
    assert.doesNotMatch(html, /<div\b|display:\s*(flex|grid)/i)
    assert.match(html, /max-width:\s*600px/)
    for (const [, w] of html.matchAll(/\bwidth="(\d+)"/g)) assert.ok(Number(w) <= 600, `width ${w}`)
    for (const [, w] of html.matchAll(/[^-]width:\s*(\d+)px/g)) assert.ok(Number(w) <= 600, `width ${w}px`)
  })

  test(`${path}: every picture has approved alt text and a live makanofficial.com file`, () => {
    const imgs = [...html.matchAll(/<img\b([^>]*)>/gi)].map((m) => m[1])
    assert.ok(imgs.length >= 1)
    for (const attrs of imgs) {
      const alt = attrs.match(/\balt="([^"]*)"/)
      assert.ok(alt, `alt on ${attrs}`)
      assert.ok(APPROVED_ALT.includes(alt[1]), `alt "${alt[1]}"`)
      const src = attrs.match(/\bsrc="([^"]*)"/)?.[1] ?? ''
      assert.match(src, /^https:\/\/www\.makanofficial\.com\/[\w./-]+$/)
      const file = `public/${src.replace('https://www.makanofficial.com/', '')}`
      assert.ok(existsSync(new URL(file, root)), file)
    }
    assert.ok(imgs.some((a) => /src="https:\/\/www\.makanofficial\.com\/email\/makan-logo-white\.png"/.test(a) && /alt="Makan"/.test(a)), 'the logo picture, alt Makan')
  })

  test(`${path}: only the site's colour tokens`, () => {
    assert.doesNotMatch(html, /rgba?\(|hsla?\(/i)
    const colours = [...html.matchAll(/#[0-9a-fA-F]{3,8}\b/g)].map((m) => m[0].toLowerCase())
    assert.ok(colours.length > 0)
    for (const c of colours) assert.ok(TOKENS.has(c), `colour ${c} is not a site token`)
    assert.match(html, /#ff9932/i) // the band and the button: Makan Orange, white text on it (founder decision)
  })

  test(`${path}: no visible words beyond the approved strings`, () => {
    for (const run of visibleText(html)) assert.ok(APPROVED.includes(run), `unapproved text: "${run}"`)
    for (const s of ['Reset your password', 'Tap the button to choose a new password for', 'Reset password', APPROVED[6]])
      assert.ok(visibleText(html).includes(s), `missing: "${s}"`)
  })

  test(`${path}: stays light in dark mode`, () => {
    assert.match(html, /<meta name="color-scheme" content="light"/)
  })
}

test('layout A shows the clip still; layout C has no clip', () => {
  const a = read(TEMPLATES[0])
  const c = read(TEMPLATES[1])
  assert.match(a, /<img\b[^>]*src="https:\/\/www\.makanofficial\.com\/auth-action\/saved\.png"[^>]*alt=""/)
  assert.doesNotMatch(c, /auth-action\//)
  assert.equal([...c.matchAll(/<img\b/g)].length, 1, 'layout C keeps only the logo')
})

test('the README gives the sender, subject and the exact PATCH shape', () => {
  const readme = read('docs/email/README.md')
  const json = JSON.parse(readme.match(/```json\n([\s\S]*?)\n```/)[1])
  const t = json.notification.sendEmail.resetPasswordTemplate
  assert.deepEqual(Object.keys(t).sort(), ['body', 'bodyFormat', 'senderDisplayName', 'subject'])
  assert.equal(t.senderDisplayName, 'Makan')
  assert.equal(t.subject, 'Reset your Makan password')
  assert.equal(t.bodyFormat, 'HTML')
  assert.doesNotMatch(readme, /makan-devel|munchies-expo|AIza|@(?!example\.com)[a-z0-9-]+\.[a-z]/i)
})
