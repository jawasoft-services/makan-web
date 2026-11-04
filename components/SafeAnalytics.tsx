"use client"

import { Analytics } from "@vercel/analytics/next"
import { redactAnalyticsUrl } from "@/lib/analytics-url"

export default function SafeAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          return { ...event, url: redactAnalyticsUrl(event.url) }
        } catch {
          return event
        }
      }}
    />
  )
}
