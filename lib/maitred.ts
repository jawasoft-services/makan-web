import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { buildMaitredList, readMaitredHolders } from '@/lib/aggregates/maitred'
import { MAX_AGE_MS, readLastRun, readMaitred } from '@/lib/aggregates/store'
import type { MaitredList, MaitredVenue } from '@/lib/aggregates/types'
import { getPlaceDirectory } from '@/lib/place-directory'

export type { MaitredNotes, MaitredVenue } from '@/lib/aggregates/types'

/**
 * Every restaurant with a current Maître d', from the aggregate the daily
 * cron writes (webAggregates/maitred, built in lib/aggregates/maitred.ts):
 * two document reads an hour at most. Only when the aggregate is missing or
 * the cron has been silent for 36 hours does it read the standings live.
 *
 * null means "not known" (no database, or the read failed), which callers
 * must keep apart from an empty list: a restaurant page must never say
 * nobody holds the seat because a read failed.
 */
const getCachedMaitred = unstable_cache(
  async (): Promise<MaitredList | null> => {
    const db = getDb()
    if (!db) return null
    try {
      const [stored, lastRun] = await Promise.all([readMaitred(db), readLastRun(db)])
      if (stored && lastRun !== null && Date.now() - lastRun.getTime() < MAX_AGE_MS) return stored
      console.warn(`maitred: aggregate ${stored ? 'stale' : 'missing'}; reading the standings live.`)
      const [holders, directory] = await Promise.all([readMaitredHolders(db), getPlaceDirectory()])
      return buildMaitredList(holders, directory)
    } catch (err) {
      console.error('maitred: failed to read; Maître d’ sections are hidden.', err)
      return null
    }
  },
  ['makan-maitred', 'v1'],
  { revalidate: 3600 },
)

export async function getMaitredVenues(): Promise<MaitredVenue[] | null> {
  return (await getCachedMaitred())?.venues ?? null
}

/** The Maître d' at one restaurant: the venue, null when nobody holds it, undefined when unknown. */
export async function getMaitredAt(placeId: string): Promise<MaitredVenue | null | undefined> {
  const venues = await getMaitredVenues()
  if (!venues) return undefined
  return venues.find((v) => v.placeId === placeId) ?? null
}
