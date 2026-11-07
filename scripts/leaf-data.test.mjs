import assert from 'node:assert/strict'
import { createHash, timingSafeEqual } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'
import test from 'node:test'
import ts from 'typescript'

// Exercise the real route/loader exports with an in-memory provider. No Firebase,
// email, Places or network client is constructed. React's request-cache adapter
// is reset explicitly between simulated requests; Next's route policy is checked
// separately, not claimed as browser/cache integration coverage.
function lane() {
  const state = {
    meals: new Map(), invites: new Map(), links: new Map(), restaurants: new Map(), users: new Map(),
    index: [], failures: new Set(), reads: [], indexReads: 0,
  }
  const modules = new Map()
  const dataCache = new Map()
  let requestCache = new Map()
  const forbidden = name => { throw new Error(`Forbidden leaf-test dependency: ${name}`) }
  const snapshot = (id, data) => ({ id, exists: data !== undefined, data: () => data })
  const read = (collection, id) => {
    state.reads.push({ collection, id })
    if (state.failures.has(collection)) throw new Error('Synthetic provider failure')
    const rows = state[collection === 'tableInvites' ? 'invites' : collection === 'claimLinks' ? 'links' : collection]
    return id === undefined
      ? { docs: [...rows].map(([key, value]) => snapshot(key, value)), empty: rows.size === 0 }
      : snapshot(id, rows.get(id))
  }
  const db = {
    doc(path) { const [collection, id] = path.split('/'); return { get: async () => read(collection, id) } },
    async getAll(...refs) {
      const options = refs.pop()
      assert.deepEqual([...options.fieldMask], ['username'])
      return Promise.all(refs.map(async ref => {
        const snap = await ref.get()
        return snapshot(snap.id, snap.exists ? { username: snap.data().username } : undefined)
      }))
    },
    collection(collection) {
      if (collection === 'businesses') return { where: () => ({ select: () => ({ limit: () => ({ get: async () => ({ empty: true }) }) }) }) }
      return { doc: id => ({ get: async () => read(collection, id) }), select: () => ({ get: async () => read(collection) }) }
    },
  }
  class TestResponse extends Response {
    static json(body, init) { return new TestResponse(JSON.stringify(body), { ...init, headers: { 'content-type': 'application/json', ...init?.headers } }) }
  }
  function load(relative) {
    if (modules.has(relative)) return modules.get(relative)
    const exports = {}
    modules.set(relative, exports)
    const code = ts.transpileModule(readFileSync(resolve(relative), 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText
    runInNewContext(code, {
      exports, Buffer, URL, URLSearchParams, Request, Response,
      console: { error() {}, warn() {} }, fetch: () => forbidden('fetch'),
      require(id) {
        if (id === 'server-only') return {}
        if (id === 'node:crypto') return { default: { createHash, timingSafeEqual } }
        if (id === 'next/server') return { NextResponse: TestResponse }
        if (id === '@/lib/firebase-admin') return { getDb: () => db }
        if (id === '@/lib/website-fixtures') return { WEBSITE_FIXTURES: false }
        if (id === '@/lib/rate-limit') return { rateLimited: () => false }
        if (id === '@/lib/api-validation') return { ALLOWED_ORIGINS: [], isAllowedOrigin: () => true, parseSafeJson: request => request.json() }
        if (id === '@/lib/place-directory') return {
          getPlaceIndex: async () => { state.indexReads++; return state.index },
          getDirectoryPlaceById: async () => null,
        }
        if (id === '@/lib/claim-search') return load('lib/claim-search.ts')
        if (id === '@/lib/public-meal') return load('lib/public-meal.ts')
        if (id === '@/i18n/paths') return { localizePath: (locale, path) => locale === 'id' ? `/id${path}` : path }
        if (id === 'react') return { cache: fn => (...args) => {
          if (!requestCache.has(fn)) requestCache.set(fn, new Map())
          const memo = requestCache.get(fn); const key = JSON.stringify(args)
          if (!memo.has(key)) memo.set(key, fn(...args))
          return memo.get(key)
        } }
        if (id === 'next/cache') return { unstable_cache: (fn, keyParts) => async (...args) => {
          const key = JSON.stringify([keyParts, args])
          if (dataCache.has(key)) return dataCache.get(key)
          const result = await fn(...args)
          dataCache.set(key, result)
          return result
        } }
        if (id === 'react/jsx-runtime') return { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }) }
        if (id === 'next/navigation') return { redirect: path => { throw new Error(`REDIRECT:${path}`) } }
        if (id === 'next-intl/server') return { getTranslations: async () => key => key, setRequestLocale() {} }
        if (id === 'next/image' || id === 'next/link' || id.startsWith('@/components/')) return { default: id }
        return forbidden(id)
      },
    }, { filename: relative })
    return exports
  }
  return { state, load, nextRequest: () => { requestCache = new Map() } }
}

