"use client"

import Image from "next/image"
import { useEffect } from "react"
import { useTranslations } from "next-intl"
import { APP_STORE_URL } from "@/lib/links"

/* ─────────────────────────────────────────────────────────────────────────
   Controls where the business-card QR ( makanofficial.com/app ) sends people.
   Makan is live on the App Store — this hands off to APP_STORE_URL.
   Change the link in lib/links.ts and redeploy; the printed card never changes.
   ───────────────────────────────────────────────────────────────────────── */

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

export default function AppLanding() {
  const t = useTranslations("AppPage")
  useEffect(() => {
    // On iOS, hand straight off to the App Store.
    // Everyone else (and iOS, if the redirect is slow) uses the button below.
    if (isIOS()) {
      window.location.href = APP_STORE_URL
    }
  }, [])

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-6 pb-16 pt-28 text-center"
    >
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

      <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-brand-ink sm:text-4xl">
        {t("title")}
      </h1>

      <p className="mb-9 max-w-sm text-base font-medium leading-relaxed text-brand-muted">
        {t("body")}
      </p>

      <a
        href={APP_STORE_URL}
        className="inline-flex h-14 items-center justify-center rounded-full bg-brand-orange px-9 text-base font-semibold text-white transition-shadow hover:shadow-lg hover:shadow-brand-orange/25"
      >
        {t("cta")}
      </a>
    </main>
  )
}
