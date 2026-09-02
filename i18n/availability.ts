const INDONESIAN_ROUTES = new Set([
  "/",
  "/app",
  "/account-deletion",
  "/contact",
  "/data-deletion",
  "/dev-preview", // dev-only harness; page 404s in production
  "/manifesto",
  "/opengraph-image", // share cards render per locale
  "/twitter-image",
  "/partner",
  "/standings",
  "/standings/opengraph-image",
  "/partner/opengraph-image",
  "/story",
  "/support",
])

export function stripLocalePrefix(pathname: string) {
  return pathname.replace(/^\/(?:en|id)(?=\/|$)/, "") || "/"
}

// Whole families of pages, one per city and one per restaurant.
const INDONESIAN_PREFIXES = ["/standings/", "/places/"]

export function isIndonesianRoute(pathname: string) {
  const bare = stripLocalePrefix(pathname)
  return INDONESIAN_ROUTES.has(bare) || INDONESIAN_PREFIXES.some((p) => bare.startsWith(p))
}
