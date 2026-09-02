"use client"

import { useLocale } from "next-intl"
import { track } from "@vercel/analytics"
import { APP_STORE_URL } from "@/lib/links"

/** App Store link that fires the same event the legacy hero fires, so the
 *  dashboard's funnel keeps working across the redesign. */
export default function StoreLink({ location, className, children }: { location: string; className?: string; children: React.ReactNode }) {
  const locale = useLocale()
  return (
    <a href={APP_STORE_URL} className={className} onClick={() => track("App Store CTA Clicked", { location, locale })}>
      {children}
    </a>
  )
}
