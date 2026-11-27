import assert from "node:assert/strict"
import test from "node:test"

import { lane } from "../scripts/share-v2-test-lane.mjs"

// Loaded as the bundler resolves it (dish-wall imports captions).
const { MAX_PER_ACCOUNT, PREVIEW_COUNT, WALL_COUNT, photoAllowed, selectDishWall, wallDish } = lane().load("lib/dish-wall.ts")

let n = 0
const meal = (over = {}) => ({
  id: `meal${++n}`, photo: `https://firebasestorage.googleapis.com/m${n}.webp`, dish: "", caption: "Seafood risotto",
  locationName: "Kendal Street Kitchen", mealType: "dinner", handle: `diner${n}`, uid: `uid${n}`, restaurant: true, ...over,
})

test("pork never reaches the wall, as a matched dish or a caption", () => {
  for (const dish of ["Babi guling", "Tonkotsu ramen", "Bacon and Brie", "Char siu bao", "Pork belly", "Ham and cheese toastie"]) {
    assert.equal(wallDish({ dish, caption: "" }), "", dish)
    assert.equal(wallDish({ dish: "", caption: dish }), "", dish)
  }
  assert.equal(wallDish({ dish: "Hamburger with fries", caption: "" }), "Hamburger with fries")
})

test("drinks never appear as dishes", () => {
  for (const dish of ["Flat white", "Iced matcha latte", "Negroni", "Es teh manis", "Clam chowder, fries & bourbon", "Need some juices here", "Jus alpukat", "Two coffees"]) {
    assert.equal(wallDish({ dish: "", caption: dish }), "", dish)
  }
  assert.equal(wallDish({ dish: "Ginger beef", caption: "" }), "Ginger beef")
})

test("a matched menu dish beats the caption; a generic caption alone never shows", () => {
  assert.equal(wallDish({ dish: "Harissa prawns", caption: "Lunch" }), "Harissa prawns")
  assert.equal(wallDish({ dish: "", caption: "Lunch" }), "")
  assert.equal(wallDish({ dish: "", caption: "Lamb" }), "")
})

test("only venue-tagged, non-delivery meals; dish-tagged ones come first", () => {
  const { previews, wall } = selectDishWall([
    meal({ caption: "Nasi goreng ayam" }),
    meal({ locationName: "" }),
    meal({ locationName: "McDonald's GoFood" }),
    meal({ dish: "Cannon of lamb", caption: "" }),
  ])
  const shown = [...previews, ...wall]
  assert.deepEqual(shown.map((m) => m.dish), ["Cannon of lamb", "Nasi goreng ayam"])
})

test("at most two meals per account, and one card per dish at a venue", () => {
  const same = { uid: "one" }
  const out = selectDishWall([
    meal({ ...same, caption: "Truffle wagyu donburi" }), meal({ ...same, caption: "Tom yum soup" }), meal({ ...same, caption: "Beef rendang" }),
    meal({ caption: "Truffle wagyu donburi" }),
  ])
  const shown = [...out.previews, ...out.wall]
  assert.equal(shown.filter((m) => m.dish !== "Truffle wagyu donburi").length, MAX_PER_ACCOUNT - 1)
  assert.equal(shown.filter((m) => m.dish === "Truffle wagyu donburi").length, 1)
})

test("previews need a named author and a meal type; nothing repeats in the spiral", () => {
  const many = Array.from({ length: 60 }, (_, i) => meal({ caption: `Dish number ${i}`, handle: i % 3 ? `diner${i}` : "", mealType: i % 4 ? "lunch" : "" }))
  const { previews, wall } = selectDishWall(many)
  assert.equal(previews.length, PREVIEW_COUNT)
  assert.ok(previews.every((m) => m.handle && m.mealType))
  assert.equal(wall.length, WALL_COUNT)
  const ids = [...previews, ...wall].map((m) => m.id)
  assert.equal(new Set(ids).size, ids.length)
})

test("restaurant meals come first; a meal at a place that is not a restaurant is only a fallback, and counted", () => {
  const park = meal({ caption: "Picnic sandwiches", locationName: "Hyde Park", restaurant: false })
  const many = Array.from({ length: 50 }, (_, i) => meal({ caption: `Plate number ${i}` }))
  const full = selectDishWall([park, ...many])
  assert.ok(![...full.previews, ...full.wall].some((m) => m.id === park.id), "enough restaurant meals: no fallback")
  assert.equal(full.fallback, 0)
  const thin = selectDishWall([park, ...many.slice(0, 6)])
  const shown = [...thin.previews, ...thin.wall]
  assert.equal(shown.at(-1).id, park.id, "fallback goes last")
  assert.equal(thin.fallback, 1)
})

test("a photo shown without its words (board, globe pins, owner page) is never pork or a drink", () => {
  // RM20773, Devon 27 Nov 2026.
  assert.equal(photoAllowed({ caption: "Babi guling", mealType: "Lunch" }), false)
  assert.equal(photoAllowed({ caption: "Flat white and a pastry", mealType: "Breakfast" }), false)
  assert.equal(photoAllowed({ caption: "Iced latte", mealType: "Snack" }), false)
  assert.equal(photoAllowed({ caption: "", mealType: "Drinks" }), false)
  assert.equal(photoAllowed({ caption: "Harissa prawns", mealType: "Dinner" }), true)
  assert.equal(photoAllowed({ caption: "Dinner", mealType: "Dinner" }), true, "a generic caption has nothing to judge")
  assert.equal(photoAllowed({}), true)
})
