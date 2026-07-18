'use client'

import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import styles from './Emphasis.module.css'

type Variant = 'warm' | 'underline' | 'cool'

/**
 * A word or short phrase in the manifesto that "ignites" into emphasis as the
 * reader reaches it.
 *
 * The span renders in its FINISHED emphasis state on the server, so no-JS,
 * crawlers, and reduced-motion viewers always see the complete, emphasised text
 * — nothing is hidden. When motion is allowed, the effect switches it to a cool
 * pre-state and transitions into emphasis. Class changes are applied
 * imperatively on the DOM node (this is exactly what effects are for), so there
 * is no render-cycle state to synchronise.
 *   - trigger="scroll" (default): ignites when the phrase's top crosses the
 *     reading line (READING_LINE) and stays lit. Monotonic, so a fast or jump
 *     scroll can't skip it. Paced by the reader's own scroll.
 *   - trigger="load": ignites shortly after mount (for above-the-fold phrases).
 */

// Fraction of the viewport height (from the top) where the eye rests while
// reading. A phrase ignites when its top crosses this line.
const READING_LINE = 0.42

export function Emphasis({
  children,
  variant = 'warm',
  trigger = 'scroll',
  delay = 0,
}: {
  children: ReactNode
  variant?: Variant
  trigger?: 'scroll' | 'load'
  delay?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    // Respect the OS setting — leave the finished static state, no motion.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    node.classList.add(styles.enhance) // switch to the cool pre-state
    const reveal = () => node.classList.add(styles.revealed)

    if (trigger === 'load') {
      const id = window.setTimeout(reveal, 60 + delay)
      return () => window.clearTimeout(id)
    }

    let frame = 0
    const check = () => {
      frame = 0
      if (node.getBoundingClientRect().top <= window.innerHeight * READING_LINE) {
        reveal()
        teardown()
      }
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(check)
    }
    const teardown = () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    check() // in case it is already above the line on mount
    return teardown
  }, [trigger, delay])

  return (
    <span ref={ref} className={`${styles.emph} ${styles[variant]}`}>
      {children}
    </span>
  )
}
