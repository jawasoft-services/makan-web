import 'server-only'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { headers } from 'next/headers'
import { getDb } from '@/lib/firebase-admin'
import { APP_STORE_URL } from '@/lib/links'
import { loadAuthorMayAppear, loadMealOwners } from '@/lib/place-meals-data'
import { NO_SHARE_CARD, readShareCardUrls, shareCardFor } from '@/lib/share-card'
import { shareV2PagesOn } from '@/lib/share-v2'
import { SHARE_V2_PROXY_HEADER, isShareV2ProxyMark } from '@/lib/share-v2-mark'
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

const PLACE_CARD_WINDOW_MS = 300_000

/**
 * A restaurant's stored share card for the page's language (English `en`, Bahasa `id`), or null. One
 * document read at most every five minutes per place, shared by both languages, as the site caches its
 * other per-place reads. (The meal and profile pages read their card inside the load they already make.)
 *
 * The five-minute clock window is part of the cache key, as on the profile page, so an answer from an earlier
 * window is never served, not even once while Next refreshes it. A card the backend drops or purges therefore
 * stops being served at the end of the window in which it was last read: under five minutes later, on each
 * server instance.
 */
export async function getPlaceShareCard(placeId: string, locale: string): Promise<string | null> {
  if (WEBSITE_FIXTURES) return null
  const window = String(Math.floor(Date.now() / PLACE_CARD_WINDOW_MS))
  const urls = await unstable_cache(() => readShareCardUrls(getDb(), 'place', placeId), ['makan-share-card', 'v3', 'place', placeId, window], { revalidate: PLACE_CARD_WINDOW_MS / 1000 })()
  return shareCardFor(urls ?? NO_SHARE_CARD, locale)
}

/**
 * Whether a v2 page should answer at all: the switch is on AND the request carries the mark only
 * proxy.ts can set on its own rewrite (lib/share-v2-mark.ts; a visitor cannot send it). Otherwise
 * the page is a 404 that reads nothing.
 */
export async function shareV2PageServed(): Promise<boolean> {
  return shareV2PagesOn() && isShareV2ProxyMark((await headers()).get(SHARE_V2_PROXY_HEADER))
}

/** What a v2 page says about itself when it does not answer: never index it. */
export const SHARE_V2_NOT_SERVED = { robots: { index: false, follow: false } } as const

const MEAL_OWNERS_SECONDS = 24 * 60 * 60
const AUTHOR_WINDOW_MS = 60 * 60 * 1000

/**
 * The meals of a place whose photos the restaurant page may show: those whose author's account
 * is in good standing, not under age and not being deleted (lib/place-meals-data.ts).
 *
 * How long a newly hidden account's photo can still appear: at most one hour. An author's answer
 * is kept for the clock hour it was read in and the hour is part of its cache key, so an answer
 * from an earlier hour is never served, not even once while a new one is fetched. If the check
 * cannot be made, no meal photo is shown.
 *
 * Cost, with the switch on only, per server instance: a meal's owner is read when the place's list
 * of meals changes and at most daily (one read per meal listed, up to 60); an author's standing
 * once per clock hour (3 reads), shared by every place they ate at. The page and its metadata
 * share one answer per request, and a warm page reads nothing.
 */
const visiblePlaceMealIds = cache(async (placeId: string, listed: string): Promise<string[]> => {
  const mealIds = listed ? listed.split(',') : []
  if (WEBSITE_FIXTURES || !mealIds.length) return mealIds
  try {
    const owners = await unstable_cache(async () => {
      const db = getDb()
      if (!db) throw new Error('Database unavailable.')
      return loadMealOwners(db, mealIds)
    }, ['makan-place-meal-owners', 'v1', placeId, listed], { revalidate: MEAL_OWNERS_SECONDS })()
    const uids = [...new Set(Object.values(owners))]
    const hour = String(Math.floor(Date.now() / AUTHOR_WINDOW_MS))
    const standing = await Promise.all(uids.map((uid) => unstable_cache(async () => {
      const db = getDb()
      if (!db) throw new Error('Database unavailable.')
      return loadAuthorMayAppear(db, uid, new Date().getUTCFullYear())
    }, ['makan-author-standing', 'v2', uid, hour], { revalidate: AUTHOR_WINDOW_MS / 1000 })()))
    const allowed = new Set(uids.filter((_, index) => standing[index]))
    return mealIds.filter((id) => allowed.has(owners[id]))
  } catch {
    // No place id, meal id or uid in the log line.
    console.error('Place meal standing unavailable.')
    return []
  }
})

export async function getVisiblePlaceMealIds(placeId: string, mealIds: readonly string[]): Promise<Set<string>> {
  return new Set(await visiblePlaceMealIds(placeId, mealIds.join(',')))
}
