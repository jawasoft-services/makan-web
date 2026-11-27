import { localizePath } from '@/i18n/paths'
import { isIndonesianRoute, stripLocalePrefix } from '@/i18n/availability'

/**
 * Where each shell link goes (RM20773). The approved prototype folds Maître d’, Get Makan and Our story
 * into the homepage (kit.js LOCAL map: '/maitre-d' → '/#c3b', '/app' → '/#get', '/story' → '/#story');
 * every other link is its own page. Press keeps its live page (Devon).
 */
const HOME_SECTIONS: Record<string, string> = { '/maitre-d': '#c3b', '/app': '#get', '/story': '#story' }

export function siteHref(locale: string, path: string): string {
  const section = HOME_SECTIONS[path]
  return section ? `${localizePath(locale, '/')}${section}` : localizePath(locale, path)
}

/** The other language's address for this page: the same page where it exists in Bahasa, else that language's home. */
export function otherLocaleHref(locale: string, pathname: string): { href: string; target: 'en' | 'id' } {
  const target = locale === 'id' ? 'en' : 'id'
  const bare = stripLocalePrefix(pathname)
  return { href: isIndonesianRoute(bare) ? localizePath(target, bare) : localizePath(target, '/'), target }
}

/** The page key the header marks as current, as the prototype's body[data-page]. */
export function currentSection(pathname: string): 'app' | 'partner' | null {
  const bare = stripLocalePrefix(pathname)
  if (bare === '/') return 'app'
  if (bare === '/partner') return 'partner'
  return null
}
