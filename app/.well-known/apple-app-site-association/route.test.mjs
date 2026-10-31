import assert from "node:assert/strict"
import test from "node:test"

import { GET } from "./route.ts"

test("AASA claims complete table invites and complete taste-match links only", async () => {
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
      "/": `/taste/${"?".repeat(12)}/${"?".repeat(43)}`,
      comment: "Open a taste-match link in Makan",
    }, {
      "/": `/id/taste/${"?".repeat(12)}/${"?".repeat(43)}`,
      comment: "Open an Indonesian taste-match link in Makan",
    }],
  }])
})
