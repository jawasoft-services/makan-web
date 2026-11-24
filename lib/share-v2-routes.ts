/**
 * RM20616 A12 U3 — which public addresses the Share v2 pages take over when SHARE_V2_PAGES is on.
 * The pages live under an internal `share-v2` segment, so the pages they replace are not edited
 * at all: with the switch off nothing is rewritten and the site serves exactly what it served before.
 *
 *   /places/<slug>   /id/places/<slug>     the restaurant page
 *   /meal/<id>       /id/meal/<id>         a shared meal
 *   /u/<slug>        /id/u/<slug>          a public profile (no page before this unit)
 *
 * Only the exact two-segment address is taken: `/places`, `/places/<slug>/opengraph-image` and
 * everything else pass through untouched.
 */
export type ShareV2Kind = 'place' | 'meal' | 'profile'
export type ShareV2Target = { kind: ShareV2Kind; locale: 'en' | 'id'; path: string }

const SEGMENTS: Record<string, ShareV2Kind> = { places: 'place', meal: 'meal', u: 'profile' }
const PLACE_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{6}$/
const KEY = /^[A-Za-z0-9_-]{1,80}$/

export function shareV2Target(pathname: string): ShareV2Target | null {
  const parts = pathname.split('/')
  // '' , ['id'], segment, key
  const locale = parts[1] === 'id' ? 'id' : 'en'
  const rest = locale === 'id' ? parts.slice(2) : parts.slice(1)
  if (parts[0] !== '' || rest.length !== 2) return null
  const [segment, key] = rest
  const kind = Object.hasOwn(SEGMENTS, segment) ? SEGMENTS[segment] : null
  if (!kind || !KEY.test(key)) return null
  // A place address that is not in its canonical form stays with the existing page, which redirects it.
  if (kind === 'place' && (key.length > 80 || !PLACE_SLUG.test(key))) return null
  return { kind, locale, path: `/${locale}/share-v2/${segment}/${key}` }
}
