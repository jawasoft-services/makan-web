import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'

import { lane } from '../scripts/share-v2-test-lane.mjs'

// The real modules, loaded as the site's bundler resolves them (share-card imports storage-bucket), with the
// bucket configured as a deployment would: SHARE_STORAGE_BUCKETS.
const configured = buckets => lane({ env: buckets === undefined ? {} : { SHARE_STORAGE_BUCKETS: buckets } })
const modules = configured('munchies-expo.firebasestorage.app')
const { SHARE_CARD_FIELDS, readShareCardUrls, shareCardFor, shareCardMetaPath, shareCardUrlFrom, shareCardUrlsFrom } = modules.load('lib/share-card.ts')
const { makanStorageObject } = modules.load('lib/storage-bucket.ts')

const BUCKET = 'munchies-expo.firebasestorage.app'
const TOKEN = '123e4567-e89b-42d3-a456-426614174000'
const at = (bucket, object, query = `?alt=media&token=${TOKEN}`) => `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(object)}${query}`
const HASH32 = '0f3a'.padEnd(32, '0')
const file = (locale, nonce = locale === 'en' ? 'aaaaaaaaaaaa' : 'bbbbbbbbbbbb') => `${HASH32}-${locale}-${nonce}.jpg`
const objectOf = (kind, id, locale) => `shareCards/${kind}/${id}/${file(locale)}`
const urlOf = (kind, id, locale, bucket = BUCKET) => at(bucket, objectOf(kind, id, locale))
const SUBJECTS = { place: 'ChIJabc_123-x', meal: 'meal12345', profile: 'k3f9q2x7' }
const KINDS = Object.keys(SUBJECTS)
const LOCALES = ['en', 'id']
const other = locale => (locale === 'en' ? 'id' : 'en')
/** A current record in U2's shape: one drawing per language. */
const current = (kind, id = SUBJECTS[kind], extra = {}) => ({
  hash: '0f3a', want: null, drop: false,
  cards: { en: { path: objectOf(kind, id, 'en'), url: urlOf(kind, id, 'en') }, id: { path: objectOf(kind, id, 'id'), url: urlOf(kind, id, 'id') } },
  ...extra,
})
const withUrl = (kind, locale, url) => { const doc = current(kind); doc.cards[locale] = { path: 'x', url }; return doc }
const CARD = urlOf('place', SUBJECTS.place, 'en')

test('the stored card is read from one document per subject, and a profile\'s by its public key', () => {
  assert.equal(shareCardMetaPath('place', 'ChIJabc_123-x'), 'shareCardMeta/place_ChIJabc_123-x')
  assert.equal(shareCardMetaPath('meal', 'meal12345'), 'shareCardMeta/meal_meal12345')
  assert.equal(shareCardMetaPath('profile', 'k3f9q2x7'), 'shareCardMeta/profile_k3f9q2x7')
  for (const id of ['', 'a/b', '../x', 'a b', 'a.b', 'x'.repeat(201), undefined, 7]) assert.equal(shareCardMetaPath('place', id), null, String(id))
})

test('a current record gives each language its own card: English pages en, Bahasa pages id', () => {
  for (const kind of KINDS) {
    const id = SUBJECTS[kind]
    for (const locale of LOCALES) assert.equal(shareCardUrlFrom(current(kind), kind, id, locale), urlOf(kind, id, locale), `${kind} ${locale}`)
    assert.deepEqual(shareCardUrlsFrom(current(kind), kind, id), { en: urlOf(kind, id, 'en'), id: urlOf(kind, id, 'id') })
    // `want` and `purge` absent rather than null is current too, as U2's isCurrent reads it.
    const { want, drop, ...bare } = current(kind)
    void want; void drop
    assert.equal(shareCardUrlFrom(bare, kind, id, 'id'), urlOf(kind, id, 'id'), kind)
  }
  // Only the two page languages: anything else has no card.
  for (const locale of ['', 'EN', 'de', 'id-ID', undefined, null]) assert.equal(shareCardUrlFrom(current('place'), 'place', SUBJECTS.place, locale), null, String(locale))
})

