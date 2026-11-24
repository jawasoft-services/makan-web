import { isCleanCaption } from './captions'

/**
 * The homepage dish wall: which public meals it may show, and in what order. Pure, so the rules are
 * tested without Firestore (lib/dish-wall.test.mjs); lib/makan-stats.ts does the reads and the gates
 * that need them (public meal, author standing, minimum age, deletion fence, dish binding).
 *
 * Devon, 24 Nov 2026: photo-only meal previews of dishes tagged at restaurants; pork never appears,
 * in either locale; drinks never appear as dishes (food-only rule, 17 Nov 2026). Public material
 * favours meals tagged at a real restaurant (`isRestaurantTagged` with a place id); a meal at a place
 * that is not a restaurant is used only as a fallback.
 */

/** One public meal that has already passed the read-time gates. */
export type WallCandidate = {
  id: string
  photo: string
  /** Menu dish the server matched this meal to (dishMemberships, bound to owner and venue), or ''. */
  dish: string
  caption: string
  locationName: string
  mealType: string
  /** The author's chosen handle when they may be named, or ''. */
  handle: string
  uid: string
  /** `isRestaurantTagged` on the meal: tagged at a real restaurant, not just any place. */
  restaurant: boolean
}

/** A meal as the wall draws it. `dish` is the matched menu dish, else the diner's own caption. */
export type WallMeal = {
  id: string
  src: string
  dish: string
  venue: string
  mealType: string
  handle: string
}

export const PREVIEW_COUNT = 5
export const WALL_COUNT = 37
// A dozen cards from two accounts reads as one family's diary.
export const MAX_PER_ACCOUNT = 2

// The pitch is places you sit down in; a delivery branch proves the opposite.
export const DELIVERY_VENUE = /\b(delivery|gofood|grabfood|shopeefood|deliveroo|uber ?eats)\b/i

// ponytail: keyword match on the dish line only. A plate whose name hides pork ("Full English")
// still passes; upgrade to a dish-level flag if the matcher ever records ingredients.
const PORK = /\b(pork|babi|bacon|ham|gammon|sausages?|chorizo|char ?siu|cha ?siu|siu ?yuk|lechon|guling|prosciutto|pancetta|salami|pepperoni|porchetta|tonkotsu|tonkatsu|katsudon|lardons?|carnitas|chicharr[oó]n|jam[oó]n|serrano|bak ?kut ?teh|crackling)\b/i
const DRINK = /\b(coffees?|kopi|lattes?|cappuccinos?|espressos?|americanos?|flat whites?|teas?|teh|matcha|chai|boba|beers?|wines?|cocktails?|mocktails?|smoothies?|juices?|jus|lemonades?|sodas?|milkshakes?|frappes?|negronis?|margaritas?|spritz(es)?|sake|soju|whisk(e)?y|bourbon|gin|rum|vodka)\b/i

const MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snack'])

/** The words a card shows for this meal, or '' when it must not appear. */
export function wallDish(candidate: Pick<WallCandidate, 'dish' | 'caption'>): string {
  const dish = candidate.dish.trim() || (isCleanCaption(candidate.caption) ? candidate.caption.trim() : '')
  if (!dish || PORK.test(dish) || DRINK.test(dish)) return ''
  return dish.slice(0, 80)
}

/**
 * Orders the gated candidates (newest first) into the five previews and the spiral. Venue-tagged
 * meals only, in this order: restaurant meals with a matched menu dish, other restaurant meals, then
 * (fallback only) meals at a place that is not a restaurant. At most two per account; one card per
 * dish at a venue. Previews also need a named author and a known meal type, because the card shows
 * both. Nothing repeats between the previews and the spiral. `fallback` counts the non-restaurant
 * meals used.
 */
export function selectDishWall(candidates: readonly WallCandidate[]): { previews: WallMeal[]; wall: WallMeal[]; fallback: number } {
  const perAccount = new Map<string, number>()
  const seenDish = new Set<string>()
  const tagged: WallMeal[] = []
  const captioned: WallMeal[] = []
  const elsewhere: WallMeal[] = []
  for (const c of candidates) {
    const venue = c.locationName.trim()
    if (!venue || DELIVERY_VENUE.test(venue) || !c.photo || !c.uid) continue
    const dish = wallDish(c)
    if (!dish) continue
    const key = `${dish.toLowerCase()}|${venue.toLowerCase()}`
    if (seenDish.has(key)) continue
    const n = (perAccount.get(c.uid) ?? 0) + 1
    if (n > MAX_PER_ACCOUNT) continue
    perAccount.set(c.uid, n)
    seenDish.add(key)
    const mealType = MEAL_TYPES.has(c.mealType.toLowerCase()) ? c.mealType.toLowerCase() : ''
    const meal = { id: c.id, src: c.photo, dish, venue, mealType, handle: c.handle }
    ;(!c.restaurant ? elsewhere : c.dish.trim() ? tagged : captioned).push(meal)
  }
  const ordered = [...tagged, ...captioned, ...elsewhere]
  const previews = ordered.filter((m) => m.handle && m.mealType).slice(0, PREVIEW_COUNT)
  const used = new Set(previews.map((m) => m.id))
  const wall = ordered.filter((m) => !used.has(m.id)).slice(0, WALL_COUNT)
  const fallbackIds = new Set(elsewhere.map((m) => m.id))
  return { previews, wall, fallback: [...previews, ...wall].filter((m) => fallbackIds.has(m.id)).length }
}
