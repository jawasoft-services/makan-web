/*
 * RM20616 O1 — the page behind the approval text's link, makanofficial.com/d/{code} (boards own-n1 to own-n7,
 * option B, Devon 24 Nov 2026). When Makan approves someone's claim to run a restaurant's page, it texts the
 * restaurant's own listed phone: "… now runs {place} on Makan … Not right? Tell us: makanofficial.com/d/{code}".
 *
 * This file holds the rules every part of the route shares, with no Node and no Next imports, so the proxy, the
 * page, the browser and the tests read the same answers:
 *
 * - The route is off unless NOTICE_LINK_PAGE is exactly "1". Off, /d/... is what it was: the site's not-found page.
 * - A code is 8 characters from 31 lower-case letters and digits without look-alikes (no 0, o, 1, l, i), as the
 *   backend makes them (functions/claims/noticeLinks.js). The format is checked before any network call.
 * - The visitor's browser calls the two public callables at the function's own URL, never through the website's
 *   server or a rewrite: the backend's per-network limit reads the caller's address.
 * - The code works like a password. Nothing here logs; callers must not log the code, the path or an answer.
 */

export type NoticeLocale = "en" | "id"

/** Which card the page shows. Each one is a board, or the nearest drawn one (see NOTICE_PAGE_NOTES.md). */
export type NoticeView =
  /** Before the server has answered: the frame and the pot clip, no words (no board draws this moment). */
  | { view: "loading" }
  /** own-n1 (own-n4 on a computer): the link is the place's current one. */
  | { view: "current"; placeName: string }
  /** own-n2: What's wrong? on the page; `error` adds the approved red line above Send. */
  | { view: "form"; placeName: string; error?: NoticeError }
  /** own-n3: after Send, and every later visit to a reported link. */
  | { view: "reported" }
  /** own-n6: unknown, mistyped, expired or no longer current. */
  | { view: "invalid" }
  /** own-n7: nobody runs the page now. */
  | { view: "unclaimed"; placeName: string }
  /** The lookup itself failed: only the approved red line (named in board note n-own-n2, not drawn as a card). */
  | { view: "blocked"; error: NoticeError }

export type NoticeError = "network" | "tooMany"
export type NoticeReason = "owner" | "staff" | "other"
export const NOTICE_REASONS: readonly NoticeReason[] = ["owner", "staff", "other"]
export const NOTE_MAX = 500

type Env = Record<string, string | undefined>

/** The route's switch: on only for the exact value "1". Read per request. */
export function noticeLinkPageOn(env: Env = process.env): boolean {
  return env.NOTICE_LINK_PAGE === "1"
}

/** The project the page talks to: production, unless NOTICE_LINK_PROJECT names the dev project exactly. */
export function noticeLinkProject(env: Env = process.env): "makan-devel" | "munchies-expo" {
  return env.NOTICE_LINK_PROJECT === "makan-devel" ? "makan-devel" : "munchies-expo"
}

export interface FunctionUrls {
  resolve: string
  report: string
}

/** The two callables' own URLs (us-central1, as deployed). Not secret: the browser calls them. */
export function functionUrls(env: Env = process.env): FunctionUrls {
  const base = `https://us-central1-${noticeLinkProject(env)}.cloudfunctions.net`
  return { resolve: `${base}/resolveNoticeLink`, report: `${base}/reportNoticeLink` }
}

const NOTICE_CODE = /^[a-hjkmnp-z2-9]{8}$/

/** The code in its stored form (lower case), or null when it cannot be a code. */
export function noticeCode(value: unknown): string | null {
  if (typeof value !== "string" || value.length !== 8) return null
  const lower = value.toLowerCase()
  return NOTICE_CODE.test(lower) ? lower : null
}

/** Fills `{place}` in a line. The name is text, never markup, and `$&`-style patterns are not expanded. */
export const withPlace = (line: string, place: string) => line.replace("{place}", () => place)

/** What one callable answered, as the Firebase callable protocol carries it. */
type CallAnswer =
  | { kind: "result"; result: unknown }
  | { kind: "error"; status: string; reason: string }
  | { kind: "network" }

