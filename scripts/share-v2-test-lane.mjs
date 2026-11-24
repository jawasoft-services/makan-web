import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { AsyncLocalStorage } from 'node:async_hooks'
import { createHash } from 'node:crypto'
import ts from 'typescript'

// RM20616 A12 U3 — runs the real Share v2 modules and pages against a fake Firestore that records every read.
// Resumed from RM20603's public-profile test lane. Only the cache store, React's request memo, the provider
// and the site's shared readers are local stand-ins; any other provider, and fetch, fail the test.
const require = createRequire(import.meta.url)
globalThis.AsyncLocalStorage ??= AsyncLocalStorage
const { unstable_cache } = require('next/cache')
const realReact = require('react')
const { renderToStaticMarkup } = require('react-dom/server')

export const KEY = 'k3f9q2x7'
export const USER = 'profile-host'
export const MEAL = 'meal-0001'
export const PLACE = 'ChIJknownplace01'
export const YEAR = 2026
export const BUCKET = 'munchies-expo.firebasestorage.app'
export const storage = `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/photo.jpg`
/**
 * The stored card of one subject, as U2 writes it (functions/shareCards/store.js, CARD_PATH):
 * shareCards/<kind>/<id>/<32 hex>-<en|id>-<12 hex>.jpg in Makan's bucket.
 */
export const HASH = '0f3a'.padEnd(32, '0')
export const cardPath = (kind, id, locale = 'en') => `shareCards/${kind}/${id}/${HASH}-${locale}-${locale === 'en' ? 'aaaaaaaaaaaa' : 'bbbbbbbbbbbb'}.jpg`
export const card = (kind, id, bucket = BUCKET, locale = 'en') => `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(cardPath(kind, id, locale))}?alt=media&token=t`
/** A current card record with one drawing per language (U2's shape), plus the private fields the website must never read. */
export const cardRecord = (kind, id, extra = {}) => ({
  kind, subjectId: id, ownerUid: kind === 'place' ? null : USER, photoOwnerUid: 'PRIVATE-PHOTO-OWNER-UID', drawnPhotoOwnerUid: 'PRIVATE-DRAWN-OWNER-UID', drawnPhotoMealId: 'meal-of-photo',
  hash: HASH, want: null, drop: false, failed: null, retired: [cardPath(kind, id, 'en').replace(HASH, 'f'.repeat(32))],
  cards: { en: { path: cardPath(kind, id, 'en'), url: card(kind, id, BUCKET, 'en') }, id: { path: cardPath(kind, id, 'id'), url: card(kind, id, BUCKET, 'id') } },
  ...extra,
})
/** The deletion fence of an account: the document the server writes while it deletes it. */
export const fence = (uid) => `accountDeletionFences/${createHash('sha256').update(uid).digest('hex')}`
export const DINERS = ['diner-1', 'diner-2']
const record = (path, value) => ({ id: path.split('/').at(-1), exists: value !== undefined, data: () => value })
export const meal = (extra = {}) => ({ userID: USER, isPublic: true, moderationStatus: 'active', caption: 'Captioned by the diner', locationName: 'Warung Bu Sri', imageURL: storage, placeProviderId: PLACE, timestamp: 100, ...extra })
export const user = (extra = {}) => ({ name: 'Dewi Lestari', username: 'dewi.l', accountStatus: 'active', bio: 'BIO TEXT', email: 'PRIVATE EMAIL', phone: 'PRIVATE PHONE', photoURL: storage, ...extra })
export const venue = { placeId: PLACE, slug: 'warung-bu-sri-abc123', name: 'Warung Bu Sri', holderName: 'HOLDER NAME', holderPhoto: `${storage}?holder`, notes: { always: 'Nasi campur ayam betutu', another: '', why: '', tip: '' }, photo: null, where: { city: 'Pererenan', country: 'Indonesia' } }
export const place = (extra = {}) => ({ placeId: PLACE, slug: venue.slug, hash: 'abc123', name: venue.name, where: venue.where, address: 'Jl. Pantai Pererenan No. 112', lat: -8.65, lng: 115.12, cuisine: ['Balinese'], since: null, indexable: true, claimed: false,
  meals: [1, 2].map(i => ({ id: `place-meal-${i}`, src: `${storage}?m${i}`, thumb: '', caption: `CAPTION ${i}`, mealType: 'Dinner', username: `diner_handle_${i}`, at: '2026-11-05T18:00:00.000Z' })), ...extra })

