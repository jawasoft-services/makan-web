const fingerprints = (process.env.ANDROID_APP_LINK_SHA256 || "")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean)

export function GET() {
  const body = fingerprints.length > 0
    ? [{
        relation: ["delegate_permission/common.handle_all_urls"],
        target: {
          namespace: "android_app",
          package_name: "com.makanofficial.makanapp",
          sha256_cert_fingerprints: fingerprints,
        },
      }]
    : []

  return Response.json(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  })
}
