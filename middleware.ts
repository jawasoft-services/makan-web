import { NextResponse, type NextRequest } from "next/server"

/**
 * Canonical-host consolidation: permanently redirect the apex (non-www) host to
 * the canonical www host, preserving path + query.
 *
 * Behind Vercel's edge the public hostname arrives on `x-forwarded-host` (the
 * `host` header is the internal one), so we check both. Matching the exact apex
 * string is loop-safe — it can never match `www.makanofficial.com`. Removes the
 * www/non-www duplicate URLs GSC reported (2026-06-19); www requests and preview
 * deploys (*.vercel.app) pass straight through.
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? ""
  const forwardedHost = request.headers.get("x-forwarded-host") ?? ""

  if (host === "makanofficial.com" || forwardedHost === "makanofficial.com") {
    return NextResponse.redirect(
      new URL(
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
        "https://www.makanofficial.com",
      ),
      308,
    )
  }

  return NextResponse.next()
}

export const config = {
  // Skip Next internals + static assets; redirect everything else on the apex.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
