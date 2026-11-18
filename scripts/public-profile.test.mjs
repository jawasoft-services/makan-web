import assert from 'node:assert/strict'
import test from 'node:test'
import { lane, KEY, USER, user, meal, storage } from './public-profile-test-lane.mjs'

const dataPath = 'lib/public-profile.ts'
const routePath = 'app/[locale]/u/[slug]/page.tsx'
const props = (slug = `dewi-l-${KEY}`, locale = 'en') => ({ params: Promise.resolve({ slug, locale }) })
const serialize = value => JSON.stringify(value)
const profilePaths = path => path === `publicProfileKeys/${KEY}` || path === `users/${USER}` || path === `users/${USER}/publicTasteGraph/top3` || path === `maitredRoles/${USER}` || path.startsWith('meals/')

test('public data is bounded, public-only, owner-checked, allowlisted and keeps TOP 3 gaps', async () => {
  const run = lane(); run.seed.set('meals/m2', meal({ isPublic: false, caption: 'FRIENDS ONLY' }))
  run.seed.set(`users/${USER}`, user({ email: 'PRIVATE EMAIL', phone: 'PRIVATE PHONE' }))
  const profile = await run.load(dataPath).loadPublicProfileData(run.db, KEY)
  assert.deepEqual(profile.top3.map(meal => meal.rank), [1, 3])
  assert.equal(profile.recent.length, 12)
  assert.doesNotMatch(serialize(profile), /FRIENDS ONLY|PRIVATE EMAIL|PRIVATE PHONE/)
  assert.equal(profile.slug, `dewi-l-${KEY}`)
  assert.equal(run.reads.length, 19)
  assert.ok(run.reads.every(profilePaths))
})

test('all hidden states match unknown keys without reading meals or roles', async () => {
  const hidden = [{ discoverable_by_friends_of_friends: false }, { isDeleted: true }, { isSpam: true }, { deletedAt: 1 }, { username: 'user_abcdefgh_abc123' }, { name: '', display_name: '', profileSetupCompletedAt: undefined }, { name: {}, display_name: ' ', profileSetupCompletedAt: undefined }]
  for (const field of ['accountStatus', 'status', 'visibility_status', 'moderationStatus']) {
    for (const status of ['deleted', 'disabled', 'held', 'hidden', 'moderated', 'pending', 'suspended', 'spam', 'banned', 'deactivated']) hidden.push({ [field]: status })
  }
  for (const extra of hidden) {
    const run = lane(); run.seed.set(`users/${USER}`, user(extra))
    const api = run.load(dataPath)
    assert.equal(await api.getPublicProfile(KEY), null, serialize(extra))
    assert.equal(run.reads.length, 2)
    await assert.rejects(run.load(routePath).default(props()), /NOT_FOUND/)
    assert.deepEqual((await run.load(routePath).generateMetadata(props())).robots, { index: false, follow: true })
  }
  const unknown = lane()
  assert.equal(await unknown.load(dataPath).getPublicProfile('00000000'), null)
  assert.equal(unknown.reads.length, 1)
})

test('draft, local, deleted, moderated and wrong-owner TOP 3 entries never reach page or preview', async () => {
  for (const extra of [{ isPublicDraft: true }, { isLocalDraft: true }, { isLocalOnly: true }, { storageScope: 'local_private' }, { isDeleted: true }, { deletedAt: 1 }, { moderationStatus: 'held' }, { userID: 'another-person' }]) {
    const run = lane(); run.seed.set('meals/m1', meal({ ...extra, caption: 'PRIVATE SENTINEL' }))
    const metadata = await run.load(routePath).generateMetadata(props())
    const body = await run.load(routePath).default(props())
    assert.doesNotMatch(serialize([metadata, body]), /PRIVATE SENTINEL/)
  }
})

