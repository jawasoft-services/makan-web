import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { lane, PLACE_ROUTE, DINERS, place, venue, user, meal, fence, storage } from './share-v2-test-lane.mjs'

// RM20616 dish pages U3 — "What to order here" and "Dishes rated here" on the Share v2 restaurant page, behind
// DISH_PAGES (boards dp-answer-a, dp-maitred-a, dp-thin-a, dp-empty; Devon 27 Nov 2026). The page reads nothing new:
// the dishes ride on the place aggregate, and a row's photo is one of the meals the page already shows.

const SLUG = venue.slug
const ON = { SHARE_V2_PAGES: '1', DISH_PAGES: '1' }
const open = (run, locale = 'en') => run.page(PLACE_ROUTE, { locale, slug: SLUG })
const strings = locale => JSON.parse(readFileSync(`messages/${locale}.json`, 'utf8'))
const photo = n => `${storage}?m${n}`
// Two diners' meals, newest first, as the aggregate lists them (captions are the clean ones the cron kept).
const meals = (...captions) => captions.map((caption, i) => ({ id: `place-meal-${i + 1}`, src: photo(i + 1), thumb: '', caption, mealType: 'Dinner', username: `diner_handle_${i + 1}`, at: '2026-11-05T18:00:00.000Z' }))
const ANSWER = { name: 'Nasi campur ayam betutu', maitred: false }
const RATED = ['Nasi goreng udang', 'Sate', 'Nasi campur ayam', 'Mie goreng']
// Each caption names exactly one rated dish (Devon, 27 Nov 2026: "Exact dish only"), so those rows get a photo.
const dishPlace = (dishes, captions = ['Nasi goreng udang', 'Mie goreng']) => place({ meals: meals(...captions), dishes })
const withDishes = (dishes, captions) => { const run = lane({ env: ON }); run.useCache(); run.state.place = dishPlace(dishes, captions); return run }
/** The dish section only: from the answer block up to "What people ate". */
const section = html => html.slice(html.indexOf('<section class="answer"'), html.indexOf('id="what-people-ate"') > 0 ? html.indexOf('<section aria-labelledby="what-people-ate"') : undefined)

test('answer (dp-answer-a): the app\'s answer on the tint, then the rated dishes with their photos, in English and Bahasa', async () => {
  for (const locale of ['en', 'id']) {
    const t = strings(locale).SharePages
    const out = await open(withDishes({ answer: ANSWER, rated: RATED }), locale)
    const html = section(out.html)
    assert.match(html, new RegExp(`^<section class="answer" aria-labelledby="what-to-order"><h2 id="what-to-order" class="answerLabel">${t.whatToOrder.replace('?', '\\?')}</h2><p class="answerDish">Nasi campur ayam betutu</p></section>`))
    assert.match(html, new RegExp(`<h2 id="dishes-rated-here" class="heading">${t.dishesRatedHere}</h2>`))
    assert.deepEqual([...html.matchAll(/<span class="dishName">([^<]*)<\/span>/g)].map(m => m[1]), RATED)
    // Captions "Nasi goreng udang" and "Mie goreng" are exactly two rated dishes: those two rows have a photo.
    const prefix = locale === 'id' ? '/id' : ''
    assert.match(html, new RegExp(`<li class="dishRow"><span class="dishName">Nasi goreng udang</span><a href="${prefix}/meal/place-meal-1" class="dishPhoto"><img src="[^"]*photo\\.jpg%3Fm1"`))
    assert.match(html, new RegExp(`<span class="dishName">Mie goreng</span><a href="${prefix}/meal/place-meal-2" class="dishPhoto">`))
    assert.match(html, /<li class="dishRow"><span class="dishName">Sate<\/span><\/li>/)
    assert.doesNotMatch(html, /answerBy|crown|A regular|Pelanggan tetap/, 'an Eat or Yeet answer has no Maître d\' line')
    // The section comes where the Maître d's note was: after the name, before "What people ate".
    assert.ok(out.html.indexOf('class="answer"') > out.html.indexOf('<h1 class="name">') && out.html.indexOf('class="answer"') < out.html.indexOf('what-people-ate'))
  }
})

