'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

/**
 * Site-wide smooth scrolling (Lenis). Skipped entirely for
 * prefers-reduced-motion users — they keep native scrolling, and the
 * `html { scroll-behavior: smooth }` fallback in globals.css still applies.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, anchors: true })
    return () => lenis.destroy()
  }, [])
  return null
}
