'use client'

import { useEffect, useRef, type ReactNode } from 'react'

/** One meal preview card, already localised by the server. */
export type WallCard = { id: string; src: string; dish: string; meta: string; handle: string; alt: string }

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
const smooth = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t) }

const NO_SCRIPT = '<style>.dish-wall{height:auto!important}.dish-wall-stage{position:relative!important;height:auto!important;overflow:visible!important}.dish-wall-screen{position:relative!important;height:100svh!important}.dish-wall-previews{position:static!important;transform:none!important;flex-wrap:wrap!important;padding:48px 16px 24px!important;pointer-events:auto!important}.dish-preview{opacity:1!important;transform:none!important;margin-top:0!important}.dish-wall-total{position:static!important;opacity:1!important;padding:0 16px 40px!important}</style>'

function hasWebGL() {
  try { return !!document.createElement('canvas').getContext('webgl2') } catch { return false }
}

/**
 * The homepage hero. A tall section with a sticky stage: the headline, then the Three.js spiral of
 * real meals, then five meal previews. Without WebGL, with reduced motion or before the scene has
 * loaded, the same tiles show as a still grid and every link works.
 */
export default function DishWall({ label, tiles, previews, intro, total }: {
  label: string
  tiles: string[]
  previews: WallCard[]
  intro: ReactNode
  total: ReactNode
}) {
  const section = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const introRef = useRef<HTMLDivElement>(null)
  const row = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = section.current!, st = stage.current!, cv = canvas.current!, introEl = introRef.current!, rowEl = row.current!
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches || !hasWebGL()
    const progress = () => {
      const run = el.offsetHeight - window.innerHeight
      return run > 0 ? clamp(-el.getBoundingClientRect().top / run, 0, 1) : 0
    }
    // The HTML layers follow the same scroll value as the scene.
    const overlay = () => {
      const p = still ? 0 : progress()
      const introV = 1 - smooth(0.04, 0.22, p)
      const answer = smooth(0.76, 0.96, p)
      st.style.setProperty('--intro', introV.toFixed(3))
      st.style.setProperty('--answer', answer.toFixed(3))
      st.style.setProperty('--shade', (1 - 0.65 * smooth(0.1, 0.4, p)).toFixed(3))
      introEl.inert = introV < 0.05
      rowEl.inert = answer < 0.6
      rowEl.classList.toggle('is-live', answer >= 0.6)
    }
    // The server renders the motion layout; reduced motion falls back in CSS, no WebGL here.
    if (still) { el.dataset.mode = 'still'; rowEl.inert = false; return }
    overlay()
    window.addEventListener('scroll', overlay, { passive: true })
    let stop: (() => void) | null = null
    let cancelled = false
    import('./dish-wall-scene').then(({ startDishWall }) => {
      if (cancelled) return
      stop = startDishWall({ section: el, stage: st, canvas: cv, tiles, progress, coarse: window.matchMedia('(pointer: coarse)').matches })
      st.dataset.scene = 'on'
    }).catch(() => { delete st.dataset.scene })
    return () => { cancelled = true; window.removeEventListener('scroll', overlay); stop?.() }
  }, [tiles])

  return <section ref={section} className="dish-wall" aria-label={label}>
    {/* Without JavaScript the scroll scene cannot run: one screen, then the previews, all visible. */}
    <noscript dangerouslySetInnerHTML={{ __html: NO_SCRIPT }} />
    <div ref={stage} className="dish-wall-stage">
      <div className="dish-wall-screen">
        <canvas ref={canvas} className="dish-wall-canvas" aria-hidden="true" />
        <div className="dish-wall-still" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element -- tiles are already resized by /api/thumb; next/image would add a billed transformation */}
          {tiles.slice(0, 32).map((src, i) => <img key={src} src={src} alt="" width={240} height={240} loading={i < 16 ? 'eager' : 'lazy'} decoding="async" />)}
        </div>
        <div className="dish-wall-shade" aria-hidden="true" />
        <div ref={introRef} className="dish-wall-intro">{intro}</div>
      </div>
      <div ref={row} className="dish-wall-previews" role="list" aria-label={label}>
        {previews.map((m, i) => <figure key={m.id} role="listitem" className="dish-preview" style={{ '--i': i } as React.CSSProperties}>
          {/* eslint-disable-next-line @next/next/no-img-element -- already resized by /api/thumb (see above) */}
          <img src={m.src} alt={m.alt} width={480} height={480} loading="lazy" decoding="async" />
          <figcaption><span className="dish-preview-meta">{m.meta}</span><span className="dish-preview-dish">{m.dish}</span>{m.handle ? <span className="dish-preview-handle">@{m.handle}</span> : null}</figcaption>
        </figure>)}
      </div>
      <div className="dish-wall-total">{total}</div>
    </div>
  </section>
}