test('Maître d\' pick (dp-maitred-a): the crown and the page\'s own "A regular, Maître d’" line; the holder is never named', async () => {
  for (const locale of ['en', 'id']) {
    const t = strings(locale).SharePages
    const out = await open(withDishes({ answer: { ...ANSWER, maitred: true }, rated: RATED }), locale)
    assert.match(section(out.html), new RegExp(`<p class="answerDish">Nasi campur ayam betutu</p><p class="answerBy"><svg class="answerCrown" viewBox="0 0 35 27" width="18" height="14" aria-hidden="true"><path [^>]*fill="#FF9932"[^>]*></path></svg>${t.maitredLine.replace('{name}', t.aRegular)}</p></section>`))
    assert.doesNotMatch(out.text, /HOLDER|\?holder/)
  }
})

test('not enough yet (dp-thin-a): no answer and meals on the page give the app\'s not-enough line, and no rows', async () => {
  for (const locale of ['en', 'id']) {
    const out = await open(withDishes({ answer: null, rated: [] }), locale)
    const html = section(out.html)
    assert.match(html, new RegExp(`<p class="answerThin">${strings(locale).Decision.FirstDay.emptyState}</p></section>`))
    assert.doesNotMatch(html, /dishes-rated-here|answerDish/)
  }
})

test('nothing here (dp-empty), not computed, or every photo hidden: no block that claims anything', async () => {
  // No visible meal and no answer: no block (and no "What people ate").
  const empty = withDishes({ answer: null, rated: [] }, [])
  empty.state.place = place({ meals: [], dishes: { answer: null, rated: [] } })
  assert.doesNotMatch((await open(empty)).html, /class="answer"|what-to-order|Not enough|What people ate/)
  // Not computed (no `dishes`, e.g. before the first run or a fallback): no block, and never the Maître d's note.
  const none = lane({ env: ON }); none.useCache()
  assert.doesNotMatch((await open(none)).html, /class="answer"|what-to-order|Nasi campur ayam betutu|A regular/)
  // An answer with no row: the answer alone, no heading.
  const alone = await open(withDishes({ answer: ANSWER, rated: [] }))
  assert.match(alone.html, /answerDish/); assert.doesNotMatch(alone.html, /dishes-rated-here/)
})

// M2 (review, 27 Nov 2026): a venue that opted out of dish names gets no `dishes` from the cron (lib/aggregates/dishes.ts),
// so its page draws no block at all, as the app shows no decision section for it: never "Not enough meals here yet".
test('a venue that opted out of dish names: no block at all, however many meals its page shows', async () => {
  for (const locale of ['en', 'id']) {
    const run = lane({ env: ON }); run.useCache()
    run.state.place = place({ meals: meals('Nasi goreng udang', 'Mie goreng') })
    run.state.maitred = { status: 'held', venue: { ...venue, notes: { ...venue.notes, always: 'Nasi goreng udang' } } }
    const out = await open(run, locale)
    assert.match(out.html, /what-people-ate/)
    assert.doesNotMatch(out.html, /class="answer"|what-to-order|answerThin|dishes-rated-here|class="order"/)
    assert.ok(!out.html.includes(strings(locale).Decision.FirstDay.emptyState))
  }
})

test('Q1, the app\'s answer only: a Maître d\' note that is not the answer is never shown', async () => {
  const run = withDishes({ answer: { name: 'Sate', maitred: false }, rated: ['Nasi goreng udang', 'Mie goreng'] })
  run.state.maitred = { status: 'held', venue: { ...venue, notes: { ...venue.notes, always: 'FREE TEXT PICK NOT ON THE LIST' } } }
  const out = await open(run)
  assert.match(out.html, /<p class="answerDish">Sate<\/p>/)
  assert.doesNotMatch(out.text, /FREE TEXT PICK|class="order"|class="dish"/)
})

