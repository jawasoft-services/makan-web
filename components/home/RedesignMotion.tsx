'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/** Content is visible without JS; motion is an enhancement and pauses out of view. */
export function HomeHero({ children, pauseLabel, resumeLabel }: { children: ReactNode; pauseLabel: string; resumeLabel: string }) {
  const ref = useRef<HTMLElement>(null)
  const [paused, setPaused] = useState(false)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    // Effect-owned attributes survive React replacing className on pause/resume.
    node.dataset.motionReady = 'true'
    node.dataset.offscreen = 'true'
    const observer = new IntersectionObserver(([entry]) => { node.dataset.offscreen = String(!entry.isIntersecting) })
    observer.observe(node)
    const visibility = () => { node.dataset.documentHidden = String(document.hidden) }
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => {
      delete node.dataset.motionReady
      delete node.dataset.offscreen
      delete node.dataset.documentHidden
      observer.disconnect()
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])
  return <section ref={ref} id="top" className={`hero hero-playing ${paused ? 'hero-paused' : ''}`} aria-label="Makan">
    {children}
    <button className="hero-motion" type="button" aria-pressed={paused} onClick={() => setPaused(!paused)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={paused ? 'm8 5 11 7-11 7Z' : 'M8 5v14M16 5v14'} /></svg><span>{paused ? resumeLabel : pauseLabel}</span></button>
  </section>
}

export function ReviewsRail({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node) return
    node.dataset.motionReady = 'true'
    node.dataset.inView = 'false'
    const observer = new IntersectionObserver(([entry]) => { node.dataset.inView = String(entry.isIntersecting) })
    observer.observe(node)
    const visibility = () => { node.dataset.documentHidden = String(document.hidden) }
    visibility()
    document.addEventListener('visibilitychange', visibility)
    return () => {
      delete node.dataset.motionReady
      delete node.dataset.inView
      delete node.dataset.documentHidden
      observer.disconnect()
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [])
  return <div ref={ref} className="review-motion">
    <div className="reviews-viewport" tabIndex={0} role="region" aria-label={label}><div className="reviews-track"><div className="review-set">{children}</div><div className="review-set review-clone" aria-hidden="true">{children}</div></div></div>
  </div>
}
