import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { runInNewContext } from 'node:vm'
import { createHash, timingSafeEqual } from 'node:crypto'
import test from 'node:test'
import ts from 'typescript'
import sharp from 'sharp'

// Execute real server exports; any provider client construction or fetch is a failing test.
function lane(overrides = {}) {
  const env = { NODE_ENV: 'development', MAKAN_WEBSITE_FIXTURES: '1', ...overrides }
  const cache = new Map()
  const attempted = []
  const reject = name => () => { attempted.push(name); throw new Error(`Forbidden fixture provider: ${name}`) }
  class ForbiddenClient { constructor() { attempted.push('provider constructor'); throw new Error('Forbidden fixture client') } }
  class Timestamp { static now() { return new Timestamp() } }
  class TestResponse extends Response {
    static json(body, init) { return new TestResponse(JSON.stringify(body), { ...init, headers: { 'content-type': 'application/json', ...init?.headers } }) }
    static redirect(url, status = 307) { return new TestResponse(null, { status, headers: { location: String(url) } }) }
  }
  function load(relative) {
    let file = resolve(relative)
    if (!existsSync(file)) file += '.ts'
    if (cache.has(file)) return cache.get(file)
    if (file.endsWith('.json')) return JSON.parse(readFileSync(file, 'utf8'))
    const exports = {}
    cache.set(file, exports)
    let code = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
    if (relative === 'app/[locale]/places/[slug]/opengraph-image.tsx') code += '\nexports.testCardPhoto = cardPhoto;'
    runInNewContext(code, {
      exports, process: { env, cwd: () => process.cwd() }, Buffer, URL, URLSearchParams, Request, Response,
      console: { warn() {}, error() {}, log() {} }, fetch: reject('fetch'),
      require(id) {
        if (id === 'server-only') return {}
        if (id === 'node:crypto' || id === 'crypto') return { createHash, timingSafeEqual, default: { createHash, timingSafeEqual } }
        if (id === 'node:path') return { join: (...parts) => resolve(...parts) }
        if (id === 'node:fs/promises') return { readFile: async path => readFileSync(path) }
        if (id === 'next/cache') return { unstable_cache: fn => fn }
        if (id === 'next/server') return { NextResponse: TestResponse }
        if (id === 'next/og') return {}
        if (id === '../../_social-image') return {}
        if (id === 'sharp') return { default: sharp }
        if (id === 'firebase-admin/app') return Object.fromEntries(['initializeApp','getApps','cert','applicationDefault'].map(name => [name, reject(name)]))
        if (id === 'firebase-admin/firestore') return { Firestore: ForbiddenClient, getFirestore: reject('getFirestore'), Timestamp }
        if (id === 'google-auth-library') return { GoogleAuth: ForbiddenClient, JWT: ForbiddenClient }
        if (id === '@vercel/oidc') return { getVercelOidcToken: reject('OIDC') }
        if (id === 'googleapis') return { google: { auth: { GoogleAuth: ForbiddenClient }, sheets: reject('Sheets') } }
        if (id === 'resend') return { Resend: ForbiddenClient }
        if (id === 'react/jsx-runtime') return { jsx() {}, jsxs() {} }
        if (id === 'next/navigation') return { redirect: reject('unexpected redirect'), notFound: reject('unexpected notFound') }
        if (id === 'next-intl/server') return { getTranslations: async () => key => key, setRequestLocale() {} }
        if (id === 'next/image' || id === 'next/link' || id.startsWith('@/components/')) return {}
        if (id.startsWith('@/')) return load(id.slice(2))
        if (id.startsWith('.')) return load(resolve(dirname(file), id))
        throw new Error(`Unexpected import: ${id} in ${relative}`)
      },
    }, { filename: relative })
    return exports
  }
  return { env, load, attempted }
}
let address = 0
const request = (path, body, extra = {}) => new Request(`http://localhost:3000${path}`, { method: 'POST', headers: { 'content-type': 'application/json', 'sec-fetch-site': 'same-origin', 'x-real-ip': `fixture-${++address}`, ...extra }, body: JSON.stringify(body) })

