import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'

import { lane } from '../scripts/share-v2-test-lane.mjs'

// The real modules, loaded as the site's bundler resolves them (share-card imports storage-bucket), with the
// bucket configured as a deployment would: SHARE_STORAGE_BUCKETS.
const configured = buckets => lane({ env: buckets === undefined ? {} : { SHARE_STORAGE_BUCKETS: buckets } })
const modules = configured('munchies-expo.firebasestorage.app')
const { readShareCardUrl, shareCardMetaPath, shareCardUrlFrom } = modules.load('lib/share-card.ts')
const { makanStorageObject } = modules.load('lib/storage-bucket.ts')

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
  // A bucket is Makan's only if the deployment says so: no name is built in.
  assert.equal(shareCardUrlFrom({ url: at('munchies-expo.appspot.com', 'shareCards/meal/meal12345/0f3a.jpg') }, 'meal', 'meal12345'), null)
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

test('the bucket is one configuration value: unset or unmatched means no card, and today\'s image', () => {
  for (const setting of [undefined, '', ' ', 'another-project.firebasestorage.app', 'not a bucket!', 'munchies-expo']) {
    const card = configured(setting).load('lib/share-card.ts')
    assert.equal(card.shareCardUrlFrom({ url: CARD }, 'place', 'ChIJabc_123-x'), null, String(setting))
  }
  const two = configured(' makan-devel.firebasestorage.app , munchies-expo.firebasestorage.app ').load('lib/share-card.ts')
  assert.equal(two.shareCardUrlFrom({ url: CARD }, 'place', 'ChIJabc_123-x'), CARD)
  assert.equal(two.shareCardUrlFrom({ url: at('makan-devel.firebasestorage.app', 'shareCards/place/ChIJabc_123-x/0f3a.jpg') }, 'place', 'ChIJabc_123-x') !== null, true)
  // The value is read in one place.
  const readers = ['lib', 'app', 'components', 'proxy.ts'].flatMap(root => root.endsWith('.ts') ? [root] : readdirSync(root, { recursive: true }).filter(name => /\.tsx?$/.test(name)).map(name => `${root}/${name}`))
  assert.deepEqual(readers.filter(file => readFileSync(file, 'utf8').includes('SHARE_STORAGE_BUCKETS') && /process\.env\.SHARE_STORAGE_BUCKETS/.test(readFileSync(file, 'utf8'))), ['lib/storage-bucket.ts'])
})

test('a photo is accepted only from a configured bucket; with none configured, from the Firebase Storage host as today', () => {
  const { isMakanPhoto } = modules.load('lib/storage-bucket.ts')
  assert.equal(makanStorageObject(at(BUCKET, 'meals/a b.jpg')), 'meals/a b.jpg')
  assert.equal(isMakanPhoto(at(BUCKET, 'meals/a.jpg')), true)
  for (const url of [at('another-project.firebasestorage.app', 'meals/a.jpg'), at('munchies-expo.firebasestorage.app.evil', 'meals/a.jpg'), `https://firebasestorage.googleapis.com:8443/v0/b/${BUCKET}/o/a.jpg`, `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/`, 'https://example.com/a.jpg', '/redesign/prawns.jpg', '', null]) {
    assert.equal(makanStorageObject(url), null, String(url)); assert.equal(isMakanPhoto(url), false, String(url))
  }
  const unset = configured(undefined).load('lib/storage-bucket.ts')
  assert.equal(unset.isMakanPhoto(at('any-project.firebasestorage.app', 'meals/a.jpg')), true)
  assert.equal(unset.makanStorageObject(at(BUCKET, 'shareCards/place/x/a.jpg')), null)
  for (const url of ['https://example.com/a.jpg', at(BUCKET, 'a.jpg').replace('https://', 'http://'), at(BUCKET, 'a.jpg').replace('.com/', '.com.evil.test/'), '/redesign/prawns.jpg']) assert.equal(unset.isMakanPhoto(url), false, url)
})
