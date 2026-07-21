import { NextResponse, type NextRequest } from "next/server"

/**
 * Canonical-host consolidation: permanently redirect the apex (non-www) host
 * to the canonical www host while preserving path and query.
 */
export function proxy(request: NextRequest) {
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
