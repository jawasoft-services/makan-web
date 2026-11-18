import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createRequire } from 'node:module'
import { AsyncLocalStorage } from 'node:async_hooks'
import ts from 'typescript'

// Real application modules and Next's cache implementation. Only cache storage,
// request memoization and the provider are local adapters; outbound fetch is blocked.
const require = createRequire(import.meta.url)
globalThis.AsyncLocalStorage ??= AsyncLocalStorage
const { unstable_cache } = require('next/cache')
const realReact = require('react')
const KEY = 'k3f9q2x7'
const USER = 'profile-host'
const storage = 'https://firebasestorage.googleapis.com/v0/b/fixture/o/photo.jpg'
const record = (path, value) => ({ id: path.split('/').at(-1), exists: value !== undefined, data: () => value })
const meal = (extra = {}) => ({ userID: USER, isPublic: true, moderationStatus: 'active', caption: 'Nasi goreng', locationName: 'Warung Bu Sri', imageURL: storage, placeProviderId: 'known-place', timestamp: 100, ...extra })
const user = (extra = {}) => ({ name: 'Dewi', username: 'dewi.l', accountStatus: 'active', bio: 'Teks pengguna', photoURL: storage, ...extra })
const venue = { placeId: 'known-place', slug: 'warung-bu-sri-abc123', name: 'Warung Bu Sri', holderName: 'Dewi', holderPhoto: null, notes: { always: '', another: '', why: '', tip: '' }, photo: null, where: null }
function seedProfile(seed = new Map(), key = KEY) {
  seed.set(`publicProfileKeys/${key}`, { uid: USER })
  seed.set(`users/${USER}`, user())
  seed.set(`users/${USER}/publicTasteGraph/top3`, { entries: ['m1', 'm2', 'm3'].map(mealId => ({ mealId })) })
  seed.set(`maitredRoles/${USER}`, { canonicalPlaceIds: ['known-place', 'unverified-place'] })
  for (let i = 1; i <= 3; i++) seed.set(`meals/m${i}`, meal({ timestamp: -i }))
  for (let i = 0; i < 12; i++) seed.set(`meals/recent${i}`, meal({ timestamp: i + 100 }))
  return seed
}
function fakeProvider(seed, reads, failures) {
  const read = async path => { reads.push(path); if (failures.has(path)) throw new Error('Synthetic read failure'); return record(path, seed.get(path)) }
  const ref = path => ({ path, get: () => read(path), collection: child => collection(`${path}/${child}`) })
  function collection(path, filters = [], count = Infinity, descending = false) {
    const query = {
      path, doc: id => ref(`${path}/${id}`), select: () => query,
      where: (field, op, value) => collection(path, [...filters, [field, op, value]], count, descending),
      limit: value => collection(path, filters, value, descending), orderBy: () => collection(path, filters, count, true),
      async get() {
        const values = [...seed].filter(([key, value]) => key.startsWith(`${path}/`) && !key.slice(path.length + 1).includes('/') && filters.every(([field, op, expected]) => op === 'in' ? expected.includes(value[field]) : value[field] === expected))
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
    return Promise.all(refs.map(async ref => {
      const snap = await ref.get()
      return mask && snap.exists ? record(ref.path, Object.fromEntries(mask.filter(key => snap.data()[key] !== undefined).map(key => [key, snap.data()[key]]))) : snap
    }))
  } }
}
function lane({ db: suppliedDb, useSharedLoaders = false } = {}) {
  const seed = seedProfile(), reads = [], failures = new Set(), modules = new Map(), stored = new Map()
  const state = { index: [{ ...venue, hash: 'abc123', city: null, indexable: true, meals: 2 }], crowns: { status: 'ready', venues: [venue] }, sharedReads: [], failCrowns: false, failIndex: false, clock: Date.now() }
  let requests = new Map()
  const db = suppliedDb ?? fakeProvider(seed, reads, failures)
  globalThis.__incrementalCache = {
    generateSimpleCacheKey: async key => key,
    get: async key => { const cached = stored.get(key); return cached ? { value: cached.value, isStale: state.clock - cached.at >= cached.value.revalidate * 1000 } : null },
    set: async (key, value) => { stored.set(key, { value, at: state.clock }) },
  }
  class ClockDate extends Date { static now() { return state.clock } }
  const forbidden = id => { throw new Error(`Forbidden test provider: ${id}`) }
  function load(relative) {
    if (modules.has(relative)) return modules.get(relative)
    const exports = {}; modules.set(relative, exports)
    const code = ts.transpileModule(readFileSync(resolve(relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
    const importModule = id => {
      if (id === 'server-only') return {}
      if (id === 'react') return { ...realReact, cache: fn => (...args) => { const key = JSON.stringify(args); if (!requests.has(fn)) requests.set(fn, new Map()); const memo = requests.get(fn); if (!memo.has(key)) memo.set(key, fn(...args)); return memo.get(key) } }
      if (id === 'react/jsx-runtime') return require(id)
      if (id === 'next/cache') return { unstable_cache }
      if (id === 'next/navigation') return { notFound: () => { throw new Error('NOT_FOUND') }, permanentRedirect: path => { throw new Error(`REDIRECT_308:${path}`) } }
      if (id === 'next-intl/server') return { setRequestLocale() {}, getTranslations: async ({ locale = 'en', namespace }) => {
        const messages = JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))
        const strings = namespace.split('.').reduce((part, key) => part[key], messages)
        return (key, params = {}) => strings[key].replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '')
      } }
      if (id === '@/lib/firebase-admin') return { getDb: () => db }
      if (id === '@/lib/website-fixtures') return { WEBSITE_FIXTURES: false }
      if (id === '@/lib/maitred' && !useSharedLoaders) return { getMaitredDirectory: async () => { if (state.failCrowns) throw new Error('unavailable'); return state.crowns } }
      if (id === '@/lib/place-directory' && !useSharedLoaders) return { getPlaceIndex: async () => { if (state.failIndex) throw new Error('unavailable'); return state.index } }
      if (id === '@/lib/gcp-federation') return { federatedCredentials: () => forbidden('cloud credentials') }
      if (id === 'google-auth-library') return { GoogleAuth: class { constructor() { forbidden('paid Google API') } }, JWT: class { constructor() { forbidden('paid Google API') } } }
      if (id === 'firebase-admin/firestore') return require(id)
      if (id.startsWith('node:')) return { ...require(id), default: require(id) }
      if (id === 'next/image' || id === 'next/link' || id.startsWith('@/components/')) return { default: typeof id === 'string' && id.endsWith('.css') ? new Proxy({}, { get: (_, key) => key }) : id }
      if (id.endsWith('.css')) return { default: new Proxy({}, { get: (_, key) => key }) }
      if (id.startsWith('@/') || id.startsWith('.')) {
        const base = id.startsWith('@/') ? id.slice(2) : resolve(dirname(relative), id)
        if (base.endsWith('.json')) return { default: JSON.parse(readFileSync(base, 'utf8')) }
        return load(/\.tsx?$/.test(base) ? base : `${base}.ts`)
      }
      return forbidden(id)
    }
    new Function('exports', 'require', 'fetch', 'Date', 'console', code)(exports, importModule, () => forbidden('fetch'), ClockDate, { error() {}, warn() {} })
    return exports
  }
  return { seed, reads, failures, state, load, nextRequest: () => { requests = new Map() }, db, stored }
}


export { lane, seedProfile, KEY, USER, venue, user, meal, storage }