test('a row photo comes only from a meal the page shows: a held, suspended, spam, under-13, deleted or deleting author\'s photo never; the next one instead', async () => {
  const hide = [
    ['held', run => run.seed.set(`users/${DINERS[0]}`, user({ accountStatus: 'held' }))],
    ['suspended', run => run.seed.set(`users/${DINERS[0]}`, user({ accountStatus: 'suspended' }))],
    ['spam', run => run.seed.set(`users/${DINERS[0]}`, user({ spamSuspected: true }))],
    ['no account', run => run.seed.delete(`users/${DINERS[0]}`)],
    ['under 13', run => run.seed.set(`users/${DINERS[0]}/private/age`, { birthYear: 2015 })],
    ['under minimum', run => run.seed.set(`users/${DINERS[0]}/private/age`, { underMinimum: true })],
    ['deleted', run => run.seed.set(`users/${DINERS[0]}`, user({ isDeleted: true }))],
    ['being deleted', run => run.seed.set(fence(DINERS[0]), { createdAt: 1 })],
    ['meal no longer public', run => run.seed.set('meals/place-meal-1', meal({ userID: DINERS[0], isPublic: false }))],
    ['check failed', run => run.failures.add(`users/${DINERS[0]}`)],
  ]
  for (const [why, change] of hide) {
    const run = withDishes({ answer: ANSWER, rated: RATED }, ['Nasi goreng udang', 'Nasi goreng udang']); change(run)
    const out = await open(run)
    assert.ok(!out.html.includes(photo(1)) && !out.html.includes(encodeURIComponent(photo(1))) && !out.html.includes('place-meal-1'), why)
    if (why === 'check failed') { assert.doesNotMatch(section(out.html), /dishPhoto/, why); continue }
    assert.match(section(out.html), /<span class="dishName">Nasi goreng udang<\/span><a href="\/meal\/place-meal-2" class="dishPhoto"><img src="[^"]*photo\.jpg%3Fm2"/, `${why}: the next visible meal that names it`)
  }
})