export function seedAll(seed = new Map()) {
  seed.set(`publicProfileKeys/${KEY}`, { uid: USER })
  seed.set(`users/${USER}`, user())
  seed.set(`users/${USER}/private/age`, { birthYear: 1994 })
  seed.set(`users/${USER}/maitredSettings/venueVisibility`, { enabled: true, noticeAt: 1 })
  seed.set(`users/${USER}/publicTasteGraph/top3`, { entries: ['m1', 'm2', 'm3'].map(mealId => ({ mealId })) })
  seed.set(`maitredRoles/${USER}`, { canonicalPlaceIds: [PLACE, 'unverified-place'] })
  for (let i = 1; i <= 3; i++) seed.set(`meals/m${i}`, meal({ timestamp: -i }))
  for (let i = 0; i < 12; i++) seed.set(`meals/recent${i}`, meal({ timestamp: i + 100 }))
  seed.set(`meals/${MEAL}`, meal())
  seed.set(`dishMemberships/${MEAL}`, { uid: USER, placeId: PLACE, name: 'Nasi campur ayam betutu' })
  // The two meals the place aggregate lists, each by its own diner.
  DINERS.forEach((uid, index) => {
    seed.set(`meals/place-meal-${index + 1}`, meal({ userID: uid, imageURL: `${storage}?m${index + 1}` }))
    seed.set(`users/${uid}`, user({ name: `Diner ${index + 1}`, username: `diner_handle_${index + 1}` }))
    seed.set(`users/${uid}/private/age`, { birthYear: 1990 })
  })
  return seed
}

/** What Firestore returns for a field mask: only the masked paths that exist, nested as stored ('want.hash' gives { want: { hash } }). */
function project(data, mask) {
  const out = {}
  for (const field of mask) {
    const parts = field.split('.')
    let value = data
    for (const part of parts) value = value !== null && typeof value === 'object' && !Array.isArray(value) ? value[part] : undefined
    if (value === undefined) continue
    let into = out
    for (const part of parts.slice(0, -1)) into = into[part] ??= {}
    into[parts.at(-1)] = value
  }
  return out
}

