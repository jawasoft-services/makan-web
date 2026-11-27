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
    meals: [{ src: STORAGE, caption: "Harissa prawns", locationName: "Kendal Street Kitchen", mealType: "Dinner", username: "ridorichard", alt: "" }],
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
  assert.deepEqual(data.feed, [{ d: "Harissa prawns", v: "Kendal Street Kitchen", h: "@ridorichard", s: `/api/thumb?w=240&u=${encodeURIComponent(STORAGE)}`, w: "London, United Kingdom" }])
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

test("empty sources give an empty, renderable page", () => {
  const { buildAgrData } = lane().load("lib/agr-home-shape.ts")
  const data = buildAgrData(input({ meals: [], standings: { rows: [], all: [], countries: 0 }, venues: [], maitred: [] }))
  assert.deepEqual([data.feed, data.pins, data.standings, data.stickers], [[], [], [], []])
})
