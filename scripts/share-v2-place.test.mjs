import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { lane, PLACE, PLACE_ROUTE, BUCKET, DINERS, place, venue, user, meal, card, cardRecord, fence, storage } from './share-v2-test-lane.mjs'

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
  assert.equal(none.reads.filter(path => path === `shareCardMeta/place_${PLACE}`).length, 1)
  const run = lane(); run.useCache(); run.seed.set(`shareCardMeta/place_${PLACE}`, cardRecord('place', PLACE))
  const stored = await open(run, 'id')
  // A Bahasa page shows the Bahasa card, and an English page the English one, from the one record.
  assert.equal(stored.metadata.openGraph.images[0].url, card('place', PLACE, BUCKET, 'id'))
  assert.deepEqual(stored.metadata.twitter.images, [card('place', PLACE, BUCKET, 'id')])
  run.reads.length = 0
  const english = await open(run)
  assert.equal(english.metadata.openGraph.images[0].url, card('place', PLACE, BUCKET, 'en'))
  await open(run, 'id')
  assert.deepEqual(run.reads, [], 'the card is read once per place every five minutes, for both languages, not per view')
  for (const url of [card('place', 'ChIJanotherplace1'), card('place', PLACE, 'another-project.firebasestorage.app'), card('meal', PLACE)]) {
    const bad = lane(); bad.useCache(); bad.seed.set(`shareCardMeta/place_${PLACE}`, cardRecord('place', PLACE, { cards: { en: { path: 'x', url }, id: { path: 'x', url } } }))
    assert.equal((await open(bad)).metadata.openGraph.images[0].url, `https://www.makanofficial.com/places/${SLUG}/opengraph-image`, url)
  }
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
    assert.deepEqual(await mod.generateMetadata(props), { robots: { index: false, follow: false } })
    await assert.rejects(mod.default(props), /NOT_FOUND/)
    assert.equal(run.reads.length, 0)
  }
})

// U3 review M2 — the place aggregate never looks at a meal's author. The page does, with the meal page's own check.
const photoOf = n => `photo.jpg?m${n}`
test('a meal photo by an account that is held, disabled, under age, deleted or being deleted is nowhere on the place page', async () => {
  const hide = [
    ['held', run => run.seed.set(`users/${DINERS[0]}`, user({ accountStatus: 'held' }))],
    ['suspended', run => run.seed.set(`users/${DINERS[0]}`, user({ accountStatus: 'suspended' }))],
    ['disabled', run => run.seed.set(`users/${DINERS[0]}`, user({ status: 'disabled' }))],
    ['spam', run => run.seed.set(`users/${DINERS[0]}`, user({ spamSuspected: true }))],
    ['deleted', run => run.seed.set(`users/${DINERS[0]}`, user({ isDeleted: true }))],
    ['no account', run => run.seed.delete(`users/${DINERS[0]}`)],
    ['under age', run => run.seed.set(`users/${DINERS[0]}/private/age`, { underMinimum: true })],
    ['birth year under 13', run => run.seed.set(`users/${DINERS[0]}/private/age`, { birthYear: 2015 })],
    ['being deleted', run => run.seed.set(fence(DINERS[0]), { createdAt: 1 })],
    ['meal no longer public', run => run.seed.set('meals/place-meal-1', meal({ userID: DINERS[0], isPublic: false }))],
    ['meal deleted', run => run.seed.delete('meals/place-meal-1')],
  ]
  for (const [why, change] of hide) {
    const run = lane(); run.useCache(); change(run)
    const out = await open(run)
    // Not the hero, not a tile, not a JSON-LD image, not a link.
    assert.ok(!out.text.includes(photoOf(1)) && !out.text.includes('photo.jpg%3Fm1'), why)
    assert.doesNotMatch(out.html, /place-meal-1/, why)
    assert.match(out.html, new RegExp(`<figure class="hero"><img src="[^"]*photo\\.jpg\\?m2"`), `${why}: the next diner's photo leads`)
    assert.match(out.html, /href="\/meal\/place-meal-2"/, why)
  }
  const both = lane(); both.useCache()
  const out = await open(both)
  assert.ok(out.html.includes(photoOf(1)) && out.html.includes(photoOf(2)))
})

