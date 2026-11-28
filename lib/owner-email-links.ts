/**
 * RM20616 O2 Q8 — the two buttons of the weekly owner email (munchies-rn functions/ownerUpdates/send.js,
 * updateLinks): /o/table-card?b=<businessId> and /o/thanks?b=<businessId>. Devon chose the existing
 * "Open in app" page: on a computer, or a phone without Makan, both hand on to /app (a phone goes to its
 * store; anything else to the home page's store badges and QR code), with /id/ kept for Bahasa.
 *
 * Off unless OWNER_EMAIL_LINKS is exactly "1", read per request. Off, both addresses are what they were
 * before: the site's not-found page.
 */
export const ownerEmailLinksOn = (): boolean => process.env.OWNER_EMAIL_LINKS === '1'

const PATHS = new Set(['/o/table-card', '/o/thanks'])
// The owner dashboard's own check of a business id (munchies-rn functions/ownerDashboard/access.js, BUSINESS_ID).
const BUSINESS_ID = /^[A-Za-z0-9]{10,40}$/

/**
 * The page an email link hands on to, or null to leave the address to the rest of the proxy. The link
 * must carry exactly one well-formed business id; /app takes no parameter, so the id is not passed on.
 */
export function ownerEmailLinkTarget(pathname: string, search: URLSearchParams): '/app' | '/id/app' | null {
  const indonesian = pathname.startsWith('/id/')
  if (!PATHS.has(indonesian ? pathname.slice(3) : pathname)) return null
  const ids = search.getAll('b')
  if (ids.length !== 1 || !BUSINESS_ID.test(ids[0])) return null
  return indonesian ? '/id/app' : '/app'
}
