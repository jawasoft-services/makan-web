import assert from "node:assert/strict"
import test from "node:test"

import { IMAGE_SLOTS, ImageSlotTimeout, imageSlotState, renderImage, withImageSlot } from "./image-slots.ts"

const tick = () => new Promise((resolve) => setTimeout(resolve, 5))

test("never more than IMAGE_SLOTS image jobs at once, and every job runs", async () => {
  let running = 0, most = 0, done = 0
  const job = () => withImageSlot(async () => {
    running++; most = Math.max(most, running)
    await tick()
    running--; done++
  })
  await Promise.all(Array.from({ length: 30 }, job))
  assert.equal(most, IMAGE_SLOTS)
  assert.equal(done, 30)
  assert.deepEqual(imageSlotState(), { active: 0, waiting: 0 })
})

test("a failing job frees its slot and its caller sees the error", async () => {
  const failures = Array.from({ length: IMAGE_SLOTS + 2 }, () => withImageSlot(async () => { await tick(); throw new Error("decode failed") }))
  for (const f of failures) await assert.rejects(f, /decode failed/)
  assert.deepEqual(imageSlotState(), { active: 0, waiting: 0 })
  assert.equal(await withImageSlot(async () => "still works"), "still works")
})

test("waiting jobs run in the order they arrived", async () => {
  const order = []
  const blockers = Array.from({ length: IMAGE_SLOTS }, () => withImageSlot(tick))
  const queued = [1, 2, 3].map((n) => withImageSlot(async () => { order.push(n) }))
  await Promise.all([...blockers, ...queued])
  assert.deepEqual(order, [1, 2, 3])
})

test("renderImage reads the whole body inside the slot and keeps status and headers", async () => {
  let readInside = false
  const res = await renderImage(() => new Response(new ReadableStream({
    start(controller) { readInside = imageSlotState().active > 0; controller.enqueue(new TextEncoder().encode("png-bytes")); controller.close() },
  }), { status: 200, headers: { "content-type": "image/png", "cache-control": "public, immutable" } }))
  assert.ok(readInside, "the body was produced while the slot was held")
  assert.equal(res.status, 200)
  assert.equal(res.headers.get("content-type"), "image/png")
  assert.equal(res.headers.get("cache-control"), "public, immutable")
  assert.equal(await res.text(), "png-bytes")
  assert.deepEqual(imageSlotState(), { active: 0, waiting: 0 })
})

test("a job that waits longer than maxWaitMs leaves the queue without running; the others still run", async () => {
  let release
  const gate = new Promise((resolve) => { release = resolve })
  const blockers = Array.from({ length: IMAGE_SLOTS }, () => withImageSlot(() => gate))
  let ran = false
  const impatient = withImageSlot(async () => { ran = true }, { maxWaitMs: 20 })
  const patient = withImageSlot(async () => "patient ran")
  await assert.rejects(impatient, ImageSlotTimeout)
  assert.equal(ran, false)
  assert.deepEqual(imageSlotState(), { active: IMAGE_SLOTS, waiting: 1 })
  release()
  await Promise.all(blockers)
  assert.equal(await patient, "patient ran")
  assert.deepEqual(imageSlotState(), { active: 0, waiting: 0 })
})

test("a job handed a slot before its wait limit runs normally", async () => {
  const blocker = Array.from({ length: IMAGE_SLOTS }, () => withImageSlot(tick))
  assert.equal(await withImageSlot(async () => "in time", { maxWaitMs: 1000 }), "in time")
  await Promise.all(blocker)
  assert.deepEqual(imageSlotState(), { active: 0, waiting: 0 })
})
