"use client"

import { useLocale, useTranslations } from "next-intl"
import Image from "next/image"
import { track } from "@vercel/analytics"
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/links"

/** Every App Store CTA includes its Google Play counterpart. */
export default function StoreLink({ location, className, children, size = "normal" }: { location: string; className?: string; children: React.ReactNode; size?: "normal" | "large" | "compact" }) {
  const locale = useLocale()
  const t = useTranslations("Global")
  return (
    <span data-store-buttons className="inline-flex max-w-full flex-wrap items-center justify-center gap-2">
      <a href={APP_STORE_URL} className={`min-h-11 ${className ?? ""}`} onClick={() => track("App Store CTA Clicked", { location, locale })}>
        {children}
      </a>
      <a href={GOOGLE_PLAY_URL} className="pointer-events-auto inline-flex min-h-11 items-center rounded-[10px] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current active:translate-y-0">
        <Image src="/mockup-assets/google-play-badge.png" alt={t("downloadGooglePlay")} width={646} height={250} className={`h-[clamp(3rem,16.2vw,3.4rem)] w-auto ${size === "large" ? "sm:h-[5.25rem]" : size === "compact" ? "sm:h-[3.75rem]" : "sm:h-[4.5rem]"}`} />
      </a>
    </span>
  )
}
