'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { MEASUREMENT_ID, startWebsiteAnalytics, track } from '@/lib/website-analytics'

export default function SafeAnalytics() {
  const pathname = usePathname()
  const lastPath = useRef<string | null>(null)
  useEffect(() => {
    if (!startWebsiteAnalytics()) return
    if (!document.getElementById('makan-analytics')) {
      const script = document.createElement('script')
      script.id = 'makan-analytics'
      script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`
      script.async = true
      script.referrerPolicy = 'origin'
      document.head.append(script)
    }
    if (lastPath.current !== pathname) {
      track('page_view')
      lastPath.current = pathname
    }
  }, [pathname])
  return null
}
