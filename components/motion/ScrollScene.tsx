"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * Scroll-staged storytelling. The wrapper is a tall region; on md+ its child
 * is pinned, and elements tagged [data-scene="n"] switch on one by one as the
 * reader scrolls through the region — the page discloses itself bit by bit
 * instead of all at once. On mobile the same beats reveal as they scroll into
 * view.
 *
 * Staging is an enhancement, never a dependency. Nothing is hidden or pinned
 * until JS adds .scene-armed (the `staged:` Tailwind variant keys the pinned
 * layout off the same class), and the scene is never armed at all when the
 * reader prefers reduced motion — they get every beat in flow, in order.
 */
export default function ScrollScene({
  children,
  thresholds,
  className = "",
}: {
  children: ReactNode
  /** Scroll progress (0..1) at which each scene index switches on. */
  thresholds: number[]
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches) return

    const beats = Array.from(node.querySelectorAll<HTMLElement>("[data-scene]"))
    node.classList.add("scene-armed")

    const desktop = window.matchMedia("(min-width: 768px)")

    // Mobile: each beat arrives as it enters the viewport, in order.
    const setupMobile = () => {
      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              entry.target.classList.add("scene-on")
              observer.unobserve(entry.target)
            }
          }
        },
        { rootMargin: "0px 0px -15% 0px" },
      )
      beats.forEach((beat) => observer.observe(beat))
      return () => observer.disconnect()
    }

    // Desktop: pinned scene staged by scroll progress through the region.
    // Driven by a rAF loop rather than scroll events: the site runs Lenis
    // smooth-scroll, which moves scrollY without firing window scroll events,
    // and a polling loop survives any scroll machinery. One
    // getBoundingClientRect per frame; the toggles run only when progress
    // actually moved, so an idle page costs one rect read and nothing else.
    const setupDesktop = () => {
      let raf = 0
      let last = -1
      const apply = () => {
        const rect = node.getBoundingClientRect()
        if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return
        const span = node.offsetHeight - window.innerHeight
        const progress = span > 0 ? Math.min(1, Math.max(0, -rect.top / span)) : 1
        if (progress === last) return
        last = progress
        for (const beat of beats) {
          const index = Number(beat.dataset.scene ?? 0)
          // data-scene-until gives a beat a WINDOW: on at its own stage,
          // off again when a later stage arrives (a resolved duel making
          // way for the next).
          const until = beat.dataset.sceneUntil
          const past = until !== undefined && progress >= (thresholds[Number(until)] ?? 2)
          beat.classList.toggle("scene-on", !past && progress >= (thresholds[index] ?? 0))
        }
      }
      const loop = () => {
        apply()
        raf = requestAnimationFrame(loop)
      }
      // The landing state (stage-0 beats) must not wait for the first rAF —
      // hidden or prerendered tabs never get one. Apply synchronously at arm.
      apply()
      raf = requestAnimationFrame(loop)
      return () => {
        cancelAnimationFrame(raf)
        last = -1
      }
    }

    // The branch must FOLLOW the breakpoint, not be chosen once at mount: a
    // pane resized across 768px otherwise leaves mobile's permanent classes
    // under desktop's windowed layout — every stage on at once. On a switch
    // the desktop loop recomputes every beat (including turning strays off)
    // on its first frame.
    let teardown = desktop.matches ? setupDesktop() : setupMobile()
    const onChange = () => {
      teardown()
      teardown = desktop.matches ? setupDesktop() : setupMobile()
    }
    desktop.addEventListener("change", onChange)
    return () => {
      desktop.removeEventListener("change", onChange)
      teardown()
      node.classList.remove("scene-armed")
    }
  }, [thresholds])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
