import 'server-only'
import { unstable_cache } from 'next/cache'
import { Timestamp } from 'firebase-admin/firestore'
import { getDb } from '@/lib/firebase-admin'
import { accessToken } from '@/lib/place-city'

/**
 * The restaurant's photo from Google Places, the same one the app's place
 * screen shows as its hero. Two Google calls when it has to fetch: the
 * `photos` field (free) for the photo name and its author, then the media
 * endpoint (paid, about $7 per thousand) for the image URL.
 *
 * The result is cached in Firestore at webCache/placePhotos/places/{placeId}
 * so it survives deployments (the Next data cache does not, and a full
 * prerender after every deploy was refetching every place). `fetchedAt`
 * enforces the 30-day limit Google's terms set on holding place content;
 * do not lengthen it. `author` and `authorUri` are the attribution Google
 * requires next to the photo, and must keep being stored and rendered.
 *
 * On a Google error the last cached value is returned, even if stale, so a
 * transient failure never blanks a hero; with nothing cached, null.
 */
export interface PlacePhoto {
  uri: string
  author: string
  authorUri: string
}

const PROJECT = process.env.FIREBASE_PROJECT_ID ?? 'munchies-expo'
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
const CACHE_COLLECTION = 'webCache'
const CACHE_DOC = 'placePhotos'
const CACHE_ITEMS = 'places'

interface CachedPhoto extends PlacePhoto {
  fetchedAt: Timestamp
}

async function fetchFromGoogle(placeId: string): Promise<PlacePhoto | null> {
  const token = await accessToken()
  if (!token) return null
  const headers = { Authorization: `Bearer ${token}`, 'X-Goog-User-Project': PROJECT }
  const place = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
    headers: { ...headers, 'X-Goog-FieldMask': 'photos' },
  })
  if (!place.ok) return null
  const json = (await place.json()) as { photos?: { name: string; authorAttributions?: { displayName?: string; uri?: string }[] }[] }
  const photo = json.photos?.[0]
  if (!photo?.name) return null
  // 1000px: a phone hero at full width, not a 1600px download on 3G.
  const media = await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1000&skipHttpRedirect=true`, { headers })
  if (!media.ok) return null
  const { photoUri } = (await media.json()) as { photoUri?: string }
  if (!photoUri) return null
  const author = photo.authorAttributions?.[0]
  return { uri: photoUri, author: author?.displayName ?? '', authorUri: author?.uri ?? '' }
}

async function readCached(placeId: string): Promise<CachedPhoto | null> {
  const db = getDb()
  if (!db) return null
  const snap = await db.collection(CACHE_COLLECTION).doc(CACHE_DOC).collection(CACHE_ITEMS).doc(placeId).get()
  if (!snap.exists) return null
  const d = snap.data() as Partial<CachedPhoto> | undefined
  if (!d || typeof d.uri !== 'string' || !(d.fetchedAt instanceof Timestamp)) return null
  return { uri: d.uri, author: d.author ?? '', authorUri: d.authorUri ?? '', fetchedAt: d.fetchedAt }
}

async function writeCached(placeId: string, photo: PlacePhoto): Promise<void> {
  const db = getDb()
  if (!db) return
  await db
    .collection(CACHE_COLLECTION)
    .doc(CACHE_DOC)
    .collection(CACHE_ITEMS)
    .doc(placeId)
    .set({ ...photo, fetchedAt: Timestamp.now() })
}

/** The photo for a place: Firestore first, Google only when missing or over 30 days old. */
async function resolvePlacePhoto(placeId: string): Promise<PlacePhoto | null> {
  let cached: CachedPhoto | null = null
  try {
    cached = await readCached(placeId)
  } catch {
    cached = null
  }
  const fresh = cached && Date.now() - cached.fetchedAt.toMillis() < THIRTY_DAYS_MS
  if (cached && fresh) return { uri: cached.uri, author: cached.author, authorUri: cached.authorUri }

  try {
    const photo = await fetchFromGoogle(placeId)
    if (photo) {
      writeCached(placeId, photo).catch(() => {
        console.error('place-photo: failed to write the cache for', placeId)
      })
      return photo
    }
  } catch {
    // fall through to the stale value
  }
  // Google failed or had nothing: the stale value beats a blank hero.
  return cached ? { uri: cached.uri, author: cached.author, authorUri: cached.authorUri } : null
}

// A warm instance keeps the Firestore read out of the render path; the
// Firestore document is what survives the deploy.
export const getPlacePhoto = unstable_cache(resolvePlacePhoto, ['makan-place-photo', 'v3'], {
  revalidate: 24 * 60 * 60,
})
