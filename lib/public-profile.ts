import 'server-only'
import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import type { Firestore } from 'firebase-admin/firestore'
import { getDb } from '@/lib/firebase-admin'
import { WEBSITE_FIXTURES, fixturePublicProfile } from '@/lib/website-fixtures'
import { isVisiblePublicProfile } from '@/lib/profile-visibility'
import { isPublicMeal, PUBLIC_MEAL_FIELDS } from '@/lib/public-meal'
import { getMaitredDirectory } from '@/lib/maitred'
import { getPlaceIndex } from '@/lib/place-directory'
import { slugify } from '@/lib/slug'

const KEY = /^[0-9abcdefghjkmnpqrstvwxyz]{8}$/
const PROFILE_CACHE_MS = 300_000
const USER_FIELDS = ['name', 'display_name', 'username', 'photoURL', 'avatar_url', 'bio', 'discoverable_by_friends_of_friends', 'profileSetupCompletedAt', 'deletedAt', 'isDeleted', 'isSpam', 'accountStatus', 'status', 'visibility_status', 'moderationStatus']
const MEAL_FIELDS = ['userID', 'caption', 'locationName', 'imageURL', 'placeProviderId', ...PUBLIC_MEAL_FIELDS]
const clip = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : ''
const documentId = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 1500 && !value.includes('/')

export type ProfileMeal = { id: string; caption: string; locationName: string; imageURL: string; placeId: string; rank?: number; placeSlug?: string }
export type PublicProfileData = { key: string; slug: string; name: string; handle: string; bio: string; avatar: string; top3: ProfileMeal[]; recent: ProfileMeal[]; rolePlaceIds: string[] }
export type PublicProfile = PublicProfileData & { crowns: { placeId: string; name: string; slug: string }[] }

export function profileKey(slug: string): string | null {
  if (slug.length > 80) return null
  const key = slug.slice(-8)
  return KEY.test(key) && (slug === key || /^[a-z0-9]+(?:-[a-z0-9]+)*-$/.test(slug.slice(0, -8))) ? key : null
}

export function profileImage(value: unknown): string {
  const src = clip(value, 2048)
  if (WEBSITE_FIXTURES && /^\/redesign\/[a-z0-9-]+\.(jpg|png|webp)$/.test(src)) return src
  try {
    const url = new URL(src)
    return url.protocol === 'https:' && url.hostname === 'firebasestorage.googleapis.com' && !url.username && !url.password ? src : ''
  } catch { return '' }
}

/** Profile-only reads; site-wide crown and place snapshots are joined separately. */
export async function loadPublicProfileData(db: Firestore, key: string): Promise<PublicProfileData | null> {
  if (!KEY.test(key)) return null
  const registry = (await db.doc(`publicProfileKeys/${key}`).get()).data()
  const uid = registry?.uid
  if (!documentId(uid)) return null
  const [userSnap] = await db.getAll(db.doc(`users/${uid}`), { fieldMask: USER_FIELDS })
  const user = userSnap.data()
  if (!isVisiblePublicProfile(user)) return null
  const handle = clip(user?.username, 24)
  const [projection, roles, recent] = await Promise.all([
    db.doc(`users/${uid}/publicTasteGraph/top3`).get(),
    db.doc(`maitredRoles/${uid}`).get(),
    db.collection('meals').where('userID', '==', uid).where('isPublic', '==', true)
      .where('moderationStatus', '==', 'active').orderBy('timestamp', 'desc').limit(12).select(...MEAL_FIELDS).get(),
  ])
  const entries: unknown[] = Array.isArray(projection.data()?.entries) ? projection.data()!.entries : []
  const candidates = entries.slice(0, 3).flatMap((entry, index) => {
    const id = entry && typeof entry === 'object' ? (entry as Record<string, unknown>).mealId : undefined
    return documentId(id) ? [{ id, rank: index + 1 }] : []
  })
  const snapshots = candidates.length ? await db.getAll(...candidates.map(entry => db.doc(`meals/${entry.id}`)), { fieldMask: MEAL_FIELDS }) : []
  const mealOf = (id: string, meal: Record<string, unknown> | undefined): ProfileMeal[] => !isPublicMeal(meal) || meal?.userID !== uid ? [] : [{
    id, caption: clip(meal.caption, 160), locationName: clip(meal.locationName, 100),
    imageURL: profileImage(meal.imageURL), placeId: documentId(meal.placeProviderId) ? meal.placeProviderId : '',
  }]
  const top3 = snapshots.flatMap((snap, index) => mealOf(candidates[index].id, snap.data()).map(meal => ({ ...meal, rank: candidates[index].rank })))
  const ids = roles.data()?.canonicalPlaceIds
  return {
    key, slug: `${slugify(handle)}-${key}`, name: clip(user?.name, 80) || clip(user?.display_name, 80) || handle,
    handle, bio: clip(user?.bio, 500), avatar: profileImage(user?.photoURL) || profileImage(user?.avatar_url), top3,
    recent: recent.docs.flatMap(snap => mealOf(snap.id, snap.data())),
    rolePlaceIds: Array.isArray(ids) ? [...new Set(ids.filter(documentId))] : [],
  }
}

const getCachedProfile = unstable_cache(async (key: string, window: number) => {
  // A time-bounded cache key prevents stale-while-revalidate from extending public visibility.
  void window
  if (WEBSITE_FIXTURES) return fixturePublicProfile(key)
  const db = getDb()
  if (!db) throw new Error('Profile database unavailable.')
  return loadPublicProfileData(db, key)
}, ['makan-public-profile', 'v1'], { revalidate: 300 })
const pendingProfiles = new Map<string, Promise<PublicProfileData | null>>()
let pendingShared: Promise<[Awaited<ReturnType<typeof getMaitredDirectory>>, Awaited<ReturnType<typeof getPlaceIndex>>]> | null = null

function sharedSnapshots() {
  if (!pendingShared) pendingShared = Promise.all([
    getMaitredDirectory().catch((): Awaited<ReturnType<typeof getMaitredDirectory>> => ({ status: 'unavailable', venues: [] })),
    getPlaceIndex().catch(() => []),
  ]).finally(() => { pendingShared = null })
  return pendingShared
}

export const getPublicProfile = cache(async (key: string): Promise<PublicProfile | null> => {
  if (!KEY.test(key)) return null
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
    const [maitred, places] = await sharedSnapshots()
    const slugs = new Map(places.map(place => [place.placeId, place.slug]))
    const withPlace = (meal: ProfileMeal) => ({ ...meal, placeSlug: slugs.get(meal.placeId) })
    return { ...profile, top3: profile.top3.map(withPlace), recent: profile.recent.map(withPlace),
      crowns: maitred.status === 'ready' ? maitred.venues.filter(venue => profile.rolePlaceIds.includes(venue.placeId))
        .map(({ placeId, name, slug }) => ({ placeId, name, slug })) : [],
    }
  } catch {
    console.error('Public profile unavailable.')
    return null
  }
})
