"use client"

import { Analytics } from "@vercel/analytics/next"

export default function SafeAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        try {
          const url = new URL(event.url)
          if (url.pathname.includes("/invite/")) {
            url.searchParams.delete("s")
            url.hash = ""
          }
          return { ...event, url: url.toString() }
        } catch {
          return event
        }
      }}
    />
  )
}
