import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { lane, KEY, MEAL_ROUTE, PLACE_ROUTE, PROFILE_ROUTE } from './share-v2-test-lane.mjs'

// RM20616 A12 U3 — the switch-off path. With SHARE_V2_PAGES absent the site must serve what makan-web
// main served at 365a96e. Three things hold that: the pages the Share v2 pages stand in for are not
// edited at all, the proxy sends every address where main's proxy sent it, and the new copy stays out of
// every page's client payload.
const BASE = '365a96e3e5dc1bbad080e04be04cdb49c8b2c42a'
const require = createRequire(import.meta.url)
const { NextRequest } = require('next/server')
const atBase = path => {
  try { return execFileSync('git', ['show', `${BASE}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 }) } catch { return null }
}
const baseAvailable = atBase('package.json') !== null
/** Fails unless every entry `base` has is in `now`, unchanged. `now` may add entries. */
function keepsEvery(now = {}, base = {}, label) {
  for (const [key, value] of Object.entries(base)) assert.deepEqual(now[key], value, `${label}: ${key} was changed or removed`)
}
const omit = (object, ...keys) => Object.fromEntries(Object.entries(object).filter(([key]) => !keys.includes(key)))
/** The lines `now` adds to `base`, or null when `now` also changes or removes one of `base`'s lines. */
function addedLines(base, now) {
  const added = []
  const want = base.split('\n')
  let next = 0
  for (const line of now.split('\n')) {
    if (next < want.length && line === want[next]) next++
    else added.push(line)
  }
  return next === want.length ? added : null
}

// Every page, card and setting a share link can reach today, and the config this unit must not touch.
const UNTOUCHED = [
  'app/[locale]/places/[slug]/page.tsx', 'app/[locale]/places/[slug]/opengraph-image.tsx', 'app/[locale]/places/page.tsx',
  'app/[locale]/meal/[id]/page.tsx', 'app/[locale]/_social-image.tsx', 'app/[locale]/opengraph-image.tsx', 'app/[locale]/twitter-image.tsx',
  'app/[locale]/p/[placeId]/page.tsx', 'app/[locale]/p/[placeId]/[dishId]/page.tsx', 'app/[locale]/p/[placeId]/PlaceLinkPage.tsx', 'app/[locale]/p/[placeId]/PlaceLinkActions.tsx',
  'app/[locale]/taste/[publicId]/[secret]/page.tsx', 'app/[locale]/invite/[publicId]/page.tsx', 'app/[locale]/invite/[publicId]/InviteLanding.tsx',
  'app/api/table-invite/preview/route.ts', 'app/api/thumb/route.ts', 'app/.well-known/assetlinks.json/route.ts',
  'app/not-found.tsx', 'app/global-not-found.tsx', 'app/sitemap.ts', 'app/robots.ts', 'app/globals.css', 'app/redesign.css',
  'components/PlaceMaitred.tsx', 'components/Navbar.tsx', 'components/Footer.tsx', 'components/home/StoreLink.tsx', 'components/standings/public-pages.module.css',
  'lib/public-meal.ts', 'lib/taste-invite.ts', 'lib/place-link.ts', 'lib/place-directory.ts', 'lib/place-photo.ts', 'lib/maitred.ts', 'lib/eat-standings.ts', 'lib/firebase-admin.ts', 'lib/site-metadata.ts', 'lib/carry-link.ts', 'lib/links.ts', 'lib/rate-limit.ts',
  'i18n/availability.ts', 'i18n/paths.ts', 'i18n/request.ts', 'i18n/routing.ts',
  'next.config.ts', 'apphosting.yaml', 'firebase.json', '.firebaserc',
]

// Devon, 24 Nov 2026: image work runs in a few slots per instance (lib/image-slots.ts) so bursts no
// longer exhaust memory. These pinned files may differ from 365a96e by exactly these edits, nothing else.
const SLOT_EDITS = {
  'app/api/thumb/route.ts': [
    ["import { THUMB_WIDTHS, thumbSource } from '@/lib/thumb'\n", "import { THUMB_WIDTHS, thumbSource } from '@/lib/thumb'\nimport { withImageSlot } from '@/lib/image-slots'\n"],
    ["    const upstream = await fetch(u, { cache: 'force-cache' })\n    if (!upstream.ok) return NextResponse.redirect(u, 302)\n    const input = Buffer.from(await upstream.arrayBuffer())\n    const sharp = (await import('sharp')).default\n    const out = await sharp(input).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer()\n", "    const out = await withImageSlot(async () => {\n      const upstream = await fetch(u, { cache: 'force-cache' })\n      if (!upstream.ok) return null\n      const input = Buffer.from(await upstream.arrayBuffer())\n      const sharp = (await import('sharp')).default\n      return sharp(input).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer()\n    }, { maxWaitMs: 10_000 })\n    if (!out) return NextResponse.redirect(u, 302)\n"],
  ],
  'app/[locale]/_social-image.tsx': [
    ["import { join } from \"node:path\"\n", "import { join } from \"node:path\"\nimport { renderImage } from \"@/lib/image-slots\"\n"],
    ["  return new ImageResponse(\n", "  return renderImage(() => new ImageResponse(\n", 2],
    ["  )\n", "  ))\n", 2],
  ],
  'app/[locale]/places/[slug]/opengraph-image.tsx': [
    ["import { getPlacePhoto } from \"@/lib/place-photo\"\n", "import { getPlacePhoto } from \"@/lib/place-photo\"\nimport { renderImage, withImageSlot } from \"@/lib/image-slots\"\n"],
    ["    let input: Buffer\n    if (WEBSITE_FIXTURES) {\n      if (!/^\\/redesign\\/[a-z0-9-]+\\.(jpg|png|webp)$/.test(src)) return null\n      input = await readFile(join(process.cwd(), \"public\", src.slice(1)))\n    } else {\n      const res = await fetch(src, { next: { revalidate: 86400 } })\n      if (!res.ok) return null\n      input = Buffer.from(await res.arrayBuffer())\n    }\n    const sharp = (await import(\"sharp\")).default\n    const jpeg = await sharp(input).rotate().resize(560, 630, { fit: \"cover\" }).jpeg({ quality: 82 }).toBuffer()\n", "    const jpeg = await withImageSlot(async () => {\n      let input: Buffer\n      if (WEBSITE_FIXTURES) {\n        if (!/^\\/redesign\\/[a-z0-9-]+\\.(jpg|png|webp)$/.test(src)) return null\n        input = await readFile(join(process.cwd(), \"public\", src.slice(1)))\n      } else {\n        const res = await fetch(src, { next: { revalidate: 86400 } })\n        if (!res.ok) return null\n        input = Buffer.from(await res.arrayBuffer())\n      }\n      const sharp = (await import(\"sharp\")).default\n      return sharp(input).rotate().resize(560, 630, { fit: \"cover\" }).jpeg({ quality: 82 }).toBuffer()\n    })\n    if (!jpeg) return null\n"],
    ["  return new ImageResponse(\n", "  return renderImage(() => new ImageResponse(\n"],
    ["  )\n", "  ))\n"],
  ],
}
// The pinned routes now return what lib/image-slots.ts returns, so it is pinned too: any edit to it,
// renderImage's status or headers included, must come back through this guard with a new hash.
const IMAGE_SLOTS_SHA256 = '0e14ad3eeb2fbaa622fd4a57572b815a278cc88b8c1321acc46c69c17e8339ee'

/** `base` with each edit applied exactly `times` times (default once); fails if an edit does not occur that often. */
function withEdits(path, base, edits) {
  let out = base
  for (const [before, after, times = 1] of edits) {
    assert.equal(out.split(before).length - 1, times, `${path}: expected ${times} of ${JSON.stringify(before.slice(0, 50))} at ${BASE.slice(0, 7)}`)
    out = out.split(before).join(after)
  }
  return out
}

test('switch off: every page, card and config a share link reaches today is byte-identical to main at 365a96e', { skip: !baseAvailable && 'commit 365a96e is not in this clone' }, () => {
  for (const path of UNTOUCHED) {
    const base = atBase(path)
    const expected = SLOT_EDITS[path] ? withEdits(path, base, SLOT_EDITS[path]) : base
    assert.equal(readFileSync(path, 'utf8'), expected, `${path} differs from ${BASE.slice(0, 7)}${SLOT_EDITS[path] ? ' plus its image-slot edits' : ''}`)
  }
  assert.equal(createHash('sha256').update(readFileSync('lib/image-slots.ts')).digest('hex'), IMAGE_SLOTS_SHA256, 'lib/image-slots.ts changed: the pinned share routes return what it returns')
})

test('switch off: the only edits to existing files are additive and inert', { skip: !baseAvailable && 'commit 365a96e is not in this clone' }, () => {
  // Messages: every string main had is unchanged; the unit adds one namespace and nothing else.
  for (const locale of ['en', 'id']) {
    const now = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))
    const { SharePages, ...rest } = now
    assert.ok(SharePages && Object.keys(SharePages).length > 0)
    assert.deepEqual(rest, JSON.parse(atBase(`messages/${locale}.json`)), locale)
  }
  // Layout: the one change keeps that namespace out of the client payload, so pages carry what they carried.
  const layout = readFileSync('app/[locale]/layout.tsx', 'utf8')
  const filter = layout.match(/const clientMessages = Object\.fromEntries\(\s*Object\.entries\(messages\)\.filter\((.*?)\),\s*\)/s)?.[1]
  assert.ok(filter, 'the layout filters the client messages')
  const keep = new Function(`return ${filter}`)()
  const messages = JSON.parse(readFileSync('messages/en.json', 'utf8'))
  const client = Object.fromEntries(Object.entries(messages).filter(keep))
  const before = Object.fromEntries(Object.entries(JSON.parse(atBase('messages/en.json'))).filter(([namespace]) => namespace !== 'Decision'))
  assert.equal(JSON.stringify(client), JSON.stringify(before), 'the client message payload is byte-identical to main')
  // package.json: the one change puts the two link-file goldens into `npm test` (U3 review, Low 7). No dependency the
  // share pages ran on moves: every one main had keeps its exact range. Devon, 24 Nov 2026 (PR #68): later work may add
  // a dependency; changing or removing an existing one still fails here.
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')), basePkg = JSON.parse(atBase('package.json'))
  assert.equal(pkg.scripts.test, `${basePkg.scripts.test} app/.well-known/*/route.test.mjs`)
  for (const field of ['dependencies', 'devDependencies']) keepsEvery(pkg[field], basePkg[field], `package.json ${field}`)
  assert.deepEqual(omit({ ...pkg, scripts: { ...pkg.scripts, test: basePkg.scripts.test } }, 'dependencies', 'devDependencies'), omit(basePkg, 'dependencies', 'devDependencies'))
  // package-lock.json: every package main installed is installed unchanged (version, source, integrity); new ones may join.
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8')), baseLock = JSON.parse(atBase('package-lock.json'))
  const { packages: lockPackages, ...lockRest } = lock, { packages: basePackages, ...baseLockRest } = baseLock
  assert.deepEqual(lockRest, baseLockRest, 'package-lock.json header')
  const { '': root, ...installed } = lockPackages, { '': baseRoot, ...baseInstalled } = basePackages
  keepsEvery(installed, baseInstalled, 'package-lock.json packages')
  // RM20616 controller (24 Nov 2026): an added package must stand apart from what main installed. It may not nest
  // inside an existing package, may not be one an existing package names as a peer or optional dependency (it
  // would change that package's resolution), and may not run an install script unless listed here.
  const INSTALL_SCRIPT_ALLOWED = []
  const baseKeys = Object.keys(baseInstalled)
  const packageName = key => key.slice(key.lastIndexOf('node_modules/') + 'node_modules/'.length)
  for (const key of Object.keys(installed).filter(key => !(key in baseInstalled))) {
    assert.ok(!baseKeys.some(old => key.startsWith(`${old}/node_modules/`)), `package-lock.json: added ${key} nests inside an existing package`)
    const name = packageName(key)
    for (const [old, entry] of Object.entries(baseInstalled)) {
      for (const field of ['peerDependencies', 'peerDependenciesMeta', 'optionalDependencies']) {
        assert.ok(!(entry[field] && name in entry[field]), `package-lock.json: added ${name} is in ${old} ${field}`)
      }
    }
    assert.ok(!installed[key].hasInstallScript || INSTALL_SCRIPT_ALLOWED.includes(name), `package-lock.json: added ${name} runs an install script`)
  }
  for (const field of ['dependencies', 'devDependencies']) keepsEvery(root[field], baseRoot[field], `package-lock.json root ${field}`)
  assert.deepEqual(omit(root, 'dependencies', 'devDependencies'), omit(baseRoot, 'dependencies', 'devDependencies'), 'package-lock.json root package')
  // Fixtures: every line main had is still there, in order; the unit only adds lines.
  const added = addedLines(atBase('lib/website-fixtures.ts'), readFileSync('lib/website-fixtures.ts', 'utf8'))
  assert.ok(added, 'lib/website-fixtures.ts changes or removes a line main had')
})

// What the proxy does with a request, in terms a visitor could observe.
function answer(proxy, path, headers = {}) {
  const response = proxy(new NextRequest(`https://www.makanofficial.com${path}`, { headers: { host: 'www.makanofficial.com', 'x-forwarded-for': '192.0.2.10', ...headers } }))
  return { status: response.status, location: response.headers.get('location'), rewrite: response.headers.get('x-middleware-rewrite'), intl: response.headers.get('x-test-intl'), robots: response.headers.get('x-robots-tag'), cookie: response.headers.get('set-cookie') }
}
const PATHS = [
  '/', '/id', '/en', '/en/places/warung-bu-sri-abc123', '/places', '/id/places', '/places/warung-bu-sri-abc123', '/id/places/warung-bu-sri-abc123', '/places/warung-bu-sri-abc123?src=crown',
  '/places/warung-bu-sri-abc123/opengraph-image', '/id/places/warung-bu-sri-abc123/opengraph-image', '/places/Not-Canonical', '/meal/meal-0001', '/id/meal/meal-0001', '/meal/meal-0001?src=share',
  '/meal/meal-0001/extra', '/meal', `/u/dewi-l-${KEY}`, `/id/u/dewi-l-${KEY}`, `/u/dewi-l-${KEY}?src=share`, '/u', '/u/a/b', '/p/ChIJknownplace01', '/id/p/ChIJknownplace01', '/taste/abcdefghijkl/x', '/invite/abcdefghijkl',
  '/standings', '/id/standings/london', '/blog/x', '/id/blog/x', '/claim/x', '/verified',
]
// The internal addresses of the v2 pages. Never public: main has no such pages, and neither does a visitor of this branch.
const INTERNAL = ['/share-v2/places/warung-bu-sri-abc123', '/id/share-v2/meal/meal-0001', `/share-v2/u/dewi-l-${KEY}`, `/en/share-v2/u/dewi-l-${KEY}`, `/id/share-v2/u/dewi-l-${KEY}`, '/share-v2', '/share-v2/', '/SHARE-V2/u/x', '/Share-V2/meal/meal-0001', `/share-v2/u/dewi-l-${KEY}?x=1`,
  // Spelled so that it does not look like the internal address until the router reads it (U3 review, second pass).
  `/share%2Dv2/u/dewi-l-${KEY}`, `/share%2dv2/u/dewi-l-${KEY}`, `/%73hare-v2/u/dewi-l-${KEY}`, `/%53HARE%2DV2/u/dewi-l-${KEY}`, `/id/share%2Dv2/meal/meal-0001`, `/%69d/share-v2/meal/meal-0001`, `/en/%73%68%61%72%65%2D%76%32/places/warung-bu-sri-abc123`,
  `//share-v2/u/dewi-l-${KEY}`, `/id//share-v2/u/dewi-l-${KEY}`, `///en///share-v2//u/dewi-l-${KEY}`, `/sHaRe-V2/u/dewi-l-${KEY}`, `/ID/Share-V2/u/dewi-l-${KEY}`, `/x/%2e%2e/share-v2/u/dewi-l-${KEY}`, `/./share-v2/u/dewi-l-${KEY}`, `/id/./share%2Dv2/u/dewi-l-${KEY}`, `/share-v2%2Fu%2Fdewi-l-${KEY}`, '/share-v2/%E0%A4%A']

test('switch off: the proxy sends every address exactly where main\'s proxy sent it', { skip: !baseAvailable && 'commit 365a96e is not in this clone' }, () => {
  const main = lane({ env: {}, source: path => (path === 'proxy.ts' ? atBase('proxy.ts') : null) }).load('proxy.ts').proxy
  for (const env of [{}, { SHARE_V2_PAGES: '' }, { SHARE_V2_PAGES: '0' }, { SHARE_V2_PAGES: 'true' }, { SHARE_V2_PAGES: 'on' }]) {
    const now = lane({ env }).load('proxy.ts').proxy
    for (const path of PATHS) {
      assert.deepEqual(answer(now, path), answer(main, path), `${path} with ${JSON.stringify(env)}`)
      assert.deepEqual(answer(now, path, { host: 'makanofficial.com' }), answer(main, path, { host: 'makanofficial.com' }), `apex ${path}`)
    }
  }
})

test('switch off: a share address is never rewritten to a v2 page, and nobody is rate limited', () => {
  const proxy = lane({ env: {} }).load('proxy.ts').proxy
  for (const path of PATHS) assert.doesNotMatch(String(answer(proxy, path).rewrite), /share-v2/, path)
  for (let i = 0; i < 80; i++) assert.notEqual(answer(proxy, `/u/dewi-l-${KEY}`).status, 429)
})

test('switch on: the three share addresses are served by the v2 pages, in both locales, and nothing else moves', () => {
  const on = lane({ env: { SHARE_V2_PAGES: '1' } }).load('proxy.ts').proxy
  const off = lane({ env: {} }).load('proxy.ts').proxy
  const served = { '/places/warung-bu-sri-abc123': '/en/share-v2/places/warung-bu-sri-abc123', '/id/places/warung-bu-sri-abc123': '/id/share-v2/places/warung-bu-sri-abc123',
    '/meal/meal-0001': '/en/share-v2/meal/meal-0001', '/id/meal/meal-0001': '/id/share-v2/meal/meal-0001',
    [`/u/dewi-l-${KEY}`]: `/en/share-v2/u/dewi-l-${KEY}`, [`/id/u/dewi-l-${KEY}`]: `/id/share-v2/u/dewi-l-${KEY}` }
  for (const [path, target] of Object.entries(served)) {
    const response = answer(on, path)
    assert.equal(response.status, 200, path)
    assert.equal(new URL(response.rewrite).pathname, target, path)
    assert.equal(response.location, null)
    assert.equal(response.robots, path.includes('/u/') ? 'noindex, follow' : null, path)
  }
  assert.equal(new URL(answer(on, '/places/warung-bu-sri-abc123?src=crown').rewrite).pathname, '/en/share-v2/places/warung-bu-sri-abc123')
  for (const path of PATHS.filter(path => !(path.split('?')[0] in served))) assert.deepEqual(answer(on, path), answer(off, path), path)
  // The canonical-host redirect still comes first.
  assert.equal(answer(on, '/meal/meal-0001', { host: 'makanofficial.com' }).status, 308)
})

test('an internal share-v2 address is never reachable directly, with the switch on or off: it gets what an unknown page gets', () => {
  for (const env of [{}, { SHARE_V2_PAGES: '0' }, { SHARE_V2_PAGES: '1' }]) {
    const proxy = lane({ env }).load('proxy.ts').proxy
    for (const path of INTERNAL) {
      const response = answer(proxy, path)
      // (Next redirects a trailing slash away before the proxy runs; the request object here keeps it.)
      assert.equal(new URL(response.rewrite).pathname.replace(/\/$/, ''), '/en/share-v2-unknown', `${path} with ${JSON.stringify(env)}`)
      assert.equal(new URL(response.rewrite).search, '', path)
      assert.equal(response.robots, 'noindex, nofollow', path)
      assert.equal(response.location, null, path)
    }
    // It is answered before anything else, so it can never be rate limited into or out of a profile.
    for (let i = 0; i < 80; i++) assert.equal(new URL(answer(proxy, `/share-v2/u/dewi-l-${KEY}`).rewrite).pathname, '/en/share-v2-unknown')
  }
  // There is no page at the address it is sent to.
  assert.throws(() => readFileSync('app/[locale]/share-v2-unknown/page.tsx'))
  const { isShareV2InternalPath } = lane().load('lib/share-v2-routes.ts')
  for (const path of ['/share-v2-unknown', '/en/share-v2-unknown', '/places/share-v2', '/u/share-v2', '/meal/share%2Dv2', '/share%252Dv2/u/x', '/', '/id', '/places/warung-bu-sri-abc123', `/u/dewi-l-${KEY}`]) assert.equal(isShareV2InternalPath(path), false, path)
  for (const path of INTERNAL) assert.equal(isShareV2InternalPath(path.split('?')[0]), true, path)
})

test('only the proxy\'s own rewrite carries the mark, and the mark is not something a visitor can send', () => {
  const requestHeader = (response, name) => response.headers.get(`x-middleware-request-${name}`)
  const call = (proxy, path, headers = {}) => proxy(new NextRequest(`https://www.makanofficial.com${path}`, { headers: { host: 'www.makanofficial.com', 'x-forwarded-for': '192.0.2.10', ...headers } }))
  const run = lane({ env: { SHARE_V2_PAGES: '1' } })
  const on = run.load('proxy.ts').proxy
  const { shareV2ProxyMark, isShareV2ProxyMark } = run.load('lib/share-v2-mark.ts')
  const mark = shareV2ProxyMark()
  assert.match(mark, /^[0-9a-f]{64}$/, 'a random value made when the server starts')
  assert.equal(shareV2ProxyMark(), mark)
  for (const guess of ['1', 'true', '', mark.slice(1), `${mark}0`, mark.toUpperCase(), null, undefined]) assert.equal(isShareV2ProxyMark(guess), false, String(guess))
  assert.equal(isShareV2ProxyMark(mark), true)
  for (const path of ['/places/warung-bu-sri-abc123', '/id/meal/meal-0001', `/u/dewi-l-${KEY}`]) {
    const response = call(on, path)
    assert.equal(requestHeader(response, 'x-makan-share-v2'), mark, path)
    assert.equal(requestHeader(response, 'x-next-intl-locale'), path.startsWith('/id/') ? 'id' : 'en', path)
    // It rides on the request the page sees, never on anything the visitor is sent.
    assert.equal(response.headers.get('x-makan-share-v2'), null, path)
  }
  // A request that arrives already carrying the header is answered as an unknown page, whatever it asks for and
  // whatever the header holds: the public addresses, the internal ones, and every other page.
  for (const env of [{}, { SHARE_V2_PAGES: '1' }]) {
    const proxy = lane({ env }).load('proxy.ts').proxy
    for (const value of ['1', mark, '']) {
      for (const path of [`/u/dewi-l-${KEY}`, '/places/warung-bu-sri-abc123', `/share-v2/u/dewi-l-${KEY}`, `/share%2Dv2/u/dewi-l-${KEY}`, '/', '/id/standings/london']) {
        const response = call(proxy, path, { 'x-makan-share-v2': value })
        assert.equal(new URL(response.headers.get('x-middleware-rewrite')).pathname, '/en/share-v2-unknown', `${path} with ${JSON.stringify(value)}`)
        assert.equal(requestHeader(response, 'x-makan-share-v2'), null)
        assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow')
      }
    }
  }
  const off = lane({ env: {} }).load('proxy.ts').proxy
  assert.equal(requestHeader(call(off, '/places/warung-bu-sri-abc123'), 'x-makan-share-v2'), null)
  // The mark is in no file and no log line: it is only ever made in lib/share-v2-mark.ts and read through it.
  for (const file of ['proxy.ts', 'lib/share-page.ts', 'lib/share-v2-mark.ts']) assert.doesNotMatch(readFileSync(file, 'utf8'), /console\.[a-z]+\([^)]*(mark|Mark|headers)/, file)
})

test('switch on: one address cannot load profiles in a loop', () => {
  const proxy = lane({ env: { SHARE_V2_PAGES: '1' } }).load('proxy.ts').proxy
  let response
  for (let i = 0; i < 61; i++) response = answer(proxy, `/id/u/dewi-l-${KEY}`)
  assert.equal(response.status, 429)
  assert.equal(response.robots, 'noindex, follow')
  assert.equal(answer(proxy, '/places/warung-bu-sri-abc123').status, 200)
})

test('the route table takes only an exact share address', () => {
  const { shareV2Target } = lane().load('lib/share-v2-routes.ts')
  assert.deepEqual(shareV2Target('/id/u/dewi-k3f9q2x7'), { kind: 'profile', locale: 'id', path: '/id/share-v2/u/dewi-k3f9q2x7' })
  for (const path of INTERNAL) assert.equal(shareV2Target(path.split('?')[0]), null, path)
  for (const path of ['/', '/places', '/places/', '/places/x-abc123/', '/places/x-abc123/opengraph-image', '/places/UPPER-abc123', '/places/no-hash', '/en/places/x-abc123', '/id/id/meal/abcdefgh', '/meal/a%2Fb', '/meal/a.b', '/u/', '/u/..', '/constructor/x', '/toString/x', '/share-v2/u/x', 'places/x-abc123', '//places/x-abc123']) {
    assert.equal(shareV2Target(path), null, path)
  }
})

test('the fixture lane renders each v2 page in English and Bahasa with no database, and its gone states', async () => {
  const run = () => lane({ fixtures: true, env: { SHARE_V2_PAGES: '1' } })
  for (const locale of ['en', 'id']) {
    const t = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')).SharePages
    const place = await run().page(PLACE_ROUTE, { locale, slug: 'kendal-street-kitchen-f10001' })
    assert.equal(place.thrown, null)
    for (const words of ['Kendal Street Kitchen', 'Harissa prawns', `${t.aRegular}, Maître d’`, t.whatPeopleAte, t.openInMakan]) assert.ok(place.html.includes(words), `${locale} place: ${words}`)
    assert.doesNotMatch(place.text, /Alex|makan_fixture/)
    const meal = await run().page(MEAL_ROUTE, { locale, id: 'fixture-public-meal' })
    for (const words of [t.mealBy.replace('{username}', 'makan_fixture'), 'Harissa prawns', 'Kendal Street Kitchen', t.openInMakan]) assert.ok(meal.html.includes(words), `${locale} meal: ${words}`)
    const profile = await run().page(PROFILE_ROUTE, { locale, slug: `alex-${KEY}` })
    for (const words of ['Alex', '@alex', t.top3, t.maitred, t.recent, t.getApp, t.haveApp]) assert.ok(profile.html.includes(words), `${locale} profile: ${words}`)
    const empty = await run().page(PROFILE_ROUTE, { locale, slug: 'alex-00000000' })
    assert.ok(empty.html.includes('@alex')); assert.doesNotMatch(empty.html, /profile-top3|profile-maitred|profile-recent/)
    for (const [route, params] of [[MEAL_ROUTE, { id: 'fixture-private-meal' }], [MEAL_ROUTE, { id: 'unknown-meal-id' }], [PROFILE_ROUTE, { slug: 'gone-g0neg0ne' }], [PROFILE_ROUTE, { slug: 'held-hhhhhhhh' }]]) {
      const gone = await run().page(route, { locale, ...params })
      assert.ok(gone.html.includes(`<h1>${t.unavailable}</h1>`), `${locale} gone ${JSON.stringify(params)}`)
      assert.ok(gone.html.includes(t.getApp))
      assert.equal(gone.html.includes(t.mealGone), route === MEAL_ROUTE)
      assert.doesNotMatch(gone.text, /PRIVATE FIXTURE|Alex|prawns/)
    }
  }
})

test('every Share v2 string exists in both languages, a diner\'s meal is "makanan", and the new copy never reaches the client', () => {
  const en = JSON.parse(readFileSync('messages/en.json', 'utf8')).SharePages
  const id = JSON.parse(readFileSync('messages/id.json', 'utf8')).SharePages
  assert.deepEqual(Object.keys(id), Object.keys(en))
  assert.doesNotMatch(JSON.stringify(id), /momen makan/i)
  for (const file of ['components/share/ShareActions.tsx']) assert.doesNotMatch(readFileSync(file, 'utf8'), /useTranslations|next-intl/)
})
