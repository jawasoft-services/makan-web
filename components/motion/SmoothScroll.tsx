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
 * Site-wide smooth scrolling (Lenis), plus the two things Lenis's own
 * anchor handling did not do for this page: land on `#section` when the
 * page opens with a hash (the pinned scenes change the page's height after
 * mount, so it lands twice: once as soon as possible, once after layout
 * has settled), and scroll to in-page anchors on click, offset by the
 * fixed header. A link whose target is not on this page is left to the
 * browser, which navigates to the page that has it.
 *
 * Skipped entirely for prefers-reduced-motion users — they keep native
 * scrolling, and the `html { scroll-behavior: smooth }` fallback in
 * globals.css still applies.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const lenis = new Lenis({ autoRaf: true, anchors: false })
    window.__lenis = lenis

    const targetFor = (hash: string): HTMLElement | null => {
      const id = decodeURIComponent(hash.replace(/^#/, ''))
      return id ? document.getElementById(id) : null
    }
    const goTo = (el: HTMLElement, immediate: boolean) => {
      // Sections carry scroll-margin-top equal to the nav, so no offset here:
      // native jumps and Lenis land in the same place.
      lenis.scrollTo(el, { immediate, force: true })
    }

    // Landing on a hash: the scenes arm on mount and grow the page, so scroll
    // once now and once more after they have settled.
    const landOnHash = () => {
      const el = targetFor(location.hash)
      if (!el) return
      goTo(el, true)
      window.setTimeout(() => {
        const again = targetFor(location.hash)
        if (again) goTo(again, true)
      }, 600)
    }
    // Timeouts, not animation frames: a background tab has no frames until
    // it is shown, and the landing must still have happened by then.
    const landTimer = window.setTimeout(landOnHash, 0)

    // In-page anchors: `#id`, or `/#id` (and `/id/#id`) while on that page.
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      const href = anchor.getAttribute('href') ?? ''
      const hashAt = href.indexOf('#')
      if (hashAt < 0) return
      const path = href.slice(0, hashAt)
      const samePage = path === '' || path === location.pathname || path.replace(/\/$/, '') === location.pathname.replace(/\/$/, '')
      if (!samePage) return
      const el = targetFor(href.slice(hashAt))
      if (!el) return
      event.preventDefault()
      history.pushState(null, '', href.slice(hashAt))
      // A link inside the mobile drawer: let the drawer close first.
      const inDrawer = Boolean(anchor.closest('[data-vaul-drawer]'))
      // A hidden tab has no animation frames to animate with: jump instead.
      window.setTimeout(() => goTo(el, document.hidden), inDrawer ? 600 : 0)
    }
    document.addEventListener('click', onClick)
    const onHashChange = () => {
      const el = targetFor(location.hash)
      if (el) goTo(el, document.hidden)
    }
    window.addEventListener('hashchange', onHashChange)

    return () => {
      window.clearTimeout(landTimer)
      document.removeEventListener('click', onClick)
      window.removeEventListener('hashchange', onHashChange)
      delete window.__lenis
      lenis.destroy()
    }
  }, [])
  return null
}
