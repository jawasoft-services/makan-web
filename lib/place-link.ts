import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'

/**
 * RM20333 — makanofficial.com/p/<placeId>[/<dishId>], the link the app's "Send to WhatsApp" shares.
 * It names a Google place ID and optionally a dish ID, nothing about the sender. The page shows only
 * what the venue's public projection and the public dish projection already hold: no private meal,
 * no name from Google. A venue that is hidden in the app (tombstone, test, moved, no public meal)
 * gets the plain "Get Makan" page, never its data.
 */
export const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]{10,200}$/
export const DISH_ID_PATTERN = /^d_[0-9a-f]{20}$/

export interface LinkedPlace {
  placeId: string
  name: string
  publicMealCount: number
  /** A public meal photo from the venue's projection, or null. */
  imageUrl: string | null
  dish: { dishId: string; name: string; publicMealCount: number } | null
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

async function readLinkedPlace(placeId: string, dishId: string | null): Promise<LinkedPlace | null> {
  const db = getDb()
  if (!db) return null
  const [venueSnap, dishSnap] = await Promise.all([
    db.collection('restaurants').doc(placeId).get(),
    dishId ? db.collection('dishVenueProjections').doc(placeId).get() : Promise.resolve(null),
  ])
  const venue = venueSnap.exists ? venueSnap.data() ?? {} : null
  if (!venue || venue.state !== 'active' || venue.isTestVenue === true || venue.replacedByCanonicalPlaceId
    || (typeof venue.canonicalPlaceId === 'string' && venue.canonicalPlaceId !== placeId)) return null
  const count = venue.publicMealCount
  const name = text(venue.displayName)
  if (!name || !Number.isSafeInteger(count) || count < 1) return null
  const imageUrl = text(venue.image?.url)
  const dishes = dishSnap?.exists ? dishSnap.data()?.dishes : null
  const found = dishId && Array.isArray(dishes) ? dishes.find((d: { dishId?: unknown }) => d?.dishId === dishId) : null
  const dishName = text(found?.name)
  return {
    placeId,
    name,
    publicMealCount: count,
    imageUrl: /^https:\/\/firebasestorage\.googleapis\.com\//.test(imageUrl) ? imageUrl : null,
    dish: dishName && dishId
      ? { dishId, name: dishName, publicMealCount: Number.isSafeInteger(found.publicMealCount) && found.publicMealCount > 0 ? found.publicMealCount : 0 }
      : null,
  }
}

/** One or two reads per link at most every five minutes, shared by the page and its metadata. */
export function getLinkedPlace(placeId: string, dishId?: string): Promise<LinkedPlace | null> {
  if (!PLACE_ID_PATTERN.test(placeId) || (dishId !== undefined && !DISH_ID_PATTERN.test(dishId))) return Promise.resolve(null)
  return unstable_cache(() => readLinkedPlace(placeId, dishId ?? null), ['makan-place-link', 'v1', placeId, dishId ?? ''], { revalidate: 300 })()
}