// M1 (review, 27 Nov 2026) and Devon's answer, "Exact dish only": a photo goes on a dish row only when the meal's
// caption names that exact dish (folded: case, accents and punctuation aside). Anything else leaves the row without one.
test('exact dish only: a variant, a longer name or a caption naming two dishes never lends its photo; an exact name does', async () => {
  const rowsOf = async (rated, captions) => {
    const html = section((await open(withDishes({ answer: ANSWER, rated }, captions))).html)
    return Object.fromEntries([...html.matchAll(/<span class="dishName">([^<]*)<\/span>(<a href="\/meal\/([^"]+)")?/g)].map(m => [m[1], m[3] ?? null]))
  }
  // "Sate lilit" is not "Sate" (only "Sate" is rated: the web never sees the unrated "Sate lilit").
  assert.deepEqual(await rowsOf(['Sate', 'Lawar'], ['Sate lilit', 'Sate lilit again']), { Sate: null, Lawar: null })
  // A variant family: "Nasi goreng seafood" is not "Nasi goreng".
  assert.deepEqual(await rowsOf(['Nasi goreng', 'Mie goreng'], ['Nasi goreng seafood', 'Mie goreng jawa']), { 'Nasi goreng': null, 'Mie goreng': null })
  // A caption naming two dishes is a photo of neither.
  assert.deepEqual(await rowsOf(['Babi guling', 'Lawar'], ['Babi guling and lawar', 'Lawar, babi guling']), { 'Babi guling': null, Lawar: null })
  // Extra words are not the dish either.
  assert.deepEqual(await rowsOf(['Nasi goreng udang', 'Sate'], ['Nasi goreng udang tonight', 'Sate with friends']), { 'Nasi goreng udang': null, Sate: null })
  // The exact dish, case, accents and punctuation aside, lands; the newest meal that names it wins, one photo per dish.
  assert.deepEqual(await rowsOf(['Nasi goreng', 'Babi guling'], ['NASI GORENG!', 'Nasi goreng']), { 'Nasi goreng': 'place-meal-1', 'Babi guling': null })
  assert.deepEqual(await rowsOf(['Bebek betutu', 'Lawar'], ['Lawar', 'Bébek  betutu.']), { 'Bebek betutu': 'place-meal-2', Lawar: 'place-meal-1' })
})

test('the answer follows the same rule: its block has no photo, and a caption naming the answer lends nothing to a row', async () => {
  const html = section((await open(withDishes({ answer: ANSWER, rated: RATED }, ['Nasi campur ayam betutu', 'Nasi campur ayam betutu']))).html)
  assert.doesNotMatch(html, /<img|dishPhoto|place-meal-/)
  assert.match(html, /<li class="dishRow"><span class="dishName">Nasi campur ayam<\/span><\/li>/)
})

test('nobody named, nothing counted: no @, handle, caption, rank, price or menu section in the dish section', async () => {
  const run = withDishes({ answer: { ...ANSWER, maitred: true }, rated: RATED }, ['Nasi goreng udang', 'Mie goreng'])
  for (const locale of ['en', 'id']) {
    const html = section((await open(run, locale)).html)
    assert.ok(html.length > 200)
    assert.ok(html.includes('dishPhoto'), 'rows with photos are checked too')
    assert.doesNotMatch(html, /@|diner_handle|HOLDER|CAPTION/)
    assert.doesNotMatch(html.replace(/<[^>]+>/g, ''), /\d/, 'no rank, count or price in the words shown')
    assert.doesNotMatch(html, /MENU|IDR|Rp|★|rating/i)
  }
})

test('dish names are shown exactly as stored, untranslated, on the Bahasa page; at most ten rows', async () => {
  const rated = ['Harissa prawns', 'Kendal\'s tiramisu', 'Grilled octopus & lemon']
  const html = section((await open(withDishes({ answer: { name: 'Fish & chips', maitred: false }, rated }), 'id')).html)
  assert.match(html, /<p class="answerDish">Fish &amp; chips<\/p>/)
  assert.deepEqual([...html.matchAll(/<span class="dishName">([^<]*)<\/span>/g)].map(m => m[1]), ['Harissa prawns', 'Kendal&#x27;s tiramisu', 'Grilled octopus &amp; lemon'])
  const many = section((await open(withDishes({ answer: ANSWER, rated: Array.from({ length: 14 }, (_, i) => `Dish ${i + 1}`) }))).html)
  assert.equal(many.match(/class="dishRow"/g).length, 10)
})

test('Q5, "Let it repeat": a row\'s photo is the grid tile\'s own file, so the browser loads it once', async () => {
  const run = withDishes({ answer: ANSWER, rated: RATED })
  run.state.place = { ...run.state.place, meals: run.state.place.meals.map((m, i) => i === 0 ? { ...m, thumb: `${storage}?thumb1` } : m) }
  const out = await open(run)
  const tiles = [...out.html.matchAll(/class="tile"><img src="([^"]*)"/g)].map(m => m[1])
  const rows = [...section(out.html).matchAll(/class="dishPhoto"><img src="([^"]*)"/g)].map(m => m[1])
  assert.deepEqual(rows, [`${storage}?thumb1`, '/api/thumb?w=480&u=' + encodeURIComponent(photo(2))].map(src => src.replace(/&/g, '&amp;')))
  for (const src of rows) assert.ok(tiles.includes(src), src)
})

test('a dish row is 64 pt with no line between rows, and the answer block is the app\'s accentTint', () => {
  const css = readFileSync('components/share/share-pages.module.css', 'utf8')
  const rule = name => css.match(new RegExp(`\\.${name} \\{([^}]*)\\}`))?.[1] ?? ''
  assert.match(rule('dishRow'), /min-height: 64px/)
  for (const name of ['dishRow', 'dishes', 'dishName']) assert.doesNotMatch(rule(name), /border|box-shadow/, name)
  assert.match(rule('answer'), /background: #FFE9D4/); assert.match(rule('answer'), /color: #1F1A14/); assert.match(rule('answer'), /border-radius: 12px/)
  assert.match(rule('answerDish'), /font-size: 28px/); assert.match(rule('answerDish'), /line-height: 34px/)
  assert.match(rule('answerLabel'), /letter-spacing: 1\.2px/)
  assert.match(rule('dishPhoto'), /width: 56px/)
  assert.doesNotMatch(css, /box-shadow/, 'flat: no shadows')
})

test('the fixture lane renders each dish state in English and Bahasa with no database', async () => {
  for (const state of ['answer', 'maitred', 'thin']) {
    for (const locale of ['en', 'id']) {
      const run = lane({ fixtures: true, env: { ...ON, MAKAN_WEBSITE_FIXTURE_DISHES: state } })
      const out = await run.page(PLACE_ROUTE, { locale, slug: 'kendal-street-kitchen-f10001' })
      assert.equal(out.thrown, null)
      if (state === 'thin') assert.ok(out.html.includes(strings(locale).Decision.FirstDay.emptyState))
      else {
        assert.match(out.html, /<p class="answerDish">Harissa prawns<\/p>/)
        assert.match(out.html, /<span class="dishName">Kendal&#x27;s tiramisu<\/span><a href="(\/id)?\/meal\/fixture-public-meal-2" class="dishPhoto">/)
        assert.equal(out.html.includes('class="answerBy"'), state === 'maitred')
      }
      assert.doesNotMatch(out.text, /Alex|makan_fixture/)
    }
  }
  assert.throws(() => lane({ fixtures: true, env: { MAKAN_WEBSITE_FIXTURE_DISHES: 'nope' } }).load('lib/website-fixtures.ts'), /Unknown website fixture dish state/)
})

// With DISH_PAGES off the Share v2 page is main's, byte for byte, but for one thing: its search title is the live place
// page's title family, not the bare name (review L1, Devon's Q3 "Reuse live titles"), wherever the title appears.
// With SHARE_V2_PAGES off this page is not served at all, so the live site does not change.
const BASE = '2b6fbe2'
const atBase = path => { try { return execFileSync('git', ['show', `${BASE}:${path}`], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch { return null } }
const basePage = atBase(PLACE_ROUTE)
test('switch off: the page equals main\'s and its metadata does but for the live title, whatever dishes the aggregate holds', { skip: !basePage && `commit ${BASE} is not in this clone` }, async () => {
  const states = [undefined, { answer: ANSWER, rated: RATED }, { answer: { ...ANSWER, maitred: true }, rated: RATED }, { answer: null, rated: [] }]
  for (const env of [{ SHARE_V2_PAGES: '1' }, { SHARE_V2_PAGES: '1', DISH_PAGES: '0' }, { SHARE_V2_PAGES: '1', DISH_PAGES: 'true' }]) {
    for (const dishes of states) {
      for (const locale of ['en', 'id']) {
        const now = lane({ env }), main = lane({ env, source: path => (path === PLACE_ROUTE ? basePage : null) })
        for (const run of [now, main]) { run.useCache(); run.state.place = dishPlace(dishes) }
        const [a, b] = [await open(now, locale), await open(main, locale)]
        assert.equal(a.html, b.html, `${JSON.stringify(env)} ${JSON.stringify(dishes)} ${locale}`)
        const live = locale === 'id' ? 'Warung Bu Sri, Pererenan: makanan & pilihan pesanan | Makan' : 'Warung Bu Sri, Pererenan: meals & what to order | Makan'
        assert.equal(b.metadata.title, 'Warung Bu Sri'); assert.equal(a.metadata.title, live)
        const titled = metadata => JSON.parse(JSON.stringify(metadata).replaceAll(JSON.stringify(live).slice(1, -1), 'Warung Bu Sri'))
        assert.deepEqual(titled(a.metadata), JSON.parse(JSON.stringify(b.metadata)), 'only the title (and the og, twitter and image-alt copies of it) differs')
        assert.deepEqual(now.reads, main.reads, 'the same reads')
        assert.doesNotMatch(a.html, /answerDish|dishes-rated-here|dishRow/)
      }
    }
  }
})
