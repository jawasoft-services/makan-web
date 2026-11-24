'use client'

import { Children, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * The pinned phone beside the four chapters on wide screens: whichever chapter sits in the middle
 * of the window picks the screen shown. Phones never see it; each chapter carries its own screen
 * (hidden on wide screens), so only the screen on show is reachable: the regulars card stays usable.
 */
export default function ChapterStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [on, setOn] = useState(0)
  useEffect(() => {
    const chapters = ref.current?.parentElement?.querySelectorAll<HTMLElement>('[data-chapter]')
    if (!chapters?.length) return
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) if (e.isIntersecting) setOn(Number((e.target as HTMLElement).dataset.chapter))
    }, { rootMargin: '-45% 0px -45% 0px' })
    chapters.forEach((c) => io.observe(c))
    return () => io.disconnect()
  }, [])
  return <div ref={ref} className="chapter-stage">
    <div className="chapter-stack">
      {Children.map(children, (child, i) => <div className={`chapter-screen${i === on ? ' is-on' : ''}`} inert={i !== on} aria-hidden={i !== on}>{child}</div>)}
    </div>
  </div>
}
