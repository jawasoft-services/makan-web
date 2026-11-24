import 'server-only'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { getDb } from '@/lib/firebase-admin'
import { APP_STORE_URL } from '@/lib/links'
import { loadAuthorMayAppear, loadMealOwners } from '@/lib/place-meals-data'
import { readShareCardUrl } from '@/lib/share-card'
import { shareV2PagesOn } from '@/lib/share-v2'
import { SHARE_V2_PROXY_HEADER } from '@/lib/share-v2-routes'
import { SITE_URL } from '@/lib/site-metadata'
import { WEBSITE_FIXTURES } from '@/lib/website-fixtures'

/** RM20616 A12 U3 — what the three Share v2 pages have in common. */

/** A page's public address: English unprefixed, Bahasa under /id. */
export const sharePageUrl = (locale: string, path: string): string => `${SITE_URL}${locale === 'id' ? '/id' : ''}${path}`

/** Apple's Smart App Banner: the App Store app, and this page's address for the app to open. */
export function smartAppBanner(url: string): { appId: string; appArgument: string } | undefined {
  const appId = APP_STORE_URL.match(/id(\d+)/)?.[1]
  return appId ? { appId, appArgument: url } : undefined
}

/**
 * A restaurant's stored share card, or null. One document read at most every five minutes per
 * place, as the site caches its other per-place reads. (The meal and profile pages read their
 * card inside the load they already make.)
 */
export function getPlaceShareCard(placeId: string): Promise<string | null> {
  if (WEBSITE_FIXTURES) return Promise.resolve(null)
  return unstable_cache(() => readShareCardUrl(getDb(), 'place', placeId), ['makan-share-card', 'v1', 'place', placeId], { revalidate: 300 })()
}

/**
 * Whether a v2 page should answer at all: the switch is on AND the request came through proxy.ts
 * (which sets the mark on its own rewrite and answers a direct request for an internal address
 * itself). Otherwise the page is a 404 that reads nothing.
 */
export async function shareV2PageServed(): Promise<boolean> {
  return shareV2PagesOn() && (await headers()).get(SHARE_V2_PROXY_HEADER) === '1'
}

/** What a v2 page says about itself when it does not answer: never index it. */
export const SHARE_V2_NOT_SERVED = { robots: { index: false, follow: false } } as const

const MEAL_OWNERS_SECONDS = 24 * 60 * 60
const AUTHOR_STANDING_SECONDS = 60 * 60

/**
 * The meals of a place whose photos the restaurant page may show: those whose author's account
 * is in good standing, not under age and not being deleted (lib/place-meals-data.ts).
 *
 * Cost, with the switch on only: a meal's owner is read once a day per place (one read per meal
 * listed); an author's standing once an hour (3 reads), shared by every place they ate at. A
 * warm page reads nothing. If the check cannot be made, no meal photo is shown.
 */
export async function getVisiblePlaceMealIds(placeId: string, mealIds: readonly string[]): Promise<Set<string>> {
  if (WEBSITE_FIXTURES) return new Set(mealIds)
  if (!mealIds.length) return new Set()
  try {
    const owners = await unstable_cache(async () => {
      const db = getDb()
      if (!db) throw new Error('Database unavailable.')
      return loadMealOwners(db, mealIds)
    }, ['makan-place-meal-owners', 'v1', placeId, mealIds.join(',')], { revalidate: MEAL_OWNERS_SECONDS })()
    const uids = [...new Set(Object.values(owners))]
    const standing = await Promise.all(uids.map((uid) => unstable_cache(async () => {
      const db = getDb()
      if (!db) throw new Error('Database unavailable.')
      return loadAuthorMayAppear(db, uid, new Date().getUTCFullYear())
    }, ['makan-author-standing', 'v1', uid], { revalidate: AUTHOR_STANDING_SECONDS })()))
    const allowed = new Set(uids.filter((_, index) => standing[index]))
    return new Set(mealIds.filter((id) => allowed.has(owners[id])))
  } catch {
    // No place id, meal id or uid in the log line.
    console.error('Place meal standing unavailable.')
    return new Set()
  }
}
