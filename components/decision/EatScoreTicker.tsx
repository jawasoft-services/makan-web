"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import StatTicker from "@/components/StatTicker"
import type { restaurantScore } from "@/lib/example-standings"

type Score = ReturnType<typeof restaurantScore>

export default function EatScoreTicker({ before, after, scoreLabel, eatsLabel, matchupsLabel }: {
  before: Score; after: Score; scoreLabel: string; eatsLabel: string; matchupsLabel: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [selected, setSelected] = useState(false)
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    const highlight = ref.current?.closest("[data-place]")?.querySelector<HTMLElement>("[data-winner-highlight][data-scene]")
    if (!highlight) return
    const sync = () => setSelected(!highlight.closest(".scene-armed") || highlight.classList.contains("scene-on"))
    const observer = new MutationObserver(sync)
    observer.observe(highlight, { attributes: true, attributeFilter: ["class"] })
    const frame = requestAnimationFrame(sync)
    return () => { observer.disconnect(); cancelAnimationFrame(frame) }
  }, [])
  const current = selected ? after : before
  return (
    <span ref={ref} data-eat-score data-pick-state={selected ? "after" : "before"} aria-live="polite" aria-atomic="true" className="mt-2 block text-[0.78rem] font-bold text-brand-orange">
      <span className="flex min-h-12 items-center justify-end">
        <motion.span data-score-value animate={{ scale: selected && after.rate > before.rate ? 1.2 : 1 }} transition={{ duration: reducedMotion ? 0 : 1.2, ease: "easeOut" }} style={{ transformOrigin: "right center" }} className="inline-flex items-baseline gap-1.5 text-[clamp(1.1rem,6vw,1.25rem)] leading-none tabular-nums sm:text-[2rem]">
          <span className="text-[0.78rem]">{scoreLabel}</span>
          <span className="whitespace-nowrap"><StatTicker key={String(selected)} value={current.rate} initialValue={before.rate} inView={selected} duration={1.2} />%</span>
        </motion.span>
      </span>
      <span className="block font-semibold text-brand-muted">{current.eats} {eatsLabel} / {current.matchups} {matchupsLabel}</span>
    </span>
  )
}
