import 'server-only'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { WEBSITE_FIXTURES, fixturePublicProfile } from '@/lib/website-fixtures'
import { getMaitredDirectory } from '@/lib/maitred'
import { PROFILE_KEY, loadPublicProfileData, type PublicProfileData } from '@/lib/public-profile-data'

export { profileKey } from '@/lib/public-profile-data'
export type { ProfileMeal, PublicProfileData } from '@/lib/public-profile-data'
export type PublicProfile = PublicProfileData & { crowns: { placeId: string; name: string; slug: string }[] }

/**
 * RM20616 A12 U3 — the public profile behind `/u/<handle>-<key>`, cached as RM20603 built it: one
 * load per key every five minutes, shared by concurrent requests and by the page and its metadata.
 * So an account that is closed or held can stay visible here for up to five minutes.
 */
const PROFILE_CACHE_MS = 300_000

const getCachedProfile = unstable_cache(async (key: string, window: number) => {
  // The time window is part of the cache key, so a stale entry is never served while it revalidates.
  void window
  if (WEBSITE_FIXTURES) return fixturePublicProfile(key)
  const db = getDb()
  if (!db) throw new Error('Profile database unavailable.')
  return loadPublicProfileData(db, key, new Date().getUTCFullYear())
}, ['makan-public-profile', 'v2'], { revalidate: 300 })
const pendingProfiles = new Map<string, Promise<PublicProfileData | null>>()

/** The profile, or null when there is none to show: unknown, closed, held, under age, or unreadable. */
export const getPublicProfile = cache(async (key: string): Promise<PublicProfile | null> => {
  if (!PROFILE_KEY.test(key)) return null
  try {
    const window = Math.floor(Date.now() / PROFILE_CACHE_MS)
    const cacheKey = `${key}:${window}`
    let read = pendingProfiles.get(cacheKey)
    if (!read) {
      read = getCachedProfile(key, window).finally(() => { if (pendingProfiles.get(cacheKey) === read) pendingProfiles.delete(cacheKey) })
      pendingProfiles.set(cacheKey, read)
    }
    const profile = await read
    if (!profile) return null
    // The site-wide Maître d' list is the snapshot every page already shares; it is read only for a title holder.
    const maitred = profile.rolePlaceIds.length ? await getMaitredDirectory().catch(() => null) : null
    return { ...profile,
      crowns: maitred?.status === 'ready' ? maitred.venues.filter((venue) => profile.rolePlaceIds.includes(venue.placeId))
        .map(({ placeId, name, slug }) => ({ placeId, name, slug })) : [],
    }
  } catch {
    // No key, uid or name in the log line.
    console.error('Public profile unavailable.')
    return null
  }
})
