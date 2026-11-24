import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { lane, KEY, USER, PLACE, PROFILE_ROUTE, user, meal, card, storage } from './share-v2-test-lane.mjs'

// RM20616 A12 U3 — the public profile page, /u/<handle>-<key>. RM20603's tests, resumed and extended.
const DATA = 'lib/public-profile-data.ts'
const SLUG = `dewi-l-${KEY}`
const open = (run, locale = 'en', slug = SLUG) => run.page(PROFILE_ROUTE, { locale, slug })
const PERSONAL = /Dewi|dewi|photo\.jpg|Captioned|Warung|BIO TEXT|PRIVATE/
const profilePaths = path => [`publicProfileKeys/${KEY}`, `users/${USER}`, `users/${USER}/private/age`, `users/${USER}/publicTasteGraph/top3`, `users/${USER}/maitredSettings/venueVisibility`, `maitredRoles/${USER}`, `shareCardMeta/profile_${USER}`].includes(path) || path.startsWith('meals/')

function assertGone(out, why) {
  assert.equal(out.thrown, null, why)
  assert.match(out.html, /Unavailable/, why)
  assert.match(out.html, /Get Makan the app/, why)
  assert.doesNotMatch(out.text, PERSONAL, why)
  assert.deepEqual(out.metadata, { robots: { index: false, follow: true } }, why)
}

test('the page shows the owner by name, with their public meals, and nothing else about them', async () => {
  const run = lane(); run.seed.set('meals/m2', meal({ isPublic: false, caption: 'FRIENDS ONLY' }))
  const profile = await run.load(DATA).loadPublicProfileData(run.db, KEY, 2026)
  assert.deepEqual(profile.top3.map(entry => entry.rank), [1, 3])
  assert.equal(profile.recent.length, 12)
  assert.equal(profile.slug, SLUG)
  assert.deepEqual(Object.keys(profile).sort(), ['avatar', 'cardUrl', 'handle', 'key', 'name', 'recent', 'rolePlaceIds', 'slug', 'top3'])
  assert.doesNotMatch(JSON.stringify(profile), /FRIENDS ONLY|PRIVATE EMAIL|PRIVATE PHONE|BIO TEXT|profile-host/)
  assert.equal(run.reads.length, 22)
  assert.ok(run.reads.every(profilePaths), run.reads.filter(path => !profilePaths(path)).join())
  const out = await open(lane())
  assert.match(out.html, /<h1>Dewi Lestari<\/h1>/); assert.match(out.html, /@dewi\.l/)
  assert.doesNotMatch(out.text, /BIO TEXT|PRIVATE EMAIL|PRIVATE PHONE|profile-host|followers|following|2026-/)
})

test('"Discoverable in Search" off means search only: the owner\'s page still opens when they send the link', async () => {
  const run = lane(); run.seed.set(`users/${USER}`, user({ discoverable_by_friends_of_friends: false }))
  const out = await open(run)
  assert.match(out.html, /<h1>Dewi Lestari<\/h1>/)
  assert.equal(out.metadata.title, 'Dewi Lestari (@dewi.l) on Makan')
})

test('an account that is deleted, held, disabled, spam or unfinished gets the gone page: no name, no photo, 3 reads', async () => {
  const hidden = [{ isDeleted: true }, { deletedAt: 1 }, { isSpam: true }, { spamSuspected: true }, { accountStatus: 'closing' }, { username: 'user_abcdefgh_abc123' }, { username: '' },
    { name: '', display_name: '', profileSetupCompletedAt: undefined }, { name: {}, display_name: ' ', profileSetupCompletedAt: undefined }]
  for (const field of ['accountStatus', 'status', 'visibility_status', 'moderationStatus']) {
    for (const status of ['deleted', 'disabled', 'held', 'hidden', 'moderated', 'pending', 'suspended', 'spam', 'banned', 'deactivated']) hidden.push({ [field]: status })
  }
  for (const extra of hidden) {
    const run = lane(); run.seed.set(`users/${USER}`, user(extra))
    assertGone(await open(run), JSON.stringify(extra))
    assert.equal(run.reads.length, 3, JSON.stringify(extra))
  }
})

test('an account under the minimum age gets the gone page', async () => {
  for (const age of [{ underMinimum: true }, { birthYear: 2014 }, { birthYear: 2026 }]) {
    const run = lane(); run.seed.set(`users/${USER}/private/age`, age)
    assertGone(await open(run), JSON.stringify(age))
    assert.equal(run.reads.length, 3)
  }
  const old = lane(); old.seed.delete(`users/${USER}/private/age`)
  assert.match((await open(old)).html, /<h1>Dewi Lestari<\/h1>/, 'an account from before the age question stays open')
})

