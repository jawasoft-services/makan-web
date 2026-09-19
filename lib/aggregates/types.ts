import type { PlaceWhere } from '@/lib/place-city'

/**
 * The shapes the site renders from. They are computed once an hour by the
 * aggregate cron (lib/aggregates/compute.ts), stored in Firestore
 * (lib/aggregates/store.ts), and read by lib/eat-standings.ts,
 * lib/place-directory.ts and lib/makan-stats.ts. Pages import the types
 * from those three modules, unchanged.
 */

export interface StandingRow {
  placeId: string
  /** URL slug: name plus six characters of the id. */
  slug: string
  name: string
  eats: number
  yeets: number
  ties: number
  matchups: number
  /** eats / matchups, 0..1 */
  eatRate: number
  /** ISO date of the first meal ever tagged to the place, or null. */
  since: string | null
  /** City and country, or null when the place can't be located. */
  where: PlaceWhere | null
  /** Coordinates from the place seed, for the map. */
  lat: number | null
  lng: number | null
  /** Public, active meals tagged to the place. */
  publicMeals: number
  /** Up to three recent, clean public captions saved here, newest first. */
  recentCaptions: string[]
  /** Position in the global standings (evidence floor met), else null. */
  rank: number | null
  /** Position in the city standings (city floor met, city page exists), else null. */
  cityRank: number | null
}

export interface CityStanding {
  slug: string
  city: string
  country: string
  /** Restaurants at or above the city floor, ranked. */
  rows: StandingRow[]
}

export interface EatStandings {
  /** Restaurants at or above the evidence floor, ranked. */
  rows: StandingRow[]
  /** Every restaurant with at least one verified matchup, same order. */
  all: StandingRow[]
  /** Cities with enough ranked restaurants for a page of their own. */
  cities: CityStanding[]
  /** Restaurants with at least one verified matchup but under the floor. */
  belowFloor: number
  /** Verified cross-restaurant matchups counted, all restaurants. */
  matchups: number
  /** Distinct countries among the ranked rows. */
  countries: number
  /** When this snapshot was computed (ISO). */
  computedAt: string
}

/** No score is shown below this many verified matchups (spec §2, RM19117 §6). */
export const EVIDENCE_FLOOR = 10
/** A city page ranks restaurants from this many matchups: a city is a smaller pool. */
export const CITY_FLOOR = 5
/** A city page needs at least this many restaurants over the city floor. */
export const MIN_CITY_ROWS = 2

export const EMPTY_STANDINGS: EatStandings = { rows: [], all: [], cities: [], belowFloor: 0, matchups: 0, countries: 0, computedAt: '' }

export interface DirectoryMeal {
  id: string
  src: string
  /** A smaller copy for grids, when the app made one. */
  thumb: string
  caption: string
  mealType: string
  username: string
  /** ISO timestamp */
  at: string
}

export interface DirectoryPlace {
  placeId: string
  slug: string
  hash: string
  name: string
  where: PlaceWhere | null
  address: string
  lat: number | null
  lng: number | null
  cuisine: string[]
  /** ISO date of the first meal ever tagged here, or null. */
  since: string | null
  /** Public meals saved here, newest first. */
  meals: DirectoryMeal[]
  /** Whether search engines should index the page (enough on it to be worth a result). */
  indexable: boolean
}

/** A single meal with no matchups is a real page but not worth a search result. */
export const INDEX_MIN_MEALS = 2

/** The small per-place record the sitemap, static params and lookups use. */
export interface PlaceIndexEntry {
  placeId: string
  slug: string
  hash: string
  name: string
  city: string | null
  indexable: boolean
  /** Public meals saved here. */
  meals: number
}

export interface PlaceStats {
  /** Distinct venues (Google Place ids) with at least one meal saved. */
  places: number
  /** Meals saved in the trailing 30 days. */
  recentMeals: number
  /** Total meals ever saved. The persisted value getMealCount falls back to. */
  mealCount: number
  /** The venues with the most meals saved, most first. Real names, as tagged. */
  topPlaces: { name: string; meals: number }[]
}

export const TOP_PLACES = 6

// Safe floors if nothing can be read: below what was measured on
// 2026-09-02 (666 places, 692 meals in 30 days), never above it.
export const FALLBACK_PLACE_STATS: PlaceStats = { places: 600, recentMeals: 500, mealCount: 581, topPlaces: [] }
