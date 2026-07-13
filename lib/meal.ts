import { cache } from "react"
import { getDb } from "@/lib/firebase-admin"

export interface MealData {
  id: string
  mealType?: string
  caption?: string
  imageURL?: string
  shareCardUrl?: string
  locationName?: string
  userID?: string
  username?: string
  isPublic?: boolean | null
  moderationStatus?: string | null
}

/**
 * The single source of truth for the web privacy + safety contract on meals.
 *
 * Firestore security rules are unreachable from the open web (there is no auth
 * session), so any web surface that resolves a meal MUST fail closed here. This
 * mirrors the deployed meal read rule exactly:
 *   - only explicitly-public meals (isPublic === true), AND
 *   - not moderation-removed. The rule is `get('moderationStatus','active') ==
 *     'active'`, i.e. a MISSING moderationStatus is treated as 'active'
 *     (visible), and only an explicit non-'active' value (removed / pending)
 *     hides the meal — a moderation takedown must NEVER stay live on the open
 *     web at /m/<id>, which is the share-card QR + universal-link URL.
 * A missing/false isPublic, an explicit non-active moderationStatus, a missing
 * doc, no DB, and any thrown error all yield null, so a friends-only, private,
 * or removed meal can never render on the public web.
 *
 * Wrapped in React `cache()` so generateMetadata and the page render share a
 * single Firestore read per request. Every meal-resolving route (/m, the legacy
 * /meal, and any future invite preview) goes through this one gate.
 */
export const getPublicMeal = cache(async (id: string): Promise<MealData | null> => {
  try {
    const db = getDb()
    if (!db) return null
    const doc = await db.collection("meals").doc(id).get()
    if (!doc.exists) return null
    const meal = { id: doc.id, ...doc.data() } as MealData
    if (meal.isPublic !== true) return null
    if (meal.moderationStatus != null && meal.moderationStatus !== "active") return null
    return meal
  } catch {
    return null
  }
})

/** Human title for a public meal — shared by every meal surface. */
export function mealTitle(meal: MealData): string {
  return meal.username
    ? `@${meal.username}'s ${meal.mealType || "Meal"}`
    : `A ${meal.mealType || "Meal"} on Makan`
}
