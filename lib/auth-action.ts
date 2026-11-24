/*
 * RM20616 A10 unit 10 (R1) — the link in Makan's account emails (password reset, email verification and
 * email change) opens makanofficial.com/auth/action instead of Firebase's grey page.
 *
 * Firebase builds the link: `?mode=…&oobCode=…&apiKey=…&lang=…[&continueUrl=…]`. This file holds the
 * rules every part of the route shares, with no network and no Next imports, so the proxy, the page and
 * the tests read the same answers:
 *
 * - Only the two Makan web API keys are served. Each comes from an environment variable and is mapped to
 *   its own project's authDomain. Any other key gets the site's not-found page, so the route can never be
 *   used to send a visitor to a host of someone else's choosing.
 * - The modes with a Makan page are listed in BUILT_MODES. Any other mode goes on to Firebase's own page
 *   on that project's authDomain, with the query exactly as it arrived.
 * - The link's code is moved out of the address on the first load: the proxy keeps the query in a
 *   short-lived HttpOnly cookie scoped to the page's own path and sends the browser to the address with no
 *   query. Nothing here logs; callers must not log the query, the cookie or the code either.
 */

export type ActionLocale = "en" | "id"
export type BuiltMode = "resetPassword" | "verifyEmail" | "verifyAndChangeEmail" | "recoverEmail"

export const BUILT_MODES: ReadonlySet<string> = new Set<BuiltMode>([
  "resetPassword",
  "verifyEmail",
  "verifyAndChangeEmail",
  "recoverEmail",
])

/** The public addresses: /auth/action, /en/auth/action and /id/auth/action (a trailing slash allowed). */
export const ACTION_PATH = /^\/(?:(en|id)\/)?auth\/action\/?$/

/** Where the proxy serves the pages from. Never public: a direct request gets the not-found page. */
export const INTERNAL_SEGMENT = "auth-action"

/** The cookie that carries the link's query from the first load to the page and its form posts. */
export const ACTION_COOKIE = "makan_auth_action"

/**
 * A day. Firebase's codes work for an hour, so a longer cookie keeps no code alive; it keeps the link's
 * apiKey for "Send a new link" on a page left open past the hour.
 */
export const ACTION_COOKIE_MAX_AGE = 60 * 60 * 24

const MAX_QUERY_LENGTH = 4096

export interface ActionProject {
  /** Which of the two projects the key belongs to. Never shown and never logged. */
  name: "dev" | "prod"
  apiKey: string
  authDomain: string
}

type Env = Record<string, string | undefined>

/*
 * The allowlist. The key values are deploy configuration, never in the repository:
 *   AUTH_ACTION_KEY_DEV   the makan-devel web API key
 *   AUTH_ACTION_KEY_PROD  the munchies-expo (production) web API key
 * Each project's authDomain defaults to its firebaseapp.com host and can be set with
 * AUTH_ACTION_DOMAIN_DEV / AUTH_ACTION_DOMAIN_PROD.
 */
const PROJECTS = [
  { name: "dev", key: "AUTH_ACTION_KEY_DEV", domain: "AUTH_ACTION_DOMAIN_DEV", fallback: "makan-devel.firebaseapp.com" },
  { name: "prod", key: "AUTH_ACTION_KEY_PROD", domain: "AUTH_ACTION_DOMAIN_PROD", fallback: "munchies-expo.firebaseapp.com" },
] as const

const HOST = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i

export function actionProjects(env: Env = process.env): ActionProject[] {
  const projects: ActionProject[] = []
  for (const project of PROJECTS) {
    const apiKey = env[project.key]?.trim()
    const authDomain = env[project.domain]?.trim() || project.fallback
    if (!apiKey || !HOST.test(authDomain)) continue
    projects.push({ name: project.name, apiKey, authDomain })
  }
  return projects
}

/** The project a link's apiKey belongs to, or null for a missing or unknown key. */
export function projectForKey(apiKey: string | null | undefined, env: Env = process.env): ActionProject | null {
  if (!apiKey) return null
  return actionProjects(env).find((project) => project.apiKey === apiKey) ?? null
}

/** The query exactly as it arrived: everything after the first `?`, without a fragment. */
export function rawQuery(url: string): string {
  const start = url.indexOf("?")
  if (start === -1) return ""
  const end = url.indexOf("#", start)
  return end === -1 ? url.slice(start + 1) : url.slice(start + 1, end)
}

/** True when the request carries a Firebase action link rather than the page's own clean address. */
export function carriesLink(query: string): boolean {
  const params = new URLSearchParams(query)
  return params.has("mode") || params.has("oobCode") || params.has("apiKey")
}

/** Firebase's own handler for the same link, with the query byte for byte. */
export function passThroughUrl(authDomain: string, query: string): string {
  return `https://${authDomain}/__/auth/action?${query}`
}

