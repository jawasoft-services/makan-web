import { WEBSITE_FIXTURES, fixtureMaitred } from '@/lib/website-fixtures'
import 'server-only'
import { getDb } from '@/lib/firebase-admin'
import { buildMaitredList, readMaitredPhotos, getVerifiedMaitredSource, MAITRED_PUBLIC_MAX_AGE_MS } from '@/lib/aggregates/maitred'
import { readMaitred } from '@/lib/aggregates/store'
import type { MaitredList, MaitredVenue, MaitredDirectoryState, MaitredPlaceState } from '@/lib/aggregates/types'
import { getPlaceDirectoryStrict } from '@/lib/place-directory'

export type { MaitredNotes, MaitredVenue, MaitredDirectoryState, MaitredPlaceState } from '@/lib/aggregates/types'

/**
 * Hard expiry, not stale-while-revalidate: the routes using this reader are
 * dynamic, while their unrelated data keeps its existing caches. Simultaneous
 * consumers share one refresh; a failed/slow refresh never revives old identity.
 */
export { MAITRED_PUBLIC_MAX_AGE_MS } from '@/lib/aggregates/maitred'
interface VerifiedSnapshot { snapshot: MaitredList; verifiedAt: number }
let cached: VerifiedSnapshot | null = null
let pending: Promise<MaitredList | null> | null = null
let failedAt: number | null = null
const FAILURE_RETRY_MS = 10_000

const isFresh = (verifiedAt: number, now = Date.now()) => Number.isFinite(verifiedAt)
  && verifiedAt <= now && now - verifiedAt < MAITRED_PUBLIC_MAX_AGE_MS

async function refreshMaitred(): Promise<VerifiedSnapshot | null> {
  const db = getDb()
  if (!db) return null
  const startedAt = Date.now()
  const stored = await readMaitred(db)
  // Verification starts before the source reads. A later cron heartbeat cannot
  // extend it, even when the cron or this read was slow.
  if (stored && stored.verifiedAt <= startedAt && isFresh(stored.verifiedAt)) {
    return { snapshot: stored, verifiedAt: stored.verifiedAt }
  }
  const [source, directory] = await Promise.all([getVerifiedMaitredSource(db), getPlaceDirectoryStrict()])
  if (source.status === 'disabled') return { snapshot: buildMaitredList(source, [], new Map()), verifiedAt: source.verifiedAt }
  if (!directory) return null
  const photos = await readMaitredPhotos(db, source, directory)
  return { snapshot: buildMaitredList(source, directory, photos), verifiedAt: source.verifiedAt }
}

async function getCachedMaitred(): Promise<MaitredList | null> {
  if (WEBSITE_FIXTURES) return fixtureMaitred()
  if (cached && isFresh(cached.verifiedAt)) return cached.snapshot
  cached = null
  if (failedAt !== null && Date.now() >= failedAt && Date.now() - failedAt < FAILURE_RETRY_MS) return null
  if (pending) return pending
  const refresh = refreshMaitred().then(result => {
    cached = result && isFresh(result.verifiedAt) ? result : null
    failedAt = cached ? null : Date.now()
    return cached?.snapshot ?? null
  }).catch(() => {
    cached = null
    failedAt = Date.now()
    console.error('maitred: public states unavailable.')
    return null
  }).finally(() => { if (pending === refresh) pending = null })
  pending = refresh
  return refresh
}

export async function getMaitredDirectory(): Promise<MaitredDirectoryState> {
  const snapshot = await getCachedMaitred()
  if (!snapshot) return { status: 'unavailable', venues: [] }
  if (snapshot.status === 'disabled') return { status: 'disabled', venues: [] }
  return { status: 'ready', venues: snapshot.venues }
}

export async function getMaitredStateAt(placeId: string): Promise<MaitredPlaceState> {
  const snapshot = await getCachedMaitred()
  if (!snapshot) return { status: 'unavailable' }
  if (snapshot.status === 'disabled') return { status: 'disabled' }
  const venue = snapshot.venues.find(venue => venue.placeId === placeId)
  if (venue) return { status: 'held', venue }
  const known = snapshot.places.find(place => place.placeId === placeId)
  return { status: known?.status ?? 'unavailable' }
}

/** Compatibility for existing lists: disabled and failed are not an empty live catalogue. */
export async function getMaitredVenues(): Promise<MaitredVenue[] | null> {
  const directory = await getMaitredDirectory()
  return directory.status === 'ready' ? directory.venues : null
}

/** Only proven vacancy yields null. Unknown/disabled/unresolved are omitted by old consumers. */
export async function getMaitredAt(placeId: string): Promise<MaitredVenue | null | undefined> {
  const place = await getMaitredStateAt(placeId)
  if (place.status === 'held') return place.venue
  return place.status === 'vacant' ? null : undefined
}
