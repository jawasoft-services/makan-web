import type { Firestore } from 'firebase-admin/firestore'
import { isPublicMeal } from './public-meal'
import { accountDeletionFencePath, chosenHandle, isVisiblePublicProfile, mayAppearOnPublicPage } from './profile-visibility'
import { AGE_FIELDS, USER_FIELDS, storagePhoto } from './public-profile-data'
import { shareCardMetaPath, shareCardUrlFrom } from './share-card'

/**
 * RM20616 A12 U3 — what the shared meal page (`/meal/<id>`) may show. Null means gone: the page
 * then says the meal is unavailable and shows nothing of it, whatever the reason.
 *
 * A meal shows only if it is public today (never an old friends-only meal, a draft, a deleted or
 * a moderated one) and its author's account is in good standing, not under the minimum age and not
 * being deleted.
 * The author is named, by @handle and photo, only with a chosen handle. The caption is not shown:
 * it is the diner's answer to "What was this?", not a review to pass on.
 */
const MEAL_ID = /^[A-Za-z0-9_-]{8,64}$/
const DISH_FIELDS = ['uid', 'placeId', 'name', 'retracting', 'dishIsDrink']

const clip = (value: unknown, max: number) => (typeof value === 'string' ? value.trim().slice(0, max) : '')

export type SharedMeal = {
  id: string
  photo: string
  /** The dish the server matched this meal to, or '' (a drink is never a dish). */
  dish: string
  /** The author's chosen handle, or '' for no byline. */
  handle: string
  avatar: string
  placeId: string
  locationName: string
  /** The image today's meal page uses for its preview, when there is no stored card. */
  fallbackImage: string
  cardUrl: string | null
}

export const isSharedMealId = (id: unknown): id is string => typeof id === 'string' && MEAL_ID.test(id)

/** Reads: the meal (1), then its author, the author's age record and deletion fence, the dish and the share card (5). */
export async function loadSharedMeal(db: Firestore, id: string, currentYear: number): Promise<SharedMeal | null> {
  if (!isSharedMealId(id)) return null
  const meal = (await db.doc(`meals/${id}`).get()).data()
  if (!meal || !isPublicMeal(meal)) return null
  const uid = clip(meal.userID, 1500) || clip(meal.uid, 1500)
  const photo = storagePhoto(meal.imageURL)
  if (!uid || uid.includes('/') || !photo) return null
  const [userSnap, ageSnap, fenceSnap, dishSnap, cardSnap] = await db.getAll(
    db.doc(`users/${uid}`), db.doc(`users/${uid}/private/age`), db.doc(accountDeletionFencePath(uid)), db.doc(`dishMemberships/${id}`), db.doc(shareCardMetaPath('meal', id)!),
    { fieldMask: [...new Set([...USER_FIELDS, ...AGE_FIELDS, ...DISH_FIELDS, 'url'])] },
  )
  const stored = userSnap.data()
  const user = stored ? Object.fromEntries(USER_FIELDS.filter((field) => stored[field] !== undefined).map((field) => [field, stored[field]])) : undefined
  const account = { user, age: ageSnap.data(), fenced: fenceSnap.exists }
  if (!mayAppearOnPublicPage(account, currentYear)) return null
  const named = isVisiblePublicProfile(account, currentYear)
  const placeId = clip(meal.placeProviderId, 1500)
  // The dish line comes only from a membership bound to this meal's owner and venue (as the app's Feed).
  const dish = dishSnap.data()
  const dishBound = dish && dish.retracting !== true && dish.uid === uid && (clip(dish.placeId, 1500) || '') === placeId && dish.dishIsDrink !== true
  return {
    id, photo, dish: dishBound ? clip(dish.name, 120) : '',
    handle: named ? chosenHandle(user).slice(0, 24) : '',
    avatar: named ? storagePhoto(user?.photoURL) || storagePhoto(user?.avatar_url) : '',
    placeId: placeId.includes('/') ? '' : placeId, locationName: clip(meal.locationName, 100),
    fallbackImage: storagePhoto(meal.shareCardUrl) || photo,
    cardUrl: shareCardUrlFrom(cardSnap.data(), 'meal', id),
  }
}
