import 'server-only'
import { FIXTURE_SLUG, WEBSITE_FIXTURES } from './website-fixtures'

// Published-menu quote, checked 2026-11-06. The restaurant still links this
// 2024-uploaded image; this is not a live till price or the review's £12 receipt.
// Full source and matching boundaries: verified-menu-price.md.
const kendalPrawns = {
  price: '£10',
  menuUrl: 'https://kendalstreetkitchen.com/main-menu/',
  sourceImage: 'https://kendalstreetkitchen.com/wp-content/uploads/2024/05/KK-Menu-MAIN-A3_01-scaled.jpg',
  checkedOn: '2026-11-06',
} as const

/** A narrow authored match, never a guessed price for a similarly named dish. */
export function getVerifiedMenuPrice(slug: string, dish: string | null | undefined) {
  const isKendal = slug === 'kendal-street-kitchen-f7d46b'
    || (WEBSITE_FIXTURES && slug === FIXTURE_SLUG)
  if (!isKendal || !dish) return null
  const name = dish.trim().replace(/\s+/g, ' ').toLowerCase()
  return name === 'harissa prawns' || name === 'harisa prawns' ? kendalPrawns : null
}
