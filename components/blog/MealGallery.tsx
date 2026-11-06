"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useReducedMotion } from "framer-motion"
import type { MealEmbed } from "@/lib/reviews/types"
import StaticPicture from "@/components/StaticPicture"
import styles from "./MealGallery.module.css"

const GALLERY_IMAGE_WIDTHS = [480, 900, 1400] as const
const staticBlogPath = (src: string) => src.replace('/blog/', '/static-images/v1/blog/').replace(/\.(?:jpg|jpeg|png|webp)$/i, '')

export function MealGallery({ meals, venue, credit }: { meals: MealEmbed[]; venue?: string; credit?: string }) {
  const withPhotos = meals.filter(meal => meal.photo)
  const [open, setOpen] = useState<number | null>(null)
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const close = useCallback(() => { setOpen(null); setLens(null) }, [])
  const active = open !== null ? withPhotos[open] : null

  useEffect(() => {
    if (open === null) { dialog.current?.close(); return }
    dialog.current?.showModal()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
      event.preventDefault()
      setLens(null)
      setOpen(current => current === null ? null : (current + (event.key === 'ArrowRight' ? 1 : -1) + withPhotos.length) % withPhotos.length)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [open, withPhotos.length])

  return (
    <section className={styles.gallery} aria-label="Meal photographs">
      <p className={styles.title}>The three I logged on Makan that night</p>
      {withPhotos.length ? (
        <div className={styles.rail} role="region" tabIndex={0} aria-label="Meal photos, swipe or scroll horizontally">
          {withPhotos.map((meal, index) => (
            <figure key={meal.photo} className={styles.meal}>
              <button type="button" onClick={() => setOpen(index)} aria-label={`Open photo: ${meal.caption}`}>
                <StaticPicture basePath={staticBlogPath(meal.photo as string)} widths={GALLERY_IMAGE_WIDTHS} alt={meal.alt} width={500} height={500} sizes="(min-width: 900px) 560px, 80vw" loading="lazy" />
              </button>
              <figcaption>{meal.caption}{venue || credit ? <span>{[venue, credit].filter(Boolean).join(' · ')}</span> : null}</figcaption>
            </figure>
          ))}
        </div>
      ) : <ul>{meals.map((meal, index) => <li key={index}>{meal.caption}</li>)}</ul>}
      <dialog ref={dialog} className={styles.dialog} aria-label={active?.alt || 'Meal photograph'} onCancel={event => { event.preventDefault(); close() }} onClick={event => { if (event.target === event.currentTarget) close() }}>
        {active ? <>
          <button type="button" onClick={close} aria-label="Close photo" className={styles.close} autoFocus>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
          <figure className={styles.lightbox}>
            <div className={styles.lens} onMouseMove={prefersReducedMotion ? undefined : event => {
              const rect = event.currentTarget.getBoundingClientRect()
              setLens({ x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 })
            }} onMouseLeave={() => setLens(null)}>
              <StaticPicture basePath={staticBlogPath(active.photo as string)} widths={GALLERY_IMAGE_WIDTHS} alt={active.alt} width={1400} height={1400} sizes="(min-width: 768px) 768px, 100vw" style={lens ? { transformOrigin: `${lens.x}% ${lens.y}%`, transform: 'scale(1.8)' } : undefined} />
            </div>
            <figcaption>{active.caption}{venue || credit ? <span>{[venue, credit].filter(Boolean).join(' · ')}</span> : null}</figcaption>
          </figure>
        </> : null}
      </dialog>
    </section>
  )
}
