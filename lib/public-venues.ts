import 'server-only'
import { unstable_cache } from 'next/cache'
import type { Firestore } from 'firebase-admin/firestore'
import { getDb } from '@/lib/firebase-admin'

export interface PublicVenue {
  placeId: string
  name: string
  publicMealCount: number
  lat: number | null
  lng: number | null
}

/** The app's public restaurant projections, including zero-meal venues with standings. */
export function excludesPublicVenue(v: Record<string, unknown>, placeId: string): boolean {
  return v.isTestVenue === true || (v.state !== undefined && v.state !== 'active') || Boolean(v.replacedByCanonicalPlaceId)
    || (typeof v.canonicalPlaceId === 'string' && v.canonicalPlaceId !== placeId)
}

interface PublicVenueSnapshot { venues: PublicVenue[]; excludedIds: string[] }
async function readPublicVenueSnapshot(db: Firestore): Promise<PublicVenueSnapshot> {
  const snap = await db.collection('restaurants')
    .select('displayName', 'locationName', 'publicMealCount', 'state', 'isTestVenue', 'canonicalPlaceId', 'replacedByCanonicalPlaceId', 'latitude', 'longitude').get()
  const excludedIds: string[] = []
  const venues = snap.docs.flatMap(doc => {
    const v = doc.data()
    const name = typeof v.displayName === 'string' && v.displayName.trim() ? v.displayName.trim()
      : typeof v.locationName === 'string' ? v.locationName.trim() : ''
    if (excludesPublicVenue(v, doc.id)) { excludedIds.push(doc.id); return [] }
    if (!name || !Number.isSafeInteger(v.publicMealCount) || v.publicMealCount < 0) return []
    return [{ placeId: doc.id, name, publicMealCount: v.publicMealCount,
      lat: typeof v.latitude === 'number' && Number.isFinite(v.latitude) && Math.abs(v.latitude) <= 90 ? v.latitude : null,
      lng: typeof v.longitude === 'number' && Number.isFinite(v.longitude) && Math.abs(v.longitude) <= 180 ? v.longitude : null }]
  })
  return { venues, excludedIds }
}

export async function readPublicVenues(db: Firestore): Promise<PublicVenue[]> {
  return (await readPublicVenueSnapshot(db)).venues
}

const getCachedPublicVenues = unstable_cache(async (): Promise<PublicVenueSnapshot> => {
  const db = getDb()
  if (!db) throw new Error('Public restaurant database unavailable.')
  return readPublicVenueSnapshot(db)
}, ['makan-public-venues', 'v2-public-state'], { revalidate: 3600 })

// Share cold work across metadata, directory, standings and concurrent requests.
let pending: Promise<PublicVenueSnapshot> | null = null
function getPublicVenueSnapshot(): Promise<PublicVenueSnapshot> {
  if (!pending) pending = getCachedPublicVenues().finally(() => { pending = null })
  return pending
}

export async function getPublicVenues(): Promise<PublicVenue[]> {
  return (await getPublicVenueSnapshot()).venues
}
export async function getExcludedPublicVenueIds(): Promise<string[]> {
  return (await getPublicVenueSnapshot()).excludedIds
}
