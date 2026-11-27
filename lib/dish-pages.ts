import { shareV2PagesOn } from '@/lib/share-v2'

/**
 * RM20616 dish pages — the one switch for the public dish section on the Share v2 restaurant page
 * (boards dp-*-a, Devon 27 Nov 2026): the hourly cron's `dishes` on each place aggregate, the
 * "What to order here" answer, "Dishes rated here", and their search title and description. On only
 * for the exact value "1"; absent or anything else is off, and with it off the cron reads and writes
 * what it did before and every page is what it was.
 *
 * Read per call, never at build: the pages behind it are dynamic. The section also needs the Share v2
 * page itself, so nothing shows unless SHARE_V2_PAGES is on too. The venue takedown
 * (`lib/web-listing.ts`) is NOT behind this switch.
 */
export const dishPagesOn = (): boolean => process.env.DISH_PAGES === '1'

/**
 * RM20616 dish pages, review L6 (Devon, 27 Nov 2026: "Same rule everywhere"): whether the site's Maître d' cards (home,
 * partner page) name the app's dish answer instead of the holder's free text. True only while the page that shows that
 * answer is served: DISH_PAGES and SHARE_V2_PAGES both on. With Share v2 off, the live place page (which prints the
 * holder's pick) is served, and the cards keep that pick, so the site names one dish per venue in every combination.
 */
export const dishAnswersShown = (): boolean => dishPagesOn() && shareV2PagesOn()

/** The dish a Maître d' card may name: the app's answer when it is the Maître d's own pick; otherwise none. */
export function maitredCardDish(answer: { name: string; maitred: boolean } | null | undefined): string | null {
  return answer?.maitred ? answer.name : null
}
