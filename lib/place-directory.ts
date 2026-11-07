import { WEBSITE_FIXTURES, fixtureDirectory, fixturePlaceIndex } from '@/lib/website-fixtures'
import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { getPublicVenues, getExcludedPublicVenueIds, type PublicVenue } from '@/lib/public-venues'
import { getEatStandings } from '@/lib/eat-standings'
import { placeSlug } from '@/lib/slug'
import { computePlaceDirectory, computePlaceDirectoryForPlace, indexOf } from '@/lib/aggregates/compute'
import { getVerifiedMaitredSource } from '@/lib/aggregates/maitred'
import { MAX_AGE_MS, readLastRun, readPlace, readPlaceIndex, readPlaces } from '@/lib/aggregates/store'
import type { DirectoryPlace, PlaceIndexEntry } from '@/lib/aggregates/types'

export { INDEX_MIN_MEALS } from '@/lib/aggregates/types'
export type { DirectoryMeal, DirectoryPlace, PlaceIndexEntry } from '@/lib/aggregates/types'

/**
 * Every restaurant on Makan that has public meals, as the app's place screen
 * would show it. Read from the aggregate documents the hourly Firebase Scheduler job writes:
 * a small sharded index for lists, and one document per place for a page.
 * The full scan (lib/aggregates/compute.ts) runs only for the cached index
 * and directory lists, when the aggregate is missing or the cron has been
 * silent for two hours, which is logged; single-place reads never scan.
 */

async function aggregateIsFresh(): Promise<boolean> {
  const db = getDb()
  if (!db) return false
  const lastRun = await readLastRun(db)
  return lastRun !== null && Date.now() >= lastRun.getTime() && Date.now() - lastRun.getTime() < MAX_AGE_MS
}

async function fallbackDirectory(reason: string): Promise<DirectoryPlace[]> {
  const db = getDb()
  if (!db) throw new Error('Place directory database unavailable.')
  console.warn(`place-directory: aggregate ${reason}; falling back to a live scan.`)
  const [source, standings] = await Promise.all([getVerifiedMaitredSource(db), getEatStandings()])
  return computePlaceDirectory(db, [...source.holders.map(h => h.placeId), ...standings.all.map(r => r.placeId)])
}

/** The small index: slug, name, city, indexable, meal count, for every place. One or two reads. */
const getCachedPlaceIndex = unstable_cache(
  async (): Promise<PlaceIndexEntry[]> => {
    if (WEBSITE_FIXTURES) return fixturePlaceIndex()
    const db = getDb()
    if (!db) throw new Error('Place directory database unavailable.')
    const [index, fresh] = await Promise.all([readPlaceIndex(db), aggregateIsFresh()])
    if (index && fresh) return index
    return indexOf(await fallbackDirectory(index ? 'stale' : 'missing'))
  },
  ['makan-place-index', 'v3-complete-public'],
  { revalidate: 3600 },
)

/** Cache venue content separately from the five-minute holder eligibility check. */
const getCachedSupplementalPlace = unstable_cache(async (placeId: string): Promise<DirectoryPlace> => {
  const db = getDb()
  if (!db) throw new Error('Place directory database unavailable.')
  return await readPlace(db, placeId) ?? computePlaceDirectoryForPlace(db, placeId)
}, ['makan-public-place', 'v2-counts'], { revalidate: 3600 })
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

async function getMissingPublicPlaces(existing: { placeId: string }[], venues: PublicVenue[], requestedId?: string): Promise<DirectoryPlace[]> {
  const db = getDb()
  if (!db) throw new Error('Place directory database unavailable.')
  const source = await getVerifiedMaitredSource(db)
  const holders = new Set(source.holders.map(holder => holder.placeId))
  if (requestedId !== undefined) {
    const venue = venues.find(v => v.placeId === requestedId)
    if (!venue && !holders.has(requestedId)) return []
    if (holders.has(requestedId) || (venue && venue.publicMealCount > 0)) return [await getSupplementalPlace(requestedId)]
  }
  const standings = await getEatStandings()
  const publicIds = new Set(venues.map(v => v.placeId))
  const ids = new Set([...holders,
    ...venues.filter(v => v.publicMealCount > 0).map(v => v.placeId),
    ...standings.all.filter(row => publicIds.has(row.placeId)).map(row => row.placeId)])
  const present = new Set(existing.map(place => place.placeId))
  return Promise.all([...ids].filter(id => !present.has(id) && (requestedId === undefined || id === requestedId)).map(getSupplementalPlace))
}

function currentVenue(place: DirectoryPlace, venues: PublicVenue[]): DirectoryPlace {
  const venue = venues.find(v => v.placeId === place.placeId)
  return venue ? { ...place, name: venue.name, slug: placeSlug(venue.name, place.placeId),
    publicMealCount: venue.publicMealCount, lat: place.lat ?? venue.lat, lng: place.lng ?? venue.lng } : place
}

export async function getPlaceIndex(): Promise<PlaceIndexEntry[]> {
  if (WEBSITE_FIXTURES) return fixturePlaceIndex()
  let index: PlaceIndexEntry[] = []
  try {
    const base = await getCachedPlaceIndex()
    const [venues, excludedIds] = await Promise.all([getPublicVenues(), getExcludedPublicVenueIds()])
    index = base.filter(entry => !excludedIds.includes(entry.placeId))
    const completed = index.map(entry => {
      const venue = venues.find(v => v.placeId === entry.placeId)
      return venue ? { ...entry, name: venue.name, slug: placeSlug(venue.name, entry.placeId), meals: venue.publicMealCount } : entry
    })
    return [...completed, ...indexOf((await getMissingPublicPlaces(index, venues)).map(place => currentVenue(place, venues)))]
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
    return Promise.all(index.map(async entry => places.get(entry.placeId) ?? getSupplementalPlace(entry.placeId)))
  },
  ['makan-place-directory', 'v6-complete-public'],
  { revalidate: 3600 },
)

/** Maître callers must preserve failed joins as unavailable, separately from a real empty list. */
export async function getPlaceDirectoryStrict(): Promise<DirectoryPlace[] | null> {
  try {
    const directory = await getCachedPlaceDirectory()
    if (WEBSITE_FIXTURES) return directory
    const [venues, excludedIds] = await Promise.all([getPublicVenues(), getExcludedPublicVenueIds()])
    return [...directory, ...await getMissingPublicPlaces(directory, venues)].filter(place => !excludedIds.includes(place.placeId)).map(place => currentVenue(place, venues))
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
 * Public restaurant projections and current holders can recover an absent aggregate.
 * Unknown IDs never trigger meal queries; recovery reads public meals at that venue only.
 */
export async function getDirectoryPlaceById(placeId: string): Promise<DirectoryPlace | null> {
  if (WEBSITE_FIXTURES) return fixtureDirectory().find(place => place.placeId === placeId) ?? null
  try {
    const db = getDb()
    if (!db) return null
    const [stored, venues, excludedIds] = await Promise.all([readPlace(db, placeId), getPublicVenues(), getExcludedPublicVenueIds()])
    if (excludedIds.includes(placeId)) return null
    const place = stored ?? (await getMissingPublicPlaces([], venues, placeId))[0] ?? null
    return place ? currentVenue(place, venues) : null
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
