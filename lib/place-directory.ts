import { WEBSITE_FIXTURES, fixtureDirectory, fixturePlaceIndex } from '@/lib/website-fixtures'
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { computePlaceDirectory, computePlaceDirectoryForPlace, indexOf } from '@/lib/aggregates/compute'
import { getVerifiedMaitredSource } from '@/lib/aggregates/maitred'
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
  if (!db) throw new Error('Place directory database unavailable.')
  console.warn(`place-directory: aggregate ${reason}; falling back to a live scan.`)
  const source = await getVerifiedMaitredSource(db)
  return computePlaceDirectory(db, source.holders.map((h) => h.placeId))
}

/** The small index: slug, name, city, indexable, meal count, for every place. One or two reads. */
const getCachedPlaceIndex = unstable_cache(
  async (): Promise<PlaceIndexEntry[]> => {
    if (WEBSITE_FIXTURES) return fixturePlaceIndex()
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
  ['makan-place-index', 'v2-maitred-states'],
  { revalidate: 3600 },
)

/** Cache venue content separately from the five-minute holder eligibility check. */
const getCachedSupplementalPlace = unstable_cache(async (placeId: string): Promise<DirectoryPlace> => {
  const db = getDb()
  if (!db) throw new Error('Place directory database unavailable.')
  return await readPlace(db, placeId) ?? computePlaceDirectoryForPlace(db, placeId)
}, ['makan-maitred-place', 'v1'], { revalidate: 3600 })
const pendingPlaces = new Map<string, Promise<DirectoryPlace>>()

function getSupplementalPlace(placeId: string): Promise<DirectoryPlace> {
  const pending = pendingPlaces.get(placeId)
  if (pending) return pending
  const read = getCachedSupplementalPlace(placeId).finally(() => {
    if (pendingPlaces.get(placeId) === read) pendingPlaces.delete(placeId)
  })
  pendingPlaces.set(placeId, read)
  return read
}

async function getMissingHolderPlaces(existing: { placeId: string }[], requestedId?: string): Promise<DirectoryPlace[]> {
  const db = getDb()
  if (!db) throw new Error('Place directory database unavailable.')
  const source = await getVerifiedMaitredSource(db)
  const present = new Set(existing.map(place => place.placeId))
  const ids = [...new Set(source.holders.map(holder => holder.placeId))]
    .filter(id => !present.has(id) && (requestedId === undefined || id === requestedId))
  return Promise.all(ids.map(getSupplementalPlace))
}

export async function getPlaceIndex(): Promise<PlaceIndexEntry[]> {
  if (WEBSITE_FIXTURES) return fixturePlaceIndex()
  let index: PlaceIndexEntry[] = []
  try {
    index = await getCachedPlaceIndex()
    return [...index, ...indexOf(await getMissingHolderPlaces(index))]
  } catch (err) {
    console.error('place-directory: failed to complete the index.', err)
    return index
  }
}

/** Cache successful full directories only; a provider failure is not an empty catalogue. */
const getCachedPlaceDirectory = unstable_cache(
  async (): Promise<DirectoryPlace[]> => {
    if (WEBSITE_FIXTURES) return fixtureDirectory()
    const db = getDb()
    if (!db) throw new Error('Place directory database unavailable.')
    const [index, fresh] = await Promise.all([readPlaceIndex(db), aggregateIsFresh()])
    if (!index || !fresh) return fallbackDirectory(index ? 'stale' : 'missing')
    const places = await readPlaces(db, index.map((p) => p.placeId))
    return index.map((p) => places.get(p.placeId)).filter((p): p is DirectoryPlace => Boolean(p))
  },
  ['makan-place-directory', 'v5-strict-failure'],
  { revalidate: 3600 },
)

/** Maître callers must preserve failed joins as unavailable, separately from a real empty list. */
export async function getPlaceDirectoryStrict(): Promise<DirectoryPlace[] | null> {
  try {
    const directory = await getCachedPlaceDirectory()
    if (WEBSITE_FIXTURES) return directory
    return [...directory, ...await getMissingHolderPlaces(directory)]
  } catch (err) {
    console.error('place-directory: failed to build the directory.', err)
    return null
  }
}

/** Existing catalogue callers retain their safe empty rendering and share the same successful cache. */
export async function getPlaceDirectory(): Promise<DirectoryPlace[]> {
  return (await getPlaceDirectoryStrict()) ?? []
}

/**
 * One place by its Google Place id: a single document read, never a scan.
 * Only a current eligible holder can recover an absent aggregate. Unknown IDs
 * never trigger meal queries; recovery reads public meals at that venue only.
 */
export async function getDirectoryPlaceById(placeId: string): Promise<DirectoryPlace | null> {
  if (WEBSITE_FIXTURES) return fixtureDirectory().find(place => place.placeId === placeId) ?? null
  try {
    const db = getDb()
    if (!db) return null
    const stored = await readPlace(db, placeId)
    return stored ?? (await getMissingHolderPlaces([], placeId))[0] ?? null
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
