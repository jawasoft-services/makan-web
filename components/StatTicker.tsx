'use client'

import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'

interface StatTickerProps {
  /** Final numeric value to display. */
  value: number
  /** Starting value, for a score changing after a pick. */
  initialValue?: number
  /** When true, the count-up animation runs (parent controls via useInView). */
  inView: boolean
  /** Animation duration in seconds. Default 1.4. */
  duration?: number
  /** Number-format locale, e.g. "id" for 5.500. Defaults to the existing format. */
  locale?: string
}

/**
 * Animates a number from 0 up to `value` once when `inView` first becomes true.
 * Respects `prefers-reduced-motion` — users with reduced motion see the final
 * value instantly. Screen readers get the final formatted number via aria-label,
 * not intermediate animation frames.
 */
export default function StatTicker({ value, inView, duration = 1.4, initialValue = 0, locale }: StatTickerProps) {
  const prefersReducedMotion = useReducedMotion()
  const count = useMotionValue(initialValue)
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString(locale))
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!inView || hasAnimated.current) return
    hasAnimated.current = true

    if (prefersReducedMotion) {
      count.set(value)
      return
    }

    const controls = animate(count, value, { duration, ease: 'easeOut' })
    return () => {
      controls.stop()
      hasAnimated.current = false
    }
  }, [inView, value, duration, prefersReducedMotion, count])

  return (
    <>
      <span className="sr-only">{value.toLocaleString(locale ?? 'en-GB')}</span>
      <motion.span aria-hidden="true">{rounded}</motion.span>
    </>
  )
}