function fakeProvider(seed, reads, failures, masks) {
  const read = async path => { reads.push(path); if (failures.has(path)) throw new Error('Synthetic read failure'); return record(path, seed.get(path)) }
  const ref = path => ({ path, get: () => read(path) })
  function collection(path, filters = [], count = Infinity, descending = false) {
    const query = {
      path, doc: id => ref(`${path}/${id}`), select: () => query,
      where: (field, op, value) => { assert.equal(op, '=='); return collection(path, [...filters, [field, value]], count, descending) },
      limit: value => collection(path, filters, value, descending), orderBy: () => collection(path, filters, count, true),
      async get() {
        const values = [...seed].filter(([key, value]) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/') && filters.every(([field, expected]) => value[field] === expected))
        if (descending) values.sort((a, b) => b[1].timestamp - a[1].timestamp)
        const docs = await Promise.all(values.slice(0, count).map(([key]) => read(key)))
        return { docs, empty: docs.length === 0 }
      },
    }
    return query
  }
  return { doc: ref, collection, getAll: async (...refs) => {
    const mask = refs.at(-1)?.fieldMask
    if (mask) refs.pop()
    // Every batched read and the field mask it asked for, so a test can see what was requested.
    masks.push({ paths: refs.map(target => target.path), mask: mask ? [...mask] : null })
    return Promise.all(refs.map(async target => {
      const snap = await target.get()
      return mask && snap.exists ? record(target.path, project(snap.data(), mask)) : snap
    }))
  } }
}

/**
 * `env` is what the modules see as process.env (so each lane has its own switch and its own bucket setting); `fixtures` runs the site's
 * local fixture lane (no database at all). `source` maps a file to replacement source, for the rule-removal check.
 */
export function lane({ env = { SHARE_V2_PAGES: '1', SHARE_STORAGE_BUCKETS: BUCKET }, fixtures = false, source = () => null } = {}) {
  const seed = seedAll(), reads = [], failures = new Set(), modules = new Map(), stored = new Map(), logs = [], masks = []
  const state = { place: place(), row: { placeId: PLACE, rank: 7, cityRank: 3, matchups: 12, eats: 9, yeets: 3 }, computedAt: '2026-11-20T00:00:00.000Z', maitred: { status: 'held', venue }, directory: { status: 'ready', venues: [venue] }, googlePhoto: null, failCrowns: false, review: null,
    // What the page sees of the request. `null` is a request proxy.ts rewrote: it carries the proxy's own mark
    // (lib/share-v2-mark.ts). Set it to an object to play a request that reached the page some other way.
    headers: null, clock: Date.UTC(YEAR, 10, 24) }
  let requests = new Map()
  const db = fakeProvider(seed, reads, failures, masks)
  const cacheStore = {
    generateSimpleCacheKey: async key => key,
    get: async key => { const cached = stored.get(key); return cached ? { value: cached.value, isStale: state.clock - cached.at >= cached.value.revalidate * 1000 } : null },
    set: async (key, value) => { stored.set(key, { value, at: state.clock }) },
  }
  class ClockDate extends Date {
    constructor(...args) { if (args.length) super(...args); else super(state.clock) }
    static now() { return state.clock }
  }
  const processLike = { env: { ...env, ...(fixtures ? { MAKAN_WEBSITE_FIXTURES: '1' } : {}) }, cwd: () => process.cwd() }
  const forbidden = id => { throw new Error(`Forbidden test provider: ${id}`) }
  const component = (tag, pick) => ({ default: props => realReact.createElement(tag, pick(props), props.children) })
  function load(relative) {
    if (modules.has(relative)) return modules.get(relative)
    const exports = {}; modules.set(relative, exports)
    const text = source(relative) ?? readFileSync(resolve(relative), 'utf8')
    const code = ts.transpileModule(text, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
    const importModule = id => {
      if (id === 'server-only') return {}
      if (id === 'react') return { ...realReact, cache: fn => (...args) => { const key = JSON.stringify(args); if (!requests.has(fn)) requests.set(fn, new Map()); const memo = requests.get(fn); if (!memo.has(key)) memo.set(key, fn(...args)); return memo.get(key) } }
      if (id === 'react/jsx-runtime') return require(id)
      if (id === 'next/cache') return { unstable_cache }
      if (id === 'next/headers') return { headers: async () => new Headers(state.headers ?? { 'x-makan-share-v2': load('lib/share-v2-mark.ts').shareV2ProxyMark() }) }
      if (id === 'next/navigation') return { notFound: () => { throw new Error('NOT_FOUND') }, permanentRedirect: path => { throw new Error(`REDIRECT_308:${path}`) }, redirect: path => { throw new Error(`REDIRECT_307:${path}`) } }
      if (id === 'next/server') return require(id)
      if (id === 'next-intl/middleware') return { default: () => request => { const response = require('next/server').NextResponse.next(); response.headers.set('x-test-intl', new URL(request.url).pathname); return response } }
      if (id === 'next-intl/routing') return { defineRouting: value => value }
      if (id === 'next-intl/server') return { setRequestLocale() {}, getTranslations: async ({ locale, namespace }) => {
        assert.ok(locale === 'en' || locale === 'id', 'every Share v2 string is read for an explicit locale')
        const strings = namespace.split('.').reduce((part, key) => part[key], JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8')))
        return (key, params = {}) => { assert.ok(key in strings, `missing string ${namespace}.${key}`); return strings[key].replace(/\{(\w+)\}/g, (_, name) => params[name] ?? '') }
      } }
      if (id === 'next/image') return component('img', ({ src, alt, className }) => ({ src, alt, className }))
      if (id === 'next/link') return component('a', ({ href, className }) => ({ href, className }))
      if (id === '@/components/Footer' || id === '@/components/SiteSchema') return { default: () => null }
      if (id === '@/components/map/PlacesMapLoader') return { default: ({ label }) => realReact.createElement('div', { 'data-map': label }) }
      if (id === '@/lib/reviews') return { getReviewForPlace: () => state.review }
      if (id === '@/lib/firebase-admin') return { getDb: () => (fixtures ? forbidden('database in the fixture lane') : db) }
      if (id === '@/lib/place-directory') return {
        getDirectoryPlace: async slug => (fixtures ? load('lib/website-fixtures.ts').fixtureDirectory().find(p => p.slug === slug) : state.place && /-abc123$/.test(slug) ? state.place : null) ?? null,
        getDirectoryPlaceById: async id => (fixtures ? load('lib/website-fixtures.ts').fixtureDirectory().find(p => p.placeId === id) : state.place?.placeId === id ? state.place : null) ?? null,
      }
      if (id === '@/lib/eat-standings') return { getEatStandings: async () => {
        if (fixtures) return load('lib/website-fixtures.ts').fixtureStandings()
        const rows = state.row ? [state.row] : []
        return { rows, all: rows, cities: [{ slug: 'pererenan', city: 'Pererenan', country: 'Indonesia', rows }], computedAt: state.computedAt }
      } }
      if (id === '@/lib/maitred') return {
        getMaitredStateAt: async () => { if (!fixtures) return state.maitred; const held = load('lib/website-fixtures.ts').fixtureMaitred()?.venues[0]; return held ? { status: 'held', venue: held } : { status: 'unavailable' } },
        getMaitredDirectory: async () => { if (state.failCrowns) throw new Error('unavailable'); return fixtures ? { status: 'ready', venues: load('lib/website-fixtures.ts').fixtureMaitred()?.venues ?? [] } : state.directory },
      }
      if (id === '@/lib/place-photo') return { getPlacePhoto: async () => state.googlePhoto }
      if (id === '@/lib/rate-limit') return load('lib/rate-limit.ts')
      if (id === '@/i18n/routing') return { routing: { locales: ['en', 'id'], defaultLocale: 'en' } }
      if (id.startsWith('node:')) return { ...require(id), default: require(id) }
      if (id.endsWith('.css')) return { default: new Proxy({}, { get: (_, key) => key }) }
      if (id.startsWith('@/') || id.startsWith('.')) {
        const base = id.startsWith('@/') ? id.slice(2) : resolve(dirname(relative), id).replace(`${process.cwd()}/`, '')
        if (base.endsWith('.json')) return { default: JSON.parse(readFileSync(base, 'utf8')) }
        for (const file of [base, `${base}.ts`, `${base}.tsx`]) if (/\.tsx?$/.test(file)) { try { readFileSync(file); return load(file) } catch (error) { if (error.code !== 'ENOENT') throw error } }
        return forbidden(id)
      }
      return forbidden(id)
    }
    new Function('exports', 'require', 'fetch', 'Date', 'console', 'process', code)(exports, importModule, () => forbidden('fetch'), ClockDate, { error: (...args) => logs.push(args.join(' ')), warn: (...args) => logs.push(args.join(' ')), log: (...args) => logs.push(args.join(' ')) }, processLike)
    return exports
  }
  const nextRequest = () => { requests = new Map() }
  /** Runs a page as one request: its metadata, then its HTML. A thrown redirect or 404 comes back as `thrown`. */
  async function page(route, params) {
    nextRequest()
    globalThis.__incrementalCache = cacheStore
    const mod = load(route)
    const props = { params: Promise.resolve(params) }
    try {
      const metadata = await mod.generateMetadata(props)
      const html = renderToStaticMarkup(await mod.default(props))
      return { metadata, html, thrown: null, text: JSON.stringify(metadata) + html }
    } catch (error) {
      return { metadata: null, html: '', thrown: error.message, text: '' }
    }
  }
  return { seed, reads, masks, failures, state, logs, load, page, nextRequest, db, env: processLike.env, useCache: () => { globalThis.__incrementalCache = cacheStore } }
}

export const PLACE_ROUTE = 'app/[locale]/share-v2/places/[slug]/page.tsx'
export const MEAL_ROUTE = 'app/[locale]/share-v2/meal/[id]/page.tsx'
export const PROFILE_ROUTE = 'app/[locale]/share-v2/u/[slug]/page.tsx'
