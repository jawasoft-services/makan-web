import type { Firestore } from 'firebase-admin/firestore'
import type { DirectoryPlace, PlaceDishes } from './types'

/**
 * RM20616 dish pages U1 — the `dishes` the hourly cron adds to each place aggregate while DISH_PAGES is
 * on (lib/dish-pages.ts). The website adds nothing of its own: it carries what the app's server wrote.
 *
 *   answer  restaurants/{id}.dishToOrder (functions/dishGuidance/dishToOrder.js): the Maître d' pick
 *           when it names a dish on the venue's list, else the venue's public Eat or Yeet top dish.
 *           Never a drink, a retired dish, the venue's own order, or an answer for a test or opted-out
 *           venue. Read through the restaurant read the directory already makes: no read of its own.
 *   rated   venueMenus/{id}.dishRatingOrder (functions/dishGuidance/menuRatingOrder.js): the menu's
 *           dishes diners rated, best first. Only that field is read (a field mask): never the menu's
 *           sections, items or prices. Menus hold no drinks. Read only for a place with an answer, and
 *           only when its answer changed, nothing is stored yet, or in the daily 03 UTC run; otherwise
 *           the stored list is kept.
 *
 * Names only. Ranks set the order and are not kept; no count, price, person or photo is stored. A
 * row's photo is matched when the page is drawn (lib/dish-photo-match.ts), from meals that already
 * passed the page's author check.
 */

export const MAX_RATED_DISHES = 10
export const MAX_DISH_NAME_CHARS = 140
/** Added to the restaurant read lib/aggregates/compute.ts already makes, only while the switch is on. */
export const DISH_VENUE_FIELDS = ['dishToOrder', 'dishNamesPolicy']
/** The one field read from a menu. */
export const RATING_ORDER_FIELDS = ['dishRatingOrder']

export type DishVenue = { dishToOrder?: unknown; dishNamesPolicy?: unknown }
type Answer = PlaceDishes['answer']

/** The app's foldName (components/restaurant/restaurantPagePresentation.ts): lower case, accents and punctuation folded, single spaces. For matching only. */
export const foldName = (value: string): string => value.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

/** The app's readDishToOrder, plus two rules of the web's own: an opted-out venue has no answer, and a name over 140 characters is not one. */
export function readAnswer(venue: DishVenue | undefined): Answer {
  if (!venue || venue.dishNamesPolicy === 'venue_opt_out') return null
  const raw = venue.dishToOrder
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const { name, maitred } = raw as Record<string, unknown>
  if (typeof name !== 'string' || typeof maitred !== 'boolean') return null
  const trimmed = name.trim()
  return trimmed && trimmed.length <= MAX_DISH_NAME_CHARS && foldName(trimmed) ? { name: trimmed, maitred } : null
}

/**
 * The page's rated names from a menu's `dishRatingOrder` ([{ name, rank }], best first). An order the app
 * would not read (readRatingOrder: an entry that is not { name, rank }, or ranks out of order) is no order.
 * Folded duplicates and names over 140 characters are dropped; fewer than 2 names is no list; then the
 * answer leaves the list and at most 10 stay.
 */
export function readRatedNames(order: unknown, answer: string): string[] {
  if (!Array.isArray(order) || !order.length) return []
  const names: string[] = []
  const seen = new Set<string>()
  let previous = 1
  for (const [index, entry] of order.entries()) {
    if (!entry || typeof entry !== 'object') return []
    const { name, rank } = entry as { name?: unknown; rank?: unknown }
    if (typeof name !== 'string' || !name.trim() || typeof rank !== 'number' || !Number.isSafeInteger(rank)) return []
    if (rank < previous || rank > index + 1) return []
    previous = rank
    const trimmed = name.trim()
    const key = foldName(trimmed)
    if (!key || trimmed.length > MAX_DISH_NAME_CHARS || seen.has(key)) continue
    seen.add(key)
    names.push(trimmed)
  }
  if (names.length < 2) return []
  const answerKey = foldName(answer)
  return names.filter(name => foldName(name) !== answerKey).slice(0, MAX_RATED_DISHES)
}

const sameAnswer = (a: Answer, b: Answer) => a === null || b === null ? a === b : a.name === b.name && a.maitred === b.maitred

/** A stored `dishes` value as the last run wrote it, or null for anything else. */
export function parseStoredDishes(value: unknown): PlaceDishes | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const { answer, rated } = value as Record<string, unknown>
  if (!Array.isArray(rated) || !rated.every(name => typeof name === 'string')) return null
  if (answer === null) return { answer: null, rated: [] }
  const parsed = readAnswer({ dishToOrder: answer })
  return parsed ? { answer: parsed, rated: rated as string[] } : null
}

/** Whether this run reads the place's menu order: only with an answer, and only when it is new, changed or due for the daily pass. */
export function needsRatingOrder(answer: Answer, stored: PlaceDishes | null, dailyPass: boolean): boolean {
  return answer !== null && (dailyPass || !stored || !sameAnswer(stored.answer, answer))
}

/**
 * Pure: one place's dishes. `order` is its menu's `dishRatingOrder` when this run read it (null for no menu
 * or no field), and `undefined` when it did not, in which case the stored list stands.
 */
export function buildPlaceDishes(answer: Answer, order: unknown, stored: PlaceDishes | null): PlaceDishes {
  if (!answer) return { answer: null, rated: [] }
  if (order !== undefined) return { answer, rated: readRatedNames(order, answer.name) }
  return { answer, rated: stored && sameAnswer(stored.answer, answer) ? stored.rated : [] }
}

export interface DishRun {
  /** Each place's dish fields, from the restaurant read the directory made (lib/aggregates/compute.ts). */
  venues: ReadonlyMap<string, DishVenue>
  /** What the last run stored for each place (lib/aggregates/store.ts readStoredPlaces). */
  stored: ReadonlyMap<string, PlaceDishes>
  /** The 03 UTC run re-reads the order of every place with an answer. */
  dailyPass: boolean
}

/** Every place with its `dishes`. Reads `venueMenus` (dishRatingOrder only) for the places that need it, 100 to a batch. */
export async function withPlaceDishes(db: Firestore, directory: DirectoryPlace[], run: DishRun): Promise<DirectoryPlace[]> {
  const answers = new Map(directory.map(place => [place.placeId, readAnswer(run.venues.get(place.placeId))]))
  const due = directory.map(place => place.placeId)
    .filter(id => needsRatingOrder(answers.get(id) ?? null, run.stored.get(id) ?? null, run.dailyPass))
  const orders = new Map<string, unknown>()
  for (let i = 0; i < due.length; i += 100) {
    const docs = await db.getAll(...due.slice(i, i + 100).map(id => db.collection('venueMenus').doc(id)), { fieldMask: RATING_ORDER_FIELDS })
    for (const doc of docs) orders.set(doc.id, doc.exists ? doc.data()?.dishRatingOrder ?? null : null)
  }
  return directory.map(place => ({ ...place,
    dishes: buildPlaceDishes(answers.get(place.placeId) ?? null, orders.has(place.placeId) ? orders.get(place.placeId) : undefined, run.stored.get(place.placeId) ?? null) }))
}