test('a record that is not current gives no card, in either language, for every kind', () => {
  const states = {
    'drop: true': { drop: true },
    'purge: true with no want (a failed older drawing cleared the ask)': { purge: true, want: null },
    'purge: true with a want': { purge: true, want: { hash: 'next' } },
    'a pending want': { want: { hash: 'next' } },
    'a want with no hash': { want: {} },
    'empty hash': { hash: '' },
    'no hash': { hash: undefined },
    'a hash that is not a string': { hash: 7 },
  }
  for (const kind of KINDS) {
    for (const locale of LOCALES) {
      for (const [label, extra] of Object.entries(states)) {
        assert.equal(shareCardUrlFrom(current(kind, SUBJECTS[kind], extra), kind, SUBJECTS[kind], locale), null, `${kind} ${locale}: ${label}`)
      }
      // drop and purge must be exactly true to block: U2 writes booleans.
      assert.notEqual(shareCardUrlFrom(current(kind, SUBJECTS[kind], { drop: false, purge: false }), kind, SUBJECTS[kind], locale), null)
    }
  }
  // The record before U2 settled its shape: a top-level url alone is not a card.
  assert.equal(shareCardUrlFrom({ hash: '0f3a', url: CARD, updatedAt: 1 }, 'place', SUBJECTS.place, 'en'), null)
  for (const doc of [undefined, null, 'x', [], {}, { hash: '0f3a' }, { hash: '0f3a', cards: null }, { hash: '0f3a', cards: [] }, { hash: '0f3a', cards: { en: CARD } }]) {
    assert.equal(shareCardUrlFrom(doc, 'place', SUBJECTS.place, 'en'), null, JSON.stringify(doc))
  }
})

test('a record with only the other language\'s card gives no card: never the other language\'s card', () => {
  for (const kind of KINDS) {
    const id = SUBJECTS[kind]
    for (const locale of LOCALES) {
      const only = current(kind)
      delete only.cards[locale]
      assert.equal(shareCardUrlFrom(only, kind, id, locale), null, `${kind} ${locale}`)
      assert.equal(shareCardUrlFrom(only, kind, id, other(locale)), urlOf(kind, id, other(locale)), `${kind} ${other(locale)} still has its own`)
      // An entry with no url, or a null entry, is missing too.
      for (const entry of [null, {}, { path: objectOf(kind, id, locale) }, { url: '' }]) {
        const blank = current(kind); blank.cards[locale] = entry
        assert.equal(shareCardUrlFrom(blank, kind, id, locale), null, `${kind} ${locale} ${JSON.stringify(entry)}`)
      }
      // The other language's file named under this language, while the other language names a different file: not this page's card.
      const crossed = current(kind); crossed.cards[locale] = { path: objectOf(kind, id, other(locale)), url: urlOf(kind, id, other(locale)).replace(TOKEN, '00000000-1111-4222-8333-444444444444') }
      assert.equal(shareCardUrlFrom(crossed, kind, id, locale), null, `${kind} ${locale} crossed`)
    }
  }
})

test('one drawing named for both languages (the words are the same) serves both pages', () => {
  for (const kind of KINDS) {
    const id = SUBJECTS[kind]
    for (const drawn of LOCALES) {
      const shared = current(kind); shared.cards[other(drawn)] = { ...shared.cards[drawn] }
      assert.deepEqual(shareCardUrlsFrom(shared, kind, id), { en: urlOf(kind, id, drawn), id: urlOf(kind, id, drawn) }, `${kind} drawn for ${drawn}`)
      // ...but not when the language it was drawn for is gone from the record.
      const orphan = current(kind); orphan.cards[other(drawn)] = { ...orphan.cards[drawn] }; delete orphan.cards[drawn]
      assert.equal(shareCardUrlFrom(orphan, kind, id, other(drawn)), null, `${kind} ${drawn} orphan`)
    }
  }
})

