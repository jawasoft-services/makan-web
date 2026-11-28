"use client"

import { useLocale, useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { track } from "@/lib/website-analytics"
import { isIndonesianRoute, stripLocalePrefix } from "@/i18n/availability"
import { localizePath } from "@/i18n/paths"
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE } from "@/i18n/routing"

export default function LanguageSwitcher({
  compact = false,
}: {
  compact?: boolean
}) {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations("Global")
  const barePath = stripLocalePrefix(pathname)

  if (!isIndonesianRoute(barePath)) return null

  const targetLocale = locale === "id" ? "en" : "id"
  const targetHref = localizePath(targetLocale, barePath)
  const targetLabel =
    targetLocale === "id" ? t("indonesian") : t("english")

  return (
    <a
      href={targetHref}
      hrefLang={targetLocale}
      lang={targetLocale}
      aria-label={`${locale === "id" ? "ID / EN" : "EN / ID"} — ${t("language")}: ${targetLabel}`}
      onClick={(event) => {
        document.cookie = `${LANG_COOKIE}=${targetLocale}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`   // the only place a language is remembered: an explicit pick
        track("Language Changed", { from: locale, to: targetLocale })
        const suffix = `${window.location.search}${window.location.hash}`
        if (suffix) {
          event.preventDefault()
          window.location.assign(`${targetHref}${suffix}`)
        }
      }}
      className={`language-switch ${compact ? "compact" : ""}`}
    >
      {locale === "id" ? "ID / EN" : "EN / ID"}
    </a>
  )
}
