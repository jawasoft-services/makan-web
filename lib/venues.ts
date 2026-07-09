import venuesData from "./venues.data.json"

/**
 * Pilot venue registry for the /r/<slug> venue-QR landing pages.
 *
 * ── DYNAMIC-QR CONTRACT (do not break — the cards are physically printed) ──
 *   The QR printed at a venue encodes  makanofficial.com/r/<slug>  — a STABLE,
 *   Makan-controlled URL. What that URL *does* is server-side and swappable by
 *   a deploy, so we never reprint:
 *     • Phase 1 (now): /r/<slug> renders the get-the-app landing page.
 *     • Phase 2 (RM18722): the SAME slug becomes a universal link that opens the
 *       composer pre-tagged to `googlePlaceId`. Change the route's behavior,
 *       redeploy — the printed card is untouched.
 *   NEVER rename or remove a live slug once its card is printed. Add venues.
 *
 * `googlePlaceId` is the app's `placeProviderId` (a Google Place ID) for the
 * venue. It is OPTIONAL in Phase 1 — the web pilot explicitly does not carry the
 * venue tag through install (documented pilot limitation) — and REQUIRED before
 * Phase 2 auto-tag. Fill it in when known; no reprint is needed.
 *
 * ── Where to edit ──
 *   The venue DATA lives in `lib/venues.data.json` (the single source of truth
 *   this module and the QR-card generator both read, so a page and its printed
 *   card can never drift). Add a venue there + run `npm run venue-qr` to mint
 *   its landing page and print-ready card together.
 */

export interface PilotVenue {
  /** URL slug — the stable token in the printed QR. Lowercase, kebab-case. */
  slug: string
  /** Display name shown on the landing page + card. */
  name: string
  /** City, for context under the venue name. */
  city: string
  /**
   * Google Place ID == the app's `placeProviderId`. Undefined until Phase 2
   * needs it for auto-tag; adding it later requires no reprint.
   */
  googlePlaceId?: string
}

// Key the lookup off each venue's own `slug` FIELD, not the JSON object key, so
// the page can never diverge from the printed card: the card filename + QR URL
// and this page lookup both resolve from the same `slug` value. (A mis-cased or
// mistyped JSON key therefore can't silently drop a live page to the generic
// fallback — the generator warns on key≠slug for tidiness.)
const VENUES: Record<string, PilotVenue> = Object.fromEntries(
  (Object.values(venuesData) as PilotVenue[]).map((v) => [v.slug.trim().toLowerCase(), v]),
)

/** Resolve a slug (case-insensitive) to a pilot venue, or null if unknown. */
export function getVenue(slug: string): PilotVenue | null {
  return VENUES[slug.trim().toLowerCase()] ?? null
}

/** Every pilot venue — used by the QR-card generator and static generation. */
export function allVenues(): PilotVenue[] {
  return Object.values(VENUES)
}
