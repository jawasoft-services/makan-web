import { NextResponse, type NextRequest } from "next/server"

/**
 * Canonical-host consolidation: permanently redirect the apex (non-www) host to
 * the canonical www host, preserving path + query. Loop-safe — never matches
 * a host that's already www. Removes the www/non-www duplicate URLs GSC flagged
 * (2026-06-19). Checks both `host` and `x-forwarded-host` (Vercel populates the
 * public hostname on the latter behind its edge).
 */
export function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? ""
  const xfh = request.headers.get("x-forwarded-host") ?? ""

  if (host === "makanofficial.com" || xfh === "makanofficial.com") {
    return NextResponse.redirect(
      new URL(
        `${request.nextUrl.pathname}${request.nextUrl.search}`,
        "https://www.makanofficial.com",
      ),
      308,
    )
  }

  const res = NextResponse.next()
  // TEMP debug — remove after confirming host detection.
  res.headers.set("x-mw-host", host || "EMPTY")
  res.headers.set("x-mw-xfh", xfh || "EMPTY")
  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
