"use client"

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react"
import Image from "next/image"
import { track } from "@vercel/analytics"
import { APP_STORE_URL } from "@/lib/links"
import {
  normalizePilotLocale,
  PILOT_LOCALE_STORAGE_KEY,
  type PilotLocale,
} from "@/lib/pilot-locale"
import type { PilotVenue } from "@/lib/venues"

const APP_SCHEME_URL = "makanapp://"

const copy = {
  en: {
    rememberVenue: "Remember this meal.",
    rememberGeneric: "Remember every meal.",
    venueBody: (venue: string) =>
      `You're at ${venue}. Makan is a private food diary you share with friends — snap what you're eating and keep every meal, free.`,
    genericBody:
      "Makan is a private food diary you share with friends — snap what you're eating and keep every meal, free.",
    download: "Download on the App Store",
    openApp: "Already have Makan? Open the app",
    availability: "Free on iPhone. Android is not yet available for this pilot.",
    language: "Language",
    english: "English",
    indonesian: "Bahasa Indonesia",
    privacy: "Privacy",
    terms: "Terms",
    rights: "All rights reserved.",
  },
  id: {
    rememberVenue: "Ingat momen makan ini.",
    rememberGeneric: "Ingat setiap momen makan.",
    venueBody: (venue: string) =>
      `Kamu sedang di ${venue}. Makan adalah jurnal makanan pribadi yang bisa dibagikan dengan teman — foto makananmu dan simpan setiap momen, gratis.`,
    genericBody:
      "Makan adalah jurnal makanan pribadi yang bisa dibagikan dengan teman — foto makananmu dan simpan setiap momen, gratis.",
    download: "Unduh di App Store",
    openApp: "Sudah punya Makan? Buka aplikasinya",
    availability: "Gratis di iPhone. Android belum tersedia untuk uji coba ini.",
    language: "Bahasa",
    english: "English",
    indonesian: "Bahasa Indonesia",
    privacy: "Privasi",
    terms: "Ketentuan",
    rights: "Hak cipta dilindungi.",
  },
} as const

interface VenueLandingProps {
  initialLocale: PilotLocale
  venue: PilotVenue | null
}

const PILOT_LOCALE_CHANGED_EVENT = "makan-pilot-locale-changed"

function subscribeToPilotLocale(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange)
  window.addEventListener(PILOT_LOCALE_CHANGED_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", onStoreChange)
    window.removeEventListener(PILOT_LOCALE_CHANGED_EVENT, onStoreChange)
  }
}

function getBrowserPilotLocale(): PilotLocale {
  const savedLocale = window.localStorage.getItem(PILOT_LOCALE_STORAGE_KEY)
  if (savedLocale === "en" || savedLocale === "id") return savedLocale

  return normalizePilotLocale(window.navigator.languages?.[0] ?? window.navigator.language)
}

export default function VenueLanding({ initialLocale, venue }: VenueLandingProps) {
  const getServerPilotLocale = useCallback(() => initialLocale, [initialLocale])
  const locale = useSyncExternalStore(
    subscribeToPilotLocale,
    getBrowserPilotLocale,
    getServerPilotLocale,
  )
  const didTrackView = useRef(false)
  const strings = copy[locale]

  useEffect(() => {
    if (didTrackView.current) return
    didTrackView.current = true
    track("venue_landing_viewed", {
      locale: initialLocale,
      venue_slug: venue?.slug ?? "unknown",
      venue_known: Boolean(venue),
    })
  }, [initialLocale, venue])

  function selectLocale(nextLocale: PilotLocale) {
    window.localStorage.setItem(PILOT_LOCALE_STORAGE_KEY, nextLocale)
    window.dispatchEvent(new Event(PILOT_LOCALE_CHANGED_EVENT))
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
          aria-label={strings.language}
        >
          {(["en", "id"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => selectLocale(option)}
              aria-pressed={locale === option}
              className={`min-h-11 rounded-full px-4 text-sm font-semibold transition-colors ${
                locale === option
                  ? "bg-brand-orange text-white"
                  : "text-brand-muted hover:text-brand-ink"
              }`}
            >
              {option === "en" ? "EN" : "ID"}
              <span className="sr-only">
                {option === "en" ? strings.english : strings.indonesian}
              </span>
            </button>
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
          {venue ? strings.rememberVenue : strings.rememberGeneric}
        </h1>

        <p className="mb-9 max-w-sm text-base font-medium leading-relaxed text-brand-muted">
          {venue ? strings.venueBody(venue.name) : strings.genericBody}
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
          {strings.download}
        </a>

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
          {strings.openApp}
        </a>

        <p className="mt-8 text-xs text-brand-muted">{strings.availability}</p>
      </main>

      <footer className="bg-brand-espresso px-6 py-8 text-center text-xs text-brand-espresso-muted">
        <nav className="mb-4 flex justify-center gap-6" aria-label="Legal">
          <a className="hover:text-white" href="/privacy-policy">
            {strings.privacy}
          </a>
          <a className="hover:text-white" href="/tos">
            {strings.terms}
          </a>
        </nav>
        <p>&copy; {new Date().getFullYear()} Makan App Ltd. {strings.rights}</p>
        <p className="mt-2">Registered in England and Wales · 16736412</p>
      </footer>
    </div>
  )
}
