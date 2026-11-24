import assert from 'node:assert/strict'
import test from 'node:test'
import { lane, PLACE, PLACE_ROUTE, place, venue, card, storage } from './share-v2-test-lane.mjs'

// RM20616 A12 U3 — the restaurant page a shared place link opens (boards X2, A7, E3, F3).
const SLUG = venue.slug
const open = (run, locale = 'en', slug = SLUG) => run.page(PLACE_ROUTE, { locale, slug })

test('the Maître d\' is "A regular" to every visitor: never a name, an initial or a photo (Devon, 24 Nov 2026)', async () => {
  const en = await open(lane())
  assert.match(en.html, /What to order here/)
  assert.match(en.html, /<p class="dish">Nasi campur ayam betutu<\/p><p class="by">A regular, Maître d’<\/p>/)
  assert.doesNotMatch(en.text, /HOLDER NAME|HOLDER|\?holder|>H</)
  const id = await open(lane(), 'id')
  assert.match(id.html, /Pesan apa di sini\?/)
  assert.match(id.html, /<p class="by">Pelanggan tetap, Maître d’<\/p>/)
  assert.doesNotMatch(id.text, /HOLDER NAME|\?holder/)
})

test('no diner is named on the place page: the meal photos carry no handle and no caption', async () => {
  const out = await open(lane())
  assert.match(out.html, /What people ate/)
  assert.match(out.html, /href="\/meal\/place-meal-1"/); assert.match(out.html, /href="\/meal\/place-meal-2"/)
  assert.doesNotMatch(out.text, /diner_handle|CAPTION/)
  // The only @ on the page is the site's own: its X account in the metadata and the JSON-LD keys.
  assert.doesNotMatch(out.html.replace(/<script[^>]*>.*?<\/script>/g, ''), /@/)
  assert.match((await open(lane(), 'id')).html, /href="\/id\/meal\/place-meal-1"/)
})

test('no dish answer is shown until there is one, and a venue with no meals shows no empty grid', async () => {
  for (const maitred of [{ status: 'vacant' }, { status: 'unresolved' }, { status: 'disabled' }, { status: 'unavailable' }, { status: 'held', venue: { ...venue, notes: { ...venue.notes, always: '  ' } } }]) {
    const run = lane(); run.state.maitred = maitred
    const out = await open(run)
    assert.match(out.html, /What people ate/)
    assert.doesNotMatch(out.text, /What to order here|A regular|Maître|HOLDER/, maitred.status)
  }
  const bare = lane(); bare.state.place = place({ meals: [] })
  assert.doesNotMatch((await open(bare)).html, /What people ate/)
})

test('the rank is the Eat or Yeet city rank with its month, and nothing else is scored: no counts, no Google rating', async () => {
  const out = await open(lane())
  assert.match(out.html, /<p class="standing">#3 in Pererenan · November<\/p>/)
  assert.match((await open(lane(), 'id')).html, /<p class="standing">#3 di Pererenan · November<\/p>/)
  assert.doesNotMatch(out.html, /Eat rate|Eats|Yeets|Matchups|matchups|rating|★|stars/i)
  for (const change of [state => { state.row = null }, state => { state.row = { ...state.row, cityRank: null } }, state => { state.computedAt = '' }, state => { state.place = place({ where: null }) }]) {
    const run = lane(); change(run.state)
    assert.doesNotMatch((await open(run)).html, /class="standing"/)
  }
})

test('the address, Directions and one claim link, in the site\'s words', async () => {
  const out = await open(lane())
  assert.match(out.html, /<dt>Address<\/dt><dd>Jl\. Pantai Pererenan No\. 112<\/dd>/)
  assert.match(out.html, />Directions<\/a>/); assert.match(out.html, /href="\/claim\/warung-bu-sri-abc123"[^>]*>Own this place\? Claim it</)
  assert.equal(out.html.split('Claim it').length, 2)
  const id = await open(lane(), 'id')
  assert.match(id.html, /<dt>Alamat<\/dt>/); assert.match(id.html, /Buka di Makan/)
  const claimed = lane(); claimed.state.place = place({ claimed: true, address: '' })
  assert.doesNotMatch((await open(claimed)).html, /Claim it|Address/)
})

test('og:image is the stored card when there is one, and today\'s per-request card when there is none', async () => {
  const none = lane(); none.useCache()
  const today = await open(none)
  assert.equal(today.metadata.openGraph.images[0].url, `https://www.makanofficial.com/places/${SLUG}/opengraph-image`)
  assert.equal(today.metadata.title, 'Warung Bu Sri')
  assert.deepEqual(today.metadata.itunes, { appId: '6756131450', appArgument: `https://www.makanofficial.com/places/${SLUG}` })
  assert.deepEqual(none.reads, [`shareCardMeta/place_${PLACE}`])
  const run = lane(); run.useCache(); run.seed.set(`shareCardMeta/place_${PLACE}`, { hash: '0f3a', url: card('place'), updatedAt: 1 })
  const stored = await open(run, 'id')
  assert.equal(stored.metadata.openGraph.images[0].url, card('place'))
  assert.deepEqual(stored.metadata.twitter.images, [card('place')])
  run.reads.length = 0
  await open(run, 'id'); await open(run)
  assert.deepEqual(run.reads, [], 'the card is read once per place every five minutes, not per view')
})

test('a Google photo keeps its credit, an unknown place is a 404, and a renamed place redirects', async () => {
  const run = lane(); run.state.place = place({ meals: [] }); run.state.googlePhoto = { uri: `${storage}?google`, author: 'A Photographer', authorUri: 'https://maps.google.com/x' }
  assert.match((await open(run)).html, /Photo: A Photographer · Google Maps/)
  const unknown = lane(); unknown.state.place = null
  assert.equal((await open(unknown)).thrown, 'NOT_FOUND')
  assert.equal((await open(lane(), 'id', 'old-name-abc123')).thrown, `REDIRECT_308:/id/places/${SLUG}`)
})

test('with the switch off the v2 place page does not exist: a 404 and not one read', async () => {
  for (const env of [{}, { SHARE_V2_PAGES: '0' }, { SHARE_V2_PAGES: 'true' }]) {
    const run = lane({ env })
    const mod = run.load(PLACE_ROUTE)
    const props = { params: Promise.resolve({ locale: 'en', slug: SLUG }) }
    assert.deepEqual(await mod.generateMetadata(props), {})
    await assert.rejects(mod.default(props), /NOT_FOUND/)
    assert.equal(run.reads.length, 0)
  }
})
