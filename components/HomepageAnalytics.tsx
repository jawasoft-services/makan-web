'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import { track } from '@vercel/analytics'

const sections = [
  'how-it-works',
  'features',
  'proof',
  'first-day',
  'wont-do',
  'for-restaurants',
  'faq',
  'android-waitlist',
]

export default function HomepageAnalytics() {
  const locale = useLocale()
  useEffect(() => {
    const seen = new Set<string>()
    const onIntersect: IntersectionObserverCallback = (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || seen.has(entry.target.id)) continue
        seen.add(entry.target.id)
        track('Homepage Section Viewed', { section: entry.target.id, locale })
        observer.unobserve(entry.target)
      }
    }

    const shortObserver = new IntersectionObserver(onIntersect, { threshold: 0.25 })
    const tallObserver = new IntersectionObserver(onIntersect, { threshold: 0.05 })

    for (const id of sections) {
      const section = document.getElementById(id)
      if (!section) continue
      if (section.offsetHeight <= window.innerHeight * 2) {
        shortObserver.observe(section)
      } else {
        tallObserver.observe(section)
      }
    }

    return () => {
      shortObserver.disconnect()
      tallObserver.disconnect()
    }
  }, [locale])

  return null
}
