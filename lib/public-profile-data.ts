import type { Firestore } from 'firebase-admin/firestore'
import { isPublicMeal, PUBLIC_MEAL_FIELDS } from './public-meal'
import { accountDeletionFencePath, chosenHandle, isVisiblePublicProfile, venueVisibilityOn } from './profile-visibility'
import { shareCardMetaPath, shareCardUrlFrom } from './share-card'
import { isMakanPhoto } from './storage-bucket'
import { slugify } from './slug'

/**
 * RM20616 A12 U3 — what a person's public page (`/u/<handle>-<key>`) may show, read from Firestore.
 * Resumed from RM20603 (`loadPublicProfileData`), with three changes: the search-off setting is no
 * longer read (Devon, 24 Nov 2026), the under-age record and the venue-visibility setting are, and
 * the page shows no bio and no place names (the board has neither).
 *
 * Everything here is the owner's own public data. A meal appears only if it is public today,
 * not deleted, a draft or moderated, and belongs to this account; an old friends-only meal never
 * does. The Maître d' venues appear only while the owner lets venues see their profile.
 */
export const PROFILE_KEY = /^[0-9abcdefghjkmnpqrstvwxyz]{8}$/
const MAX_TOP = 3
const MAX_RECENT = 12
export const USER_FIELDS = ['name', 'display_name', 'username', 'photoURL', 'avatar_url', 'profileSetupCompletedAt', 'deletedAt', 'isDeleted', 'isSpam', 'spamSuspected', 'accountStatus', 'status', 'visibility_status', 'moderationStatus']
export const AGE_FIELDS = ['birthYear', 'underMinimum']
const MEAL_FIELDS = ['userID', 'locationName', 'imageURL', 'placeProviderId', ...PUBLIC_MEAL_FIELDS]

const clip = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')
const documentId = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 1500 && !value.includes('/')

/** `locationName` is the venue's name, for the photo's alt text. The caption never leaves the loader. */
export type ProfileMeal = { id: string; locationName: string; imageURL: string; placeId: string; rank?: number }
export type PublicProfileData = {
  key: string; slug: string; name: string; handle: string; avatar: string
  top3: ProfileMeal[]; recent: ProfileMeal[]
  /** Venues where the owner holds the title; empty unless they let venues see their profile. */
  rolePlaceIds: string[]
  /** The stored share card (A12 U2), or null. */
  cardUrl: string | null
}

/** The permanent key at the end of a profile slug (`dewi-0k3m9x2a`), or null. Same rule as the app's link parser. */
export function profileKey(slug: string): string | null {
  if (typeof slug !== 'string' || slug.length > 80) return null
  const key = slug.slice(-8)
  return PROFILE_KEY.test(key) && /^[a-z0-9]+(?:-[a-z0-9]+)*-$/.test(slug.slice(0, -8)) ? key : null
}

/** A photo address the page may load: Firebase Storage over https, in Makan's own bucket once that is configured. */
export function storagePhoto(value: unknown): string {
  const src = clip(value, 2048)
  return isMakanPhoto(src) ? src : ''
}

/**
 * Reads: the key (1); the account, its age record and its deletion fence (3); then the top 3 list, the title record, the
 * venue-visibility setting, the share card and up to 12 recent public meals (4 + 12); then up to 3
 * top meals. An unknown key costs 1 read and an account with no public page 4.
 */
export async function loadPublicProfileData(db: Firestore, key: string, currentYear: number): Promise<PublicProfileData | null> {
  if (!PROFILE_KEY.test(key)) return null
  const uid = (await db.doc(`publicProfileKeys/${key}`).get()).data()?.uid
  if (!documentId(uid)) return null
  const [userSnap, ageSnap, fenceSnap] = await db.getAll(db.doc(`users/${uid}`), db.doc(`users/${uid}/private/age`), db.doc(accountDeletionFencePath(uid)), { fieldMask: [...USER_FIELDS, ...AGE_FIELDS] })
  // Only the fields the gate and the page need leave this function.
  const stored = userSnap.data()
  const user = stored ? Object.fromEntries(USER_FIELDS.filter((field) => stored[field] !== undefined).map((field) => [field, stored[field]])) : undefined
  if (!isVisiblePublicProfile({ user, age: ageSnap.data(), fenced: fenceSnap.exists }, currentYear)) return null
  const handle = chosenHandle(user).slice(0, 24)
  // The card is found by the public key, never the uid: its address goes into og:image.
  const cardPath = shareCardMetaPath('profile', key)
  const [projection, roles, visibility, card, recent] = await Promise.all([
    db.doc(`users/${uid}/publicTasteGraph/top3`).get(),
    db.doc(`maitredRoles/${uid}`).get(),
    db.doc(`users/${uid}/maitredSettings/venueVisibility`).get(),
    cardPath ? db.doc(cardPath).get() : null,
    db.collection('meals').where('userID', '==', uid).where('isPublic', '==', true)
      .where('moderationStatus', '==', 'active').orderBy('timestamp', 'desc').limit(MAX_RECENT).select(...MEAL_FIELDS).get(),
  ])
  const entries: unknown[] = Array.isArray(projection.data()?.entries) ? projection.data()!.entries : []
  const candidates = entries.slice(0, MAX_TOP).flatMap((entry, index) => {
    const id = entry && typeof entry === 'object' ? (entry as Record<string, unknown>).mealId : undefined
    return documentId(id) ? [{ id, rank: index + 1 }] : []
  })
  const snapshots = candidates.length ? await db.getAll(...candidates.map((entry) => db.doc(`meals/${entry.id}`)), { fieldMask: MEAL_FIELDS }) : []
  const mealOf = (id: string, meal: Record<string, unknown> | undefined): ProfileMeal[] => {
    if (!meal || !isPublicMeal(meal) || meal.userID !== uid) return []
    const imageURL = storagePhoto(meal.imageURL)
    return imageURL ? [{ id, locationName: clip(meal.locationName, 100), imageURL, placeId: documentId(meal.placeProviderId) ? meal.placeProviderId : '' }] : []
  }
  const ids = roles.data()?.canonicalPlaceIds
  return {
    key, slug: `${slugify(handle)}-${key}`, name: clip(user?.name, 80) || clip(user?.display_name, 80) || handle,
    handle, avatar: storagePhoto(user?.photoURL) || storagePhoto(user?.avatar_url),
    top3: snapshots.flatMap((snap, index) => mealOf(candidates[index].id, snap.data()).map((meal) => ({ ...meal, rank: candidates[index].rank }))),
    recent: recent.docs.flatMap((snap) => mealOf(snap.id, snap.data())),
    rolePlaceIds: venueVisibilityOn(visibility.data()) && Array.isArray(ids) ? [...new Set(ids.filter(documentId))] : [],
    cardUrl: card ? shareCardUrlFrom(card.data(), 'profile', key) : null,
  }
}
