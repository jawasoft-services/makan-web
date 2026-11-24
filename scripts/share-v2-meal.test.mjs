import assert from 'node:assert/strict'
import test from 'node:test'
import { lane, USER, MEAL, PLACE, MEAL_ROUTE, BUCKET, user, meal, card, fence, storage } from './share-v2-test-lane.mjs'

// RM20616 A12 U3 — the shared meal page, /meal/<id> (board G3), and its gone state (board web-gone).
const open = (run, locale = 'en', id = MEAL) => run.page(MEAL_ROUTE, { locale, id })
const PERSONAL = /Dewi|dewi|photo\.jpg|Captioned|Warung|Nasi|PRIVATE|meal-0001/

function assertGone(out, why) {
  assert.equal(out.thrown, null, why)
  assert.match(out.html, /<h1>Unavailable<\/h1><p>This meal is no longer available\.<\/p>/, why)
  assert.match(out.html, /Get Makan the app/, why)
  assert.doesNotMatch(out.text, PERSONAL, why)
  assert.deepEqual(out.metadata, { robots: { index: false, follow: false } }, why)
}

test('a public meal shows its photo, its author by handle, its dish and its place, and not its caption', async () => {
  const run = lane()
  const out = await open(run)
  assert.match(out.html, /Meal by @dewi\.l/)
  assert.match(out.html, /<h1 class="dish">Nasi campur ayam betutu<\/h1>/)
  assert.match(out.html, /<a href="\/places\/warung-bu-sri-abc123" class="placeLink">Warung Bu Sri<\/a>/)
  assert.match(out.html, /Open in Makan/)
  assert.doesNotMatch(out.text, /Captioned by the diner|Dewi Lestari|PRIVATE EMAIL|BIO TEXT|profile-host/)
  assert.equal(out.metadata.title, 'Meal by @dewi.l')
  assert.deepEqual(out.metadata.itunes, { appId: '6756131450', appArgument: `https://www.makanofficial.com/meal/${MEAL}` })
  assert.deepEqual(run.reads, [`meals/${MEAL}`, `users/${USER}`, `users/${USER}/private/age`, fence(USER), `dishMemberships/${MEAL}`, `shareCardMeta/meal_${MEAL}`])
  const id = await open(lane(), 'id')
  assert.match(id.html, /Makanan oleh @dewi\.l/); assert.match(id.html, /Buka di Makan/)
  assert.match(id.html, /href="\/id\/places\/warung-bu-sri-abc123"/)
  assert.equal(id.metadata.alternates.canonical, `https://www.makanofficial.com/id/meal/${MEAL}`)
})

test('a meal that is not public today is gone: an old friends-only meal, a draft, a deleted or a moderated one', async () => {
  for (const extra of [{ isPublic: false }, { isPublic: null }, { isPublic: undefined }, { isPublic: 'true' }, { isDeleted: true }, { deletedAt: 1 }, { isPublicDraft: true }, { isLocalDraft: true }, { isLocalOnly: true }, { storageScope: 'local_private' }, { moderationStatus: 'held' }, { moderationStatus: 'removed' }]) {
    const run = lane(); run.seed.set(`meals/${MEAL}`, meal({ ...extra, caption: 'PRIVATE CAPTION' }))
    assertGone(await open(run), JSON.stringify(extra))
    assert.deepEqual(run.reads, [`meals/${MEAL}`], 'nothing about the author is read for a meal that is gone')
  }
})

test('an unknown meal is gone, and an id that cannot be a meal id reads nothing', async () => {
  const unknown = lane(); unknown.seed.delete(`meals/${MEAL}`)
  assertGone(await open(unknown), 'unknown')
  for (const id of ['short', 'a/b/c/d/e/f', '../../users/x', 'x'.repeat(65), 'has space1', 'meal.0001']) {
    const run = lane(); run.seed.set(`meals/${id}`, meal())
    assertGone(await open(run, 'en', id), id); assert.equal(run.reads.length, 0, id)
  }
})

