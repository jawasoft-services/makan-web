/**
 * RM20616 A12 U3 — three things on the Share v2 pages that are Devon's to choose. Each is one
 * value here, read in one place. What each board draws is written out in progress/A12/NOTES.md,
 * "U3 review fixes", so the choice can be made from the boards.
 */

/**
 * The line under the dish on the restaurant page's "What to order here" card.
 *   'a-regular-maitred'  "A regular, Maître d’"   (built: the boards' "<name>, Maître d’" with "A regular" for the name)
 *   'a-regular'          "A regular"
 *   'none'               no line
 * Whichever is chosen, the holder is never named (Devon, 24 Nov 2026).
 */
export const PLACE_MAITRED_LINE: 'a-regular-maitred' | 'a-regular' | 'none' = 'a-regular-maitred'

/**
 * The line under "Unavailable" on a gone profile. The board (`web-gone`) has one line and it is
 * about a meal, so today there is none. To add the app's approved line from board `prof-blocked`
 * ("This profile isn’t available. It may have been removed."), add it to messages/en.json and
 * messages/id.json as SharePages.profileGone and set this to 'profileGone'.
 */
export const GONE_PROFILE_LINE: 'profileGone' | null = null

/**
 * Parts of today's restaurant page that the board (`sharefx-place`) does not draw. With `false`
 * the v2 page leaves them out, as built; with `true` it shows them below the board's content,
 * using today's components and words.
 */
export const PLACE_PAGE_KEEPS = { map: false, firsthandReview: false } as const
