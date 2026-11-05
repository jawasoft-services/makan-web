import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'

/**
 * RM20363 — claim links (makanofficial.com/claim/<token>), minted by the app
 * repo's prepare-venue tool (munchies-rn functions/venuePrep). The token picks
 * one venue; the page grants nothing and proves no ownership.
 *
 * Three reads per token at most every five minutes: the link, the venue record
 * and whether an approved business owns the place. Names and areas come from
 * the prep sheet or the venue record, never stored from Google (RM20225).
 */
export const CLAIM_TOKEN_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{6,12}$/

export interface ClaimVenue {
  token: string
  placeId: string
  name: string
  area: string
  mealCount: number
  claimed: boolean
}

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export function isClaimToken(value: string): boolean {
  return value.length <= 73 && CLAIM_TOKEN_PATTERN.test(value)
}

async function readClaimVenue(token: string): Promise<ClaimVenue | null> {
  const db = getDb()
  if (!db) return null
  const link = await db.collection('claimLinks').doc(token).get()
  const placeId = text(link.data()?.placeId)
  if (!placeId) return null
  const [restaurant, businesses] = await Promise.all([
    db.collection('restaurants').doc(placeId).get(),
    db.collection('businesses').where('placeProviderId', '==', placeId).select('placeProviderId').limit(1).get(),
  ])
  const venue = restaurant.exists ? restaurant.data() ?? {} : null
  // A moved or retired venue must not offer a claim on its old identity.
  if (venue && (venue.state === 'tombstone' || venue.state === 'unresolved' || venue.replacedByCanonicalPlaceId
    || (typeof venue.canonicalPlaceId === 'string' && venue.canonicalPlaceId !== placeId))) return null
  const count = venue?.publicMealCount
  return {
    token,
    placeId,
    name: text(venue?.displayName) || text(link.data()?.displayName),
    area: text(link.data()?.area),
    mealCount: Number.isSafeInteger(count) && count > 0 ? count : 0,
    claimed: !businesses.empty,
  }
}

export function getClaimVenue(token: string): Promise<ClaimVenue | null> {
  if (!isClaimToken(token)) return Promise.resolve(null)
  return unstable_cache(() => readClaimVenue(token), ['makan-claim-venue', 'v1', token], { revalidate: 300 })()
}
