"use client"

import { useEffect, useRef, type ReactNode } from "react"

const NAV_PX = 95 // the fixed navigation bar
const GAP_PX = 28 // least empty space kept above and below the content
const MIN_SCALE = 0.68

/**
 * The pinned scene's content box. The pin centres it between the nav bar and the
 * bottom of the screen, so empty space above and below is equal. When the window
 * is too short for the content's natural height, the content is scaled down as a
 * whole (photos keep their proportions) and the box shrinks with it, so the gaps
 * stay equal and the last line never touches the bottom edge. Inert until the
 * scene is armed (desktop, motion allowed): flowed layouts are left alone.
 */
export default function SceneFit({ children, className = "" }: { children: ReactNode; className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const outer = box.current
    const inner = content.current
    const root = outer?.closest<HTMLElement>("#proof")
    if (!outer || !inner || !root) return

    const fit = () => {
      const staged = root.classList.contains("scene-armed") && window.matchMedia("(min-width: 768px)").matches
      // offsetHeight is layout height, so it is the natural height whatever the scale.
      const natural = inner.offsetHeight
      const scale = staged ? Math.min(1, Math.max(MIN_SCALE, (window.innerHeight - NAV_PX - 2 * GAP_PX) / natural)) : 1
      inner.style.transform = scale < 1 ? `scale(${scale})` : ""
      outer.style.height = scale < 1 ? `${natural * scale}px` : ""
    }

    fit()
    // ScrollScene arms after this effect runs; refit when it adds its class.
    const observer = new MutationObserver(fit)
    observer.observe(root, { attributes: true, attributeFilter: ["class"] })
    window.addEventListener("resize", fit)
    void document.fonts?.ready.then(fit)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", fit)
    }
  }, [])

  return (
    <div ref={box} className={className}>
      <div ref={content} style={{ transformOrigin: "top center" }}>
        {children}
      </div>
    </div>
  )
}
