import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { APP_STORE_URL } from '@/lib/links'
import { readShareCardUrl } from '@/lib/share-card'
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