const NETWORK: CallAnswer = { kind: "network" }

async function call(fetchImpl: typeof fetch, url: string, data: Record<string, string>): Promise<CallAnswer> {
  let body: unknown
  let ok: boolean
  try {
    const response = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store",
      redirect: "error",
    })
    ok = response.ok
    body = await response.json()
  } catch {
    return NETWORK
  }
  if (!body || typeof body !== "object") return NETWORK
  if (ok && "result" in body) return { kind: "result", result: (body as { result: unknown }).result }
  const error = (body as { error?: { status?: unknown; message?: unknown; details?: { reason?: unknown } } }).error
  if (!error || typeof error.status !== "string") return NETWORK
  const reason = typeof error.details?.reason === "string" ? error.details.reason : typeof error.message === "string" ? error.message : ""
  return { kind: "error", status: error.status, reason }
}

function stateOf(answer: CallAnswer): { state: unknown; placeName: string | null } | null {
  if (answer.kind !== "result" || !answer.result || typeof answer.result !== "object") return null
  const { state, placeName } = answer.result as { state?: unknown; placeName?: unknown }
  return { state, placeName: typeof placeName === "string" ? placeName : null }
}

/** The card for the lookup's answer (NOTICE_LINK_NOTES.md, "Request and answer shapes"). */
export async function resolveNotice(fetchImpl: typeof fetch, url: string, value: unknown): Promise<NoticeView> {
  const code = noticeCode(value)
  if (!code) return { view: "invalid" }
  const answer = await call(fetchImpl, url, { code })
  const found = stateOf(answer)
  if (found) {
    switch (found.state) {
      case "current": return { view: "current", placeName: found.placeName ?? "" }
      case "reported": return { view: "reported" }
      case "unclaimed": return { view: "unclaimed", placeName: found.placeName ?? "" }
      case "invalid": return { view: "invalid" }
    }
  }
  if (answer.kind === "error" && answer.status === "RESOURCE_EXHAUSTED") return { view: "blocked", error: "tooMany" }
  // The backend's switch is off: the link cannot do anything now, which is what own-n6 says.
  if (answer.kind === "error" && answer.status === "FAILED_PRECONDITION") return { view: "invalid" }
  return { view: "blocked", error: "network" }
}

export interface ReportInput {
  reason: string
  note: string
}

/** Files the report and returns the card for the answer; `placeName` is the name the form showed. */
export async function sendReport(fetchImpl: typeof fetch, url: string, value: unknown, input: ReportInput, placeName: string): Promise<NoticeView> {
  const code = noticeCode(value)
  if (!code) return { view: "invalid" }
  const retry: NoticeView = { view: "form", placeName, error: "network" }
  if (!(NOTICE_REASONS as readonly string[]).includes(input.reason)) return retry
  const note = input.note.trim()
  const answer = await call(fetchImpl, url, { code, reason: input.reason, ...(note ? { note } : {}) })
  const found = stateOf(answer)
  if (found) {
    switch (found.state) {
      case "reported": return { view: "reported" }
      case "invalid": return { view: "invalid" }
      case "unclaimed": return { view: "unclaimed", placeName: found.placeName ?? placeName }
    }
  }
  // too_many (the network's limit) and daily_limit (the place's) both get the approved "Too many attempts" line.
  if (answer.kind === "error" && answer.status === "RESOURCE_EXHAUSTED") return { view: "form", placeName, error: "tooMany" }
  if (answer.kind === "error" && answer.status === "FAILED_PRECONDITION") return { view: "invalid" }
  return retry
}

/**
 * One report per press: while a report is on its way, and after one was filed (any answer but the form again),
 * a press sends nothing and returns null. After a failure the person may press again.
 */
export function reportSender(send: (input: ReportInput) => Promise<NoticeView>) {
  let inFlight = false
  let done = false
  return (input: ReportInput): Promise<NoticeView> | null => {
    if (inFlight || done) return null
    inFlight = true
    return send(input).then((view) => {
      inFlight = false
      if (view.view !== "form") done = true
      return view
    })
  }
}
