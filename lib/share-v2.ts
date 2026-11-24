/**
 * RM20616 A12 U3 — the one switch for the Share v2 pages (the `/u/` profile page, the reworked
 * place and meal pages, the gone page, the Smart App Banner and the stored share card as
 * `og:image`). It is on only for the exact value "1"; absent or anything else is off, and with
 * it off every page and `og:image` is what it was before this unit.
 *
 * Read per request, never at build: the pages behind it are dynamic. The two link files under
 * `app/.well-known/` are NOT behind this switch.
 */
export const shareV2PagesOn = (): boolean => process.env.SHARE_V2_PAGES === '1'
