import assert from "node:assert/strict"
import test from "node:test"

import { lane } from "../scripts/share-v2-test-lane.mjs"

// RM20773: the new home page's live data (lib/agr-home-shape.ts), shaped from the existing readers.
const STORAGE = "https://firebasestorage.googleapis.com/v0/b/munchies-expo.firebasestorage.app/o/meals%2Fa.jpg?alt=media"

function row(name, extra = {}) {
  return {
    placeId: `p-${name}`, slug: `${name.toLowerCase().replace(/\W+/g, "-")}-abc123`, name,
    eats: 13, yeets: 2, ties: 0, matchups: 15, eatRate: 13 / 15, since: null,
    where: { city: "London", country: "United Kingdom" }, lat: 51.5, lng: -0.1,
    publicMeals: 3, recentCaptions: [], rank: 1, ...extra,
  }
}

function input(extra = {}) {
  return {
    locale: "en",
    meals: [{ src: STORAGE, caption: "Lamb chops", locationName: "Kendal Street Kitchen", mealType: "Dinner", username: "ridorichard", alt: "" }],
    standings: { rows: [row("Kendal Street Kitchen")], all: [row("Kendal Street Kitchen")], countries: 3 },
    venues: [
      { placeId: "p-Kendal Street Kitchen", name: "Kendal Street Kitchen", lat: 51.5, lng: -0.16 },
      { placeId: "p-none", name: "No coordinates", lat: null, lng: null },
    ],
    maitred: [{ name: "Kendal Street Kitchen", holderName: "Real Person", notes: { always: "Harissa prawns" } }, { name: "No usual", holderName: "Other", notes: { always: "" } }],
    t: { savedBy: "Saved by {handle}" },
    ...extra,
  }
}

test("the home data uses live meals, standings and venues, never Places, and thumbnails via /api/thumb", () => {
  const { buildAgrData } = lane().load("lib/agr-home-shape.ts")
  const data = buildAgrData(input())
  assert.deepEqual(data.feed, [{ d: "Lamb chops", v: "Kendal Street Kitchen", h: "@ridorichard", s: `/api/thumb?w=240&u=${encodeURIComponent(STORAGE)}`, w: "London, United Kingdom" }])
  assert.equal(data.pins.length, 1, "a venue without coordinates is not a pin")
  assert.equal(data.pins[0].s, data.feed[0].s, "a pin reuses the meal photo already loaded")
  assert.deepEqual(data.standings[0], { rank: 1, name: "Kendal Street Kitchen", city: "London", country: "United Kingdom", pct: 87, eats: 13, yeets: 2, img: data.feed[0].s })
  assert.equal(data.countries, 3)
  assert.equal(data.t.savedBy, "Saved by {handle}")
  assert.ok(data.dishes.length > 0 && data.dishes.every((d) => d.src.startsWith("/agr/plates/")))
})

test("a Maître d' is shown as 'A regular', never by name, and only with a published usual", () => {
  const { buildAgrData } = lane().load("lib/agr-home-shape.ts")
  const data = buildAgrData(input())
  assert.deepEqual(data.stickers, [{ venue: "Kendal Street Kitchen", dish: "Harissa prawns", holder: "A regular", initial: "A" }])
  assert.ok(!JSON.stringify(data).includes("Real Person"))
})

test("each board row and globe pin uses its own restaurant's newest meal photo before a feed match", () => {
  const { buildAgrData } = lane().load("lib/agr-home-shape.ts")
  const data = buildAgrData(input({ thumbs: { "p-Kendal Street Kitchen": "/api/thumb?w=240&u=x" } }))
  assert.equal(data.standings[0].img, "/api/thumb?w=240&u=x")
  assert.equal(data.pins[0].s, "/api/thumb?w=240&u=x")
})

