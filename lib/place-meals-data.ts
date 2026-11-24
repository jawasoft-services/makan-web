import type { Firestore } from 'firebase-admin/firestore'
import { isPublicMeal, PUBLIC_MEAL_FIELDS } from './public-meal'
import { accountDeletionFencePath, mayAppearOnPublicPage } from './profile-visibility'
import { AGE_FIELDS, USER_FIELDS } from './public-profile-data'

/**
 * RM20616 A12 U3 — whose meal photos the restaurant page may show. The place aggregate lists a
 * venue's public meals but never looks at their authors' accounts, so the page asks here before it
 * uses a photo as its hero, in its grid or in its JSON-LD: the same standing check the meal page
 * and the profile page make (`mayAppearOnPublicPage`), nothing page-specific.
 */
const documentId = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 1500 && !value.includes('/')

/** The owner of each meal that is public today, by meal id. One read per meal, in one batch. */
export async function loadMealOwners(db: Firestore, mealIds: readonly string[]): Promise<Record<string, string>> {
  const ids = [...new Set(mealIds.filter(documentId))]
  if (!ids.length) return {}
  const snapshots = await db.getAll(...ids.map((id) => db.doc(`meals/${id}`)), { fieldMask: ['userID', 'uid', ...PUBLIC_MEAL_FIELDS] })
  const owners: Record<string, string> = {}
  snapshots.forEach((snapshot, index) => {
    const meal = snapshot.data()
    const uid = meal ? (documentId(meal.userID) ? meal.userID : documentId(meal.uid) ? meal.uid : '') : ''
    if (meal && uid && isPublicMeal(meal)) owners[ids[index]] = uid
  })
  return owners
}

/** Whether an account's meals may be on a public page: its `users` document, age record and deletion fence (3 reads). */
export async function loadAuthorMayAppear(db: Firestore, uid: string, currentYear: number): Promise<boolean> {
  if (!documentId(uid)) return false
  const [user, age, fence] = await db.getAll(
    db.doc(`users/${uid}`), db.doc(`users/${uid}/private/age`), db.doc(accountDeletionFencePath(uid)),
    { fieldMask: [...USER_FIELDS, ...AGE_FIELDS] },
  )
  return mayAppearOnPublicPage({ user: user.data(), age: age.data(), fenced: fence.exists }, currentYear)
}
