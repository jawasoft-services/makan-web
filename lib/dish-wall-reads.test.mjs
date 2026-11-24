import assert from "node:assert/strict"
import test from "node:test"

import { lane, fence, meal, user } from "../scripts/share-v2-test-lane.mjs"

// The homepage reads (lib/dish-wall-data.ts) against the fake Firestore: whose meals may appear.
function seeded() {
  const modules = lane()
  modules.useCache()
  const { seed } = modules
  // Ten diners in good standing, two meals each, each dish named.
  for (let d = 0; d < 10; d++) {
    seed.set(`users/good${d}`, user({ name: `Diner ${d}`, username: `good_${d}` }))
    seed.set(`users/good${d}/private/age`, { birthYear: 1990 })
    for (let m = 0; m < 2; m++) seed.set(`meals/good${d}-${m}`, meal({ userID: `good${d}`, caption: `Grilled dish ${d}-${m}`, mealType: "lunch", timestamp: 500 + d * 2 + m }))
  }
  // Accounts that must never appear, and a meal that is not public.
  seed.set("users/minor", user({ username: "minor_handle" })); seed.set("users/minor/private/age", { birthYear: 2016, underMinimum: true })
  seed.set("users/fenced", user({ username: "fenced_handle" })); seed.set("users/fenced/private/age", { birthYear: 1990 }); seed.set(fence("fenced"), { at: 1 })
  seed.set("users/held", user({ username: "held_handle", accountStatus: "suspended" })); seed.set("users/held/private/age", { birthYear: 1990 })
  for (const uid of ["minor", "fenced", "held"]) seed.set(`meals/${uid}-meal`, meal({ userID: uid, caption: `Secret dish of ${uid}`, mealType: "dinner", timestamp: 900 }))
  seed.set("meals/private-meal", meal({ userID: "good0", caption: "Private dish here", isPublic: false, timestamp: 901 }))
  return modules
}

test("the dish wall never shows a minor, a fenced or a suspended account, or a private meal", async () => {
  const modules = seeded()
  const { getDishWall } = modules.load("lib/dish-wall-data.ts")
  const wall = await getDishWall()
  assert.ok(wall, "the wall reads")
  const shown = [...wall.previews, ...wall.wall]
  const ids = shown.map((m) => m.id)
  for (const bad of ["minor-meal", "fenced-meal", "held-meal", "private-meal"]) assert.ok(!ids.includes(bad), bad)
  assert.ok(shown.every((m) => !/secret|private/i.test(m.dish)))
  assert.ok(wall.previews.length >= 3 && wall.previews.every((m) => m.handle && m.mealType))
  // The bound dishMemberships name beats the caption and leads the spiral (it has no meal type,
  // so it cannot be a preview).
  assert.equal(wall.wall[0].dish, "Nasi campur ayam betutu")
})

// getRecentPublicMeals (the legacy home's strip) filters on this same check before naming anyone.
test("the shared author check refuses minors, fenced and suspended accounts", async () => {
  const modules = seeded()
  const { loadAuthors } = modules.load("lib/dish-wall-data.ts")
  const authors = await loadAuthors(modules.db, ["good0", "minor", "fenced", "held", "missing"])
  assert.deepEqual(Object.fromEntries([...authors].map(([uid, a]) => [uid, a.mayAppear])), { good0: true, minor: false, fenced: false, held: false, missing: false })
  assert.equal(authors.get("good0").handle, "good_0")
})

test("a failed or thin read falls back, is not cached, and is retried after ten minutes", async () => {
  const modules = lane()
  modules.useCache()
  const { getDishWall } = modules.load("lib/dish-wall-data.ts")
  assert.equal(await getDishWall(), null, "too few meals: bundled set")
  for (let d = 0; d < 10; d++) {
    modules.seed.set(`users/late${d}`, user({ username: `late_${d}` })); modules.seed.set(`users/late${d}/private/age`, { birthYear: 1990 })
    for (let m = 0; m < 2; m++) modules.seed.set(`meals/late${d}-${m}`, meal({ userID: `late${d}`, caption: `Late dish ${d}-${m}`, mealType: "dinner", timestamp: 700 + d * 2 + m }))
  }
  assert.equal(await getDishWall(), null, "within ten minutes: no rescan on every visit")
  modules.state.clock += 11 * 60 * 1000
  assert.ok(await getDishWall(), "after ten minutes the next visit retries and reads the wall")
})
