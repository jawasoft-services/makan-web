import assert from "node:assert/strict"
import test from "node:test"

import { redactAnalyticsUrl } from "./analytics-url.ts"

const ID = "AbCdEfGhIjKl"
const KEY = "k".repeat(43)

test("a taste-match key never leaves the page, in either locale", () => {
  for (const prefix of ["/taste", "/id/taste"]) {
    const out = redactAnalyticsUrl(`https://www.makanofficial.com${prefix}/${ID}/${KEY}?utm=1`)
    assert.ok(!out.includes(KEY) && !out.includes(ID), out)
    assert.equal(new URL(out).pathname, `${prefix}/redacted/redacted`)
  }
})

test("table invites still lose the key and fragment; other pages are untouched", () => {
  assert.equal(redactAnalyticsUrl(`https://www.makanofficial.com/invite/${ID}?s=${KEY}#s=${KEY}`), `https://www.makanofficial.com/invite/${ID}`)
  assert.equal(redactAnalyticsUrl("https://www.makanofficial.com/app?x=1"), "https://www.makanofficial.com/app?x=1")
})
