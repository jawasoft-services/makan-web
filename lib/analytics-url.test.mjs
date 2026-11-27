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

// RM20616 A12 U3 — a public profile's address holds a person's handle and their permanent key.
test("a person's profile address never leaves the page for analytics, in either locale", () => {
  for (const prefix of ["/u", "/id/u"]) {
    const out = redactAnalyticsUrl(`https://www.makanofficial.com${prefix}/dewi-lestari-k3f9q2x7?src=share`)
    assert.ok(!out.includes("dewi") && !out.includes("k3f9q2x7"), out)
    assert.equal(new URL(out).pathname, `${prefix}/redacted`)
  }
  // Addresses that only start alike are left alone.
  assert.equal(redactAnalyticsUrl("https://www.makanofficial.com/uli-marylebone"), "https://www.makanofficial.com/uli-marylebone")
})

// RM20616 A12 U3 review, Low 8 — a meal id is public, but it resolves to a person's handle.
test("a meal's address never leaves the page for analytics, in either locale", () => {
  for (const prefix of ["/meal", "/id/meal"]) {
    const out = redactAnalyticsUrl(`https://www.makanofficial.com${prefix}/AbCdEf123456?src=share`)
    assert.ok(!out.includes("AbCdEf123456"), out)
    assert.equal(new URL(out).pathname, `${prefix}/redacted`)
  }
  assert.equal(redactAnalyticsUrl("https://www.makanofficial.com/mealtime"), "https://www.makanofficial.com/mealtime")
})

// RM20616 O1 review, L3 — the approval text's link (/d/<code>) carries its code in the path.
test("a notice-link code never leaves the page for analytics, in any locale", () => {
  for (const prefix of ["/d", "/id/d", "/en/d"]) {
    const out = redactAnalyticsUrl(`https://www.makanofficial.com${prefix}/k7m2qx9p?src=sms`)
    assert.ok(!out.includes("k7m2qx9p"), out)
    assert.equal(new URL(out).pathname, `${prefix}/redacted`)
  }
  assert.equal(redactAnalyticsUrl("https://www.makanofficial.com/dishes"), "https://www.makanofficial.com/dishes")
})
