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
 * Origin allowlist. Browsers automatically send an `Origin` header on
 * cross-origin POSTs; rejecting mismatches blocks drive-by browser-based abuse
 * (a malicious page that POSTs to our forms from a victim's browser).
 *
 * Non-browser clients (curl, scripts) can spoof Origin freely — this is one
 * layer of defense, not a perimeter. Pair with rate limiting at the platform.
 *
 * When Origin is absent (some server-to-server fetches don't send it), we
 * allow the request; CSRF in the classic sense doesn't apply here because the
 * endpoints have no auth/session to ride.
 */
export function isAllowedOrigin(request: Request, allowed: string[]): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true
  return allowed.includes(origin)
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
