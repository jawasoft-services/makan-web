import assert from "node:assert/strict"
import test from "node:test"

import { GET } from "./route.ts"

const PROD = Array.from({ length: 32 }, (_, i) => (i + 16).toString(16).toUpperCase()).join(":")
const DEV = Array.from({ length: 32 }, (_, i) => (i + 64).toString(16).toUpperCase()).join(":")

test("assetlinks stays empty until fingerprints are configured", async () => {
  delete process.env.ANDROID_APP_LINK_SHA256
  delete process.env.ANDROID_DEV_APP_LINK_SHA256
  assert.deepEqual(await GET().json(), [])
})

test("assetlinks lists each configured app with its certificate fingerprints", async () => {
  process.env.ANDROID_APP_LINK_SHA256 = `${PROD.toLowerCase()}, not-a-fingerprint`
  process.env.ANDROID_DEV_APP_LINK_SHA256 = DEV
  const body = await GET().json()
  assert.deepEqual(body, [{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: { namespace: "android_app", package_name: "com.makanofficial.makanapp", sha256_cert_fingerprints: [PROD] },
  }, {
    relation: ["delegate_permission/common.handle_all_urls"],
    target: { namespace: "android_app", package_name: "com.makanofficial.makandev", sha256_cert_fingerprints: [DEV] },
  }])
})

test("assetlinks drops values that are not SHA-256 colon-hex fingerprints", async () => {
  process.env.ANDROID_APP_LINK_SHA256 = "AA:BB, ,xyz"
  delete process.env.ANDROID_DEV_APP_LINK_SHA256
  assert.deepEqual(await GET().json(), [])
})