test('fixture mode is explicit, validates state, and rejects deployment markers', () => {
  assert.equal(lane({ MAKAN_WEBSITE_FIXTURES: '' }).load('lib/website-fixtures.ts').WEBSITE_FIXTURES, false)
  for (const key of ['VERCEL','K_SERVICE','K_REVISION','FIREBASE_APP_HOSTING','FIREBASE_APP_HOSTING_ENV']) {
    assert.throws(() => lane({ [key]: 'present' }).load('lib/website-fixtures.ts'), /cannot run in a deployment/)
  }
  assert.throws(() => lane({ MAKAN_WEBSITE_FIXTURE_STATE: 'made-up' }).load('lib/website-fixtures.ts'), /Unknown website fixture/)
})

test('Firebase, ADC, federation, Places tokens and Sheets are fenced before client construction', async () => {
  const run = lane({ FIREBASE_PROJECT_ID: 'munchies-expo', FIREBASE_CLIENT_EMAIL: 'test@example.test', FIREBASE_PRIVATE_KEY: 'not-a-key', GCP_WORKLOAD_IDENTITY_PROVIDER: 'provider', GCP_SERVICE_ACCOUNT_EMAIL: 'test@example.test' })
  assert.equal(run.load('lib/firebase-admin.ts').getDb(), null)
  assert.equal(run.load('lib/firebase-admin.ts').getDb(), null)
  assert.equal(await run.load('lib/place-city.ts').accessToken(), null)
  assert.equal(run.load('lib/gcp-federation.ts').federatedCredentials('test@example.test'), null)
  assert.throws(() => run.load('lib/sheets-auth.ts').getSheetsAuth(), /Sheets is disabled/)
  assert.deepEqual(run.attempted, [])
})

test('healthy typed readers provide local data without invoking any provider', async () => {
  const run = lane(); const f = run.load('lib/website-fixtures.ts')
  const stats = run.load('lib/makan-stats.ts')
  assert.equal(await stats.getMealCount(), 5700)
  assert.equal((await stats.getPlaceStats()).places, 2)
  assert.equal((await stats.getRecentPublicMeals(2)).length, 2)
  assert.ok((await stats.getRecentPublicMeals()).every(meal => meal.src.startsWith('/redesign/')))
  const directory = run.load('lib/place-directory.ts')
  assert.equal((await directory.getPlaceIndex()).length, 2)
  assert.equal((await directory.getPlaceDirectory()).length, 2)
  assert.equal((await directory.getDirectoryPlace(f.FIXTURE_SLUG)).placeId, f.FIXTURE_PLACE_ID)
  assert.equal(await directory.getDirectoryPlace('unknown-f10003'), null)
  assert.equal((await run.load('lib/eat-standings.ts').getCityStanding('london')).city.rows.length, 2)
  assert.ok((await run.load('lib/place-photo.ts').getPlacePhoto(f.FIXTURE_PLACE_ID)).uri.startsWith('/redesign/'))
  assert.equal((await run.load('lib/maitred.ts').getMaitredAt(f.FIXTURE_PLACE_ID)).holderName, 'Alex')
  assert.equal(await run.load('lib/maitred.ts').getMaitredAt('missing'), undefined)
  assert.equal((await run.load('lib/claim-link.ts').getClaimVenue(f.FIXTURE_SLUG)).appLink, true)
  assert.equal(await run.load('lib/claim-link.ts').getClaimVenue('bad/token'), null)
  assert.equal((await run.load('lib/claim-venues.ts').getClaimSearchEntries()).length, 2)
  assert.equal((await run.load('lib/place-link.ts').getLinkedPlace(f.FIXTURE_PLACE_ID, f.FIXTURE_DISH_ID)).dish.name, 'Prawns')
  assert.equal(await run.load('lib/place-link.ts').getLinkedPlace('bad'), null)
  assert.equal((await run.load('lib/app-store.ts').getAppStoreRating()).count, 6)
  assert.deepEqual(run.attempted, [])
})

