import 'server-only'
import { createHash } from 'node:crypto'
import type { DirectoryPlace, EatStandings, MaitredList, PlaceStats, StandingRow } from './aggregates/types'
import type { PublicMeal } from './makan-stats'
import type { ClaimVenue } from './claim-link'
import type { LinkedPlace } from './place-link'
import type { TasteInvitePreview } from './taste-invite'

/** Explicit local build/test lane. Never infer safety from missing credentials: ADC may exist. */
export const WEBSITE_FIXTURES = process.env.MAKAN_WEBSITE_FIXTURES === '1'
const hosting = ['VERCEL', 'K_SERVICE', 'K_REVISION', 'FIREBASE_APP_HOSTING', 'FIREBASE_APP_HOSTING_ENV']
if (WEBSITE_FIXTURES && hosting.some(key => Boolean(process.env[key]))) {
  throw new Error('Website fixtures are local-only and cannot run in a deployment environment.')
}
const state = process.env.MAKAN_WEBSITE_FIXTURE_STATE ?? 'healthy'
if (WEBSITE_FIXTURES && !['healthy', 'empty', 'unavailable', 'stale', 'maitred-vacant', 'maitred-unresolved', 'maitred-disabled', 'maitred-no-order', 'maitred-no-photo'].includes(state)) {
  throw new Error('Unknown website fixture state.')
}
export const FIXTURE_STATE = state
export const FIXTURE_SECRET = 'f'.repeat(43) // Public test token, never an app credential.
export const FIXTURE_DISH_ID = 'd_00000000000000000001'
export const FIXTURE_PLACE_ID = 'fixture_kendal_0001'
export const FIXTURE_SLUG = 'kendal-street-kitchen-f10001'
export const FIXTURE_CHECKED_AT = state === 'stale' ? '2026-09-01T12:00:00.000Z' : '2026-11-06T12:00:00.000Z'
const unavailable = state === 'unavailable' || state === 'empty'
const photo = (name: string) => `/redesign/${name}.jpg`

const meals = [
  { id: 'fixture-public-meal', src: photo('prawns'), thumb: '', caption: 'Harissa prawns at Kendal Street Kitchen', mealType: 'Dinner', username: 'makan_fixture', at: '2026-11-05T18:00:00.000Z' },
  { id: 'fixture-public-meal-2', src: photo('tiramisu'), thumb: '', caption: 'Tiramisu after dinner', mealType: 'Dinner', username: 'makan_fixture', at: '2026-11-04T18:00:00.000Z' },
  { id: 'fixture-public-meal-3', src: photo('dining'), thumb: '', caption: 'An evening at the table', mealType: 'Dinner', username: 'makan_fixture', at: '2026-11-03T18:00:00.000Z' },
]
const base: DirectoryPlace = {
  placeId: FIXTURE_PLACE_ID, slug: FIXTURE_SLUG, hash: 'f10001', name: 'Kendal Street Kitchen',
  where: { city: 'London', country: 'United Kingdom' }, address: 'Kendal Street, London',
  lat: 51.514, lng: -0.166, cuisine: ['Mediterranean'], since: '2026-10-01T12:00:00.000Z', meals, indexable: true, claimed: false,
}
const places: DirectoryPlace[] = [base,
  { ...base, placeId: 'fixture_cafe_000002', slug: 'fixture-cafe-f10002', hash: 'f10002', name: 'Fixture Café', address: '', lat: 51.516, lng: -0.164, meals: [meals[1]], indexable: false, claimed: true },
]
export const fixtureDirectory = (): DirectoryPlace[] => unavailable ? [] : places
export const fixturePlaceIndex = () => fixtureDirectory().map(p => ({ placeId: p.placeId, slug: p.slug, hash: p.hash, name: p.name, city: p.where?.city ?? null, indexable: p.indexable, meals: p.meals.length }))
export const fixturePublicMeals = (): PublicMeal[] => unavailable ? [] : meals.map(m => ({ src: m.src, alt: m.caption, caption: m.caption, locationName: base.name, mealType: m.mealType, username: m.username }))
export const fixturePlaceStats = (): PlaceStats => ({ places: unavailable ? 0 : places.length, recentMeals: unavailable ? 0 : meals.length, mealCount: unavailable ? 0 : 5700, topPlaces: unavailable ? [] : [{ name: base.name, meals: meals.length }] })
export const fixturePhoto = (placeId: string) => unavailable || !places.some(p => p.placeId === placeId) ? null : { uri: photo('dining'), author: '@ridorichard', authorUri: 'https://www.makanofficial.com/blog/kendal-street-kitchen' }

