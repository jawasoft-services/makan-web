import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  locales: ["en", "id"],
  defaultLocale: "en",
  localePrefix: "as-needed",
  localeDetection: true,
  // Devon, 28 Nov 2026: "the website should be in whatever language the persons system is on, british people in
  // indonesia should be shown english not indonesian". next-intl's own cookie remembered whichever language a visit
  // last landed on (an /id link was enough) and then outranked the system language for a year. It no longer reads or
  // writes one: a visit follows Accept-Language, a prefixed address shows its own language, and only an explicit pick
  // in a language switcher is remembered (LANG_COOKIE, applied in proxy.ts). Never a geo or IP choice.
  localeCookie: false,
})

/** Set only by the language switchers (an explicit pick); read by proxy.ts. The old NEXT_LOCALE cookie is ignored. */
export const LANG_COOKIE = "MAKAN_LANG"
export const LANG_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export type AppLocale = (typeof routing.locales)[number]
