import assert from 'node:assert/strict'
import test from 'node:test'
import { lane, PLACE, PLACE_ROUTE, DINERS, place, venue, user, storage, cardRecord } from './share-v2-test-lane.mjs'

// RM20616 dish pages U4 — the Share v2 restaurant page's search lines and index rule, behind DISH_PAGES (board dp-serp).
// With the app's answer: the approved "What to order at …" title and description. Without one: the live place page's
// title family (Devon, Q3). A page with no visible meal and no answer is not indexed. Canonical, languages and JSON-LD
// do not change, and nothing is marked up as a review, a rating or a menu.

const SLUG = venue.slug
const ON = { SHARE_V2_PAGES: '1', DISH_PAGES: '1' }
const open = (run, locale = 'en') => run.page(PLACE_ROUTE, { locale, slug: SLUG })
const meals = n => Array.from({ length: n }, (_, i) => ({ id: `place-meal-${i + 1}`, src: `${storage}?m${i + 1}`, thumb: '', caption: `Caption ${i + 1} here`, mealType: 'Dinner', username: `diner_handle_${i + 1}`, at: '2026-11-05T18:00:00.000Z' }))
const runWith = (env, extra) => { const run = lane({ env }); run.useCache(); run.state.place = place(extra); return run }
const ANSWER = { name: 'Nasi campur ayam betutu', maitred: false }
const jsonLd = html => [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(m => m[1])

test('with an answer: the approved title and description, in English and Bahasa, with and without a city', async () => {
  const cases = [
    [{ ...ANSWER }, 'en', true, 'What to order at Warung Bu Sri, Pererenan | Makan', 'What to order at Warung Bu Sri, Pererenan, Indonesia: Nasi campur ayam betutu, the top dish in diners’ Eat or Yeet picks on Makan.'],
    [{ ...ANSWER, maitred: true }, 'en', true, 'What to order at Warung Bu Sri, Pererenan | Makan', 'What to order at Warung Bu Sri, Pererenan, Indonesia: Nasi campur ayam betutu, the Maître d’ pick on Makan.'],
    [{ ...ANSWER }, 'id', true, 'Apa yang harus dipesan di Warung Bu Sri, Pererenan | Makan', 'Apa yang harus dipesan di Warung Bu Sri, Pererenan, Indonesia: Nasi campur ayam betutu, hidangan teratas dari pilihan Eat or Yeet pengunjung di Makan.'],
    [{ ...ANSWER, maitred: true }, 'id', true, 'Apa yang harus dipesan di Warung Bu Sri, Pererenan | Makan', 'Apa yang harus dipesan di Warung Bu Sri, Pererenan, Indonesia: Nasi campur ayam betutu, pilihan Maître d’ di Makan.'],
    [{ ...ANSWER }, 'en', false, 'What to order at Warung Bu Sri | Makan', 'What to order at Warung Bu Sri: Nasi campur ayam betutu, the top dish in diners’ Eat or Yeet picks on Makan.'],
    [{ ...ANSWER, maitred: true }, 'id', false, 'Apa yang harus dipesan di Warung Bu Sri | Makan', 'Apa yang harus dipesan di Warung Bu Sri: Nasi campur ayam betutu, pilihan Maître d’ di Makan.'],
  ]
  for (const [answer, locale, located, title, description] of cases) {
    const out = await open(runWith(ON, { dishes: { answer, rated: [] }, ...(located ? {} : { where: null }) }), locale)
    assert.equal(out.metadata.title, title)
    assert.equal(out.metadata.description, description)
    assert.equal(out.metadata.openGraph.title, title); assert.equal(out.metadata.twitter.title, title)
  }
})

// Review L1: whenever the Share v2 page is served, not only once DISH_PAGES is on, so Share v2 going on first loses no title.
test('Q3, no answer: the live place page\'s titles, not the bare name, with or without DISH_PAGES; the description stays the page\'s own', async () => {
  const cases = [
    [{}, 'en', 'Warung Bu Sri, Pererenan: meals & what to order | Makan'],
    [{}, 'id', 'Warung Bu Sri, Pererenan: makanan & pilihan pesanan | Makan'],
    [{ meals: [], publicMealCount: 0 }, 'en', 'Warung Bu Sri, Pererenan | Makan'],
    [{ where: null }, 'en', 'Warung Bu Sri: meals & what to order | Makan'],
    [{ where: null, meals: [], publicMealCount: 0 }, 'id', 'Warung Bu Sri | Makan'],
  ]
  for (const [extra, locale, title] of cases) {
    for (const dishes of [undefined, { answer: null, rated: [] }]) {
      const on = await open(runWith(ON, { ...extra, dishes }), locale)
      const off = await open(runWith({ SHARE_V2_PAGES: '1' }, { ...extra, dishes }), locale)
      assert.equal(on.metadata.title, title, JSON.stringify(extra))
      assert.equal(off.metadata.title, title, 'DISH_PAGES off: the same live title')
      assert.equal(on.metadata.description, off.metadata.description)
    }
  }
})

test('canonical, the en/id/x-default alternates, the preview image and the JSON-LD do not change; nothing is a review, rating or menu', async () => {
  for (const locale of ['en', 'id']) {
    for (const answer of [ANSWER, { ...ANSWER, maitred: true }, null]) {
      const on = await open(runWith(ON, { dishes: { answer, rated: ['Sate', 'Lawar'] } }), locale)
      const off = await open(runWith({ SHARE_V2_PAGES: '1' }, { dishes: { answer, rated: ['Sate', 'Lawar'] } }), locale)
      assert.deepEqual(on.metadata.alternates, off.metadata.alternates)
      // The same image; its alt text is the page's title, as on every page (lib/site-metadata.ts).
      const image = ({ url, width, height }) => ({ url, width, height })
      assert.deepEqual(on.metadata.openGraph.images.map(image), off.metadata.openGraph.images.map(image))
      assert.equal(on.metadata.openGraph.images[0].alt, on.metadata.title)
      assert.deepEqual(on.metadata.itunes, off.metadata.itunes)
      assert.deepEqual(jsonLd(on.html), jsonLd(off.html))
      for (const script of jsonLd(on.html)) {
        assert.doesNotMatch(script, /Review|AggregateRating|"rating|Rating"|"Menu|hasMenu|MenuItem|ItemList|Recommendation|Sate|Lawar|Nasi campur/)
      }
      const canonical = `https://www.makanofficial.com${locale === 'id' ? '/id' : ''}/places/${SLUG}`
      assert.equal(on.metadata.alternates.canonical, canonical)
      assert.deepEqual(on.metadata.alternates.languages, { en: `https://www.makanofficial.com/places/${SLUG}`, id: `https://www.makanofficial.com/id/places/${SLUG}`, 'x-default': `https://www.makanofficial.com/places/${SLUG}` })
    }
  }
})

test('index rule: a page with no visible meal and no answer is noindex, follow; an answer or a visible meal keeps today\'s rule', async () => {
  const noindex = { index: false, follow: true }
  // Every author hidden, no answer: noindex (today it would be indexed: two public meals).
  const hidden = runWith(ON, { dishes: { answer: null, rated: [] } })
  for (const uid of DINERS) hidden.seed.set(`users/${uid}`, user({ accountStatus: 'held' }))
  assert.deepEqual((await open(hidden)).metadata.robots, noindex)
  // The same with the switch off: today's rule, indexed.
  const off = runWith({ SHARE_V2_PAGES: '1' }, { dishes: { answer: null, rated: [] } })
  for (const uid of DINERS) off.seed.set(`users/${uid}`, user({ accountStatus: 'held' }))
  assert.equal((await open(off)).metadata.robots, undefined)
  // An answer keeps it indexed even with every photo hidden; a visible meal keeps it indexed with no answer.
  const answered = runWith(ON, { dishes: { answer: ANSWER, rated: [] } })
  for (const uid of DINERS) answered.seed.set(`users/${uid}`, user({ accountStatus: 'held' }))
  assert.equal((await open(answered)).metadata.robots, undefined)
  assert.equal((await open(runWith(ON, { dishes: { answer: null, rated: [] } }))).metadata.robots, undefined)
  // No meals at all and no answer: noindex (dp-empty); not computed counts as no answer.
  assert.deepEqual((await open(runWith(ON, { meals: [], dishes: { answer: null, rated: [] } }))).metadata.robots, noindex)
  assert.deepEqual((await open(runWith(ON, { meals: [] }))).metadata.robots, noindex)
  // Today's own noindex (too thin) still holds with an answer.
  assert.deepEqual((await open(runWith(ON, { indexable: false, dishes: { answer: ANSWER, rated: [] } }))).metadata.robots, undefined, 'indexable from its matchup row')
  const thin = runWith(ON, { indexable: false, dishes: { answer: ANSWER, rated: [] } }); thin.state.row = null
  assert.deepEqual((await open(thin)).metadata.robots, noindex)
})

test('the metadata reads nothing the page does not: one author check per request, with the switch on', async () => {
  const on = runWith(ON, { meals: meals(2), dishes: { answer: null, rated: [] } })
  const off = runWith({ SHARE_V2_PAGES: '1' }, { meals: meals(2), dishes: { answer: null, rated: [] } })
  await open(on); await open(off)
  assert.deepEqual(on.reads.sort(), off.reads.sort())
  // With a stored card today's metadata skips the author check; the switch-on metadata makes it, shared with the page.
  const [cardOn, cardOff] = [runWith(ON, { meals: meals(2), dishes: { answer: null, rated: [] } }), runWith({ SHARE_V2_PAGES: '1' }, { meals: meals(2), dishes: { answer: null, rated: [] } })]
  for (const run of [cardOn, cardOff]) run.seed.set(`shareCardMeta/place_${PLACE}`, cardRecord('place', PLACE))
  await open(cardOn); await open(cardOff)
  assert.deepEqual(cardOn.reads.sort(), cardOff.reads.sort())
})