test('an unknown key, a key with no account, and a link that is not a profile link get the gone page', async () => {
  const unknown = lane(); unknown.seed.delete(`publicProfileKeys/${KEY}`)
  assertGone(await open(unknown), 'unknown key'); assert.equal(unknown.reads.length, 1)
  const orphan = lane(); orphan.seed.delete(`users/${USER}`)
  assertGone(await open(orphan), 'no account'); assert.equal(orphan.reads.length, 3)
  for (const slug of ['short', 'dewi-1234567!', 'a'.repeat(81), '../x-k3f9q2x7', KEY, `-${KEY}`, `Dewi-${KEY}`]) {
    const run = lane()
    assertGone(await open(run, 'en', slug), slug); assert.equal(run.reads.length, 0, slug)
  }
})

test('a read that fails gets the gone page, and the log line names nobody', async () => {
  for (const path of [`publicProfileKeys/${KEY}`, `users/${USER}`, `users/${USER}/private/age`, `users/${USER}/maitredSettings/venueVisibility`, 'meals/m1']) {
    const run = lane(); run.failures.add(path)
    assertGone(await open(run), path)
    assert.deepEqual(run.logs, ['Public profile unavailable.'])
  }
})

test('a friends-only, draft, local, deleted, moderated or someone else\'s meal never appears, in TOP 3 or Recent', async () => {
  for (const extra of [{ isPublic: false }, { isPublic: null }, { isPublic: undefined }, { isPublicDraft: true }, { isLocalDraft: true }, { isLocalOnly: true }, { storageScope: 'local_private' }, { isDeleted: true }, { deletedAt: 1 }, { moderationStatus: 'held' }, { userID: 'another-person' }]) {
    const run = lane()
    const hidden = { ...extra, caption: 'PRIVATE SENTINEL', imageURL: `${storage}?private-sentinel` }
    run.seed.set('meals/m1', meal({ ...hidden, timestamp: -1 }))
    // Recent's query asks for public, active meals of this owner; the page must not rely on the query alone.
    run.seed.set('meals/recent3', { ...meal({ timestamp: 103 }), ...hidden, ...(extra.userID ? {} : { userID: USER }) })
    const out = await open(run)
    assert.match(out.html, /<h1>Dewi Lestari<\/h1>/)
    assert.doesNotMatch(out.text, /PRIVATE SENTINEL|private-sentinel|meal\/m1"/, JSON.stringify(extra))
  }
  const query = lane()
  query.db.collection = () => ({ where() { return this }, orderBy() { return this }, limit() { return this }, select() { return this },
    get: async () => ({ docs: [{ id: 'leaked', data: () => meal({ isPublic: false, caption: 'PRIVATE SENTINEL' }) }, { id: 'other', data: () => meal({ userID: 'another-person', caption: 'PRIVATE SENTINEL' }) }] }) })
  assert.doesNotMatch((await open(query)).text, /PRIVATE SENTINEL|meal\/leaked|meal\/other/)
})

test('the Maître d\' venues show only while the owner lets venues see their profile, and only verified titles', async () => {
  const on = await open(lane())
  assert.match(on.html, /profile-maitred/); assert.match(on.html, /Warung Bu Sri/)
  assert.doesNotMatch(on.html, /unverified-place/)
  for (const setting of [undefined, {}, { enabled: false, noticeAt: 1 }, { enabled: 'true' }]) {
    const run = lane()
    if (setting === undefined) run.seed.delete(`users/${USER}/maitredSettings/venueVisibility`)
    else run.seed.set(`users/${USER}/maitredSettings/venueVisibility`, setting)
    const out = await open(run)
    assert.match(out.html, /<h1>Dewi Lestari<\/h1>/)
    assert.doesNotMatch(out.text, /profile-maitred|Warung Bu Sri|warung-bu-sri/, JSON.stringify(setting))
  }
  const failed = lane(); failed.state.failCrowns = true
  const partial = await open(failed)
  assert.match(partial.html, /<h1>Dewi Lestari<\/h1>/); assert.doesNotMatch(partial.html, /profile-maitred/)
})

test('profile cache: 22 reads cold, none warm, concurrent requests share one load, and a closed account drops out after 5 minutes', async () => {
  const run = lane(); run.useCache(); const api = run.load('lib/public-profile.ts')
  await Promise.all([api.getPublicProfile(KEY), api.getPublicProfile(KEY), api.getPublicProfile(KEY)])
  assert.equal(run.reads.length, 22)
  run.nextRequest(); run.reads.length = 0
  assert.ok(await api.getPublicProfile(KEY)); assert.equal(run.reads.length, 0)
  run.seed.set(`users/${USER}`, user({ accountStatus: 'held' }))
  run.state.clock += 300_001; run.nextRequest()
  assert.equal(await api.getPublicProfile(KEY), null)
  assert.equal(run.reads.length, 3)
})

test('the page carries the board\'s words only, in English and Bahasa, and a stale handle redirects', async () => {
  const en = await open(lane())
  for (const words of ['TOP 3', 'Maître d’', 'Recent', 'Get Makan the app', 'I already have Makan']) assert.ok(en.html.includes(words), words)
  const id = await open(lane(), 'id')
  for (const words of ['3 TERATAS', 'Maître d’', 'Terbaru', 'Dapatkan aplikasi Makan', 'Aku sudah punya Makan']) assert.ok(id.html.includes(words), words)
  assert.equal(id.metadata.title, 'Dewi Lestari (@dewi.l) di Makan')
  assert.equal(id.metadata.alternates.canonical, `https://www.makanofficial.com/id/u/${SLUG}`)
  assert.deepEqual(id.metadata.robots, { index: false, follow: true })
  assert.match(id.html, new RegExp(`makanapp://u/${SLUG}`))
  assert.equal((await open(lane(), 'id', `old-name-${KEY}`)).thrown, `REDIRECT_308:/id/u/${SLUG}`)
  assert.equal((await open(lane(), 'en', `old-name-${KEY}`)).thrown, `REDIRECT_308:/u/${SLUG}`)
  const empty = lane(); empty.seed.set(`users/${USER}/publicTasteGraph/top3`, { entries: [] }); empty.seed.set(`maitredRoles/${USER}`, {})
  for (const key of [...empty.seed.keys()]) if (key.startsWith('meals/')) empty.seed.delete(key)
  assert.doesNotMatch((await open(empty)).html, /profile-top3|profile-maitred|profile-recent/)
})

test('og:image is the stored card when there is one, else the site\'s own card: never a card drawn per request', async () => {
  const none = await open(lane())
  assert.equal(none.metadata.openGraph.images[0].url, 'https://www.makanofficial.com/opengraph-image')
  assert.deepEqual(none.metadata.twitter.images, ['https://www.makanofficial.com/opengraph-image'])
  assert.equal((await open(lane(), 'id')).metadata.openGraph.images[0].url, 'https://www.makanofficial.com/id/opengraph-image')
  const run = lane(); run.seed.set(`shareCardMeta/profile_${USER}`, { hash: '0f3a', url: card('profile'), updatedAt: 1 })
  const stored = await open(run)
  assert.equal(stored.metadata.openGraph.images[0].url, card('profile'))
  assert.deepEqual(stored.metadata.twitter.images, [card('profile')])
  assert.equal(stored.metadata.openGraph.type, 'profile')
  const bad = lane(); bad.seed.set(`shareCardMeta/profile_${USER}`, { url: 'https://example.com/shareCards/a.jpg' })
  assert.equal((await open(bad)).metadata.openGraph.images[0].url, 'https://www.makanofficial.com/opengraph-image')
  assert.doesNotMatch(JSON.stringify(none.metadata) + JSON.stringify(stored.metadata), /\/u\/[^"]*opengraph-image/)
})

test('with the switch off there is no profile page: a 404 and not one read', async () => {
  for (const env of [{}, { SHARE_V2_PAGES: '0' }, { SHARE_V2_PAGES: 'true' }]) {
    const run = lane({ env })
    const mod = run.load(PROFILE_ROUTE)
    const props = { params: Promise.resolve({ locale: 'en', slug: SLUG }) }
    assert.deepEqual(await mod.generateMetadata(props), {})
    await assert.rejects(mod.default(props), /NOT_FOUND/)
    assert.equal(run.reads.length, 0)
  }
})

test('profile links are in no sitemap or directory, and avatars come only from Makan\'s own storage', async () => {
  // The loader itself refuses a key that is not a key, so no caller can make it read another path.
  for (const key of ['users/x', '../users', 'K3F9Q2X7', 'short', '', `${KEY}/x`]) {
    const run = lane()
    assert.equal(await run.load(DATA).loadPublicProfileData(run.db, key, 2026), null, key)
    assert.equal(run.reads.length, 0, key)
  }
  assert.doesNotMatch(readFileSync('app/sitemap.ts', 'utf8'), /getPublicProfile|publicProfileKeys|\/u\//)
  const api = lane().load(DATA)
  assert.equal(api.profileKey(SLUG), KEY)
  assert.equal(api.storagePhoto(storage), storage)
  for (const value of ['https://example.com/photo.jpg', 'http://firebasestorage.googleapis.com/a', 'https://firebasestorage.googleapis.com.evil.test/a', 'https://user@firebasestorage.googleapis.com/a', '/redesign/prawns.jpg']) assert.equal(api.storagePhoto(value), '')
})

test('a chosen user_ handle is a handle, and an empty photoURL falls back to avatar_url', async () => {
  const run = lane(); run.seed.set(`users/${USER}`, user({ username: 'user_joe', photoURL: '', avatar_url: `${storage}?avatar` }))
  const profile = await run.load(DATA).loadPublicProfileData(run.db, KEY, 2026)
  assert.equal(profile.handle, 'user_joe'); assert.equal(profile.avatar, `${storage}?avatar`)
  assert.equal(PLACE.length > 0, true)
})
