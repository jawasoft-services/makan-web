"use client"

import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { useReducedMotion } from "framer-motion"
import type { MealEmbed } from "@/lib/reviews/types"

export function MealGallery({ meals }: { meals: MealEmbed[] }) {
  const withPhotos = meals.filter((m) => m.photo)
  const [open, setOpen] = useState<number | null>(null)
  // Lens zoom inside the lightbox — origin follows the cursor.
  const [lens, setLens] = useState<{ x: number; y: number } | null>(null)
  const prefersReducedMotion = useReducedMotion()
  const close = useCallback(() => {
    setOpen(null)
    setLens(null)
  }, [])
  const active = open !== null ? withPhotos[open] : null

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close()
      else if (e.key === "ArrowRight") setOpen((o) => (o === null ? o : (o + 1) % withPhotos.length))
      else if (e.key === "ArrowLeft") setOpen((o) => (o === null ? o : (o - 1 + withPhotos.length) % withPhotos.length))
    }
    document.addEventListener("keydown", onKey)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKey)
      document.body.style.overflow = ""
    }
  }, [open, close, withPhotos.length])

  return (
    <div className="my-8 rounded-2xl border border-brand-line bg-brand-card p-5">
      <p className="mb-4 text-sm font-semibold text-brand-ink">The three I logged on Makan that night</p>

      {withPhotos.length ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {withPhotos.map((m, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open photo: ${m.caption}`}
              className="group block overflow-hidden rounded-xl border border-brand-line text-left transition-colors hover:border-brand-orange/50"
            >
              <Image
                src={m.photo as string}
                alt={m.alt}
                width={500}
                height={500}
                className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
              <span className="block px-3 py-2 text-xs text-brand-muted">{m.caption}</span>
            </button>
          ))}
        </div>
      ) : (
        <ul className="space-y-2 text-[15px] text-brand-ink/85">
          {meals.map((m, i) => (
            <li key={i} className="flex gap-2">
              <span className="text-brand-orange-ink">·</span>
              {m.caption}
            </li>
          ))}
        </ul>
      )}

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={active.alt}
          onClick={close}
          className="inverse-ground fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close photo"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
              <line x1="5" y1="5" x2="15" y2="15" />
              <line x1="15" y1="5" x2="5" y2="15" />
            </svg>
          </button>

          <figure
            className="m-0 flex max-h-[88vh] max-w-3xl flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="overflow-hidden rounded-xl"
              onMouseMove={
                prefersReducedMotion
                  ? undefined
                  : (e) => {
                      const r = e.currentTarget.getBoundingClientRect()
                      setLens({
                        x: ((e.clientX - r.left) / r.width) * 100,
                        y: ((e.clientY - r.top) / r.height) * 100,
                      })
                    }
              }
              onMouseLeave={() => setLens(null)}
            >
              <Image
                src={active.photo as string}
                alt={active.alt}
                width={1400}
                height={1400}
                className="max-h-[80vh] w-auto object-contain transition-transform duration-200 ease-out"
                style={
                  lens
                    ? { transformOrigin: `${lens.x}% ${lens.y}%`, transform: 'scale(1.8)' }
                    : undefined
                }
              />
            </div>
            <figcaption className="mt-3 text-center text-sm text-white/80">{active.caption}</figcaption>
          </figure>
        </div>
      )}
    </div>
  )
}
