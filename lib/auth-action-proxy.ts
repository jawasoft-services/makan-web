import { NextResponse, type NextRequest } from "next/server"
import {
  ACTION_COOKIE,
  ACTION_HEADERS,
  PAGE_HEADERS,
  ACTION_PATH,
  BUILT_MODES,
  INTERNAL_SEGMENT,
  actionCookieOptions,
  carriesLink,
  cleanPath,
  encodeStoredLink,
  isInternalActionPath,
  linkLocale,
  passThroughUrl,
  projectForKey,
  rawQuery,
} from "@/lib/auth-action"

/*
 * RM20616 A10 unit 10 (R1) — the proxy's part of /auth/action (see lib/auth-action.ts).
 *
 * 1. A link with an unknown or missing apiKey, or a built mode with no code: the site's not-found page.
 * 2. A link whose mode has no Makan page: 302 to Firebase's own handler on that project's authDomain,
 *    with the query byte for byte.
 * 3. A link for a built mode: the query goes into an HttpOnly session cookie scoped to the page's own path
 *    (a second link opened in the same language replaces the first; the form posts check which one a card
 *    was drawn for), and the browser is sent (303) to that path with no query, so the code is in the
 *    address only on the first load and never in a later request line, form post, history entry or analytics page view.
 * 4. The clean address: served by the page under the internal `auth-action` segment, which has its own
 *    document (no site header, no analytics, no other script).
 * Every answer carries no-store and noindex; every answer to a request carrying the link carries
 * no-referrer, and the clean page same-origin (see PAGE_HEADERS).
 */

function withActionHeaders<T extends NextResponse>(response: T, headers: Readonly<Record<string, string>> = ACTION_HEADERS): T {
  for (const [name, value] of Object.entries(headers)) response.headers.set(name, value)
  return response
}

/** What any unknown page gets: the site's own 404, with nothing from the request carried along. */
function notFound(request: NextRequest) {
  const url = request.nextUrl.clone()
  url.pathname = `/en/${INTERNAL_SEGMENT}-unknown`
  url.search = ""
  return withActionHeaders(NextResponse.rewrite(url))
}

/** The proxy's answer for the action addresses, or null for every other address. */
export function authActionResponse(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  if (isInternalActionPath(pathname)) return notFound(request)
  const match = ACTION_PATH.exec(pathname)
  if (!match) return null
  const prefix = match[1] ?? null
  const query = rawQuery(request.url)

  if (carriesLink(query)) {
    const params = new URLSearchParams(query)
    const project = projectForKey(params.get("apiKey"))
    if (!project) return notFound(request)
    if (!BUILT_MODES.has(params.get("mode") ?? "")) {
      return withActionHeaders(NextResponse.redirect(passThroughUrl(project.authDomain, query), 302))
    }
    if (!params.get("oobCode")) return notFound(request)
    const path = cleanPath(linkLocale(prefix, params.get("lang")))
    const response = NextResponse.redirect(new URL(path, request.nextUrl.origin), 303)
    response.cookies.set(ACTION_COOKIE, encodeStoredLink({ query }), actionCookieOptions(path))
    return withActionHeaders(response)
  }

  const locale = prefix === "id" ? "id" : "en"
  const url = request.nextUrl.clone()
  url.pathname = `/${INTERNAL_SEGMENT}/${locale}`
  url.search = ""
  const headers = new Headers(request.headers)
  headers.set("X-NEXT-INTL-LOCALE", locale)
  return withActionHeaders(NextResponse.rewrite(url, { request: { headers } }), PAGE_HEADERS)
}
