import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { getPlaceSeed, isFoodVenue, placeLabel, type PlaceWhere } from '@/lib/place-city'
import { isCleanCaption } from '@/lib/makan-stats'
import { placeSlug, shortHash } from '@/lib/slug'

/**
 * Every restaurant on Makan that has public meals, as the app's place screen
 * would show it: name, address, city, cuisine, and the public meals saved
 * there. This is what a restaurant page renders.
 *
 * Rules that keep it safe to publish:
 *  - only meals marked public and not moderated away, with a photo;
 *  - only places Google types as somewhere people eat (isFoodVenue), so a
 *    meal tagged to a street address or a home never becomes a page;
 *  - handles only where the account chose one; auto handles are dropped;
 *  - captions only when clean (same rule as the homepage strip).
 * Nothing about private meals, friends-only meals or users leaves here.
 */
export interface DirectoryMeal {
  id: string
  src: string
  caption: string
  mealType: string
  username: string
  /** ISO timestamp */
  at: string
}

export interface DirectoryPlace {
  placeId: string
  slug: string
  hash: string
  name: string
  where: PlaceWhere | null
  address: string
  lat: number | null
  lng: number | null
  cuisine: string[]
  /** ISO date of the first meal ever tagged here, or null. */
  since: string | null
  /** Public meals saved here, newest first. */
  meals: DirectoryMeal[]
  /** Whether search engines should index the page (enough on it to be worth a result). */
  indexable: boolean
}

/** A single meal with no matchups is a real page but not worth a search result. */
export const INDEX_MIN_MEALS = 2
const MAX_MEALS_ON_PAGE = 60

export const getPlaceDirectory = unstable_cache(
  async (): Promise<DirectoryPlace[]> => {
    try {
      const db = getDb()
      if (!db) return []
      const snap = await db
        .collection('meals')
        .select('placeProviderId', 'locationName', 'createdAt', 'isPublic', 'moderationStatus', 'imageURL', 'caption', 'mealType', 'userID', 'uid', 'userName')
        .get()

      type Raw = { id: string; src: string; caption: string; mealType: string; uid: string; legacyName: string; at: number }
      const byPlace = new Map<string, { name: Map<string, number>; first: number; meals: Raw[] }>()
      for (const doc of snap.docs) {
        const d = doc.data()
        const placeId = str(d.placeProviderId)
        if (!placeId) continue
        const entry: { name: Map<string, number>; first: number; meals: Raw[] } = byPlace.get(placeId) ?? { name: new Map<string, number>(), first: Infinity, meals: [] }
        const name = str(d.locationName)
        if (name) entry.name.set(name, (entry.name.get(name) ?? 0) + 1)
        const at = toMillis(d.createdAt) ?? 0
        if (at && at < entry.first) entry.first = at
        const isPublic = d.isPublic === true && (d.moderationStatus === undefined || d.moderationStatus === 'active')
        const src = str(d.imageURL)
        if (isPublic && src.startsWith('https://firebasestorage.googleapis.com/')) {
          entry.meals.push({
            id: doc.id,
            src,
            caption: str(d.caption),
            mealType: str(d.mealType),
            uid: str(d.userID) || str(d.uid),
            legacyName: str(d.userName),
            at,
          })
        }
        byPlace.set(placeId, entry)
      }

      // Only places with public meals, only food venues.
      const candidates = [...byPlace.entries()].filter(([id, e]) => e.meals.length && isFoodVenue(getPlaceSeed(id)?.types))

      // Canonical names and cuisine from the app's place records.
      const canonical = new Map<string, { name: string; cuisine: string[] }>()
      const refs = candidates.map(([id]) => db.collection('restaurants').doc(id))
      for (let i = 0; i < refs.length; i += 100) {
        const docs = await db.getAll(...refs.slice(i, i + 100), { fieldMask: ['displayName', 'locationName', 'cuisine'] })
        for (const d of docs) {
          if (!d.exists) continue
          const data = d.data() ?? {}
          const cats = (data.cuisine?.categories ?? []) as { label?: string }[]
          canonical.set(d.id, {
            name: str(data.displayName) || str(data.locationName),
            cuisine: cats.map((c) => str(c.label)).filter(Boolean),
          })
        }
      }

      // Handles for the meals shown, joined once per account.
      const uids = new Set<string>()
      for (const [, e] of candidates) for (const m of e.meals.slice(0, MAX_MEALS_ON_PAGE)) if (!m.legacyName && m.uid) uids.add(m.uid)
      const handle = new Map<string, string>()
      const uidList = [...uids]
      for (let i = 0; i < uidList.length; i += 100) {
        const docs = await db.getAll(...uidList.slice(i, i + 100).map((u) => db.collection('users').doc(u)), { fieldMask: ['username'] })
        for (const u of docs) {
          const name = u.exists ? str(u.data()?.username) : ''
          if (name && !/^user_/i.test(name)) handle.set(u.id, name)
        }
      }

      return candidates
        .map(([placeId, e]) => {
          const seed = getPlaceSeed(placeId)
          const name = canonical.get(placeId)?.name || topVote(e.name) || 'Unnamed place'
          const meals = e.meals
            .sort((x, y) => y.at - x.at)
            .slice(0, MAX_MEALS_ON_PAGE)
            .map((m) => ({
              id: m.id,
              src: m.src,
              caption: isCleanCaption(m.caption) ? m.caption : '',
              mealType: m.mealType,
              username: (m.legacyName && !/^user_/i.test(m.legacyName) ? m.legacyName : handle.get(m.uid)) ?? '',
              at: new Date(m.at).toISOString(),
            }))
          return {
            placeId,
            slug: placeSlug(name, placeId),
            hash: shortHash(placeId),
            name,
            where: seed ? placeLabel(seed) : null,
            address: seed?.address ?? '',
            lat: seed?.lat ?? null,
            lng: seed?.lng ?? null,
            cuisine: canonical.get(placeId)?.cuisine ?? [],
            since: Number.isFinite(e.first) ? new Date(e.first).toISOString() : null,
            meals,
            indexable: meals.length >= INDEX_MIN_MEALS,
          }
        })
        .sort((x, y) => y.meals.length - x.meals.length || x.name.localeCompare(y.name))
    } catch {
      console.error('place-directory: failed to build the directory.')
      return []
    }
  },
  ['makan-place-directory', 'v1'],
  { revalidate: 3600 },
)

/** A place by its slug, matched on the hash so a renamed place keeps its URL. */
export async function getDirectoryPlace(slug: string): Promise<DirectoryPlace | null> {
  const hash = /-([0-9a-f]{6})$/.exec(slug)?.[1]
  if (!hash) return null
  const all = await getPlaceDirectory()
  return all.find((p) => p.hash === hash) ?? null
}

function topVote(votes: Map<string, number>): string {
  let best = ''
  let n = 0
  for (const [name, count] of votes) if (count > n) (best = name), (n = count)
  return best
}

function toMillis(v: unknown): number | null {
  if (!v || typeof v !== 'object') return null
  const t = v as { toMillis?: () => number; _seconds?: number }
  if (typeof t.toMillis === 'function') return t.toMillis()
  if (typeof t._seconds === 'number') return t._seconds * 1000
  return null
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}