test('a meal whose author is closed, held, spam, under age, being deleted or unknown is gone', async () => {
  const fenced = lane(); fenced.seed.set(fence(USER), { createdAt: 1 })
  assertGone(await open(fenced), 'deletion fence')
  const states = [{ isDeleted: true }, { deletedAt: 1 }, { isSpam: true }, { spamSuspected: true }, { accountStatus: 'held' }, { status: 'banned' }, { visibility_status: 'hidden' }, { moderationStatus: 'suspended' }, { accountStatus: 'closing' }]
  for (const extra of states) {
    const run = lane(); run.seed.set(`users/${USER}`, user(extra))
    assertGone(await open(run), JSON.stringify(extra))
  }
  for (const age of [{ underMinimum: true }, { birthYear: 2015 }]) {
    const run = lane(); run.seed.set(`users/${USER}/private/age`, age)
    assertGone(await open(run), JSON.stringify(age))
  }
  const orphan = lane(); orphan.seed.delete(`users/${USER}`)
  assertGone(await open(orphan), 'no account')
  for (const owner of [{ userID: undefined }, { userID: '' }, { userID: 7 }, { userID: 'a/b' }]) {
    const run = lane(); run.seed.set(`meals/${MEAL}`, meal(owner))
    assertGone(await open(run), JSON.stringify(owner))
  }
})

test('a read that fails is gone, and the log line names nothing', async () => {
  for (const path of [`meals/${MEAL}`, `users/${USER}`, `users/${USER}/private/age`, fence(USER)]) {
    const run = lane(); run.failures.add(path)
    assertGone(await open(run), path)
    assert.deepEqual(run.logs, ['Shared meal unavailable.'])
  }
})

test('an author with no chosen handle is not named: the meal shows without a byline or a photo of them', async () => {
  for (const extra of [{ username: 'user_abcdefgh_abc123' }, { username: '' }, { name: '', display_name: '', profileSetupCompletedAt: undefined }]) {
    const run = lane(); run.seed.set(`users/${USER}`, user({ ...extra, photoURL: `${storage}?avatar-sentinel` }))
    const out = await open(run)
    assert.match(out.html, /Nasi campur ayam betutu/)
    assert.doesNotMatch(out.text, /Meal by|avatar-sentinel|user_abcdefgh|Dewi/, JSON.stringify(extra))
    assert.equal(out.metadata.title, 'Nasi campur ayam betutu')
  }
})

test('the dish line comes only from this owner\'s own dish at this venue, and a drink is never a dish', async () => {
  for (const dish of [undefined, { uid: 'another-person', placeId: PLACE, name: 'DISH SENTINEL' }, { uid: USER, placeId: 'another-place', name: 'DISH SENTINEL' }, { uid: USER, placeId: PLACE, name: 'DISH SENTINEL', retracting: true }, { uid: USER, placeId: PLACE, name: 'DISH SENTINEL', dishIsDrink: true }]) {
    const run = lane()
    if (dish) run.seed.set(`dishMemberships/${MEAL}`, dish); else run.seed.delete(`dishMemberships/${MEAL}`)
    const out = await open(run)
    assert.match(out.html, /<h1 class="byline">/, 'the byline is the heading of a meal with no dish')
    assert.doesNotMatch(out.text, /DISH SENTINEL|class="dish"/, JSON.stringify(dish))
  }
})

