import assert from "node:assert/strict"
import test from "node:test"

import { GET } from "./route.ts"

test("AASA claims only complete fragment-bearing table invites", async () => {
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
    }],
  }])
})