test("empty sources give a renderable page: the strip falls back to the plates, the rest is empty", () => {
  const { buildAgrData } = lane().load("lib/agr-home-shape.ts")
  const data = buildAgrData(input({ meals: [], standings: { rows: [], all: [], countries: 0 }, venues: [], maitred: [] }))
  assert.deepEqual([data.pins, data.standings, data.stickers], [[], [], []])
  assert.ok(data.feed.length > 0)
})

test("the strip never shows a card without a venue or a dish line", () => {
  const { buildAgrData } = lane().load("lib/agr-home-shape.ts")
  const meals = [
    { src: STORAGE, caption: "Lamb chops", locationName: "Kendal Street Kitchen", mealType: "Dinner", username: "ridorichard", alt: "" },
    { src: STORAGE, caption: "Chicken and rice", locationName: "", mealType: "Lunch", username: "someone", alt: "" },
    { src: STORAGE, caption: "", locationName: "Somewhere", mealType: "Lunch", username: "someone", alt: "" },
  ]
  assert.deepEqual(buildAgrData(input({ meals })).feed.map((f) => f.d), ["Lamb chops"])
})

test("the strip's meals come from the gated dish wall, previews first, handle without @", () => {
  const { feedMealsFromWall } = lane().load("lib/agr-home-shape.ts")
  assert.deepEqual(feedMealsFromWall(null), [])
  const wall = {
    previews: [{ id: "a", src: STORAGE, dish: "Mie Mamak", venue: "Seroeni", mealType: "lunch", handle: "sika" }],
    wall: [{ id: "b", src: STORAGE, dish: "Nasi campur", venue: "Sambel!", mealType: "", handle: "" }],
  }
  assert.deepEqual(feedMealsFromWall(wall), [
    { src: STORAGE, caption: "Mie Mamak", locationName: "Seroeni", mealType: "lunch", username: "sika", alt: "" },
    { src: STORAGE, caption: "Nasi campur", locationName: "Sambel!", mealType: "", username: "", alt: "" },
  ])
})

test("the dish wall's rules keep the 27 Nov live-page cards out: pork, a juice, no venue", () => {
  const { selectDishWall } = lane().load("lib/dish-wall.ts")
  const c = (id, extra) => ({ id, uid: id, photo: STORAGE + id, dish: "", caption: "", locationName: "Warung", mealType: "lunch", handle: id, restaurant: true, ...extra })
  const { previews, wall } = selectDishWall([
    c("pork", { caption: "Babi babi hitam" }),
    c("juice", { caption: "Need some juices here 🥵", locationName: "Jus Kode Glodok" }),
    c("novenue", { caption: "Chicken and rice", locationName: "" }),
    c("ok", { dish: "Nasi campur cumi cumi", locationName: "Sambel!" }),
  ])
  assert.deepEqual([...previews, ...wall].map((m) => m.dish), ["Nasi campur cumi cumi"])
})

test("with no live wall the strip falls back to the approved plates, minus pork and the usual", () => {
  const { buildAgrData } = lane().load("lib/agr-home-shape.ts")
  const feed = buildAgrData(input({ meals: [] })).feed
  assert.ok(feed.length > 10)
  assert.ok(!feed.some((f) => /carbonara/i.test(f.d)), "carbonara is treated as pork")
  assert.ok(!feed.some((f) => f.d === "Harissa prawns" && f.v === "Kendal Street Kitchen"), "the usual is not repeated")
  assert.ok(feed.every((f) => f.v && /-256\.webp$/.test(f.s)))
})

test("the usual's own meal is not repeated in the live strip", () => {
  const { buildAgrData } = lane().load("lib/agr-home-shape.ts")
  const meals = [
    { src: STORAGE, caption: "Harissa prawns", locationName: "Kendal Street Kitchen", mealType: "", username: "ridorichard", alt: "" },
    { src: STORAGE, caption: "Nasi campur", locationName: "Sambel!", mealType: "", username: "x", alt: "" },
  ]
  assert.deepEqual(buildAgrData(input({ meals })).feed.map((f) => f.d), ["Nasi campur"])
})

