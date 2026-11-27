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
