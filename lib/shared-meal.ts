import 'server-only'
import { cache } from 'react'
import { getDb } from '@/lib/firebase-admin'
import { WEBSITE_FIXTURES, fixtureSharedMeal } from '@/lib/website-fixtures'
import { loadSharedMeal, type SharedMeal } from '@/lib/shared-meal-data'

export type { SharedMeal } from '@/lib/shared-meal-data'

/**
 * RM20616 A12 U3 — the shared meal, checked on every request (visibility can change after a link
 * is sent), as today's meal page does. React's request cache shares the one load between the page
 * and its metadata. A failed read is "gone": the author's standing could not be checked.
 */
export const getSharedMeal = cache(async (id: string): Promise<SharedMeal | null> => {
  try {
    if (WEBSITE_FIXTURES) return fixtureSharedMeal(id)
    const db = getDb()
    return db ? await loadSharedMeal(db, id, new Date().getUTCFullYear()) : null
  } catch {
    // No meal id, uid or handle in the log line.
    console.error('Shared meal unavailable.')
    return null
  }
})