test('if the authors cannot be checked, no meal photo is shown; and the check is cached, not made per view', async () => {
  for (const path of ['meals/place-meal-1', `users/${DINERS[1]}`, fence(DINERS[0])]) {
    const run = lane(); run.useCache(); run.failures.add(path)
    const out = await open(run)
    assert.equal(out.thrown, null, path)
    assert.doesNotMatch(out.text, /photo\.jpg|place-meal-|What people ate/, path)
    assert.match(out.html, /<h1 class="name">Warung Bu Sri<\/h1>/)
    assert.deepEqual(run.logs, ['Place meal standing unavailable.'])
  }
  const run = lane(); run.useCache()
  await open(run)
  const standing = run.reads.filter(path => !path.startsWith('shareCardMeta/'))
  assert.deepEqual(standing.sort(), ['meals/place-meal-1', 'meals/place-meal-2', ...DINERS.flatMap(uid => [`users/${uid}`, `users/${uid}/private/age`, fence(uid)])].sort(), '1 read per meal, 3 per author')
  run.reads.length = 0
  await open(run); await open(run, 'id')
  assert.deepEqual(run.reads, [], 'a warm page reads nothing')
  // An author is checked again in the next clock hour; a meal's owner is not read again that day. The first view of
  // the new hour already hides a newly held account: the earlier hour's answer is never served, not even once.
  run.seed.set(`users/${DINERS[0]}`, user({ accountStatus: 'banned' }))
  const stillThisHour = await open(run)
  assert.ok(stillThisHour.html.includes(photoOf(1)), 'within the hour the cached answer stands')
  run.state.clock = (Math.floor(run.state.clock / 3_600_000) + 1) * 3_600_000 + 1
  const later = await open(run)
  assert.ok(!later.html.includes(photoOf(1)) && later.html.includes(photoOf(2)))
  assert.ok(!run.reads.some(path => path.startsWith('meals/')))
  assert.deepEqual(run.reads.filter(path => path.startsWith('users/') || path.startsWith('accountDeletionFences/')).length, 6)
})

test('a request that did not come through the proxy is a 404 that reads nothing, even with the switch on', async () => {
  for (const headers of [{}, { 'x-makan-share-v2': '1' }, { 'x-makan-share-v2': '0' }, { 'x-makan-share-v2': 'true' }, { 'x-makan-share-v2': 'a'.repeat(64) }]) {
    const run = lane(); run.state.headers = headers
    const mod = run.load(PLACE_ROUTE)
    const props = { params: Promise.resolve({ locale: 'en', slug: SLUG }) }
    assert.deepEqual(await mod.generateMetadata(props), { robots: { index: false, follow: false } })
    await assert.rejects(mod.default(props), /NOT_FOUND/)
    assert.equal(run.reads.length, 0)
  }
  // An address with a dot never passes proxy.ts, so it never carries the mark; and a dotted slug can only redirect to the public address.
  assert.equal((await open(lane(), 'en', 'warung.bu.sri-abc123')).thrown, `REDIRECT_308:/places/${SLUG}`)
})

// Devon's three choices live in lib/share-page-choices.ts. As built, and what each other value does.
const choices = readFileSync('lib/share-page-choices.ts', 'utf8')
const choose = (find, replacement) => { assert.ok(choices.includes(find), find); return lane({ source: path => (path === 'lib/share-page-choices.ts' ? choices.replace(find, replacement) : null) }) }

test('choice: the line under the dish. Whichever value is set, the holder is never named', async () => {
  assert.match(choices, /PLACE_MAITRED_LINE: [^=]+= 'a-regular-maitred'/)
  const alone = await open(choose("= 'a-regular-maitred'", "= 'a-regular'"))
  assert.match(alone.html, /<p class="dish">Nasi campur ayam betutu<\/p><p class="by">A regular<\/p>/)
  const none = await open(choose("= 'a-regular-maitred'", "= 'none'"))
  assert.match(none.html, /<p class="dish">Nasi campur ayam betutu<\/p><\/section>/)
  for (const out of [alone, none]) assert.doesNotMatch(out.text, /HOLDER/)
})

