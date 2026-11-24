import assert from "node:assert/strict"
import test from "node:test"

import { GET } from "./route.ts"

test("AASA claims complete fragment-bearing table invites, venue claim links, restaurant/dish links and the email-verified return", async () => {
  const response = GET()
  const { applinks } = await response.json()

  assert.equal(response.status, 200)
  assert.match(response.headers.get("content-type"), /^application\/json/)
  assert.deepEqual(applinks.apps, [])
  assert.deepEqual(applinks.details, [{
    appIDs: ["T3Z49Z9YUB.com.makanofficial.makanapp"],
    components: [{
      "/": `/invite/${"?".repeat(12)}`,
      "#": `s=${"?".repeat(43)}`,
      comment: "Open a complete table invite in Makan",
    }, {
      "/": "/claim/*",
      comment: "Open a venue claim link in Makan",
    }, {
      "/": "/id/claim/*",
      comment: "Open an Indonesian venue claim link in Makan",
    }, {
      "/": "/p/*",
      comment: "Open a restaurant or dish link in Makan",
    }, {
      "/": "/id/p/*",
      comment: "Open an Indonesian restaurant or dish link in Makan",
    }, {
      "/": "/verified",
      comment: "Return to Makan after verifying an email address",
    }],
  }, {
    appIDs: ["T3Z49Z9YUB.com.makanofficial.makandev"],
    components: [
      { "/": "/claim/*", comment: "Open a venue claim link in Makan" },
      { "/": "/id/claim/*", comment: "Open an Indonesian venue claim link in Makan" },
      { "/": "/p/*", comment: "Open a restaurant or dish link in Makan" },
      { "/": "/id/p/*", comment: "Open an Indonesian restaurant or dish link in Makan" },
      { "/": "/verified", comment: "Return to Makan after verifying an email address" },
      { "/": "/places/*", comment: "Open a shared restaurant page in Makan" },
      { "/": "/id/places/*", comment: "Open an Indonesian shared restaurant page in Makan" },
      { "/": "/u/*", comment: "Open a shared profile in Makan" },
      { "/": "/id/u/*", comment: "Open an Indonesian shared profile in Makan" },
      { "/": "/meal/*", comment: "Open a shared meal in Makan" },
      { "/": "/id/meal/*", comment: "Open an Indonesian shared meal in Makan" },
    ],
  }])
})

// RM20616 A12 U3 — the Share v2 link paths open MakanDev only. The App Store app's entry is pinned
// byte for byte to what makan-web main served at 365a96e, so this unit cannot change which links
// open the live app.
const PRODUCTION_ENTRY_AT_365A96E = '{"appIDs":["T3Z49Z9YUB.com.makanofficial.makanapp"],"components":[{"/":"/invite/????????????","#":"s=???????????????????????????????????????????","comment":"Open a complete table invite in Makan"},{"/":"/claim/*","comment":"Open a venue claim link in Makan"},{"/":"/id/claim/*","comment":"Open an Indonesian venue claim link in Makan"},{"/":"/p/*","comment":"Open a restaurant or dish link in Makan"},{"/":"/id/p/*","comment":"Open an Indonesian restaurant or dish link in Makan"},{"/":"/verified","comment":"Return to Makan after verifying an email address"}]}'
const SHARE_PATHS = ["/places/*", "/id/places/*", "/u/*", "/id/u/*", "/meal/*", "/id/meal/*"]

test("the App Store app's AASA entry is byte-identical to main; only MakanDev gains the share paths", async () => {
  const { applinks } = await GET().json()
  const [production, dev, ...rest] = applinks.details
  assert.deepEqual(rest, [])
  assert.equal(JSON.stringify(production), PRODUCTION_ENTRY_AT_365A96E)
  assert.deepEqual(dev.appIDs, ["T3Z49Z9YUB.com.makanofficial.makandev"])
  const paths = (entry) => entry.components.map((component) => component["/"])
  for (const path of SHARE_PATHS) {
    assert.ok(paths(dev).includes(path), `MakanDev opens ${path}`)
    assert.ok(!paths(production).includes(path), `the App Store app does not open ${path}`)
  }
  // Taste links open neither app (RM20320 review: a build without the screen would open a dead end).
  for (const entry of [production, dev]) assert.ok(!paths(entry).some((path) => path.includes("taste")))
  // The switch does not reach this file: the entry is the same with it on, off or absent.
  const before = process.env.SHARE_V2_PAGES
  try {
    for (const value of [undefined, "1", "0"]) {
      if (value === undefined) delete process.env.SHARE_V2_PAGES
      else process.env.SHARE_V2_PAGES = value
      assert.equal(JSON.stringify((await GET().json()).applinks.details[0]), PRODUCTION_ENTRY_AT_365A96E)
    }
  } finally {
    if (before === undefined) delete process.env.SHARE_V2_PAGES
    else process.env.SHARE_V2_PAGES = before
  }
})
