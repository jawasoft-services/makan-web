// RM20333 — Android App Links. The domain verifies Makan's /invite, /claim and /p/ links only when
// each app's signing-certificate SHA-256 is listed here. The fingerprints are not secret but belong to
// the Play App Signing key (production) and the EAS keystore (MakanDev), so they are configured, not
// guessed: ANDROID_APP_LINK_SHA256 and ANDROID_DEV_APP_LINK_SHA256 hold comma-separated
// colon-hex values. With neither set the file stays empty, as it was before this ticket.
const FINGERPRINT = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/

// The valid SHA-256 colon-hex fingerprints in a comma-separated setting; anything else is dropped.
const fingerprints = (value: string | undefined): string[] =>
  (value ?? "").split(",").map((item) => item.trim().toUpperCase()).filter((item) => FINGERPRINT.test(item))

const APPS = [
  { env: "ANDROID_APP_LINK_SHA256", packageName: "com.makanofficial.makanapp" },
  { env: "ANDROID_DEV_APP_LINK_SHA256", packageName: "com.makanofficial.makandev" },
] as const

export function GET() {
  const statements = APPS.flatMap(({ env, packageName }) => {
    const sha256 = fingerprints(process.env[env])
    return sha256.length
      ? [{
          relation: ["delegate_permission/common.handle_all_urls"],
          target: { namespace: "android_app", package_name: packageName, sha256_cert_fingerprints: sha256 },
        }]
      : []
  })
  return Response.json(statements, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  })
}