export function fixtureStandings(): EatStandings {
  const rows: StandingRow[] = unavailable ? [] : places.map((p, i) => ({ placeId: p.placeId, slug: p.slug, name: p.name,
    eats: i ? 6 : 8, yeets: i ? 4 : 2, ties: 0, matchups: 10, eatRate: i ? .6 : .8,
    since: p.since, where: p.where, lat: p.lat, lng: p.lng, publicMeals: p.meals.length,
    recentCaptions: p.meals.map(m => m.caption), rank: i + 1, cityRank: i + 1,
  }))
  return { rows, all: rows, cities: rows.length ? [{ slug: 'london', city: 'London', country: 'United Kingdom', rows }] : [], belowFloor: 0, matchups: rows.length * 10, countries: rows.length ? 1 : 0, computedAt: FIXTURE_CHECKED_AT }
}
export function fixtureMaitred(): MaitredList | null {
  if (state === 'unavailable') return null
  const status = state === 'maitred-disabled' ? 'disabled' : 'ready'
  const places: MaitredList['places'] = state === 'maitred-vacant' || state === 'maitred-unresolved'
    ? [{ placeId: base.placeId, status: state === 'maitred-vacant' ? 'vacant' : 'unresolved' }] : []
  const venues: MaitredList['venues'] = state === 'empty' || status === 'disabled' || places.length ? [] : [{
    placeId: base.placeId, slug: base.slug, name: base.name, where: base.where,
    holderName: 'Alex', holderPhoto: null, photo: state === 'maitred-no-photo' ? null : meals[0].src,
    notes: { always: state === 'maitred-no-order' ? '' : 'Harissa prawns', another: '', why: '', tip: '' },
  }]
  return { schemaVersion: 2, verifiedAt: Date.now(), status, venues, places }
}
export function fixtureClaim(token: string): ClaimVenue | null {
  const place = fixtureDirectory().find(p => p.slug === token)
  return place ? { token, placeId: place.placeId, name: place.name, area: place.where?.city ?? '', mealCount: place.meals.length, claimed: Boolean(place.claimed), appLink: place.placeId === base.placeId } : null
}
export function fixtureLinkedPlace(placeId: string, dishId?: string): LinkedPlace | null {
  const place = fixtureDirectory().find(p => p.placeId === placeId)
  return place ? { placeId, name: place.name, publicMealCount: place.meals.length, imageUrl: place.meals[0]?.src ?? null,
    dish: dishId === FIXTURE_DISH_ID ? { dishId, name: 'Harissa prawns', publicMealCount: 1 } : null,
  } : null
}
export function fixtureMeal(id: string) {
  if (unavailable) return null
  if (id === 'fixture-private-meal') return { id, isPublic: false, caption: 'PRIVATE FIXTURE MUST NOT LEAK', imageURL: photo('prawns') }
  const meal = meals.find(m => m.id === id)
  return meal ? { id, isPublic: true, mealType: meal.mealType, caption: meal.caption, imageURL: meal.src, username: meal.username, userID: 'fixture-diner', locationName: base.name, placeProviderId: base.placeId } : null
}

/** Raw invite fixtures still pass through the route's real hash and terminal-state checks. */
export function fixtureTableInvite(publicId: string): Record<string, unknown> | null {
  if (unavailable) return null
  const statuses: Record<string, string> = { fixtureTable: 'active', expiredTable: 'active', revokedTable: 'revoked', fullTable___: 'full' }
  if (!(publicId in statuses)) return null
  const date = new Date(publicId === 'expiredTable' ? '2000-01-01T00:00:00Z' : '2099-01-01T00:00:00Z')
  return { consentVersion: 2, status: statuses[publicId], tokenHash: createHash('sha256').update(FIXTURE_SECRET).digest('hex'), hostDisplayName: 'Alex', hostAvatarUrl: '', expiresAt: { toMillis: () => date.getTime(), toDate: () => date } }
}
export function fixtureTaste(publicId: string, secret: string): TasteInvitePreview {
  const empty = { hostDisplayName: '', hostAvatarUrl: '', meals: [] }
  if (state === 'unavailable') return { state: 'unavailable', ...empty }
  if (secret !== FIXTURE_SECRET || !['fixtureTaste', 'expiredTaste', 'revokedTaste', 'privateTaste'].includes(publicId)) return { state: 'invalid', ...empty }
  if (publicId === 'expiredTaste') return { state: 'expired', ...empty }
  if (publicId === 'revokedTaste') return { state: 'revoked', ...empty }
  if (publicId === 'privateTaste') return { state: 'invalid', ...empty }
  return { state: 'active', hostDisplayName: 'Alex', hostAvatarUrl: '', meals: state === 'empty' ? [] : meals.map(m => ({ mealId: m.id, caption: m.caption, locationName: base.name, imageURL: m.src })) }
}
