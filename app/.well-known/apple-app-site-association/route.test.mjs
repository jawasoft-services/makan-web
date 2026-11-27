import assert from "node:assert/strict"
import test from "node:test"

import { GET } from "./route.ts"

// The file served before RM20616 U4, byte for byte (also what www.makanofficial.com served on 27 Nov 2026).
const BEFORE_U4 = "{\"applinks\":{\"apps\":[],\"details\":[{\"appIDs\":[\"T3Z49Z9YUB.com.makanofficial.makanapp\"],\"components\":[{\"/\":\"/invite/????????????\",\"#\":\"s=???????????????????????????????????????????\",\"comment\":\"Open a complete table invite in Makan\"},{\"/\":\"/claim/*\",\"comment\":\"Open a venue claim link in Makan\"},{\"/\":\"/id/claim/*\",\"comment\":\"Open an Indonesian venue claim link in Makan\"},{\"/\":\"/p/*\",\"comment\":\"Open a restaurant or dish link in Makan\"},{\"/\":\"/id/p/*\",\"comment\":\"Open an Indonesian restaurant or dish link in Makan\"},{\"/\":\"/verified\",\"comment\":\"Return to Makan after verifying an email address\"}]},{\"appIDs\":[\"T3Z49Z9YUB.com.makanofficial.makandev\"],\"components\":[{\"/\":\"/claim/*\",\"comment\":\"Open a venue claim link in Makan\"},{\"/\":\"/id/claim/*\",\"comment\":\"Open an Indonesian venue claim link in Makan\"},{\"/\":\"/p/*\",\"comment\":\"Open a restaurant or dish link in Makan\"},{\"/\":\"/id/p/*\",\"comment\":\"Open an Indonesian restaurant or dish link in Makan\"},{\"/\":\"/verified\",\"comment\":\"Return to Makan after verifying an email address\"}]}]}}"

// Runs `body` with APP_CLIP_DEV_LINKS set to `value` (undefined: unset), then restores it.
async function withLinksSwitch(value, body) {
  const before = process.env.APP_CLIP_DEV_LINKS
  try {
    if (value === undefined) delete process.env.APP_CLIP_DEV_LINKS
    else process.env.APP_CLIP_DEV_LINKS = value
    return await body()
  } finally {
    if (before === undefined) delete process.env.APP_CLIP_DEV_LINKS
    else process.env.APP_CLIP_DEV_LINKS = before
  }
}

test("AASA claims complete fragment-bearing table invites, venue claim links, restaurant/dish links and the email-verified return", () => withLinksSwitch(undefined, async () => {
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
    ],
  }])
}))

test("with APP_CLIP_DEV_LINKS off the file is byte for byte what it was before the App Clip unit", async () => {
  for (const value of [undefined, "", "0", "true", "TRUE", "on", "yes", " 1", "1 ", "01", "false"]) {
    await withLinksSwitch(value, async () => {
      const response = GET()
      assert.equal(await response.text(), BEFORE_U4, JSON.stringify(value))
      assert.equal(response.headers.get("content-type"), "application/json")
      assert.equal(response.headers.get("cache-control"), "public, max-age=300, s-maxage=3600")
    })
  }
})

test("with APP_CLIP_DEV_LINKS=1 the file adds the MakanDev App Clip and MakanDev's restaurant page links, nothing for the production app", () => withLinksSwitch("1", async () => {
  const response = GET()
  const body = await response.json()
  const before = JSON.parse(BEFORE_U4)

  assert.equal(response.status, 200)
  assert.equal(response.headers.get("content-type"), "application/json")
  assert.deepEqual(Object.keys(body), ["applinks", "appclips"])
  assert.deepEqual(body.appclips, { apps: ["T3Z49Z9YUB.com.makanofficial.makandev.Clip"] })
  assert.deepEqual(body.applinks.apps, [])
  // The production app's entry is untouched: its /places/ links and clip are the release step (A12).
  assert.deepEqual(body.applinks.details[0], before.applinks.details[0])
  assert.equal(body.applinks.details.length, 2)
  assert.deepEqual(body.applinks.details[1], {
    appIDs: ["T3Z49Z9YUB.com.makanofficial.makandev"],
    components: [
      ...before.applinks.details[1].components,
      { "/": "/places/*", comment: "Open a restaurant page link in MakanDev" },
      { "/": "/id/places/*", comment: "Open an Indonesian restaurant page link in MakanDev" },
    ],
  })
  assert.ok(!JSON.stringify(body).includes("makanapp.Clip"))
}))
