import { NextResponse, type NextRequest } from "next/server"
import { functionUrls, noticeCode, noticeLinkPageOn, type NoticeLocale } from "@/lib/notice-link"
import { shareV2ProxyMark } from "@/lib/share-v2-mark"

/*
 * RM20616 O1 — the proxy's part of /d/{code} (see lib/notice-link.ts).
 *
 * 1. The internal address (`notice-link`) is never public, with the switch on or off: a direct request gets what any
 *    unknown page gets.
 * 2. With NOTICE_LINK_PAGE off, nothing else here applies: /d/... goes where it went before (the not-found page).
 * 3. With it on, /d/{code}, /en/d/{code} and /id/d/{code} are served by the internal page in that language. A segment
 *    that cannot be a code is passed on as "-", so the page draws "This link doesn't work" and nothing typed travels.
 * Every answer carries no-store, no-referrer and noindex. The page's own answer also carries the site's
 * Content-Security-Policy with the configured project's function host added to connect-src, and the proxy's mark.
 */

/**
 * The header that marks the proxy's own rewrite (review L7). Its value is the per-process random mark the Share v2
 * pages already use (lib/share-v2-mark.ts): a request that skipped the proxy cannot carry it, and one that arrives
 * carrying the header is answered as an unknown page.
 */
export const NOTICE_MARK_HEADER = "x-makan-notice-link"

/** Where the page is served from. Never public. */
export const NOTICE_SEGMENT = "notice-link"

/** The public addresses: /d/<segment>, /en/d/<segment> and /id/d/<segment> (a trailing slash allowed). */
const NOTICE_PATH = /^\/(?:(en|id)\/)?d\/([^/]{1,64})\/?$/
const LONG_NOTICE_PATH = /^\/(?:(en|id)\/)?d\/[^/]+\/?$/

/** What the page gets for a segment that cannot be a code (never a code: too short). */
const NOT_A_CODE = "-"

const NOTICE_HEADERS: Readonly<Record<string, string>> = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
}

function withNoticeHeaders(response: NextResponse): NextResponse {
  for (const [name, value] of Object.entries(NOTICE_HEADERS)) response.headers.set(name, value)
  return response
}

/**
 * The site's policy (next.config.ts, passed in at build as SITE_CONTENT_SECURITY_POLICY) with the one function host the
 * page calls added to connect-src (review L2). Null when the site's policy is unknown: the site's own header then stays,
 * which blocks the call (closed, not open).
 */
function noticePagePolicy(): string | null {
  const site = process.env.SITE_CONTENT_SECURITY_POLICY
  if (!site || !/connect-src [^;]*/.test(site)) return null
  const host = new URL(functionUrls().resolve).origin
  return site.replace(/connect-src [^;]*/, (directive) => `${directive} ${host}`)
}

/** True for any request to the internal address, however it is spelled: as the router reads it (decoded, any case, dot segments removed). */
export function isInternalNoticePath(pathname: string): boolean {
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return /(^|\/)notice(-|%2d)link/i.test(pathname)
  }
  const segments: string[] = []
  for (const part of decoded.replace(/\\/g, "/").toLowerCase().split("/")) {
    if (part === "" || part === ".") continue
    if (part === "..") segments.pop()
    else segments.push(part.trim())
  }
  const first = segments[0] === "id" || segments[0] === "en" ? segments[1] : segments[0]
  return first === NOTICE_SEGMENT
}

/**
 * The page's language for an address with no prefix, by the site's own rules (i18n/routing.ts): the visitor's saved
 * choice (NEXT_LOCALE), then the browser's preferred language, else English.
 */
export function noticeLocale(prefix: string | undefined, saved: string | undefined, acceptLanguage: string | null): NoticeLocale {
  if (prefix === "en" || prefix === "id") return prefix
  if (saved === "en" || saved === "id") return saved
  const wanted = (acceptLanguage ?? "")
    .split(",")
    .map((entry, index) => {
      const [tag, ...params] = entry.trim().split(";")
      const q = params.map((param) => /^\s*q=([0-9.]+)\s*$/.exec(param)?.[1]).find(Boolean)
      return { primary: tag.trim().toLowerCase().split("-")[0], q: q === undefined ? 1 : Number(q), index }
    })
    .filter((entry) => entry.q > 0 && Number.isFinite(entry.q))
    .sort((a, b) => b.q - a.q || a.index - b.index)
  for (const { primary } of wanted) {
    if (primary === "en") return "en"
    if (primary === "id" || primary === "in") return "id"
  }
  return "en"
}

/** The proxy's answer for the notice-link addresses, or null for every other address. */
export function noticeLinkResponse(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl
  if (isInternalNoticePath(pathname) || request.headers.has(NOTICE_MARK_HEADER)) {
    const url = request.nextUrl.clone()
    url.pathname = `/en/${NOTICE_SEGMENT}-unknown`
    url.search = ""
    return withNoticeHeaders(NextResponse.rewrite(url))
  }
  if (!noticeLinkPageOn()) return null
  const match = NOTICE_PATH.exec(pathname) ?? LONG_NOTICE_PATH.exec(pathname)
  if (!match) return null
  const locale = noticeLocale(match[1], request.cookies.get("NEXT_LOCALE")?.value, request.headers.get("accept-language"))
  // A fresh URL, not a clone of nextUrl: a clone keeps a trailing slash and the query.
  const url = new URL(`/${NOTICE_SEGMENT}/${locale}/${noticeCode(match[2]) ?? NOT_A_CODE}`, request.url)
  const headers = new Headers(request.headers)
  headers.set("X-NEXT-INTL-LOCALE", locale)
  // Set here and nowhere else; never logged, never in a response body.
  headers.set(NOTICE_MARK_HEADER, shareV2ProxyMark())
  const response = withNoticeHeaders(NextResponse.rewrite(url, { request: { headers } }))
  const policy = noticePagePolicy()
  if (policy) response.headers.set("Content-Security-Policy", policy)
  return response
}
