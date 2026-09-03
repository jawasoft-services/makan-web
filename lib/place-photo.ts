import 'server-only'
import { unstable_cache } from 'next/cache'
import { accessToken } from '@/lib/place-city'

/**
 * The restaurant's photo from Google Places, the same one the app's place
 * screen shows as its hero. Two calls: the `photos` field (free) for the
 * photo name and its author, then the media endpoint (paid, about $7 per
 * thousand) for the image URL. Cached for 30 days per place, which is as
 * long as Google's terms allow place content to be held. Google requires
 * the author attribution to be shown next to the photo; `author` is that.
 */
export interface PlacePhoto {
  uri: string
  author: string
  authorUri: string
}

const PROJECT = process.env.FIREBASE_PROJECT_ID ?? 'munchies-expo'
const THIRTY_DAYS = 30 * 24 * 60 * 60

export const getPlacePhoto = unstable_cache(
  async (placeId: string): Promise<PlacePhoto | null> => {
    try {
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
      const media = await fetch(`https://places.googleapis.com/v1/${photo.name}/media?maxWidthPx=1600&skipHttpRedirect=true`, { headers })
      if (!media.ok) return null
      const { photoUri } = (await media.json()) as { photoUri?: string }
      if (!photoUri) return null
      const author = photo.authorAttributions?.[0]
      return { uri: photoUri, author: author?.displayName ?? '', authorUri: author?.uri ?? '' }
    } catch {
      return null
    }
  },
  ['makan-place-photo', 'v1'],
  { revalidate: THIRTY_DAYS },
)
