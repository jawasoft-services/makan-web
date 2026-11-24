import assert from 'node:assert/strict'
import test from 'node:test'
import { lane, KEY, MEAL, PLACE, BUCKET, PLACE_ROUTE, MEAL_ROUTE, PROFILE_ROUTE, TOKEN, OTHER_TOKEN, cardRecord, cardPath, card, storage } from './share-v2-test-lane.mjs'

// RM20616 A12 — the three Share v2 pages against the card record U2 writes (shareCardMeta/<kind>_<id>, with
// cards.<locale>.url), in both languages. Each page uses its own language's card only while the record is current
// and the address is that subject's own file; anything else gives the page's own image, never an error page.
const SITE = 'https://www.makanofficial.com'
const SLUG = 'warung-bu-sri-abc123'
const PAGES = {
  place: { route: PLACE_ROUTE, id: PLACE, params: { slug: SLUG }, fallback: locale => `${SITE}${locale === 'id' ? '/id' : ''}/places/${SLUG}/opengraph-image` },
  meal: { route: MEAL_ROUTE, id: MEAL, params: { id: MEAL }, fallback: () => storage },
  profile: { route: PROFILE_ROUTE, id: KEY, params: { slug: `dewi-l-${KEY}` }, fallback: locale => `${SITE}${locale === 'id' ? '/id' : ''}/opengraph-image` },
}
const LOCALES = ['en', 'id']
const other = locale => (locale === 'en' ? 'id' : 'en')
const at = (bucket, object) => `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(object)}?alt=media&token=${TOKEN}`
const UID = 'Xk2uQ7pR0aBcDeFgHiJkLmNoPq12'
const fileOf = (kind, id, locale) => cardPath(kind, id, locale).split('/').at(-1)
const withCard = (kind, id, locale, url) => { const record = cardRecord(kind, id); record.cards[locale] = { path: 'x', url }; return record }

/** Each state: the record, and whether the page should show its own language's card. */
const STATES = {
  'current': (kind, id) => [cardRecord(kind, id), true],
  'drop: true': (kind, id) => [cardRecord(kind, id, { drop: true }), false],
  'purge: true, no want': (kind, id) => [cardRecord(kind, id, { purge: true, want: null }), false],
  'a pending want': (kind, id) => [cardRecord(kind, id, { want: { hash: 'f'.repeat(64), content: { lines: ['PRIVATE WORDS'] }, requestedAt: 1 } }), false],
  'an empty hash': (kind, id) => [cardRecord(kind, id, { hash: '' }), false],
  'no card for any language': (kind, id) => [cardRecord(kind, id, { cards: {} }), false],
  'only a top-level url (the old shape)': (kind, id, locale) => [cardRecord(kind, id, { cards: undefined, url: card(kind, id, BUCKET, locale) }), false],
  'the other language only': (kind, id, locale) => { const record = cardRecord(kind, id); delete record.cards[locale]; return [record, false] },
  'a wrong bucket': (kind, id, locale) => [withCard(kind, id, locale, card(kind, id, 'another-project.firebasestorage.app', locale)), false],
  'a path outside shareCards/<kind>/<id>/': (kind, id, locale) => [withCard(kind, id, locale, at(BUCKET, `shareCards/${kind}/${id}-x/${fileOf(kind, id, locale)}`)), false],
  'another kind\'s folder': (kind, id, locale) => [withCard(kind, id, locale, card(kind === 'meal' ? 'place' : 'meal', id, BUCKET, locale)), false],
  'a uid-looking folder in the path': (kind, id, locale) => [withCard(kind, id, locale, at(BUCKET, `shareCards/${kind}/${id}/${UID}/${fileOf(kind, id, locale)}`)), false],
  'a uid in place of the subject': (kind, id, locale) => [withCard(kind, id, locale, at(BUCKET, `shareCards/${kind}/${UID}/${fileOf(kind, id, locale)}`)), false],
  'the other language\'s file under this language': (kind, id, locale) => [withCard(kind, id, locale, card(kind, id, BUCKET, other(locale), OTHER_TOKEN)), false],
}

async function render(kind, locale, record) {
  const page = PAGES[kind]
  const run = lane(); run.useCache()
  if (record) run.seed.set(`shareCardMeta/${kind}_${page.id}`, record)
  const out = await run.page(page.route, { locale, ...page.params })
  return { run, out }
}

