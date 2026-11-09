import type { Review } from "./types"
import { kendalStreetKitchen } from "./kendal-street-kitchen"
import { uliMarylebone } from "./uli-marylebone"
import { slugHash } from "../slug"

/** Every restaurant review is one entry here. To add the next one:
 *  create lib/reviews/<slug>.ts and add it to this array. */
export const reviews: Review[] = [kendalStreetKitchen, uliMarylebone]

export function getReview(slug: string): Review | undefined {
  return reviews.find((r) => r.slug === slug)
}

export function getAllReviews(): Review[] {
  return [...reviews].sort((a, b) => b.datePublished.localeCompare(a.datePublished))
}

export function getReviewForPlace(slug: string): Review | undefined {
  const hash = slugHash(slug)
  return hash ? getAllReviews().find(review => slugHash(review.restaurant.makanSlug) === hash) : undefined
}

export type { Review } from "./types"
