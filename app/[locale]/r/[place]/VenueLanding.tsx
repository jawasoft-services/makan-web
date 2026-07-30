"use client"

import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { usePathname } from "next/navigation"
import { track } from "@vercel/analytics"
import { localizePath } from "@/i18n/paths"
import { APP_STORE_URL } from "@/lib/links"
import type { PilotVenue } from "@/lib/venues"

const APP_SCHEME_URL = "makanapp://"

interface VenueLandingProps {
  venue: PilotVenue | null
}

export default function VenueLanding({ venue }: VenueLandingProps) {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations("VenueLanding")
  const bareVenuePath = pathname.replace(/^\/(?:en|id)(?=\/|$)/, "") || "/"

  function rememberLocale(nextLocale: "en" | "id") {
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; samesite=lax`
    track("venue_landing_locale_changed", {
      locale: nextLocale,
      venue_slug: venue?.slug ?? "unknown",
    })
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-16 text-center sm:pt-24"
      >
        <div
          className="mb-10 inline-flex rounded-full border border-brand-orange/25 bg-white/75 p-1 shadow-sm"
          role="group"
          aria-label={t("language")}
        >
          {(["en", "id"] as const).map((option) => (
            <a
              key={option}
              href={localizePath(option, bareVenuePath)}
              hrefLang={option}
              lang={option}
              onClick={() => rememberLocale(option)}
              aria-current={locale === option ? "page" : undefined}
              aria-label={`${t("language")}: ${
                option === "en" ? t("english") : t("indonesian")
              }`}
              className={`inline-flex min-h-11 items-center rounded-full px-4 text-sm font-semibold transition-colors ${
                locale === option
                  ? "bg-brand-orange text-white"
                  : "text-brand-muted hover:text-brand-ink"
              }`}
            >
              {option.toUpperCase()}
            </a>
          ))}
        </div>

        <Image
          src="/makan-icon.svg"
          alt=""
          width={64}
          height={64}
          className="mb-7 h-16 w-16"
          priority
        />
        <Image
          src="/makan-logo-orange.svg"
          alt="Makan"
          width={200}
          height={46}
          className="mb-9 h-auto w-[190px]"
          priority
        />

        {venue && (
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">
            {venue.name} · {venue.city}
          </p>
        )}

        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-brand-ink sm:text-4xl">
          {venue ? t("rememberVenue") : t("rememberGeneric")}
        </h1>

        <p className="mb-4 max-w-sm text-base font-medium leading-relaxed text-brand-muted">
          {venue
            ? t("venueBody", { venue: venue.name })
            : t("genericBody")}
        </p>

        <p className="mb-9 max-w-sm text-sm font-semibold text-brand-orange">
          {t("openCanggu")}
        </p>

        <a
          href={APP_STORE_URL}
          onClick={() =>
            track("venue_landing_app_store_tapped", {
              locale,
              venue_slug: venue?.slug ?? "unknown",
            })
          }
          className="inline-flex min-h-14 items-center justify-center rounded-full bg-brand-orange px-9 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-brand-orange/25 active:scale-[0.98]"
        >
          {t("download")}
        </a>

        <span
          aria-disabled="true"
          className="mt-3 inline-flex min-h-11 items-center rounded-full border border-brand-orange/25 px-6 text-sm font-semibold text-brand-muted"
        >
          {t("playUnavailable")}
        </span>

        <a
          href={APP_SCHEME_URL}
          onClick={() =>
            track("venue_landing_open_app_tapped", {
              locale,
              venue_slug: venue?.slug ?? "unknown",
            })
          }
          className="mt-5 min-h-11 content-center text-sm font-medium text-brand-muted underline-offset-4 transition-colors hover:text-brand-ink hover:underline"
        >
          {t("openApp")}
        </a>

        <p className="mt-8 text-xs text-brand-muted">{t("availability")}</p>
      </main>

      <footer className="bg-brand-espresso px-6 py-8 text-center text-xs text-brand-espresso-muted">
        <nav className="mb-4 flex justify-center gap-6" aria-label={t("legal")}>
          <a className="hover:text-white" href={localizePath(locale, "/privacy-policy")}>
            {t("privacy")}
          </a>
          <a className="hover:text-white" href={localizePath(locale, "/tos")}>
            {t("terms")}
          </a>
        </nav>
        <p>&copy; {new Date().getFullYear()} Makan App Ltd. {t("rights")}</p>
        <p className="mt-2">Registered in England and Wales · 16736412</p>
      </footer>
    </div>
  )
}
