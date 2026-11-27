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
 * count). Readers see a change within the hour: one read per server instance per hour, shared by every page.
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

/**
 * The venues with no page, for the readers. Never throws: if the list cannot be read it hides nothing and logs,
 * as the site's other optional readers do, and the next call reads again.
 */
export async function getHiddenPlaceIds(): Promise<ReadonlySet<string>> {
  if (WEBSITE_FIXTURES) return new Set(fixtureHiddenPlaceIds())
  try {
    if (!pending) pending = getCachedHiddenPlaceIds().finally(() => { pending = null })
    return new Set(await pending)
  } catch {
    console.error('web-listing: takedown list unavailable; hiding nothing.')
    return new Set()
  }
}

/** The ids among `ids` with no page, for a client component's props: empty when nothing is hidden, and never the whole list. */
export function withoutPage(hidden: ReadonlySet<string>, ids: readonly string[]): string[] {
  return hidden.size ? [...new Set(ids.filter(id => hidden.has(id)))] : []
}
