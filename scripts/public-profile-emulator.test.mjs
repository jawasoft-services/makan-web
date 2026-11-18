import assert from 'node:assert/strict'
import test from 'node:test'
import { lane, seedProfile, KEY, USER, venue } from './public-profile-test-lane.mjs'

// Opt-in local emulator lane: the fixed demo project and required localhost
// emulator prevent Application Default Credentials or paid/live reads.
test('emulator: actual profile/shared loaders count by path, coalesce cold work and reuse snapshots', { skip: process.env.MAKAN_PROFILE_EMULATOR_TEST !== '1' }, async () => {
  assert.match(process.env.FIRESTORE_EMULATOR_HOST ?? '', /^(127\.0\.0\.1|localhost):\d+$/)
  const { initializeApp, deleteApp } = await import('firebase-admin/app')
  const { getFirestore, Timestamp } = await import('firebase-admin/firestore')
  const app = initializeApp({ projectId: 'demo-rm20603-web' }, `profile-budget-${Date.now()}`)
  const db = getFirestore(app)
  const reads = []
  const unwrapped = new WeakMap()
  const wrap = target => {
    const proxy = new Proxy(target, { get(object, key) {
      const value = object[key]
      if (typeof value !== 'function') return value
      if (key === 'get') return async (...args) => {
        const snapshot = await value.apply(object, args)
        if (snapshot.docs) {
          if (snapshot.docs.length) reads.push(...snapshot.docs.map(doc => doc.ref.path))
          else reads.push(`${object.path ?? 'query'}/<empty-query>`)
        } else reads.push(object.path)
        return snapshot
      }
      if (key === 'getAll') return async (...args) => {
        const snapshots = await value.apply(object, args.map(ref => unwrapped.get(ref) ?? ref))
        reads.push(...snapshots.map(doc => doc.ref.path))
        return snapshots
      }
      return (...args) => {
        const result = value.apply(object, args)
        return result && typeof result === 'object' && (typeof result.get === 'function' || typeof result.collection === 'function') ? wrap(result) : result
      }
    } })
    unwrapped.set(proxy, target)
    return proxy
  }
  try {
    const seed = seedProfile()
    seed.set('publicProfileKeys/00000000', { uid: USER })
    seed.set('webAggregates/maitred', { payload: { schemaVersion: 2, verifiedAt: Date.now(), status: 'ready', venues: [venue], places: [] } })
    seed.set('webAggregates/meta', { lastRunAt: Timestamp.now() })
    seed.set('webAggregates/placeIndex', { shards: 1, count: 1 })
    seed.set('webAggregates/placeIndex/shards/0', { entries: [{ ...venue, hash: 'abc123', city: null, indexable: true, meals: 2 }] })
    seed.set('maitredFeature/current', { enabled: false })
    seed.set('webAggregates/standings', { payload: { rows: [], all: [], cities: [], belowFloor: 0, matchups: 0, countries: 0, computedAt: new Date().toISOString() } })
    seed.set('restaurants/known-place', { displayName: venue.name, publicMealCount: 0, state: 'active' })
    const batch = db.batch()
    for (const [path, value] of seed) batch.set(db.doc(path), value)
    await batch.commit()
    const run = lane({ db: wrap(db), useSharedLoaders: true })
    const api = run.load('lib/public-profile.ts')
    const isSpecific = path => path.startsWith('publicProfileKeys/') || path.startsWith(`users/${USER}`) || path === `maitredRoles/${USER}` || path.startsWith('meals/')
    const first = api.getPublicProfile(KEY)
    run.nextRequest()
    const second = api.getPublicProfile('00000000')
    const profiles = await Promise.all([first, second])
    assert.ok(profiles.every(profile => profile?.name === 'Dewi'))
    assert.equal(reads.filter(isSpecific).length, 38)
    const shared = reads.filter(path => !isSpecific(path))
    assert.equal(shared.filter(path => path === 'webAggregates/maitred').length, 1)
    assert.equal(shared.filter(path => path === 'webAggregates/placeIndex').length, 1)
    assert.equal(shared.filter(path => path === 'maitredFeature/current').length, 1)
    assert.equal(shared.filter(path => path === 'webAggregates/standings').length, 1)
    assert.equal(shared.filter(path => path === 'restaurants/known-place').length, 1)
    reads.length = 0; run.nextRequest()
    await api.getPublicProfile(KEY)
    assert.deepEqual(reads, [], 'cached profile with warm shared snapshots makes zero reads')
    // Only evict profile data: shared snapshots and their in-flight/caches stay intact.
    for (const key of [...run.stored.keys()]) if (key.includes('makan-public-profile')) run.stored.delete(key)
    run.nextRequest(); await api.getPublicProfile(KEY)
    assert.equal(reads.length, 19)
    assert.ok(reads.every(isSpecific))
    console.log(JSON.stringify({ emulatorProject: 'demo-rm20603-web', profileColdReads: 19, profileWarmReads: 0, concurrentProfiles: 2, sharedColdReads: shared.length, sharedReadsOnNextProfile: 0, sharedPaths: shared }))
  } finally {
    await db.terminate()
    await deleteApp(app)
  }
})
