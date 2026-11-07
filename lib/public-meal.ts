/** Fields needed to decide whether a meal may appear on the public website. */
export const PUBLIC_MEAL_FIELDS = [
  'isPublic', 'isDeleted', 'deletedAt', 'isPublicDraft', 'isLocalDraft',
  'isLocalOnly', 'storageScope', 'moderationStatus',
] as const

/** A public flag alone does not make deleted, moderated, draft or local data public. */
export function isPublicMeal(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const meal = value as Record<string, unknown>
  return meal.isPublic === true
    && meal.isDeleted !== true
    && !meal.deletedAt
    && meal.isPublicDraft !== true
    && meal.isLocalDraft !== true
    && meal.isLocalOnly !== true
    && meal.storageScope !== 'local_private'
    && (!meal.moderationStatus || meal.moderationStatus === 'active')
}
