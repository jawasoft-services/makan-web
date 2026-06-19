"use client"

import Image from "next/image"
import { useEffect } from "react"
import { APP_STORE_URL } from "@/lib/links"

/* ─────────────────────────────────────────────────────────────────────────
   Controls where the business-card QR ( makanofficial.com/app ) sends people.
   Change these lines and redeploy — the printed card never changes.
     • Beta now:   status: "beta"  + testFlightUrl
     • Public:     status: "live"  + appStoreUrl
   ───────────────────────────────────────────────────────────────────────── */
const CONFIG = {
  status: "live" as "beta" | "live",
  testFlightUrl: "https://testflight.apple.com/join/mJvRBHkW", // TestFlight beta (public join link)
  appStoreUrl: APP_STORE_URL, // Makan v1 live on the App Store (2026-06-19)
}

function isIOS(): boolean {
  if (typeof navigator === "undefined") return false
  return (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  )
}

export default function AppLanding() {
  const live = CONFIG.status === "live"
  const url = live ? CONFIG.appStoreUrl : CONFIG.testFlightUrl
  const hasUrl = Boolean(url) && url !== "TESTFLIGHT_URL_HERE"

  useEffect(() => {
    // On iOS, hand straight off to TestFlight / the App Store.
    // Everyone else (and iOS, if the redirect is slow) uses the button below.
    if (hasUrl && isIOS()) {
      window.location.href = url
    }
  }, [hasUrl, url])

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-brand-bg px-6 pb-16 pt-28 text-center"
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
        src="/makan-wordmark.svg"
        alt="Makan"
        width={200}
        height={49}
        className="mb-9 h-auto w-[190px]"
        priority
      />

      {!live && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-orange">
          Early access
        </p>
      )}

      <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
        {live ? "Get Makan" : "Try Makan in beta"}
      </h1>

      <p className="mb-9 max-w-sm text-base font-medium leading-relaxed text-brand-muted">
        Remember every meal.{" "}
        {live
          ? "Download it free on the App Store."
          : "Join the TestFlight beta and be one of the first in."}
      </p>

      {hasUrl ? (
        <a
          href={url}
          className="inline-flex h-14 items-center justify-center rounded-full bg-brand-orange px-9 text-base font-semibold text-brand-bg transition-shadow hover:shadow-lg hover:shadow-brand-orange/25"
        >
          {live ? "Download on the App Store" : "Join the TestFlight beta"}
        </a>
      ) : (
        <p className="text-sm font-medium text-brand-dim">Opening soon.</p>
      )}

      {!live && hasUrl && (
        <p className="mt-6 max-w-xs text-xs leading-relaxed text-brand-dim">
          Best on iPhone. TestFlight installs Apple&apos;s tester app first, then Makan.
        </p>
      )}
    </main>
  )
}
