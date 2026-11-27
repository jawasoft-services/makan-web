'use client'

import { useEffect, useRef } from 'react'

/**
 * The footer's two motions, from the prototype's kit.js and foot3d.js: link words scramble into anagrams
 * for a beat on hover, then settle; and the rebus pictograms become three.js objects. three.js is a
 * separate chunk, imported only once the footer is within 600 px of the screen, and never under
 * reduced motion.
 */
export default function FooterFx() {
  const marker = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const foot = marker.current?.closest('footer')
    if (!foot) return
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const cleanups: (() => void)[] = []
    foot.querySelectorAll<HTMLAnchorElement>('.sf-link').forEach(a => {
      const word = a.textContent ?? ''
      if (!a.hasAttribute('aria-label')) a.setAttribute('aria-label', word)
      let busy = 0
      const enter = () => {
        if (reduce || busy) return
        let n = 0
        busy = window.setInterval(() => {
          if (++n > 4) { clearInterval(busy); busy = 0; a.textContent = word; return }
          const c = word.split('')
          for (let i = c.length - 1; i > 0; i--) { const k = Math.floor(Math.random() * (i + 1)); [c[i], c[k]] = [c[k], c[i]] }
          a.textContent = c.join('')
        }, 40)
      }
      a.addEventListener('mouseenter', enter)
      cleanups.push(() => { a.removeEventListener('mouseenter', enter); if (busy) { clearInterval(busy); a.textContent = word } })
    })
    if (reduce || !('IntersectionObserver' in window)) return () => cleanups.forEach(fn => fn())
    let mounted: { destroy(): void } | null = null
    let gone = false
    const io = new IntersectionObserver(entries => {
      if (!entries.some(e => e.isIntersecting)) return
      io.disconnect()
      import('./foot3d.js').then(({ mountFooterIcons }) => {
        if (!gone) mounted = mountFooterIcons(foot)
      }).catch(() => { /* the flat pictograms stay */ })
    }, { rootMargin: '600px 0px' })
    io.observe(foot)
    return () => { gone = true; io.disconnect(); mounted?.destroy(); cleanups.forEach(fn => fn()) }
  }, [])
  return <span ref={marker} hidden />
}
