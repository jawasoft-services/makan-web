const INDONESIAN_ROUTES = new Set([
  "/",
  "/app",
  "/contact",
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
