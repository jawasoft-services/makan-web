import 'server-only'

import { unstable_cache } from 'next/cache'

import type { AgrData } from '@/components/agr/types'
import { buildAgrData } from '@/lib/agr-home-shape'
import { getEatStandings } from '@/lib/eat-standings'
import { getMaitredDirectory } from '@/lib/maitred'
import { getPlaceDirectory } from '@/lib/place-directory'
import { getRecentPublicMeals, type PublicMeal } from '@/lib/makan-stats'
import { getPublicVenues } from '@/lib/public-venues'
import { thumbUrl } from '@/lib/thumb'
import { dishAnswersShown } from '@/lib/dish-pages'
import en from '@/messages/en.json'
import id from '@/messages/id.json'

/**
 * RM20773: everything the new home page shows that is live, from the existing cached readers.
 *
 * Cost (Devon's standing rule): one render reads each source once, and every source is cached.
 * - Standings, public venues: their own 1 h `unstable_cache` (lib/eat-standings, lib/public-venues).
 * - Maître d': its own 5 min module cache (lib/maitred), the reason the home stays dynamic.
 * - Feed: `getRecentPublicMeals` has no cache of its own, so it is wrapped here for 1 h.
 * - Board and globe photos: each restaurant's newest public meal from the place directory, the
 *   same 1 h cache lib/maitred already reads for this page, so it adds no Firestore reads.
 * No Google Places calls: a meal's city comes from the standings rows Makan already holds.
 */

export const FEED_SIZE = 80
const FEED_RETRY_MS = 10 * 60 * 1000

const readFeed = unstable_cache(
  async () => {
    const meals = await getRecentPublicMeals(FEED_SIZE)
    // A failed or empty read is not cached: throwing keeps it out of the cache.
    if (!meals.length) throw new Error('agr-feed: no public meals')
    return meals
  },
  ['agr-home-feed', 'v1'],
  { revalidate: 3600 },
)

// ponytail: per-instance backoff (as lib/dish-wall-data), not shared state. Without it a
// Firestore outage would rescan the newest meals on every visit.
let feedFailedAt = 0

async function getFeed(): Promise<PublicMeal[]> {
  if (feedFailedAt && Date.now() - feedFailedAt < FEED_RETRY_MS) return []
  try {
    const meals = await readFeed()
    feedFailedAt = 0
    return meals
  } catch {
    feedFailedAt = Date.now()
    return []
  }
}

function runtimeStrings(messages: Record<string, unknown>): Record<string, string> {
  const agr = messages.Agr as Record<string, unknown> | undefined
  const runtime = (agr?.runtime ?? {}) as Record<string, unknown>
  return Object.fromEntries(Object.entries(runtime).filter(([, v]) => typeof v === 'string')) as Record<string, string>
}

export async function getAgrHomeData(locale: string): Promise<AgrData> {
  const [meals, standings, venues, maitred, places] = await Promise.all([
    getFeed(),
    getEatStandings(),
    // Throws without a database (fixtures, outage): the globe then shows land and no pins.
    getPublicVenues().catch(() => []),
    getMaitredDirectory(),
    getPlaceDirectory(),
  ])
  const venueIds = new Set(venues.map((v) => v.placeId))
  // The app's own small copy when it made one (no resize on this server), else /api/thumb.
  const thumbs: Record<string, string> = {}
  for (const place of places) {
    const meal = place.meals[0]
    if (meal) thumbs[place.placeId] = meal.thumb || thumbUrl(meal.src, 240)
  }
  const messages = (locale === 'id' ? id : en) as unknown as Record<string, unknown>
  return buildAgrData({
    locale,
    meals,
    standings,
    // Every public venue is a pin; places only the directory knows (or every place, when the
    // venue read failed) still get one, so the globe never loses its photos.
    venues: [...venues, ...places.filter((p) => !venueIds.has(p.placeId))],
    maitred: maitred.venues,
    // RM20616 dish pages L6: with the answers shown, a Maître d' card names the app's answer (from the same directory).
    ...(dishAnswersShown() ? { dishAnswers: new Map(places.flatMap((p) => p.dishes ? [[p.placeId, p.dishes.answer] as const] : [])) } : {}),
    thumbs,
    t: runtimeStrings(messages),
  })
}
