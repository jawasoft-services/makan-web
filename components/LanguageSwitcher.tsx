"use client"

import { useLocale, useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { track } from "@vercel/analytics"
import { isIndonesianRoute, stripLocalePrefix } from "@/i18n/availability"
import { localizePath } from "@/i18n/paths"

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
      aria-label={`${t("language")}: ${targetLabel}`}
      onClick={(event) => {
        document.cookie = `NEXT_LOCALE=${targetLocale}; path=/; max-age=31536000; samesite=lax`
        track("Language Changed", { from: locale, to: targetLocale })
        const suffix = `${window.location.search}${window.location.hash}`
        if (suffix) {
          event.preventDefault()
          window.location.assign(`${targetHref}${suffix}`)
        }
      }}
      className={
        compact
          ? "inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-sm font-bold text-brand-orange"
          : "inline-flex min-h-11 items-center justify-center rounded-full bg-white px-4 text-xs font-bold tracking-[0.08em] text-brand-orange transition-shadow hover:shadow-lg hover:shadow-black/10"
      }
    >
      {locale === "id" ? "ID / EN" : "EN / ID"}
    </a>
  )
}
