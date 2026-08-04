const ANDROID_CERTIFICATE_FINGERPRINT = /^(?:[0-9A-F]{2}:){31}[0-9A-F]{2}$/

function androidCertificateFingerprints(): string[] {
  return (process.env.ANDROID_APP_LINK_SHA256 || "")
    .split(",")
    .map((value) => value.trim().toUpperCase())
    .filter((value) => ANDROID_CERTIFICATE_FINGERPRINT.test(value))
}

export function GET() {
  const fingerprints = androidCertificateFingerprints()
  const statements = fingerprints.length === 0
    ? []
    : [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: "com.makanofficial.makanapp",
            sha256_cert_fingerprints: fingerprints,
          },
        },
      ]

  // Android path ownership remains narrowed to /club/ by the app manifest.
  // With no valid production signing fingerprint, this route fails closed.
  return Response.json(statements, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  })
}