/** The page's language: the address's prefix first, then the link's `lang`, else English. */
export function linkLocale(prefix: string | null | undefined, lang: string | null | undefined): ActionLocale {
  if (prefix === "id" || prefix === "en") return prefix
  return /^id(?:[-_]|$)/i.test(lang ?? "") ? "id" : "en"
}

/** The page's own address in that language (English is served without a prefix, as everywhere on the site). */
export function cleanPath(locale: ActionLocale): string {
  return locale === "id" ? "/id/auth/action" : "/auth/action"
}

/** True for any request to the internal address, however it is spelled. */
export function isInternalActionPath(pathname: string): boolean {
  let decoded = pathname
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    // A malformed escape is still checked as it was sent.
  }
  return /(^|\/)auth-action(\/|$)/i.test(decoded.replace(/\/+/g, "/"))
}

export interface StoredLink {
  /** The link's query as it arrived. */
  query: string
}

export function encodeStoredLink(link: StoredLink): string {
  return Buffer.from(JSON.stringify({ q: link.query }), "utf8").toString("base64url")
}

export function decodeStoredLink(value: string | null | undefined): StoredLink | null {
  if (!value || value.length > MAX_QUERY_LENGTH * 2) return null
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"))
    if (!parsed || typeof parsed !== "object") return null
    const { q } = parsed as { q?: unknown }
    if (typeof q !== "string" || q.length > MAX_QUERY_LENGTH) return null
    return { query: q }
  } catch {
    return null
  }
}

export interface ActionLink {
  mode: BuiltMode
  oobCode: string
  project: ActionProject
  /** The query as it arrived, for the hand-on to Firebase's own page. */
  query: string
}

/** The stored link, if it is complete, for a built mode, and carries a known key. */
export function readStoredLink(link: StoredLink | null, env: Env = process.env): ActionLink | null {
  if (!link) return null
  const params = new URLSearchParams(link.query)
  const mode = params.get("mode") ?? ""
  const oobCode = params.get("oobCode") ?? ""
  const project = projectForKey(params.get("apiKey"), env)
  if (!project || !BUILT_MODES.has(mode) || !oobCode || oobCode.length > 1024) return null
  return { mode: mode as BuiltMode, oobCode, project, query: link.query }
}

/** The response headers of every answer to a request that carries the link (redirects and not-found). */
export const ACTION_HEADERS: Readonly<Record<string, string>> = {
  "Cache-Control": "no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "X-Robots-Tag": "noindex, nofollow",
}

/*
 * The page itself, at the clean address with no code in it: `same-origin` sends no referrer to any other
 * site, exactly as no-referrer does, and lets the page's own form posts carry their Origin. Under
 * `no-referrer` a browser sends `Origin: null` on a plain form post, Next refuses it as a cross-site Server
 * Action, and the page would not work with JavaScript off.
 */
export const PAGE_HEADERS: Readonly<Record<string, string>> = { ...ACTION_HEADERS, "Referrer-Policy": "same-origin" }

/** The shape the app's own sign-in form accepts (a typo with no @ is refused before anything is sent). */
export function plausibleEmail(value: string): boolean {
  return value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export const MIN_PASSWORD_LENGTH = 6

/** Which card the page shows. Each one is a board (RM20616 A10 reset_boards, approved 24 Nov 2026). */
export type ActionView =
  /** si-fp-5; `network` adds the si-fp-8 line, `weak` turns the password rule red. */
  | { view: "choose"; email: string | null; error?: "network" | "weak"; keep?: string }
  /** si-fp-6 (si-fp-13 on a computer). */
  | { view: "changed" }
  /** si-fp-expired / si-fp-9. */
  | { view: "expired" }
  /** si-fp-10 / si-fp-12; `email` adds the invalid-address line, `network` the si-fp-8 line. */
  | { view: "forgot"; error?: "network" | "email"; keep?: string }
  /** si-fp-11. */
  | { view: "sent" }
  /** si-fp-7: the account was disabled or deleted. */
  | { view: "broken" }
  /** si-v-12, si-v-13. */
  | { view: "verified" }
  | { view: "verifyExpired" }
  /** web-email-done, web-email-undone, web-email-expired. */
  | { view: "emailChanged"; email: string }
  | { view: "emailUndone"; email: string }
  | { view: "emailExpired" }
  /** No usable answer from Firebase, or a case with no board: Firebase's own page handles the link. */
  | { view: "firebase" }

/** The kind of code each built mode must carry. A link whose code is of another kind goes on to Firebase. */
export const REQUEST_TYPE: Readonly<Record<BuiltMode, string>> = {
  resetPassword: "PASSWORD_RESET",
  verifyEmail: "VERIFY_EMAIL",
  verifyAndChangeEmail: "VERIFY_AND_CHANGE_EMAIL",
  recoverEmail: "RECOVER_EMAIL",
}
