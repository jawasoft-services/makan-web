import assert from 'node:assert/strict'
import test from 'node:test'

import { readShareCardUrl, shareCardMetaPath, shareCardUrlFrom } from './share-card.ts'

const CARD = 'https://firebasestorage.googleapis.com/v0/b/fixture.firebasestorage.app/o/shareCards%2Fplace%2Fabc%2F0f3a.jpg?alt=media&token=t'

test('the stored card is read from one document per subject', () => {
  assert.equal(shareCardMetaPath('place', 'ChIJabc_123-x'), 'shareCardMeta/place_ChIJabc_123-x')
  assert.equal(shareCardMetaPath('meal', 'meal12345'), 'shareCardMeta/meal_meal12345')
  assert.equal(shareCardMetaPath('profile', 'uid-1'), 'shareCardMeta/profile_uid-1')
  for (const id of ['', 'a/b', '../x', 'x'.repeat(1501), undefined, 7]) assert.equal(shareCardMetaPath('place', id), null, String(id))
})

test('only a Firebase Storage share card address is accepted', () => {
  assert.equal(shareCardUrlFrom({ hash: '0f3a', url: CARD, updatedAt: 1 }), CARD)
  for (const url of [
    'http://firebasestorage.googleapis.com/v0/b/x/o/shareCards%2Fa.jpg',
    'https://firebasestorage.googleapis.com.evil.test/v0/b/x/o/shareCards%2Fa.jpg',
    'https://user@firebasestorage.googleapis.com/v0/b/x/o/shareCards%2Fa.jpg',
    'https://firebasestorage.googleapis.com/v0/b/x/o/meals%2Fprivate.jpg',
    'https://firebasestorage.googleapis.com/v0/b/x/o/other%2FshareCards%2Fa.jpg',
    'https://example.com/shareCards/a.jpg', 'javascript:alert(1)', '', 7, null, undefined,
    `https://firebasestorage.googleapis.com/v0/b/x/o/shareCards%2F${'a'.repeat(2100)}.jpg`,
  ]) assert.equal(shareCardUrlFrom({ url }), null, String(url).slice(0, 80))
  for (const doc of [undefined, null, 'x', [], {}]) assert.equal(shareCardUrlFrom(doc), null)
})

test('one read, and a missing document, a refused read or no database gives no card', async () => {
  const reads = []
  const db = (docs, fail = false) => ({ doc: path => ({ get: async () => {
    reads.push(path)
    if (fail) throw new Error('refused')
    return { data: () => docs[path] }
  } }) })
  assert.equal(await readShareCardUrl(db({ 'shareCardMeta/place_abcdefghij': { url: CARD } }), 'place', 'abcdefghij'), CARD)
  assert.deepEqual(reads, ['shareCardMeta/place_abcdefghij'])
  assert.equal(await readShareCardUrl(db({}), 'meal', 'meal12345'), null)
  assert.equal(await readShareCardUrl(db({}, true), 'meal', 'meal12345'), null)
  assert.equal(await readShareCardUrl(null, 'meal', 'meal12345'), null)
  reads.length = 0
  assert.equal(await readShareCardUrl(db({}), 'meal', 'a/b'), null)
  assert.deepEqual(reads, [])
})
