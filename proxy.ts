import createMiddleware from "next-intl/middleware"
import { defineRouting } from "next-intl/routing"
import { NextResponse, type NextRequest } from "next/server"
import { isIndonesianRoute, stripLocalePrefix } from "@/i18n/availability"
import { routing } from "@/i18n/routing"
import { rateLimited } from '@/lib/rate-limit'

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
  if (stripLocalePrefix(pathname).startsWith('/u/') && rateLimited(request, 'public-profile', { burst: 60, perMinute: 30 })) {
    return new NextResponse(null, { status: 429, headers: { 'Retry-After': '2', 'X-Robots-Tag': 'noindex, follow' } })
  }

  // English is served unprefixed, so /en/... is only ever an old link or an
  // old index entry. next-intl would strip the prefix with a 307, which tells
  // Google to keep the prefixed URL and keep crawling it (Search Console,
  // 2026-09-05: six "Page with redirect"). 308 consolidates it instead.
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const url = request.nextUrl.clone()
    url.pathname = stripLocalePrefix(pathname)
    return NextResponse.redirect(url, 308)
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

  const response = isIndonesianRoute(pathname)
    ? localizedMiddleware(request)
    : englishOnlyMiddleware(request)
  if (stripLocalePrefix(pathname).startsWith('/u/')) response.headers.set('X-Robots-Tag', 'noindex, follow')
  return response
}

export const config = {
  // Skip APIs, Next internals and any request with a file extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
}
