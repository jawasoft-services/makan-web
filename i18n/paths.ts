import { isIndonesianRoute, stripLocalePrefix } from "./availability"
import type { AppLocale } from "./routing"

export function localizePath(locale: AppLocale | string, href: string) {
  if (
    href.startsWith("#") ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:")
  ) {
    return href
  }

  const suffixIndex = href.search(/[?#]/)
  const pathname = suffixIndex === -1 ? href : href.slice(0, suffixIndex)
  const suffix = suffixIndex === -1 ? "" : href.slice(suffixIndex)
  const barePath = stripLocalePrefix(pathname)

  if (locale === "id" && isIndonesianRoute(barePath)) {
    return `${barePath === "/" ? "/id" : `/id${barePath}`}${suffix}`
  }

  return `${barePath}${suffix}`
}
