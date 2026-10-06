"use client"

import { useRef } from "react"
import { useInView } from "framer-motion"
import StatTicker from "@/components/StatTicker"

/**
 * The hero's meal total, set large and counted up once when it enters view.
 * An invisible copy of the final number holds the width, so the label beside
 * it stays still while the digits grow.
 */
export default function MealCount({ value, locale }: { value: number; locale: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <span
      ref={ref}
      className="relative inline-block text-[clamp(2.5rem,5.5vw,3.6rem)] font-extrabold leading-none tracking-[-0.03em] text-brand-orange tabular-nums"
    >
      <span aria-hidden className="invisible">
        {value.toLocaleString(locale)}+
      </span>
      <span className="absolute inset-0 text-right">
        <StatTicker value={value} inView={inView} locale={locale} />+
      </span>
    </span>
  )
}