const mealPath = 'app/[locale]/meal/[id]/page.tsx'
const mealProps = { params: Promise.resolve({ id: 'public-meal', locale: 'en' }) }
const publicMeal = { isPublic: true, moderationStatus: 'active', username: 'meal_person', caption: 'PUBLIC MEAL SENTINEL', imageURL: 'https://firebasestorage.googleapis.com/public.jpg' }

test('meal page and metadata share one current read; the next request hides a newly private meal', async () => {
  const run = lane(); run.state.meals.set('public-meal', publicMeal)
  const route = run.load(mealPath)
  assert.equal(route.dynamic, 'force-dynamic')
  const [metadata, body] = await Promise.all([route.generateMetadata(mealProps), route.default(mealProps)])
  assert.equal(metadata.description, publicMeal.caption)
  assert.match(JSON.stringify(body), /PUBLIC MEAL SENTINEL/)
  assert.equal(run.state.reads.filter(read => read.collection === 'meals').length, 1)
  run.state.meals.set('public-meal', { ...publicMeal, isPublic: false })
  run.nextRequest()
  assert.equal(JSON.stringify(await route.generateMetadata(mealProps)), '{}')
  await assert.rejects(route.default(mealProps), /REDIRECT:\//)
  assert.equal(run.state.reads.filter(read => read.collection === 'meals').length, 2)
})

test('deleted, moderated, draft and local meals never reach public metadata or page output', async () => {
  const run = lane(); const route = run.load(mealPath)
  const cases = [
    { isPublic: undefined }, { isPublic: null }, { isDeleted: true }, { deletedAt: '2026-11-07' },
    { isPublicDraft: true }, { isLocalDraft: true }, { isLocalOnly: true }, { storageScope: 'local_private' },
    { moderationStatus: 'removed' }, { moderationStatus: 'pending' },
  ]
  for (const change of cases) {
    run.state.meals.set('public-meal', { ...publicMeal, ...change }); run.nextRequest()
    assert.equal(JSON.stringify(await route.generateMetadata(mealProps)), '{}', JSON.stringify(change))
    await assert.rejects(route.default(mealProps), /REDIRECT:\//, JSON.stringify(change))
  }
})

test('meal read failures fail closed and recover on the next request', async () => {
  const run = lane(); run.state.meals.set('public-meal', publicMeal); run.state.failures.add('meals')
  const route = run.load(mealPath)
  assert.equal(JSON.stringify(await route.generateMetadata(mealProps)), '{}')
  await assert.rejects(route.default(mealProps), /REDIRECT:\//)
  run.state.failures.clear(); run.nextRequest()
  assert.equal((await route.generateMetadata(mealProps)).description, publicMeal.caption)
})

test('public meal bylines use the current chosen username before saved legacy handles', async () => {
  for (const authorField of ['userID', 'uid']) {
    const run = lane()
    run.state.meals.set('public-meal', { ...publicMeal, [authorField]: 'author', username: undefined, userName: 'legacy_handle' })
    run.state.users.set('author', { username: '  current_handle  ', name: 'PRIVATE NAME', email: 'private@example.test' })
    const route = run.load(mealPath)
    const [metadata, body] = await Promise.all([route.generateMetadata(mealProps), route.default(mealProps)])
    assert.match(metadata.title, /^@current_handle/)
    assert.match(JSON.stringify(body), /@current_handle/)
    assert.doesNotMatch(JSON.stringify([metadata, body]), /legacy_handle|PRIVATE NAME|private@example/)
    assert.equal(run.state.reads.filter(read => read.collection === 'users').length, 1)
  }
})

test('meal byline fallback is bounded, and ineligible meals never read a profile', async () => {
  for (const profile of [undefined, { username: 'user_generated' }, { username: '' }]) {
    const run = lane()
    run.state.meals.set('public-meal', { ...publicMeal, userID: 'author', username: undefined, userName: 'legacy_handle' })
    if (profile) run.state.users.set('author', profile)
    const route = run.load(mealPath)
    assert.match((await route.generateMetadata(mealProps)).title, /^@legacy_handle/)
    run.state.meals.set('public-meal', { ...publicMeal, userID: 'author', isLocalOnly: true }); run.nextRequest()
    const before = run.state.reads.length
    assert.equal(JSON.stringify(await route.generateMetadata(mealProps)), '{}')
    assert.equal(run.state.reads.slice(before).filter(read => read.collection === 'users').length, 0)
  }
  const run = lane()
  run.state.meals.set('public-meal', { ...publicMeal, userID: 'author', username: undefined, userName: 'legacy_handle' })
  run.state.failures.add('users')
  assert.match((await run.load(mealPath).generateMetadata(mealProps)).title, /^@legacy_handle/)
  run.state.meals.set('public-meal', { ...publicMeal, userID: 'author', username: undefined, userName: 'user_generated' }); run.nextRequest()
  assert.doesNotMatch((await run.load(mealPath).generateMetadata(mealProps)).title, /@|user_generated/)
})

const secret = 's'.repeat(43)
const invite = () => ({
  status: 'active', consentVersion: 2, tokenHash: createHash('sha256').update(secret).digest('hex'),
  hostDisplayName: 'HOST IDENTITY SENTINEL', hostAvatarUrl: 'https://example.test/private-avatar.jpg',
  expiresAt: { toMillis: () => Date.now() + 60_000, toDate: () => new Date(Date.now() + 60_000) },
})
const inviteRequest = (suppliedSecret = secret) => new Request('http://localhost/api/table-invite/preview', {
  method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ publicId: 'tableInvite1', secret: suppliedSecret }),
})

test('only active table previews return host identity; every terminal state is redacted', async () => {
  const run = lane(); const { POST } = run.load('app/api/table-invite/preview/route.ts')
  run.state.invites.set('tableInvite1', invite())
  const active = await POST(inviteRequest())
  assert.match(active.headers.get('cache-control'), /private, no-store/)
  const activeBody = await active.json()
  assert.equal(activeBody.state, 'active'); assert.equal(activeBody.hostDisplayName, 'HOST IDENTITY SENTINEL')
  assert.equal(activeBody.hostAvatarUrl, invite().hostAvatarUrl); assert.ok(activeBody.expiresAt)
  for (const [change, expected] of [
    [{ status: 'revoked' }, 'revoked'], [{ status: 'full' }, 'full'], [{ status: 'other' }, 'invalid'],
    [{ consentVersion: 1 }, 'invalid'], [{ expiresAt: { toMillis: () => Date.now() - 1 } }, 'expired'],
    [{ expiresAt: undefined }, 'expired'],
  ]) {
    run.state.invites.set('tableInvite1', { ...invite(), ...change })
    const response = await POST(inviteRequest()); const value = await response.json()
    assert.deepEqual(value, { state: expected, hostDisplayName: '', hostAvatarUrl: '', expiresAt: null })
    assert.doesNotMatch(JSON.stringify(value), /SENTINEL|private-avatar/)
  }
})

test('wrong invite secrets remain redacted and failed reads can retry', async () => {
  const run = lane(); run.state.invites.set('tableInvite1', invite())
  const { POST } = run.load('app/api/table-invite/preview/route.ts')
  assert.deepEqual(await (await POST(inviteRequest('x'.repeat(43)))).json(), { state: 'invalid', hostDisplayName: '', hostAvatarUrl: '', expiresAt: null })
  run.state.failures.add('tableInvites')
  assert.equal((await POST(inviteRequest())).status, 503)
  run.state.failures.clear()
  assert.equal((await (await POST(inviteRequest())).json()).state, 'active')
})

const listed = { placeId: 'known-place', slug: 'known-place-abcdef', name: 'Known Kitchen', city: 'London', meals: 7 }

test('claim details retain the known public count when a restaurant projection is absent or invalid', async () => {
  for (const restaurant of [undefined, {}, { publicMealCount: -1 }, { publicMealCount: 1.5 }]) {
    const run = lane(); run.state.index = [listed]
    if (restaurant) run.state.restaurants.set(listed.placeId, restaurant)
    const venue = await run.load('lib/claim-link.ts').getClaimVenue(listed.slug)
    assert.equal(venue.mealCount, 7); assert.equal(venue.name, listed.name); assert.equal(venue.appLink, false)
    assert.equal(run.state.indexReads, 1)
  }
})

test('prepared claims retain their link behavior and prefer a valid restaurant count, including zero', async () => {
  for (const count of [0, 3]) {
    const run = lane(); run.state.index = [listed]
    run.state.links.set('prepared-abcdef', { placeId: listed.placeId, displayName: 'Prepared Kitchen', area: 'Prepared Area' })
    run.state.restaurants.set(listed.placeId, { displayName: 'Current Kitchen', publicMealCount: count })
    const venue = await run.load('lib/claim-link.ts').getClaimVenue('prepared-abcdef')
    assert.equal(venue.mealCount, count); assert.equal(venue.name, 'Current Kitchen'); assert.equal(venue.area, 'Prepared Area')
    assert.equal(venue.appLink, true); assert.equal(run.state.indexReads, 0)
  }
  const run = lane(); run.state.index = [listed]
  run.state.links.set('prepared-abcdef', { placeId: listed.placeId, displayName: 'Prepared Kitchen' })
  const venue = await run.load('lib/claim-link.ts').getClaimVenue('prepared-abcdef')
  assert.equal(venue.mealCount, 7); assert.equal(venue.appLink, true); assert.equal(venue.name, 'Prepared Kitchen')
})

test('prepared-source failure preserves directory search and retries without caching the failure', async () => {
  const run = lane(); run.state.index = [listed]; run.state.failures.add('claimLinks')
  const { getClaimSearchEntries } = run.load('lib/claim-venues.ts')
  const initial = await getClaimSearchEntries()
  assert.equal(initial.length, 1); assert.equal(initial[0].path, `/claim/${listed.slug}`)
  run.state.failures.clear()
  run.state.links.set('prepared-abcdef', { placeId: listed.placeId, displayName: 'Prepared Kitchen', area: 'London' })
  const recovered = await getClaimSearchEntries()
  assert.equal(recovered.length, 1); assert.equal(recovered[0].path, '/claim/prepared-abcdef')
  assert.equal(recovered[0].name, 'Prepared Kitchen')
  run.state.index.push({ ...listed, placeId: 'next-place', slug: 'next-place-fedcba', name: 'Next Kitchen' })
  assert.equal((await getClaimSearchEntries()).length, 2)
  assert.equal(run.state.reads.filter(read => read.collection === 'claimLinks').length, 2)
})