for (const kind of Object.keys(PAGES)) {
  test(`${kind} page: each record state, in English and Bahasa, gives this language's card or the page's own image`, async () => {
    const page = PAGES[kind]
    for (const locale of LOCALES) {
      for (const [label, state] of Object.entries(STATES)) {
        const [record, shown] = state(kind, page.id, locale)
        const { out } = await render(kind, locale, record)
        const why = `${kind} ${locale}: ${label}`
        assert.equal(out.thrown, null, why)
        const expected = shown ? card(kind, page.id, BUCKET, locale) : page.fallback(locale)
        assert.equal(out.metadata.openGraph.images[0].url, expected, why)
        assert.deepEqual(out.metadata.twitter.images.map(image => image.url ?? image), [expected], why)
        // Never the other language's card, and never any private field of the record.
        assert.ok(!out.text.includes(encodeURIComponent(cardPath(kind, page.id, other(locale)))), why)
        assert.doesNotMatch(out.text, /PRIVATE|shareCards%2F[^"]*Xk2uQ7/, why)
      }
    }
  })

  test(`${kind} page: the card record is read once, through the field mask, and never its private fields`, async () => {
    const page = PAGES[kind]
    for (const locale of LOCALES) {
      const { run } = await render(kind, locale, cardRecord(kind, page.id))
      const path = `shareCardMeta/${kind}_${page.id}`
      const asked = run.masks.filter(entry => entry.paths.some(p => p.startsWith('shareCardMeta/')))
      assert.deepEqual(asked, [{ paths: [path], mask: ['hash', 'cards', 'drop', 'purge', 'want.hash'] }], `${kind} ${locale}`)
      // Every read of the record went through that masked read: no unmasked get().
      assert.equal(run.reads.filter(p => p === path).length, asked.length, `${kind} ${locale}`)
      for (const field of ['photoOwnerUid', 'drawnPhotoOwnerUid', 'drawnPhotoMealId', 'ownerUid', 'want', 'want.content', 'retired', 'url', 'uid']) {
        assert.ok(!asked[0].mask.includes(field), `${kind} ${locale} asks for ${field}`)
      }
    }
  })
}

test('with SHARE_V2_PAGES unset (or anything but "1") no page reads a card record, or anything else', async () => {
  for (const env of [{}, { SHARE_V2_PAGES: '' }, { SHARE_V2_PAGES: '0' }, { SHARE_V2_PAGES: 'true' }]) {
    for (const [kind, page] of Object.entries(PAGES)) {
      for (const locale of LOCALES) {
        const run = lane({ env: { ...env, SHARE_STORAGE_BUCKETS: BUCKET } })
        run.seed.set(`shareCardMeta/${kind}_${page.id}`, cardRecord(kind, page.id))
        const out = await run.page(page.route, { locale, ...page.params })
        assert.equal(out.thrown, 'NOT_FOUND', `${kind} ${locale} ${JSON.stringify(env)}`)
        assert.deepEqual(run.reads, [], `${kind} ${locale} ${JSON.stringify(env)}`)
        assert.deepEqual(run.masks, [])
      }
    }
  }
})

test('a place card the backend drops or purges stops being served at the end of the five-minute window, even where Next serves an expired entry while it refreshes', async () => {
  const WINDOW = 300_000
  const page = PAGES.place
  const path = `shareCardMeta/place_${PLACE}`
  for (const serveStale of [true, false]) {
    for (const [label, removal] of [['drop', { drop: true }], ['purge', { purge: true, want: null }], ['a new ask', { want: { hash: 'f'.repeat(64) } }]]) {
      for (const locale of LOCALES) {
        const why = `${label} ${locale} serveStale=${serveStale}`
        const run = lane(); run.useCache(); run.state.serveStale = serveStale
        const start = run.state.clock
        run.seed.set(path, cardRecord('place', PLACE))
        const view = async () => (await run.page(page.route, { locale, ...page.params })).metadata.openGraph.images[0].url
        assert.equal(await view(), card('place', PLACE, BUCKET, locale), why)
        // The backend removes the card. Until the window ends this instance still has the address it read (the worst case).
        run.seed.set(path, cardRecord('place', PLACE, removal))
        run.state.clock = start + WINDOW - 1
        assert.equal(await view(), card('place', PLACE, BUCKET, locale), why)
        assert.equal(run.reads.filter(p => p === path).length, 1, why)
        // From the next window on, it reads the record again and the page uses its own image.
        run.state.clock = start + WINDOW
        assert.equal(await view(), page.fallback(locale), why)
        assert.equal(run.reads.filter(p => p === path).length, 2, why)
      }
    }
  }
  // However long the place went unviewed, the first view after it never gets the old address.
  for (const idle of [WINDOW + 1, 60 * 60_000, 24 * 60 * 60_000]) {
    const run = lane(); run.useCache(); run.state.serveStale = true
    run.seed.set(path, cardRecord('place', PLACE))
    assert.equal((await run.page(page.route, { locale: 'en', ...page.params })).metadata.openGraph.images[0].url, card('place', PLACE))
    run.seed.set(path, cardRecord('place', PLACE, { drop: true }))
    run.state.clock += idle
    assert.equal((await run.page(page.route, { locale: 'en', ...page.params })).metadata.openGraph.images[0].url, page.fallback('en'), `idle ${idle} ms`)
  }
})