test('profile cache: 19 cold reads, zero warm, concurrent cold requests coalesce, expiry blocks and failures retry', async () => {
  const run = lane(); const api = run.load(dataPath)
  await Promise.all([api.getPublicProfile(KEY), api.getPublicProfile(KEY), api.getPublicProfile(KEY)])
  assert.equal(run.reads.length, 19)
  run.nextRequest(); run.reads.length = 0
  await api.getPublicProfile(KEY); assert.equal(run.reads.length, 0)
  run.seed.set(`users/${USER}`, user({ discoverable_by_friends_of_friends: false }))
  run.state.clock += 300_001; run.nextRequest()
  assert.equal(await api.getPublicProfile(KEY), null)
  assert.equal(run.reads.length, 2)
  const retry = lane(); const retryApi = retry.load(dataPath)
  retry.failures.add(`users/${USER}`); assert.equal(await retryApi.getPublicProfile(KEY), null)
  retry.failures.clear(); retry.nextRequest(); assert.ok(await retryApi.getPublicProfile(KEY))
})

test('page has approved chrome only, Indonesian user text stays unchanged, stale handles redirect with 308', async () => {
  const run = lane(); const route = run.load(routePath)
  const body = serialize(await route.default(props(undefined, 'id')))
  assert.match(body, /TOP 3/); assert.match(body, /Maître d’/); assert.match(body, /Terbaru/)
  assert.match(body, /Teks pengguna/); assert.match(body, /Saya sudah punya Makan/)
  assert.doesNotMatch(body, /timestamp|followers|following|Friends since|2026-/)
  const meta = await route.generateMetadata(props(undefined, 'id'))
  assert.equal(meta.openGraph.title, 'Dewi (@dewi.l) di Makan')
  assert.equal(meta.openGraph.type, 'profile')
  assert.equal(meta.twitter.card, 'summary_large_image')
  await assert.rejects(route.default(props(`old-name-${KEY}`, 'id')), new RegExp(`REDIRECT_308:/id/u/dewi-l-${KEY}`))
})

test('empty sections hide, verified crowns only, shared failures preserve a complete 200 render', async () => {
  const run = lane(); const api = run.load(dataPath)
  const profile = await api.getPublicProfile(KEY)
  assert.deepEqual(profile.crowns.map(venue => venue.placeId), ['known-place'])
  run.state.failCrowns = true; run.state.failIndex = true; run.nextRequest()
  const partial = await api.getPublicProfile(KEY)
  assert.deepEqual(partial.crowns, [])
  assert.ok(partial.recent.every(meal => meal.placeSlug === undefined))
  assert.ok(await run.load(routePath).default(props()))
  const empty = lane(); empty.seed.set(`users/${USER}/publicTasteGraph/top3`, { entries: [] });empty.seed.set(`maitredRoles/${USER}`, {})
  for (const key of [...empty.seed.keys()]) if (key.startsWith('meals/')) empty.seed.delete(key)
  const body = serialize(await empty.load(routePath).default(props()))
  assert.doesNotMatch(body, /profile-top3|profile-maitred|profile-recent/)
})

test('profile parser rejects malformed keys and remote images outside Firebase Storage', () => {
  const api = lane().load(dataPath)
  for (const value of ['short', 'dewi-1234567!', 'a'.repeat(81), '../x-k3f9q2x7']) assert.equal(api.profileKey(value), null)
  assert.equal(api.profileKey(`dewi-l-${KEY}`), KEY)
  assert.equal(api.profileImage(storage), storage)
  for (const value of ['https://example.com/photo.jpg', 'http://firebasestorage.googleapis.com/a', 'https://firebasestorage.googleapis.com.evil.test/a', 'https://user@firebasestorage.googleapis.com/a']) assert.equal(api.profileImage(value), '')
})

test('chosen user_ handles stay visible and an empty photoURL falls back to avatar_url', async () => {
  const run = lane(); run.seed.set(`users/${USER}`, user({ username: 'user_joe', photoURL: '', avatar_url: storage }))
  const profile = await run.load(dataPath).loadPublicProfileData(run.db, KEY)
  assert.equal(profile.handle, 'user_joe')
  assert.equal(profile.avatar, storage)
})
