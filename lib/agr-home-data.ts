import 'server-only'

import type { AgrData } from '@/components/agr/types'
import { buildAgrData, feedMealsFromWall } from '@/lib/agr-home-shape'
import { getEatStandings } from '@/lib/eat-standings'
import { getMaitredDirectory } from '@/lib/maitred'
import { getPlaceDirectory } from '@/lib/place-directory'
import { getDishWall } from '@/lib/dish-wall-data'
import { photoAllowed } from '@/lib/dish-wall'
import { getPublicVenues } from '@/lib/public-venues'
import { thumbUrl } from '@/lib/thumb'
import en from '@/messages/en.json'
import id from '@/messages/id.json'

/**
 * RM20773: everything the new home page shows that is live, from the existing cached readers.
 *
 * Cost (Devon's standing rule): one render reads each source once, and every source is cached.
 * - Standings, public venues: their own 1 h `unstable_cache` (lib/eat-standings, lib/public-venues).
 * - Maître d': its own 5 min module cache (lib/maitred), the reason the home stays dynamic.
 * - Feed: the homepage dish wall (`getDishWall`), its own 24 h cache with a 10 min retry backoff.
 *   It carries the public-material gates (venue, bound dish, no pork, no drinks), which the raw
 *   recent-meals reader did not.
 * - Board and globe photos: each restaurant's newest public meal from the place directory, the
 *   same 1 h cache lib/maitred already reads for this page, so it adds no Firestore reads.
 * No Google Places calls: a meal's city comes from the standings rows Makan already holds.
 */

function runtimeStrings(messages: Record<string, unknown>): Record<string, string> {
  const agr = messages.Agr as Record<string, unknown> | undefined
  const runtime = (agr?.runtime ?? {}) as Record<string, unknown>
  return Object.fromEntries(Object.entries(runtime).filter(([, v]) => typeof v === 'string')) as Record<string, string>
}

export async function getAgrHomeData(locale: string): Promise<AgrData> {
  const [meals, standings, venues, maitred, places] = await Promise.all([
    getDishWall().then(feedMealsFromWall),
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
    const meal = place.meals.find(photoAllowed)   // never a pork or drink photo (lib/dish-wall)
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
    thumbs,
    t: runtimeStrings(messages),
  })
}
