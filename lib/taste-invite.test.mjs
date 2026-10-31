import assert from "node:assert/strict"
import test from "node:test"

import { loadTasteInvitePreview } from "./taste-invite.ts"

const PUBLIC_ID = "AbCdEfGhIjKl"
const SECRET = "s".repeat(43)
const NOW = Date.parse("2026-11-01T12:00:00.000Z")
const future = { toMillis: () => NOW + 86400000 }

class Snap { constructor(value) { this.value = value } data() { return this.value } }
const fakeDb = (seed) => {
  const reads = []
  return {
    reads,
    doc: (path) => ({ path, get: async () => { reads.push(path); return new Snap(seed[path]) } }),
    getAll: async (...refs) => Promise.all(refs.map((ref) => ref.get())),
  }
}
const meal = (extra = {}) => ({ userID: "host", isPublic: true, caption: "Nasi goreng", locationName: "Warung Bu Sri", imageURL: "https://img.example.com/a.jpg", ...extra })
const seed = (extra = {}) => ({
  "config/tasteMatchInvite": { enabled: true },
  [`tasteInvites/${PUBLIC_ID}`]: { hostUid: "host", secret: SECRET, status: "active", expiresAt: future },
  "users/host": { name: "Host", username: "host", accountStatus: "active", photoURL: "https://example.com/h.jpg", email: "h@example.com" },
  "users/host/publicTasteGraph/top3": { entries: [{ mealId: "m1" }, { mealId: "m2" }, { mealId: "m3" }] },
  "meals/m1": meal(),
  "meals/m2": meal({ isPublic: false, caption: "FRIENDS ONLY" }),
  "meals/m3": meal({ caption: "Es campur" }),
  ...extra,
})
const run = (values, id = PUBLIC_ID, secret = SECRET) => loadTasteInvitePreview(fakeDb(values), id, secret, NOW)

test("shows public meals only and never a friends-only caption", async () => {
  const result = await run(seed())
  assert.equal(result.state, "active")
  assert.deepEqual(result.meals.map((m) => m.mealId), ["m1", "m3"])
  assert.ok(!JSON.stringify(result).includes("FRIENDS ONLY"))
})

test("drops draft, private, removed, local and someone else's meals", async () => {
  for (const override of [{ isPublicDraft: true }, { isPublic: null }, { moderationStatus: "removed" }, { storageScope: "local_private" }, { userID: "other" }]) {
    const result = await run(seed({ "meals/m1": meal(override) }))
    assert.deepEqual(result.meals.map((m) => m.mealId), ["m3"])
  }
})

test("exposes no personal data beyond name and photo", async () => {
  const result = await run(seed())
  assert.deepEqual(Object.keys(result).sort(), ["hostAvatarUrl", "hostDisplayName", "meals", "state"])
  assert.ok(!JSON.stringify(result).includes("h@example.com"))
})

test("a wrong secret, unknown id or malformed input reveals nothing", async () => {
  for (const result of [await run(seed(), PUBLIC_ID, "x".repeat(43)), await run(seed(), "ZzZzZzZzZzZz"), await run(seed(), "short", SECRET)]) {
    assert.deepEqual(result, { state: "invalid", hostDisplayName: "", hostAvatarUrl: "", meals: [] })
  }
})

test("is off until the config flag is on; expired, revoked and suspended links show no host", async () => {
  assert.equal((await run(seed({ "config/tasteMatchInvite": {} }))).state, "unavailable")
  const base = `tasteInvites/${PUBLIC_ID}`
  assert.equal((await run(seed({ [base]: { hostUid: "host", secret: SECRET, status: "active", expiresAt: { toMillis: () => NOW - 1 } } }))).state, "expired")
  assert.equal((await run(seed({ [base]: { hostUid: "host", secret: SECRET, status: "revoked", expiresAt: future } }))).state, "revoked")
  const suspended = await run(seed({ "users/host": { name: "Host", username: "host", accountStatus: "suspended" } }))
  assert.deepEqual(suspended, { state: "invalid", hostDisplayName: "", hostAvatarUrl: "", meals: [] })
})

test("reads stay bounded: config, invite, host, top3 and at most three meals", async () => {
  const db = fakeDb(seed())
  await loadTasteInvitePreview(db, PUBLIC_ID, SECRET, NOW)
  assert.equal(db.reads.length, 7)
})

test("a non-https avatar or meal photo is dropped", async () => {
  const result = await run(seed({ "users/host": { name: "Host", username: "host", photoURL: "javascript:alert(1)" }, "meals/m1": meal({ imageURL: "http://x/y" }) }))
  assert.equal(result.hostAvatarUrl, "")
  assert.equal(result.meals[0].imageURL, "")
})