test('empty and unavailable stay distinct; stale evidence keeps its timestamp', async () => {
  for (const state of ['empty', 'unavailable']) {
    const run = lane({ MAKAN_WEBSITE_FIXTURE_STATE: state })
    assert.equal((await run.load('lib/place-directory.ts').getPlaceDirectory()).length, 0)
    assert.equal((await run.load('lib/eat-standings.ts').getEatStandings()).rows.length, 0)
    assert.equal(await run.load('lib/app-store.ts').getAppStoreRating(), null)
    const maitred = await run.load('lib/maitred.ts').getMaitredAt('fixture_kendal_0001')
    assert.equal(maitred, undefined)
    assert.deepEqual(run.attempted, [])
  }
  const run = lane({ MAKAN_WEBSITE_FIXTURE_STATE: 'stale' })
  assert.equal((await run.load('lib/eat-standings.ts').getEatStandingsSnapshot()).checkedAt, '2026-09-01T12:00:00.000Z')
})

test('meal metadata uses the real public gate; private sentinel never leaves', async () => {
  const run = lane(); const route = run.load('app/[locale]/meal/[id]/page.tsx')
  const metadata = id => route.generateMetadata({ params: Promise.resolve({ id, locale: 'en' }) })
  const publicResult = await metadata('fixture-public-meal')
  assert.match(publicResult.title, /makan_fixture/)
  for (const id of ['fixture-private-meal','missing']) {
    const result = await metadata(id)
    assert.equal(Object.keys(result).length, 0)
    assert.doesNotMatch(JSON.stringify(result), /PRIVATE FIXTURE|prawns/)
  }
  assert.deepEqual(run.attempted, [])
})

test('table API retains origin, format, hash and terminal-state validation without Firebase', async () => {
  const run = lane(); const f = run.load('lib/website-fixtures.ts'); const { POST } = run.load('app/api/table-invite/preview/route.ts')
  for (const [publicId,state] of [['fixtureTable','active'],['expiredTable','expired'],['revokedTable','revoked'],['fullTable___','full']]) {
    const result = await POST(request('/api/table-invite/preview', { publicId, secret: f.FIXTURE_SECRET }))
    assert.equal(result.status, 200); assert.equal((await result.json()).state, state)
    assert.match(result.headers.get('cache-control'), /private, no-store/)
  }
  for (const body of [{ publicId: 'fixtureTable', secret: 'x'.repeat(43) }, { publicId: 'bad', secret: f.FIXTURE_SECRET }]) {
    const value = await (await POST(request('/api/table-invite/preview', body))).json()
    assert.equal(value.state, 'invalid'); assert.equal(value.hostDisplayName, '')
  }
  const foreign = request('/api/table-invite/preview', { publicId:'fixtureTable',secret:f.FIXTURE_SECRET }, { origin:'https://example.test','sec-fetch-site':'cross-site' })
  assert.equal((await POST(foreign)).status,403)
  assert.deepEqual(run.attempted, [])
})

test('taste fixtures expose only public synthetic meals and redact invalid/expired/private states', () => {
  const run=lane(); const f=run.load('lib/website-fixtures.ts')
  assert.equal(f.fixtureTaste('fixtureTaste', f.FIXTURE_SECRET).meals.length, 3)
  for (const id of ['expiredTaste','revokedTaste','privateTaste','unknownTaste']) {
    const result=f.fixtureTaste(id,f.FIXTURE_SECRET)
    assert.equal(result.meals.length,0); assert.equal(result.hostDisplayName,'')
  }
  assert.equal(f.fixtureTaste('fixtureTaste','x'.repeat(43)).state,'invalid')
  assert.deepEqual(run.attempted,[])
})

test('form validation runs before local success/failure; no email, Sheets or Turnstile request', async () => {
  for (const kind of ['contact', 'partner']) {
    const run=lane({ GOOGLE_SHEET_ID:'fixture-sheet', RESEND_API_KEY:'not-a-key', TURNSTILE_SECRET_KEY:'not-a-key' })
    const {POST}=run.load(`app/api/${kind}/route.ts`)
    const body={ name:'Fixture Person',email:'fixture@example.test',restaurant:'Fixture Kitchen',city:'London',message:'Fixture only',turnstileToken:'fixture-turnstile-pass' }
    assert.equal((await POST(request(`/api/${kind}`,{...body,name:'  '}))).status,400)
    assert.equal((await POST(request(`/api/${kind}`,{...body,email:'not-email'}))).status,400)
    assert.equal((await POST(request(`/api/${kind}`,{...body,name:'x'.repeat(101)}))).status,400)
    assert.equal((await POST(request(`/api/${kind}`,{...body,turnstileToken:'fixture-turnstile-fail'}))).status,400)
    const success=await POST(request(`/api/${kind}`,body)); assert.equal(success.status,200)
    const result=await success.json();assert.equal(result.fixture,true);assert.equal(result.success,true)
    assert.equal((await POST(request(`/api/${kind}`,{...body,email:'fail@example.test'}))).status,503)
    const foreign=request(`/api/${kind}`,body,{origin:'https://example.test','sec-fetch-site':'cross-site'})
    assert.equal((await POST(foreign)).status,403)
    assert.deepEqual(run.attempted,[])
  }
})

