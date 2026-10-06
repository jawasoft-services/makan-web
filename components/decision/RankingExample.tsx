"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useReducedMotion } from "framer-motion"
import type { Duel } from "./EatOrYeetDuel"
import StatTicker from "@/components/StatTicker"
import { exampleStandings } from "@/lib/example-standings"

/**
 * The after-state plays as three beats so cause reads before effect:
 * scores change in place, then rows move, then ranks and arrows settle.
 */
type Phase = "before" | "scoring" | "moving" | "settled"
const SCORE_MS = 900
const MOVE_MS = 1000
const EASE_MOVE = [0.65, 0, 0.35, 1] as const
const EASE_OUT = [0.23, 1, 0.32, 1] as const

export default function RankingExample({ duels, labels }: {
  duels: Duel[]
  labels: { title: string; before: string; after: string; restaurant: string; eats: string; score: string; movement: string; up: string; down: string; unchanged: string }
}) {
  const trigger = useRef<HTMLSpanElement>(null)
  const [phase, setPhase] = useState<Phase>("before")
  const reducedMotion = useReducedMotion()
  const previous = exampleStandings(duels, 0)
  const final = exampleStandings(duels, duels.length)
  const scored = phase !== "before"
  const reordered = phase === "moving" || phase === "settled"
  const settled = phase === "settled"
  const rows = reordered ? final : previous
  useEffect(() => {
    const marker = trigger.current
    if (!marker) return
    const timers: number[] = []
    let shown = false
    const sync = () => {
      const staged = !!marker.closest(".scene-armed")
      const after = !staged || marker.classList.contains("scene-on")
      if (after === shown) return
      shown = after
      timers.splice(0).forEach(clearTimeout)
      if (!after) return setPhase("before")
      // Unstaged (reduced motion, or no scene JS) shows the result directly.
      if (!staged) return setPhase("settled")
      setPhase("scoring")
      timers.push(
        window.setTimeout(() => setPhase("moving"), SCORE_MS),
        window.setTimeout(() => setPhase("settled"), SCORE_MS + MOVE_MS),
      )
    }
    const observer = new MutationObserver(sync)
    observer.observe(marker, { attributes: true, attributeFilter: ["class"] })
    const frame = requestAnimationFrame(sync)
    return () => { observer.disconnect(); cancelAnimationFrame(frame); timers.forEach(clearTimeout) }
  }, [])
  return (
    <div data-ranking-example data-ranking-state={scored ? "after" : "before"} data-ranking-phase={phase}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-bold text-brand-ink">{labels.title}</h3>
        {/* Animates only on the switch to after; the first render matches the server. */}
        <motion.span key={String(scored)} initial={scored && !reducedMotion ? { opacity: 0, filter: "blur(2px)" } : false} animate={{ opacity: 1, filter: "blur(0px)" }} transition={{ duration: 0.3, ease: EASE_OUT }}
          className={`text-base font-bold ${scored ? "text-brand-orange" : "text-brand-ink"}`}>{scored ? labels.after : labels.before}</motion.span>
      </div>
      <table className="mt-3 w-full table-fixed border-collapse text-sm tabular-nums text-brand-ink sm:text-base">
        <caption className="sr-only">{labels.title}</caption>
        <colgroup><col className="w-6 sm:w-8" /><col /><col className="w-8 sm:w-16" /><col className="w-10 sm:w-20" /><col className="w-10 sm:w-16" /></colgroup>
        <thead className="border-b border-brand-ink/25 text-xs font-semibold text-brand-muted sm:text-sm">
          <tr><th scope="col" className="py-2 text-left">#</th><th scope="col" className="py-2 text-left">{labels.restaurant}</th><th scope="col" className="text-right">{labels.eats}</th><th scope="col" className="text-right">{labels.score}</th><th scope="col" className="text-right">{labels.movement}</th></tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const before = previous.find(item => item.name === row.name)!
            const after = final.find(item => item.name === row.name)!
            const movement = settled ? before.rank - after.rank : 0
            const gainedEat = scored && after.eats > before.eats
            // Opaque rows, risers on top: crossing rows pass over, never through, each other.
            const rising = reordered && after.rank < before.rank
            const changesRank = after.rank !== before.rank
            const inTransit = phase === "moving" && changesRank
            return (
              <motion.tr key={row.name} layout={reducedMotion ? false : "position"}
                transition={{ layout: { duration: scored ? MOVE_MS / 1000 : 0.45, ease: EASE_MOVE } }}
                data-restaurant={row.name}
                className={`relative border-b border-brand-line transition-colors duration-300 ${gainedEat ? "bg-brand-cream" : "bg-brand-card"} ${rising ? "z-10" : ""}`}>
                <td className="py-2.5 font-bold">
                  {/* A row in transit drops its rank and receives the new one on landing,
                      so every visible number is always in order. */}
                  <motion.span key={settled ? after.rank : before.rank} className="inline-block"
                    initial={reducedMotion || !settled || !changesRank ? false : { opacity: 0, filter: "blur(2px)" }}
                    animate={{ opacity: inTransit ? 0 : 1, filter: "blur(0px)" }}
                    transition={{ duration: inTransit ? 0.15 : 0.3, ease: EASE_OUT }}>
                    {settled ? after.rank : before.rank}
                  </motion.span>
                </td>
                <th scope="row" className="py-2.5 pr-2 text-left font-semibold leading-snug">{row.name}</th>
                <td className={`text-right transition-colors duration-300 ${gainedEat ? "font-bold text-brand-orange" : "font-semibold"}`}>
                  <motion.span className="inline-block" style={{ transformOrigin: "right center" }}
                    animate={{ scale: gainedEat && phase === "scoring" && !reducedMotion ? [1, 1.3, 1] : 1 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}>
                    {scored ? after.eats : before.eats}
                  </motion.span>
                </td>
                <td className="text-right font-bold text-brand-orange"><StatTicker key={`${scored}-${row.name}`} initialValue={before.rate} value={scored ? after.rate : before.rate} inView={scored} duration={SCORE_MS / 1000} />%</td>
                <td className="text-right">
                  <span className="inline-flex items-center justify-end gap-1 font-semibold">
                    <span className="sr-only">{movement > 0 ? `${labels.up} ${movement}` : movement < 0 ? `${labels.down} ${-movement}` : labels.unchanged}</span>
                    {movement !== 0 ? (
                      <motion.span aria-hidden="true" className="inline-flex items-center gap-1"
                        initial={reducedMotion ? false : { opacity: 0, y: movement > 0 ? 6 : -6 }}
                        animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT, delay: 0.08 }}>
                        <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 ${movement < 0 ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M8 13V3m-4 4 4-4 4 4" /></svg>
                        <span>{Math.abs(movement)}</span>
                      </motion.span>
                    ) : <span aria-hidden="true">–</span>}
                  </span>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
      <span ref={trigger} data-scene="12" aria-hidden="true" className="pointer-events-none block h-px w-px" />
      <p aria-live="polite" aria-atomic="true" className="sr-only">{scored ? labels.after : labels.before}. {(scored ? final : previous).map(row => `${row.rank}. ${row.name}, ${row.eats} ${labels.eats}, ${row.rate}%`).join('; ')}</p>
    </div>
  )
}
