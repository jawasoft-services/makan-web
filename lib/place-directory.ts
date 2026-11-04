import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { computePlaceDirectory, indexOf } from '@/lib/aggregates/compute'
import { MAX_AGE_MS, readLastRun, readPlace, readPlaceIndex, readPlaces } from '@/lib/aggregates/store'
import type { DirectoryPlace, PlaceIndexEntry } from '@/lib/aggregates/types'

export { INDEX_MIN_MEALS } from '@/lib/aggregates/types'
export type { DirectoryMeal, DirectoryPlace, PlaceIndexEntry } from '@/lib/aggregates/types'

/**
 * Every restaurant on Makan that has public meals, as the app's place screen
 * would show it. Read from the aggregate documents the daily cron writes:
 * a small sharded index for lists, and one document per place for a page.
 * The full scan (lib/aggregates/compute.ts) runs only for the cached index
 * and directory lists, when the aggregate is missing or the cron has been
 * silent for 36 hours, which is logged; single-place reads never scan.
 */

async function aggregateIsFresh(): Promise<boolean> {
  const db = getDb()
  if (!db) return false
  const lastRun = await readLastRun(db)
  return lastRun !== null && Date.now() - lastRun.getTime() < MAX_AGE_MS
}

async function fallbackDirectory(reason: string): Promise<DirectoryPlace[]> {
  const db = getDb()
  if (!db) return []
  console.warn(`place-directory: aggregate ${reason}; falling back to a live scan.`)
  return computePlaceDirectory(db)
}

/** The small index: slug, name, city, indexable, meal count, for every place. One or two reads. */
export const getPlaceIndex = unstable_cache(
  async (): Promise<PlaceIndexEntry[]> => {
    try {
      const db = getDb()
      if (!db) return []
      const [index, fresh] = await Promise.all([readPlaceIndex(db), aggregateIsFresh()])
      if (index && fresh) return index
      return indexOf(await fallbackDirectory(index ? 'stale' : 'missing'))
    } catch (err) {
      console.error('place-directory: failed to read the index.', err)
      return []
    }
  },
  ['makan-place-index', 'v1'],
  { revalidate: 3600 },
)

/** Every place in full. One read per place: use getPlaceIndex where a list will do. */
export const getPlaceDirectory = unstable_cache(
  async (): Promise<DirectoryPlace[]> => {
    try {
      const db = getDb()
      if (!db) return []
      const [index, fresh] = await Promise.all([readPlaceIndex(db), aggregateIsFresh()])
      if (!index || !fresh) return fallbackDirectory(index ? 'stale' : 'missing')
      const places = await readPlaces(db, index.map((p) => p.placeId))
      return index.map((p) => places.get(p.placeId)).filter((p): p is DirectoryPlace => Boolean(p))
    } catch (err) {
      console.error('place-directory: failed to build the directory.', err)
      return []
    }
  },
  ['makan-place-directory', 'v3'],
  { revalidate: 3600 },
)

/**
 * One place by its Google Place id: a single document read, never a scan.
 * Missing from the aggregate means not a page (not a food venue, no public
 * meals) or the cron has not run yet; the cron repairs the second case. A
 * request path must not scan `meals`: this is reached by every shared meal
 * link, and an unknown id would otherwise cost a full collection read per hit.
 */
export async function getDirectoryPlaceById(placeId: string): Promise<DirectoryPlace | null> {
  try {
    const db = getDb()
    if (!db) return null
    return await readPlace(db, placeId)
  } catch (err) {
    console.error('place-directory: failed to read a place.', err)
    return null
  }
}

/** A place by its slug, matched on the hash so a renamed place keeps its URL. Two reads. */
export async function getDirectoryPlace(slug: string): Promise<DirectoryPlace | null> {
  const hash = /-([0-9a-f]{6})$/.exec(slug)?.[1]
  if (!hash) return null
  const index = await getPlaceIndex()
  const entry = index.find((p) => p.hash === hash)
  return entry ? getDirectoryPlaceById(entry.placeId) : null
}
