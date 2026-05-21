'use client'

import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'

interface StatTickerProps {
  /** Final numeric value to display. */
  value: number
  /** When true, the count-up animation runs (parent controls via useInView). */
  inView: boolean
  /** Animation duration in seconds. Default 1.4. */
  duration?: number
}

/**
 * Animates a number from 0 up to `value` once when `inView` first becomes true.
 * Respects `prefers-reduced-motion` — users with reduced motion see the final
 * value instantly. Screen readers get the final formatted number via aria-label,
 * not intermediate animation frames.
 */
export default function StatTicker({ value, inView, duration = 1.4 }: StatTickerProps) {
  const prefersReducedMotion = useReducedMotion()
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString())
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!inView || hasAnimated.current) return
    hasAnimated.current = true

    if (prefersReducedMotion) {
      count.set(value)
      return
    }

    const controls = animate(count, value, { duration, ease: 'easeOut' })
    return () => controls.stop()
  }, [inView, value, duration, prefersReducedMotion, count])

  return <motion.span aria-label={value.toLocaleString()}>{rounded}</motion.span>
}
