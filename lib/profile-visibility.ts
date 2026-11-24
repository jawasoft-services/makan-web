/**
 * RM20616 A12 U3 — who may appear on a public website page. Pure: it reads documents it is
 * handed and nothing else. One gate for the `/u/` page, the meal page's byline and the
 * taste-invite preview's sibling rules (ported from RM20603's `isVisiblePublicProfile`).
 *
 * "Discoverable in Search" off (`discoverable_by_friends_of_friends: false`) means search only
 * (Devon, 24 Nov 2026): a person's own link works when they send it. This file never reads that
 * field. The same decision lives in the app at utils/sharePolicy.ts (`mayShareOwnProfileLink`).
 */
type Doc = unknown

export const MINIMUM_AGE = 13

const UNAVAILABLE = new Set(['deleted', 'disabled', 'held', 'hidden', 'moderated', 'pending', 'suspended', 'spam', 'banned', 'deactivated'])
const STATUS_FIELDS = ['accountStatus', 'status', 'visibility_status', 'moderationStatus'] as const
const PLACEHOLDER_HANDLE = /^user_[0-9a-z]{8}_[0-9a-z]{6,9}$/i

const record = (value: Doc): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

/**
 * Whether an account is in good standing. A missing document, a deleted or spam account, and one
 * that any status field marks as held, disabled, hidden or moderated are all unavailable.
 */
export function accountStanding(user: Doc): 'active' | 'unavailable' {
  const doc = record(user)
  if (!doc) return 'unavailable'
  if (doc.deletedAt || doc.isDeleted === true) return 'unavailable'
  if (doc.isSpam === true || doc.spamSuspected === true) return 'unavailable'
  if (STATUS_FIELDS.some((field) => UNAVAILABLE.has(text(doc[field]).toLowerCase()))) return 'unavailable'
  if (text(doc.accountStatus) !== '' && text(doc.accountStatus) !== 'active') return 'unavailable'
  return 'active'
}

/**
 * The server's age record (`users/<uid>/private/age`) says this account is under the minimum age.
 * The app closes such an account; this covers one whose closing has not finished. No record is
 * not an answer: accounts from before the age question stay open and are asked at launch.
 */
export function isUnderMinimumAge(age: Doc, currentYear: number): boolean {
  const doc = record(age)
  if (!doc) return false
  if (doc.underMinimum === true) return true
  return typeof doc.birthYear === 'number' && Number.isInteger(doc.birthYear) && doc.birthYear > currentYear - MINIMUM_AGE
}

/** The handle a person chose, without its @. A placeholder the app assigned is no handle. */
export function chosenHandle(user: Doc): string {
  const handle = text(record(user)?.username).replace(/^@/, '')
  return handle && !PLACEHOLDER_HANDLE.test(handle) ? handle : ''
}

/** Whether anything by this account (a meal, with or without a byline) may be on a public page. */
export function mayAppearOnPublicPage(user: Doc, age: Doc, currentYear: number): boolean {
  return accountStanding(user) === 'active' && !isUnderMinimumAge(age, currentYear)
}

/** Whether this account has a public `/u/` page, and may be named on a page as a meal's author. */
export function isVisiblePublicProfile(user: Doc, age: Doc, currentYear: number): boolean {
  if (!mayAppearOnPublicPage(user, age, currentYear)) return false
  const doc = record(user)
  if (!doc || !chosenHandle(doc)) return false
  const finished = text(doc.profileSetupCompletedAt) !== ''
  const named = [doc.name, doc.display_name].some((value) => text(value) !== '')
  return finished || named
}

/**
 * RM20348 — "Let places I visit often see my profile" (`users/<uid>/maitredSettings/venueVisibility`).
 * Only an explicit yes links a person to a venue in public; no record or anything else is a no.
 */
export function venueVisibilityOn(setting: Doc): boolean {
  return record(setting)?.enabled === true
}
