import { NextResponse, type NextRequest } from "next/server"

/**
 * Canonical-host consolidation: permanently redirect the apex (non-www) host to
 * the canonical www host, preserving path + query.
 *
 * Exact host equality (=== "makanofficial.com") is deliberate — it can never
 * match "www.makanofficial.com", so there's no redirect loop. This is the safe
 * complement to the per-page canonical tags; it removes the www/non-www
 * duplicate URLs that GSC reported as "Alternate page with proper canonical tag"
 * and "Crawled - currently not indexed" (2026-06-19). Preview deploys
 * (*.vercel.app) and www requests pass straight through.
 */
export function middleware(request: NextRequest) {
  if (request.headers.get("host") === "makanofficial.com") {
    const target = new URL(
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
      "https://www.makanofficial.com",
    )
    return NextResponse.redirect(target, 308)
  }
  return NextResponse.next()
}

export const config = {
  // Skip Next internals + static assets; redirect everything else on the apex.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