test("Maître d' stickers follow the dish rules: no pork, no drinks", () => {
  const { buildAgrData } = lane().load("lib/agr-home-shape.ts")
  const maitred = [
    { name: "A", notes: { always: "Babi guling" } },
    { name: "B", notes: { always: "Es kopi susu" } },
    { name: "C", notes: { always: "Es jeruk" } },
    { name: "D", notes: { always: "Ayam betutu" } },
  ]
  assert.deepEqual(buildAgrData(input({ maitred })).stickers.map((s) => s.dish), ["Ayam betutu"])
})

// RM20616 dish pages, review L6 (Devon, 27 Nov 2026: "Same rule everywhere"): with the place page's dish answers live,
// a home Maître d' card names the app's answer, the same dish the venue's page shows, never the holder's free text.
// A card exists to show a regular's pick, so it shows only an answer that IS the Maître d's pick; otherwise no card.
test("with dish answers, a Maître d' card names the app's answer only when it is the Maître d's pick", () => {
  const { buildAgrData } = lane().load("lib/agr-home-shape.ts")
  const maitred = [
    { placeId: "p-a", name: "Pick on the list", holderName: "X", notes: { always: "Harissa prawns, the big ones" } },
    { placeId: "p-b", name: "Eat or Yeet answer", holderName: "X", notes: { always: "Free text pick" } },
    { placeId: "p-c", name: "No answer", holderName: "X", notes: { always: "Another free text" } },
    { placeId: "p-d", name: "Not computed or opted out", holderName: "X", notes: { always: "Free text" } },
    { placeId: "p-e", name: "Holder with no usual", holderName: "X", notes: { always: "" } },
  ]
  const answers = new Map([["p-a", { name: "Harissa prawns", maitred: true }], ["p-b", { name: "Sate", maitred: false }], ["p-c", null], ["p-e", { name: "Lawar", maitred: true }]])
  const data = buildAgrData(input({ maitred, dishAnswers: answers }))
  assert.deepEqual(data.stickers, [
    { venue: "Pick on the list", dish: "Harissa prawns", holder: "A regular", initial: "A" },
    { venue: "Holder with no usual", dish: "Lawar", holder: "A regular", initial: "A" },
  ])
  assert.doesNotMatch(JSON.stringify(data.stickers), /free text|Sate/i)
  // Without the answers (the switch off), the cards are main's: the holder's own pick.
  assert.deepEqual(buildAgrData(input({ maitred })).stickers.map(s => s.dish), ["Harissa prawns, the big ones", "Free text pick", "Another free text"])
})

// RM20616 dish pages L6 merged with main's dish rules (7f713f1): with the answers shown, the answer itself must pass them.
test("with dish answers, a Maître d' answer that is pork or a drink gets no card", () => {
  const { buildAgrData } = lane().load("lib/agr-home-shape.ts")
  const maitred = [
    { placeId: "p-a", name: "Pork answer", notes: { always: "Ayam betutu" } },
    { placeId: "p-b", name: "Drink answer", notes: { always: "Nasi campur" } },
    { placeId: "p-c", name: "Food answer", notes: { always: "Babi guling" } },
  ]
  const answers = new Map([["p-a", { name: "Babi guling", maitred: true }], ["p-b", { name: "Es kopi susu", maitred: true }], ["p-c", { name: "Ayam betutu", maitred: true }]])
  assert.deepEqual(buildAgrData(input({ maitred, dishAnswers: answers })).stickers.map((s) => [s.venue, s.dish]), [["Food answer", "Ayam betutu"]])
  // Off: main's rule on the holder's own picks.
  assert.deepEqual(buildAgrData(input({ maitred })).stickers.map((s) => [s.venue, s.dish]), [["Pork answer", "Ayam betutu"], ["Drink answer", "Nasi campur"]])
})
