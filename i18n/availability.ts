const INDONESIAN_ROUTES = new Set([
  "/",
  "/app",
  "/account-deletion",
  "/contact",
  "/data-deletion",
  "/dev-preview", // dev-only harness; page 404s in production
  "/manifesto",
  "/partner",
  "/story",
  "/support",
])

export function stripLocalePrefix(pathname: string) {
  return pathname.replace(/^\/(?:en|id)(?=\/|$)/, "") || "/"
}

export function isIndonesianRoute(pathname: string) {
  return INDONESIAN_ROUTES.has(stripLocalePrefix(pathname))
}
