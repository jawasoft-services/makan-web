'use client'

import { useEffect } from 'react'
import { track } from '@vercel/analytics'

const sections = ['how-it-works', 'features', 'faq', 'android-waitlist']

export default function HomepageAnalytics() {
  useEffect(() => {
    const seen = new Set<string>()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || seen.has(entry.target.id)) continue
          seen.add(entry.target.id)
          track('Homepage Section Viewed', { section: entry.target.id })
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.25 },
    )

    for (const id of sections) {
      const section = document.getElementById(id)
      if (section) observer.observe(section)
    }

    return () => observer.disconnect()
  }, [])

  return null
}
