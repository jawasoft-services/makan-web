import { WEBSITE_FIXTURES, fixtureHiddenPlaceIds } from '@/lib/website-fixtures'
import 'server-only'
import { unstable_cache } from 'next/cache'
import type { Firestore } from 'firebase-admin/firestore'
import { getDb } from '@/lib/firebase-admin'

/**
 * RM20616 dish pages U2 — a venue's takedown. Devon, 27 Nov 2026: "Page only", then "Yes, plain-text name".
 *
 *   config/webListing   { hidden: string[] }   Google place ids, set by hand by the team (a production write: Devon's)
 *
 * Server-only: the Firestore rules' final catch-all denies every client, so no app user can read who asked. A
 * listed venue has no page on the website: /places/<slug> and /id/places/<slug> answer not found and leave the
 * sitemap and the A–Z directory (lib/place-directory.ts getPlaceIndex). It stays in the standings and the Maître d'
 * listings exactly as it is, with its name as plain text where it was a link to the page. Its dish data is not
 * computed (lib/aggregates/dishes.ts). Not behind DISH_PAGES: a takedown works whatever that switch says.
 *
 * An absent document, a malformed one, or an entry that is not a place id hides nothing (the other entries still
 * count). Readers read it at most once per server instance per hour, shared by every page; see getHiddenPlaceIds for
 * a read that fails.
 */
export const WEB_LISTING_PATH = 'config/webListing'
const PLACE_ID = /^[A-Za-z0-9_-]{1,256}$/

/** The hidden place ids in a `config/webListing` document's data. */
export function parseWebListing(data: unknown): Set<string> {
  const hidden = data && typeof data === 'object' && !Array.isArray(data) ? (data as { hidden?: unknown }).hidden : undefined
  return new Set(Array.isArray(hidden) ? hidden.filter((id): id is string => typeof id === 'string' && PLACE_ID.test(id)) : [])
}

/** One read. A read that fails throws (the cron then fails its run and keeps what it last wrote); an absent document hides nothing. */
export async function readHiddenPlaceIds(db: Firestore): Promise<Set<string>> {
  const snap = await db.doc(WEB_LISTING_PATH).get()
  return parseWebListing(snap.exists ? snap.data() : undefined)
}

const getCachedHiddenPlaceIds = unstable_cache(async (): Promise<string[]> => {
  const db = getDb()
  if (!db) throw new Error('Web listing database unavailable.')
  return [...await readHiddenPlaceIds(db)]
}, ['makan-web-listing', 'v1'], { revalidate: 3600 })

let pending: Promise<string[]> | null = null
/** The last list this server read, kept for a failed read (review L2). */
let lastRead: string[] | null = null
/** When a read last failed; for a minute after it the readers use `lastRead` without trying again. */
let failedAt: number | null = null
const FAILURE_RETRY_MS = 60_000

/**
 * The venues with no page, for the readers. Never throws, and never fails closed (a whole directory of not-found pages
 * would be worse). If the list cannot be read, the last list this server read stands, so a takedown it knew is kept;
 * a server that has never read it hides nothing. A failure is remembered for a minute, so requests neither wait on
 * the read nor repeat it meanwhile. Logged without any place id.
 */
export async function getHiddenPlaceIds(): Promise<ReadonlySet<string>> {
  if (WEBSITE_FIXTURES) return new Set(fixtureHiddenPlaceIds())
  const now = Date.now()
  if (failedAt !== null && now >= failedAt && now - failedAt < FAILURE_RETRY_MS) return new Set(lastRead ?? [])
  try {
    if (!pending) pending = getCachedHiddenPlaceIds().finally(() => { pending = null })
    lastRead = await pending
    failedAt = null
    return new Set(lastRead)
  } catch {
    failedAt = Date.now()
    console.error(lastRead ? 'web-listing: takedown list unavailable; using the last list read.' : 'web-listing: takedown list unavailable; hiding nothing.')
    return new Set(lastRead ?? [])
  }
}

/** The ids among `ids` with no page, for a client component's props: empty when nothing is hidden, and never the whole list. */
export function withoutPage(hidden: ReadonlySet<string>, ids: readonly string[]): string[] {
  return hidden.size ? [...new Set(ids.filter(id => hidden.has(id)))] : []
}