test('cron and thumbnail routes cannot scan, write, fetch or redirect to a remote provider', async () => {
  const run=lane()
  const cron=await run.load('app/api/cron/aggregates/route.ts').GET(new Request('http://localhost:3000/api/cron/aggregates'))
  assert.equal(cron.status,403)
  const image='https://firebasestorage.googleapis.com/v0/b/munchies-expo.firebasestorage.app/o/fixture.jpg?alt=media'
  const thumb=await run.load('app/api/thumb/route.ts').GET(new Request(`http://localhost:3000/api/thumb?u=${encodeURIComponent(image)}&w=480`))
  assert.equal(thumb.status,503); assert.equal(thumb.headers.get('location'),null)
  assert.deepEqual(run.attempted,[])
})


test('OG photos read only local allowlisted fixture images, preserving image rendering', async () => {
  const run=lane(); const { testCardPhoto }=run.load('app/[locale]/places/[slug]/opengraph-image.tsx')
  assert.equal(await testCardPhoto('https://firebasestorage.googleapis.com/example.jpg'), null)
  assert.equal(await testCardPhoto('/redesign/../../secret.jpg'), null)
  assert.match(await testCardPhoto('/redesign/prawns.jpg'), /^data:image\/jpeg;base64,/)
  assert.deepEqual(run.attempted,[])
})

test('without fixture mode the original provider path remains selected', async () => {
  const run=lane({ MAKAN_WEBSITE_FIXTURES:'' })
  assert.equal(await run.load('lib/app-store.ts').getAppStoreRating(), null)
  assert.deepEqual(run.attempted,['fetch'])
  assert.throws(() => run.load('lib/firebase-admin.ts').getDb(), /Forbidden fixture provider/)
  assert.deepEqual(run.attempted,['fetch','getApps'])
  const form=lane({ MAKAN_WEBSITE_FIXTURES:'' })
  const {POST}=form.load('app/api/contact/route.ts')
  const result=await POST(request('/api/contact',{name:'Fixture Person',email:'fixture@example.test'}))
  assert.equal(result.status,500)
  assert.deepEqual(form.attempted,['provider constructor'])
})


test('Maître d’ fixture states preserve unknown, explicit vacancy, unresolved, disabled and missing content', async () => {
  const expectations = [
    ['healthy', 'held'], ['empty', 'unavailable'], ['unavailable', 'unavailable'],
    ['maitred-vacant', 'vacant'], ['maitred-unresolved', 'unresolved'],
    ['maitred-disabled', 'disabled'], ['maitred-no-order', 'held'], ['maitred-no-photo', 'held'],
  ]
  for (const [state, expected] of expectations) {
    const run = lane({ MAKAN_WEBSITE_FIXTURE_STATE: state })
    const f = run.load('lib/website-fixtures.ts')
    const api = run.load('lib/maitred.ts')
    const place = await api.getMaitredStateAt(f.FIXTURE_PLACE_ID)
    assert.equal(place.status, expected, state)
    const compatibility = await api.getMaitredAt(f.FIXTURE_PLACE_ID)
    if (expected === 'vacant') assert.equal(compatibility, null)
    else if (expected !== 'held') assert.equal(compatibility, undefined)
    if (state === 'maitred-no-order') assert.equal(place.venue.notes.always, '')
    if (state === 'maitred-no-photo') assert.equal(place.venue.photo, null)
    const directory = await api.getMaitredDirectory()
    assert.equal(directory.status, state === 'unavailable' ? 'unavailable' : state === 'maitred-disabled' ? 'disabled' : 'ready')
    assert.deepEqual(run.attempted, [])
  }
})
