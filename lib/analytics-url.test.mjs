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

test("claim and invite secrets, query fields and fragments never leave analytics URLs", () => {
  assert.equal(redactAnalyticsUrl(`https://www.makanofficial.com/invite/${ID}?s=${KEY}#s=${KEY}`), `https://www.makanofficial.com/invite/redacted`)
  assert.equal(redactAnalyticsUrl("https://www.makanofficial.com/app?email=private#secret"), "https://www.makanofficial.com/app")
})

test("claim tokens are redacted in both languages", () => {
  for (const locale of ["", "/id"]) assert.equal(redactAnalyticsUrl(`https://www.makanofficial.com${locale}/claim/${KEY}?email=private#secret`), `https://www.makanofficial.com${locale}/claim/redacted`)
})
