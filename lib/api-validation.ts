// lib/api-validation.ts
//
// Server-side validation + security helpers for public API routes.
// All exports are pure (no I/O); safe to import in any route handler.

/**
 * HTML-escape a string for safe interpolation into HTML.
 * MUST be used on every user value before embedding in email `html` templates,
 * otherwise submitted `<a>`/`<img>` lands as live markup in the team inbox.
 */
export function htmlEscape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case "&": return "&amp;"
      case "<": return "&lt;"
      case ">": return "&gt;"
      case '"': return "&quot;"
      case "'": return "&#39;"
      default: return c
    }
  })
}

/**
 * Sanitize a string for use in an email Subject header.
 * Strips CR/LF (header injection) and caps length.
 */
export function sanitizeSubject(s: string, maxLen = 120): string {
  return s.replace(/[\r\n]+/g, " ").trim().slice(0, maxLen)
}

/**
 * Parse a JSON request body with a hard byte cap.
 * Returns null on oversize or malformed input — the caller should respond 400.
 * Default cap (8 KB) is generous for our forms and starves memory-amplification
 * attacks at the door.
 */
export async function parseSafeJson<T>(
  request: Request,
  maxBytes = 8 * 1024,
): Promise<T | null> {
  let text: string
  try {
    text = await request.text()
  } catch {
    return null
  }
  if (text.length > maxBytes) return null
  try {
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

/**
 * Honeypot check. Forms render a visually-hidden `website` field; legitimate
 * users never see or fill it, naive bots auto-fill all visible-named inputs.
 * On a positive hit, return success silently to the bot — don't signal which
 * field is the trap.
 */
export function isBotByHoneypot(body: { website?: unknown }): boolean {
  return typeof body.website === "string" && body.website.trim().length > 0
}

/**
 * Same-site check. A request passes when EITHER its `Origin` is one of ours
 * OR the browser's `Sec-Fetch-Site` says same-origin/same-site; it fails when
 * both are absent or foreign. Safari drops `Origin` on some same-site fetches,
 * so `Origin` alone must not be required; `Sec-Fetch-Site` is set by every
 * modern browser and cannot be set by page script. Rejecting mismatches blocks
 * drive-by browser abuse (a malicious page POSTing to our forms from a
 * visitor's browser).
 *
 * Non-browser clients (curl, scripts) can spoof both headers — this is one
 * layer of defense, not a perimeter. Pair with Turnstile and rate limiting.
 */
export function isAllowedOrigin(request: Request, allowed: string[]): boolean {
  const origin = request.headers.get("origin")
  if (origin && allowed.includes(origin)) return true
  const site = request.headers.get("sec-fetch-site")
  return site === "same-origin" || site === "same-site"
}

/**
 * Per-field maximum lengths (characters). Used as a server-side hard cap to
 * prevent oversized payloads reaching email/Sheets and to bound storage costs.
 */
export const FIELD_MAX = {
  name: 100,
  email: 254, // RFC 5321 maximum total email length
  restaurant: 200,
  city: 100,
  message: 2000,
} as const

/**
 * Origins permitted to POST to the public API.
 * Production domains + dev origin + Vercel preview URL (when present).
 */
export const ALLOWED_ORIGINS = [
  "https://www.makanofficial.com",
  "https://makanofficial.com",
  ...(process.env.NODE_ENV === "development" ? ["http://localhost:3000"] : []),
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
]
