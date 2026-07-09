'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'

declare global {
  interface Window {
    /** Active Lenis instance — programmatic scrolls MUST go through it
     *  (a raw window.scrollTo fights Lenis's internal position and loses). */
    __lenis?: Lenis
  }
}

/**
 * Site-wide smooth scrolling (Lenis). Skipped entirely for
 * prefers-reduced-motion users — they keep native scrolling, and the
 * `html { scroll-behavior: smooth }` fallback in globals.css still applies.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, anchors: true })
    window.__lenis = lenis
    return () => {
      delete window.__lenis
      lenis.destroy()
    }
  }, [])
  return null
}