test('og:image is the stored card when there is one, and today\'s image when there is none', async () => {
  const none = lane(); none.seed.set(`meals/${MEAL}`, meal({ shareCardUrl: `${storage}?story-card` }))
  assert.deepEqual((await open(none)).metadata.openGraph.images, [{ url: `${storage}?story-card`, width: 1080, height: 1920 }])
  assert.deepEqual((await open(lane())).metadata.openGraph.images, [{ url: storage, width: 1080, height: 1920 }])
  const run = lane(); run.seed.set(`shareCardMeta/meal_${MEAL}`, { hash: '0f3a', url: card('meal', MEAL), updatedAt: 1 })
  const stored = await open(run)
  assert.deepEqual(stored.metadata.openGraph.images, [{ url: card('meal', MEAL), width: 1200, height: 630 }])
  assert.deepEqual(stored.metadata.twitter.images, [card('meal', MEAL)])
  // Not a card, another meal's card, and a card in another project's bucket all fall back to today's image.
  for (const url of [`${storage}?not-a-card`, card('meal', 'another-meal-1'), card('meal', MEAL, 'another-project.firebasestorage.app'), card('place', MEAL)]) {
    const bad = lane(); bad.seed.set(`shareCardMeta/meal_${MEAL}`, { url })
    assert.deepEqual((await open(bad)).metadata.openGraph.images, [{ url: storage, width: 1080, height: 1920 }], url)
  }
})

test('a meal with a photo outside Makan\'s storage is gone rather than loaded from elsewhere', async () => {
  for (const imageURL of ['https://example.com/a.jpg', '', undefined, storage.replace('https://', 'http://'), storage.replace(BUCKET, 'another-project.firebasestorage.app')]) {
    const run = lane(); run.seed.set(`meals/${MEAL}`, meal({ imageURL }))
    assertGone(await open(run), String(imageURL))
  }
})

test('the gone page in Bahasa uses the board\'s words', async () => {
  const run = lane(); run.seed.delete(`meals/${MEAL}`)
  const out = await open(run, 'id')
  assert.match(out.html, /<h1>Tidak tersedia<\/h1><p>Makanan ini sudah tidak tersedia\.<\/p>/)
  assert.match(out.html, /Dapatkan aplikasi Makan/)
})

test('with the switch off the v2 meal page does not exist: a 404 and not one read', async () => {
  for (const env of [{}, { SHARE_V2_PAGES: '0' }, { SHARE_V2_PAGES: 'true' }]) {
    const run = lane({ env })
    const mod = run.load(MEAL_ROUTE)
    const props = { params: Promise.resolve({ locale: 'en', id: MEAL }) }
    assert.deepEqual(await mod.generateMetadata(props), { robots: { index: false, follow: false } })
    await assert.rejects(mod.default(props), /NOT_FOUND/)
    assert.equal(run.reads.length, 0)
  }
})

test('the author\'s photo is loaded only from Makan\'s storage: any other address leaves their initial', async () => {
  for (const photoURL of ['https://example.com/avatar-sentinel.jpg', storage.replace(BUCKET, 'another-project.firebasestorage.app') + '?avatar-sentinel', 'http://firebasestorage.googleapis.com/avatar-sentinel']) {
    const run = lane(); run.seed.set(`users/${USER}`, user({ photoURL, avatar_url: photoURL }))
    const out = await open(run)
    assert.match(out.html, /<span class="avatar avatarSmall" aria-hidden="true">D<\/span>Meal by @dewi\.l/, photoURL)
    assert.doesNotMatch(out.text, /avatar-sentinel|example\.com|another-project/, photoURL)
  }
  const own = lane(); own.seed.set(`users/${USER}`, user({ photoURL: `${storage}?own-avatar` }))
  assert.match((await open(own)).html, /photo\.jpg\?own-avatar/)
})

test('a request that did not come through the proxy is a 404 that reads nothing, even with the switch on', async () => {
  const run = lane(); run.state.headers = {}
  const mod = run.load(MEAL_ROUTE)
  const props = { params: Promise.resolve({ locale: 'en', id: MEAL }) }
  assert.deepEqual(await mod.generateMetadata(props), { robots: { index: false, follow: false } })
  await assert.rejects(mod.default(props), /NOT_FOUND/)
  assert.equal(run.reads.length, 0)
})
