'use client'

import { useEffect, useState } from 'react'

const MIN_CINEMATIC_HEIGHT = 640
const ENLARGED_ROOT_FONT_SIZE = 20

/**
 * Sticky, viewport-bound stories need enough vertical room to keep their
 * visuals and copy together. Switch to the complete static composition when
 * that room is unavailable or when the visitor has enlarged page text.
 */
export function useStaticMotionFallback() {
  const [shouldUseStaticLayout, setShouldUseStaticLayout] = useState(false)

  useEffect(() => {
    const syncLayout = () => {
      const rootFontSize = Number.parseFloat(
        window.getComputedStyle(document.documentElement).fontSize,
      )

      setShouldUseStaticLayout(
        window.innerHeight < MIN_CINEMATIC_HEIGHT ||
          rootFontSize >= ENLARGED_ROOT_FONT_SIZE,
      )
    }

    syncLayout()
    window.addEventListener('resize', syncLayout)

    const observer = new MutationObserver(syncLayout)
    observer.observe(document.documentElement, {
      attributes: true,
    })
    observer.observe(document.head, {
      childList: true,
      subtree: true,
    })

    return () => {
      window.removeEventListener('resize', syncLayout)
      observer.disconnect()
    }
  }, [])

  return shouldUseStaticLayout
}
