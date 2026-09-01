"use client"

import { useEffect, useRef, type ReactNode } from "react"

/**
 * Adds .is-revealing to its wrapper once it enters the viewport, which lets
 * the CSS in globals.css run the staggered entrance ([data-beat]), the chip
 * deal ([data-deal]) and the hand-ring draw.
 *
 * Content never depends on this to become visible: without JS the class is
 * never added and everything renders static; with reduced motion the CSS
 * side is inert.
 */
export default function Reveal({
  children,
  className = "",
}: {
  children: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          node.classList.add("is-revealing")
          observer.disconnect()
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