test('only this subject\'s own card, in Makan\'s own bucket, under shareCards/<kind>/<id>/, in U2\'s file shape, is accepted', () => {
  for (const kind of KINDS) {
    const id = SUBJECTS[kind]
    for (const locale of LOCALES) {
      const own = objectOf(kind, id, locale)
      const rejected = {
        'a bucket nobody configured (no name is built in)': at('munchies-expo.appspot.com', own),
        'another project\'s bucket': at('another-project.firebasestorage.app', own),
        'a fixture bucket': at('fixture', own),
        'http': urlOf(kind, id, locale).replace('https://', 'http://'),
        'a look-alike host': urlOf(kind, id, locale).replace('firebasestorage.googleapis.com', 'firebasestorage.googleapis.com.evil.test'),
        'a user in the address': urlOf(kind, id, locale).replace('https://', 'https://user@'),
        'another host': `https://example.com/${own}`,
        'another subject': urlOf(kind, `${id}-other`, locale),
        'an id that only starts the same': at(BUCKET, `shareCards/${kind}/${id.slice(0, -1)}/${file(locale)}`),
        'another kind': urlOf(kind === 'place' ? 'meal' : 'place', id, locale),
        'outside shareCards/': at(BUCKET, `meals/${file(locale)}`),
        'shareCards/ deeper down': at(BUCKET, `other/${own}`),
        'a dot-dot segment': at(BUCKET, `shareCards/${kind}/${id}/../../meals/${file(locale)}`),
        'a uid-looking folder under the subject': at(BUCKET, `shareCards/${kind}/${id}/Xk2uQ7pR0aBcDeFgHiJkLmNoPq12/${file(locale)}`),
        'a uid-looking file name': at(BUCKET, `shareCards/${kind}/${id}/Xk2uQ7pR0aBcDeFgHiJkLmNoPq12-${locale}-aaaaaaaaaaaa.jpg`),
        'a uid in place of the subject': at(BUCKET, `shareCards/${kind}/Xk2uQ7pR0aBcDeFgHiJkLmNoPq12/${file(locale)}`),
        'not U2\'s file name': at(BUCKET, `shareCards/${kind}/${id}/0f3a.jpg`),
        'a short hash': at(BUCKET, `shareCards/${kind}/${id}/${'0'.repeat(31)}-${locale}-aaaaaaaaaaaa.jpg`),
        'upper-case hex': at(BUCKET, `shareCards/${kind}/${id}/${'A'.repeat(32)}-${locale}-aaaaaaaaaaaa.jpg`),
        'another locale code': at(BUCKET, `shareCards/${kind}/${id}/${HASH32}-ms-aaaaaaaaaaaa.jpg`),
        'not a jpeg': at(BUCKET, `shareCards/${kind}/${id}/${file(locale).replace('.jpg', '.png')}`),
        'a suffix after the name': at(BUCKET, `shareCards/${kind}/${id}/${file(locale)}.html`),
        'drawn for the other language, named for this one alone': urlOf(kind, id, other(locale)).replace(TOKEN, '00000000-1111-4222-8333-555555555555'),
        'a very long address': at(BUCKET, `shareCards/${kind}/${id}/${'a'.repeat(2100)}.jpg`),
      }
      for (const [label, url] of Object.entries(rejected)) assert.equal(shareCardUrlFrom(withUrl(kind, locale, url), kind, id, locale), null, `${kind} ${locale}: ${label}`)
      for (const url of ['javascript:alert(1)', '', 7, null, undefined, {}]) assert.equal(shareCardUrlFrom(withUrl(kind, locale, url), kind, id, locale), null, `${kind} ${locale}: ${String(url)}`)
    }
  }
  // A profile card stored under a uid is not this key's card: the uid never reaches og:image.
  assert.equal(shareCardUrlFrom(withUrl('profile', 'en', at(BUCKET, `shareCards/profile/uid-of-the-owner/${file('en')}`)), 'profile', 'k3f9q2x7', 'en'), null)
  // The id itself must be a card id.
  for (const id of ['', 'a/b', '../x', undefined]) assert.equal(shareCardUrlFrom(current('place'), 'place', id, 'en'), null, String(id))
})

test('only the exact address U2 writes is accepted, and the page gets it rebuilt from the checked parts', () => {
  const UID = 'Xk2uQ7pR0aBcDeFgHiJkLmNoPq12'
  for (const kind of KINDS) {
    const id = SUBJECTS[kind]
    for (const locale of LOCALES) {
      const object = objectOf(kind, id, locale)
      const good = urlOf(kind, id, locale)
      assert.equal(shareCardUrlFrom(withUrl(kind, locale, good), kind, id, locale), good, `${kind} ${locale}`)
      const rejected = {
        'a uid in the query': `${good}&uid=${UID}`,
        'a uid in a fragment': `${good}#${UID}`,
        'an empty fragment': `${good}#`,
        '?alt=json (the object\'s metadata, not the image)': at(BUCKET, object, `?alt=json&token=${TOKEN}`),
        'alt=json alone': at(BUCKET, object, '?alt=json'),
        'an extra parameter': at(BUCKET, object, `?alt=media&token=${TOKEN}&x=1`),
        'an extra parameter first': at(BUCKET, object, `?x=1&alt=media&token=${TOKEN}`),
        'a uid parameter, then a second question mark': at(BUCKET, object, `?uid=${UID}?alt=media&token=${TOKEN}`),
        'the parameters swapped': at(BUCKET, object, `?token=${TOKEN}&alt=media`),
        'no query': at(BUCKET, object, ''),
        'no token': at(BUCKET, object, '?alt=media'),
        'an empty token': at(BUCKET, object, '?alt=media&token='),
        'a token that is not a uuid': at(BUCKET, object, '?alt=media&token=t'),
        'a uid as the token': at(BUCKET, object, `?alt=media&token=${UID}`),
        'an upper-case token': at(BUCKET, object, `?alt=media&token=${TOKEN.toUpperCase()}`),
        'a token with more after it': at(BUCKET, object, `?alt=media&token=${TOKEN}0`),
        'a doubled token': at(BUCKET, object, `?alt=media&token=${TOKEN}&token=${TOKEN}`),
        'an embedded newline': good.replace('/o/', '/o/\n'),
        'an embedded tab': good.replace('/o/', '/o/\t'),
        'a carriage return in the query': good.replace('&token', '\r&token'),
        'a leading space': ` ${good}`,
        'a trailing space': `${good} `,
        'a trailing newline': `${good}\n`,
        'a NUL': `${good}\u0000`,
        'a non-ASCII character': `${good}é`,
      }
      for (const [label, url] of Object.entries(rejected)) assert.equal(shareCardUrlFrom(withUrl(kind, locale, url), kind, id, locale), null, `${kind} ${locale}: ${label}`)
      // The stored string is never passed through: the same object, spelled another way, comes back in U2's own form.
      const spelled = `HTTPS://FIREBASESTORAGE.GOOGLEAPIS.COM/v0/b/${BUCKET}/o/${object}?alt=media&token=${TOKEN}`
      assert.equal(shareCardUrlFrom(withUrl(kind, locale, spelled), kind, id, locale), good, `${kind} ${locale}: rebuilt`)
    }
  }
})

