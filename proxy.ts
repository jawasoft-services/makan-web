import createMiddleware from "next-intl/middleware"
import { defineRouting } from "next-intl/routing"
import { NextResponse, type NextRequest } from "next/server"
import { isIndonesianRoute, stripLocalePrefix } from "@/i18n/availability"
import { routing } from "@/i18n/routing"
import { authActionResponse } from "@/lib/auth-action-proxy"
import { rateLimited } from "@/lib/rate-limit"
import { shareV2PagesOn } from "@/lib/share-v2"
import { SHARE_V2_PROXY_HEADER, shareV2ProxyMark } from "@/lib/share-v2-mark"
import { isShareV2InternalPath, shareV2Target, type ShareV2Target } from "@/lib/share-v2-routes"

const localizedMiddleware = createMiddleware(routing)
const englishOnlyMiddleware = createMiddleware(
  defineRouting({
    locales: ["en"],
    defaultLocale: "en",
    localePrefix: "never",
    localeDetection: false,
  }),
)

/**
 * RM20616 A12 U3 — serves a Share v2 page at its public address. Only reached with SHARE_V2_PAGES on.
 * The page lives under the internal `share-v2` segment, so the visitor's address does not change.
 * A person's page is never indexed, and one address cannot load profiles in a loop (RM20603).
 */
function shareV2Response(request: NextRequest, target: ShareV2Target) {
  const profile = target.kind === "profile"
  if (profile && rateLimited(request, "public-profile", { burst: 60, perMinute: 30 })) {
    return new NextResponse(null, { status: 429, headers: { "Retry-After": "2", "X-Robots-Tag": "noindex, follow" } })
  }
  const url = request.nextUrl.clone()
  url.pathname = target.path
  const headers = new Headers(request.headers)
  headers.set("X-NEXT-INTL-LOCALE", target.locale)
  // The mark a v2 page requires (lib/share-v2-mark.ts). Set here and nowhere else; never logged, never in a response.
  headers.set(SHARE_V2_PROXY_HEADER, shareV2ProxyMark())
  const response = NextResponse.rewrite(url, { request: { headers } })
  if (profile) response.headers.set("X-Robots-Tag", "noindex, follow")
  return response
}

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

  const { pathname } = request.nextUrl

  // RM20616 A12 U3 — the internal share-v2 addresses are never public, with the switch on or off. A
  // direct request gets what any unknown page gets (the site's 404), so the rate limit, the
  // `X-Robots-Tag` and the public address can never be skipped. So does any request that arrives
  // already carrying the proxy's mark header: the proxy's own rewrite does not come back through
  // here, so a mark on an incoming request was put there by the visitor.
  if (request.headers.has(SHARE_V2_PROXY_HEADER) || isShareV2InternalPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/en/share-v2-unknown"
    url.search = ""
    const response = NextResponse.rewrite(url)
    response.headers.set("X-Robots-Tag", "noindex, nofollow")
    return response
  }

  // RM20616 A10 unit 10 — the account-email action page (/auth/action, /id/auth/action). Answered
  // before the locale rules, which would otherwise send /id/auth/action to English.
  const authAction = authActionResponse(request)
  if (authAction) return authAction

  // English is served unprefixed, so /en/... is only ever an old link or an
  // old index entry. next-intl would strip the prefix with a 307, which tells
  // Google to keep the prefixed URL and keep crawling it (Search Console,
  // 2026-09-05: six "Page with redirect"). 308 consolidates it instead.
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone()
    url.pathname = stripLocalePrefix(pathname)
    return NextResponse.redirect(url, 308)
  }

  // RM20616 A12 U3 — off unless SHARE_V2_PAGES=1: with it off this block does nothing and every
  // address below is handled exactly as before.
  if (shareV2PagesOn()) {
    const target = shareV2Target(pathname)
    if (target) return shareV2Response(request, target)
  }

  // Editorial, legal, restaurant and meal pages have not been translated yet.
  // A manually entered /id URL falls back to the canonical English route
  // instead of presenting English content under an Indonesian URL.
  if (pathname.startsWith("/id/") && !isIndonesianRoute(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = stripLocalePrefix(pathname)
    const response = NextResponse.redirect(url, 307)
    response.cookies.set("NEXT_LOCALE", "en", {
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    })
    return response
  }

  return isIndonesianRoute(pathname)
    ? localizedMiddleware(request)
    : englishOnlyMiddleware(request)
}

export const config = {
  // Skip APIs, Next internals and any request with a file extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