test('choice: the map and the firsthand-review block are left out as built, and come back with one value each', async () => {
  assert.match(choices, /PLACE_PAGE_KEEPS = \{ map: false, firsthandReview: false \}/)
  const review = { slug: 'a-review', author: { name: 'Rido' }, visitDate: '2026-10-01', orderSummary: 'ORDER SUMMARY', bill: { total: '£84', covers: 2 } }
  const built = lane(); built.state.review = review
  assert.doesNotMatch((await open(built)).html, /data-map|ORDER SUMMARY/)
  const kept = choose('{ map: false, firsthandReview: false }', '{ map: true, firsthandReview: true }'); kept.state.review = review
  const out = await open(kept)
  assert.match(out.html, /data-map="Map showing Warung Bu Sri"/); assert.match(out.html, /ORDER SUMMARY/); assert.match(out.html, /href="\/blog\/a-review"/)
})

// U3 review, second pass — the preview image. With no stored card it is today's per-request card, which can draw the
// newest meal's photo. It is used only if that meal's author may appear; otherwise the site's own card.
test('the preview image never shows a meal photo by a hidden account: it falls back to the site\'s own card', async () => {
  const todays = `https://www.makanofficial.com/places/${SLUG}/opengraph-image`
  const visible = lane(); visible.useCache()
  assert.equal((await open(visible)).metadata.openGraph.images[0].url, todays)
  for (const [why, change] of [
    ['held', run => run.seed.set(`users/${DINERS[0]}`, user({ accountStatus: 'held' }))],
    ['under age', run => run.seed.set(`users/${DINERS[0]}/private/age`, { underMinimum: true })],
    ['deleted', run => run.seed.set(`users/${DINERS[0]}`, user({ isDeleted: true }))],
    ['being deleted', run => run.seed.set(fence(DINERS[0]), { createdAt: 1 })],
    ['check failed', run => run.failures.add(`users/${DINERS[0]}`)],
  ]) {
    for (const locale of ['en', 'id']) {
      const run = lane(); run.useCache(); change(run)
      const out = await open(run, locale)
      const site = `https://www.makanofficial.com${locale === 'id' ? '/id' : ''}/opengraph-image`
      assert.equal(out.metadata.openGraph.images[0].url, site, `${why} ${locale}`)
      assert.deepEqual(out.metadata.twitter.images, [site], why)
      assert.doesNotMatch(JSON.stringify(out.metadata), /places\/[^"]*opengraph-image|photo\.jpg/, why)
    }
  }
  // Only the newest meal matters to today's card: a hidden author further down the list leaves it in use.
  const second = lane(); second.useCache(); second.seed.set(`users/${DINERS[1]}`, user({ accountStatus: 'held' }))
  assert.equal((await open(second)).metadata.openGraph.images[0].url, todays)
  // A stored card is used as it is (U2 renders it under the same rule), and a place with no meals keeps today's text card.
  const stored = lane(); stored.useCache(); stored.seed.set(`users/${DINERS[0]}`, user({ accountStatus: 'held' })); stored.seed.set(`shareCardMeta/place_${PLACE}`, cardRecord('place', PLACE))
  assert.equal((await open(stored)).metadata.openGraph.images[0].url, card('place', PLACE))
  const bare = lane(); bare.useCache(); bare.state.place = place({ meals: [] })
  assert.equal((await open(bare)).metadata.openGraph.images[0].url, todays)
})

test('the page and its preview share one author check per request, and a failed re-check shows no photo rather than an old answer', async () => {
  const run = lane(); run.useCache()
  await open(run)
  assert.equal(run.reads.filter(path => path.startsWith('meals/')).length, 2, 'the metadata and the page did not each read the meals')
  assert.equal(run.reads.filter(path => path === `users/${DINERS[0]}`).length, 1)
  run.state.clock = (Math.floor(run.state.clock / 3_600_000) + 1) * 3_600_000 + 1
  run.failures.add(`users/${DINERS[0]}`)
  const out = await open(run)
  assert.doesNotMatch(out.text, /photo\.jpg|place-meal-/)
  assert.equal(out.metadata.openGraph.images[0].url, 'https://www.makanofficial.com/opengraph-image')
})
