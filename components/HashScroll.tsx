'use client'

import { useEffect } from 'react'

/**
 * Scrolls the homepage to the section named in the URL hash after the sections
 * have mounted.
 *
 * A nav link like "FAQ" from another page (e.g. /places/…) navigates to the
 * localized home path with a hash (/#faq, /id/#faq). The browser's native
 * hash-scroll fires as the document loads — before the homepage's sections are
 * laid out and before Lenis smooth-scroll takes over the scroll position — so
 * the visitor lands at the top of home instead of at the section. This waits
 * for the target element, then scrolls to it (through Lenis when present so it
 * agrees with the rest of the page's scrolling), which is what makes the
 * section links actually reach their section.
 */
export default function HashScroll() {
  useEffect(() => {
    const raw = window.location.hash
    if (!raw || raw === '#') return
    const id = decodeURIComponent(raw.slice(1))

    let cancelled = false
    let tries = 0

    const scroll = () => {
      if (cancelled) return
      const el = document.getElementById(id)
      if (el) {
        // Prefer Lenis so the position matches the page's own smooth scroll;
        // fall back to the native API when Lenis is not mounted.
        if (window.__lenis) window.__lenis.scrollTo(el, { offset: 0 })
        else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return
      }
      // The section may not be laid out yet on first paint; retry briefly.
      if (tries++ < 40) requestAnimationFrame(scroll)
    }

    // One frame lets the initial layout settle before the first lookup.
    const raf = requestAnimationFrame(scroll)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
    }
  }, [])

  return null
}