test('one masked read: only hash, cards, drop, purge and want.hash ever leave the database', async () => {
  assert.deepEqual(SHARE_CARD_FIELDS, ['hash', 'cards', 'drop', 'purge', 'want.hash'])
  const calls = []
  const db = (docs, fail = false) => ({
    doc: path => ({ path }),
    getAll: async (...args) => {
      calls.push(args)
      if (fail) throw new Error('refused')
      return args.filter(arg => arg.path).map(ref => ({ data: () => docs[ref.path] }))
    },
  })
  const record = { ...current('place'), photoOwnerUid: 'PRIVATE', drawnPhotoOwnerUid: 'PRIVATE', retired: ['shareCards/place/x/old.jpg'], want: null }
  assert.deepEqual(await readShareCardUrls(db({ 'shareCardMeta/place_ChIJabc_123-x': record }), 'place', 'ChIJabc_123-x'), { en: CARD, id: urlOf('place', SUBJECTS.place, 'id') })
  assert.equal(calls.length, 1)
  assert.deepEqual(calls[0], [{ path: 'shareCardMeta/place_ChIJabc_123-x' }, { fieldMask: ['hash', 'cards', 'drop', 'purge', 'want.hash'] }])
  for (const field of ['photoOwnerUid', 'drawnPhotoOwnerUid', 'want.content', 'want', 'retired', 'ownerUid', 'url']) assert.ok(!calls[0][1].fieldMask.includes(field), field)
  const none = { en: null, id: null }
  assert.deepEqual(await readShareCardUrls(db({}), 'meal', 'meal12345'), none)
  assert.deepEqual(await readShareCardUrls(db({}, true), 'meal', 'meal12345'), none)
  assert.deepEqual(await readShareCardUrls(null, 'meal', 'meal12345'), none)
  calls.length = 0
  assert.deepEqual(await readShareCardUrls(db({}), 'meal', 'a/b'), none)
  assert.deepEqual(calls, [])
  // The page picks its own language, and nothing else.
  const urls = { en: 'E', id: 'I' }
  assert.equal(shareCardFor(urls, 'en'), 'E'); assert.equal(shareCardFor(urls, 'id'), 'I')
  for (const locale of ['', 'ID', 'ms', undefined]) assert.equal(shareCardFor(urls, locale), null, String(locale))
  assert.equal(shareCardFor(undefined, 'en'), null); assert.equal(shareCardFor({ en: null, id: 'I' }, 'en'), null)
})

test('the bucket is one configuration value: unset or unmatched means no card, and today\'s image', () => {
  for (const setting of [undefined, '', ' ', 'another-project.firebasestorage.app', 'not a bucket!', 'munchies-expo']) {
    const card = configured(setting).load('lib/share-card.ts')
    for (const locale of LOCALES) assert.equal(card.shareCardUrlFrom(current('place'), 'place', 'ChIJabc_123-x', locale), null, `${setting} ${locale}`)
  }
  const two = configured(' makan-devel.firebasestorage.app , munchies-expo.firebasestorage.app ').load('lib/share-card.ts')
  assert.equal(two.shareCardUrlFrom(current('place'), 'place', 'ChIJabc_123-x', 'en'), CARD)
  assert.equal(two.shareCardUrlFrom(withUrl('place', 'id', urlOf('place', 'ChIJabc_123-x', 'id', 'makan-devel.firebasestorage.app')), 'place', 'ChIJabc_123-x', 'id') !== null, true)
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
