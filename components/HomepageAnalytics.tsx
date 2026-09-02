'use client'

import { useEffect } from 'react'
import { useLocale } from 'next-intl'
import { track } from '@vercel/analytics'

const sections = [
  'how-it-works',
  'features',
  'proof',
  'first-day',
  'standings', 'for-restaurants',
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

    // Pinned scroll scenes grow to many viewports once ScrollScene arms
    // them, which happens after this effect runs, so classify by structure
    // (a section that contains staged beats) rather than by measured height.
    for (const id of sections) {
      const section = document.getElementById(id)
      if (!section) continue
      if (section.querySelector('[data-scene]')) {
        tallObserver.observe(section)
      } else {
        shortObserver.observe(section)
      }
    }

    return () => {
      shortObserver.disconnect()
      tallObserver.disconnect()
    }
  }, [locale])

  return null
}
