import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'

import { lane } from '../scripts/share-v2-test-lane.mjs'

// The real modules, loaded as the site's bundler resolves them (share-card imports storage-bucket).
const modules = lane()
const { readShareCardUrl, shareCardMetaPath, shareCardUrlFrom } = modules.load('lib/share-card.ts')
const { MAKAN_BUCKETS, makanStorageObject } = modules.load('lib/storage-bucket.ts')

const BUCKET = 'munchies-expo.firebasestorage.app'
const at = (bucket, object) => `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(object)}?alt=media&token=t`
const CARD = at(BUCKET, 'shareCards/place/ChIJabc_123-x/0f3a.jpg')

test('the stored card is read from one document per subject, and a profile\'s by its public key', () => {
  assert.equal(shareCardMetaPath('place', 'ChIJabc_123-x'), 'shareCardMeta/place_ChIJabc_123-x')
  assert.equal(shareCardMetaPath('meal', 'meal12345'), 'shareCardMeta/meal_meal12345')
  assert.equal(shareCardMetaPath('profile', 'k3f9q2x7'), 'shareCardMeta/profile_k3f9q2x7')
  for (const id of ['', 'a/b', '../x', 'a b', 'a.b', 'x'.repeat(201), undefined, 7]) assert.equal(shareCardMetaPath('place', id), null, String(id))
})

test('only this subject\'s own card, in Makan\'s own bucket, is accepted', () => {
  assert.equal(shareCardUrlFrom({ hash: '0f3a', url: CARD, updatedAt: 1 }, 'place', 'ChIJabc_123-x'), CARD)
  assert.equal(shareCardUrlFrom({ url: at('munchies-expo.appspot.com', 'shareCards/meal/meal12345/0f3a.jpg') }, 'meal', 'meal12345') !== null, true)
  // Another subject's card, another kind's card, and a card for an id that only starts the same.
  assert.equal(shareCardUrlFrom({ url: CARD }, 'place', 'ChIJother'), null)
  assert.equal(shareCardUrlFrom({ url: CARD }, 'meal', 'ChIJabc_123-x'), null)
  assert.equal(shareCardUrlFrom({ url: CARD }, 'place', 'ChIJabc_123'), null)
  // A profile card stored under a uid is not this key's card: the uid never reaches og:image.
  assert.equal(shareCardUrlFrom({ url: at(BUCKET, 'shareCards/profile/uid-of-the-owner/0f3a.jpg') }, 'profile', 'k3f9q2x7'), null)
  for (const url of [
    at('another-project.firebasestorage.app', 'shareCards/place/ChIJabc_123-x/0f3a.jpg'),
    at('fixture', 'shareCards/place/ChIJabc_123-x/0f3a.jpg'),
    CARD.replace('https://', 'http://'),
    CARD.replace('firebasestorage.googleapis.com', 'firebasestorage.googleapis.com.evil.test'),
    CARD.replace('https://', 'https://user@'),
    at(BUCKET, 'meals/private.jpg'), at(BUCKET, 'other/shareCards/place/ChIJabc_123-x/0f3a.jpg'), at(BUCKET, 'shareCards/place/ChIJabc_123-x/../../meals/private.jpg'),
    'https://example.com/shareCards/place/ChIJabc_123-x/a.jpg', 'javascript:alert(1)', '', 7, null, undefined,
    at(BUCKET, `shareCards/place/ChIJabc_123-x/${'a'.repeat(2100)}.jpg`),
  ]) assert.equal(shareCardUrlFrom({ url }, 'place', 'ChIJabc_123-x'), null, String(url).slice(0, 90))
  for (const doc of [undefined, null, 'x', [], {}]) assert.equal(shareCardUrlFrom(doc, 'place', 'ChIJabc_123-x'), null)
})

test('one read, and a missing document, a refused read or no database gives no card', async () => {
  const reads = []
  const db = (docs, fail = false) => ({ doc: path => ({ get: async () => {
    reads.push(path)
    if (fail) throw new Error('refused')
    return { data: () => docs[path] }
  } }) })
  assert.equal(await readShareCardUrl(db({ 'shareCardMeta/place_ChIJabc_123-x': { url: CARD } }), 'place', 'ChIJabc_123-x'), CARD)
  assert.deepEqual(reads, ['shareCardMeta/place_ChIJabc_123-x'])
  assert.equal(await readShareCardUrl(db({}), 'meal', 'meal12345'), null)
  assert.equal(await readShareCardUrl(db({}, true), 'meal', 'meal12345'), null)
  assert.equal(await readShareCardUrl(null, 'meal', 'meal12345'), null)
  reads.length = 0
  assert.equal(await readShareCardUrl(db({}), 'meal', 'a/b'), null)
  assert.deepEqual(reads, [])
})

test('a photo address is accepted only from Makan\'s own bucket, the one the resize route pins', () => {
  assert.equal(makanStorageObject(at(BUCKET, 'meals/a b.jpg')), 'meals/a b.jpg')
  assert.equal(makanStorageObject(at('munchies-expo.appspot.com', 'avatars/x.jpg')), 'avatars/x.jpg')
  for (const url of [at('another-project.firebasestorage.app', 'meals/a.jpg'), at('munchies-expo.firebasestorage.app.evil', 'meals/a.jpg'), `https://firebasestorage.googleapis.com:8443/v0/b/${BUCKET}/o/a.jpg`, `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/`, 'https://example.com/a.jpg', '/redesign/prawns.jpg', '', null]) {
    assert.equal(makanStorageObject(url), null, String(url))
  }
  assert.ok(readFileSync(new URL('./thumb.ts', import.meta.url), 'utf8').includes(`/v0/b/${MAKAN_BUCKETS[0]}/o/`), 'lib/thumb.ts pins the same bucket')
})
