'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import StatTicker from './StatTicker'
import StaticPicture from './StaticPicture'

// Shape mirrors PublicMeal in lib/makan-stats.ts — redeclared here because
// that module is `server-only` and this is a client component.
type Meal = {
  src: string
  alt: string
  caption: string
  locationName: string
  mealType: string
  username: string
}

// Bundled photos shown when the live Firestore fetch fails or comes back
// suspiciously thin — the section must never render sparse or empty.
const FALLBACK_MEALS: Meal[] = [
  { src: '/meals/IMG_6831.jpg', alt: 'Octopus with orange sauce', caption: 'Octopus with orange sauce', locationName: '', mealType: '', username: '' },
  { src: '/meals/IMG_6952.jpg', alt: 'Eggs Benedict', caption: 'Eggs Benedict', locationName: '', mealType: '', username: '' },
  { src: '/meals/IMG_6944.jpg', alt: 'Beijing style Peking duck', caption: 'Beijing style Peking duck', locationName: '', mealType: '', username: '' },
  { src: '/meals/IMG_6959.jpg', alt: 'Hangover Tom Yum', caption: 'Hangover Tom Yum', locationName: '', mealType: '', username: '' },
  { src: '/meals/IMG_6942.jpg', alt: 'Tuna tartare', caption: 'Tuna tartare', locationName: '', mealType: '', username: '' },
  { src: '/meals/IMG_6945.jpg', alt: 'Valentines brunch platter', caption: 'Valentines brunch platter', locationName: '', mealType: '', username: '' },
]
const FALLBACK_IMAGE_WIDTHS = [480, 720] as const

interface LatestOnMakanProps {
  mealCount: number
  liveMeals: Meal[]
}

/* Feather icons the app's share card uses for meal types
   (Breakfast=sunrise · Lunch=sun · Dinner=moon · Snack=coffee). */
function MealTypeIcon({ type }: { type: string }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2.4,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    style: { width: '1em', height: '1em' },
    'aria-hidden': true,
  }
  switch (type) {
    case 'Breakfast':
      return (
        <svg {...common}>
          <path d="M17 18a5 5 0 0 0-10 0" />
          <line x1="12" y1="2" x2="12" y2="9" />
          <line x1="4.22" y1="10.22" x2="5.64" y2="11.64" />
          <line x1="1" y1="18" x2="3" y2="18" />
          <line x1="21" y1="18" x2="23" y2="18" />
          <line x1="18.36" y1="11.64" x2="19.78" y2="10.22" />
          <line x1="23" y1="22" x2="1" y2="22" />
          <polyline points="8 6 12 2 16 6" />
        </svg>
      )
    case 'Lunch':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      )
    case 'Dinner':
      return (
        <svg {...common}>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )
    case 'Snack':
      return (
        <svg {...common}>
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      )
    default:
      return null
  }
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" style={{ width: '1em', height: '1em' }} aria-hidden>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}

/**
 * The app's "export as a post" share card, rebuilt live: square card, photo
 * on top, 340/1080 saffron bar with wordmark → @username → caption +
 * meal-type pill → location + makanofficial.com. Typography scales with the
 * card via container-query units so one component serves both breakpoints.
 */
function MealPostCard({ meal }: { meal: Meal }) {
  const bundledFallback = /^\/meals\/IMG_.+\.jpg$/i.test(meal.src)

  return (
    <div
      className="flex aspect-square w-full flex-col overflow-hidden bg-brand-orange text-white"
      style={{ containerType: 'inline-size' }}
    >
      <div className="relative w-full shrink-0" style={{ aspectRatio: '1080 / 740' }}>
        {bundledFallback ? (
          <StaticPicture
            basePath={meal.src
              .replace('/meals/', '/static-images/v1/meals/')
              .replace(/\.jpg$/i, '')}
            widths={FALLBACK_IMAGE_WIDTHS}
            alt={meal.alt}
            width={360}
            height={247}
            sizes="(min-width: 1024px) 360px, 240px"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <Image
            src={meal.src}
            alt={meal.alt}
            width={360}
            height={247}
            sizes="(min-width: 1024px) 360px, 240px"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </div>
      <div
        className="flex min-h-0 flex-1 flex-col justify-between text-white"
        style={{ padding: '2.6cqw 4cqw 3cqw' }}
      >
        <div className="flex items-center justify-between gap-2">
          <Image
            src="/makan-logo-white.svg"
            alt="makan"
            width={120}
            height={28}
            style={{ height: '4cqw', width: 'auto' }}
          />
          {meal.mealType && (
            <span
              className="flex shrink-0 items-center rounded-full bg-white font-bold text-brand-orange-ink"
              style={{ fontSize: '2.6cqw', gap: '1.2cqw', padding: '0.9cqw 2.4cqw' }}
            >
              <MealTypeIcon type={meal.mealType} />
              {meal.mealType}
            </span>
          )}
        </div>
        {meal.username && (
          <p className="truncate font-medium text-white/80" style={{ fontSize: '2.6cqw', lineHeight: 1.2 }}>
            @{meal.username}
          </p>
        )}
        <p className="truncate font-bold" style={{ fontSize: '3.8cqw', lineHeight: 1.25 }}>
          {meal.caption || meal.mealType || 'A meal on Makan'}
        </p>
        <div className="flex items-center justify-between text-white/80" style={{ fontSize: '2.4cqw', gap: '2cqw' }}>
          <span className="flex min-w-0 items-center truncate" style={{ gap: '1.2cqw' }}>
            {meal.locationName && (
              <>
                <PinIcon />
                <span className="truncate">{meal.locationName}</span>
              </>
            )}
          </span>
          <span className="shrink-0">makanofficial.com</span>
        </div>
      </div>
    </div>
  )
}

function ArrowButton({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'left' ? 'Scroll to previous meals' : 'Scroll to more meals'}
      className={`absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-brand-line bg-brand-card text-brand-ink shadow-lg shadow-black/10 transition-transform hover:scale-105 active:scale-95 lg:flex ${
        dir === 'left' ? '-left-2' : '-right-2'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left' ? <path d="M10 3 5 8l5 5" /> : <path d="m6 3 5 5-5 5" />}
      </svg>
    </button>
  )
}

export default function LatestOnMakan({ mealCount, liveMeals }: LatestOnMakanProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const scroller = useRef<HTMLDivElement>(null)

  const meals = liveMeals.length >= 12 ? liveMeals : FALLBACK_MEALS

  const scrollByCard = (dir: 1 | -1) => {
    scroller.current?.scrollBy({ left: dir * 384, behavior: 'smooth' })
  }

  return (
    <section ref={ref} className="bg-brand-cream py-20 sm:py-32">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange-ink">
            On Makan
          </p>
          <h2 className="mt-3 text-2xl font-bold text-brand-ink sm:text-3xl lg:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            <StatTicker value={mealCount} inView={inView} /> meals logged.
          </h2>
        </motion.div>
      </div>

      {/* One responsive carousel — avoids duplicating every card in hidden DOM. */}
      <div className="relative mx-auto mt-10 max-w-7xl lg:mt-12">
        <ArrowButton dir="left" onClick={() => scrollByCard(-1)} />
        <ArrowButton dir="right" onClick={() => scrollByCard(1)} />
        <div
          ref={scroller}
          className="meal-carousel flex snap-x snap-mandatory gap-3 overflow-x-auto px-5 pb-4 sm:px-8 lg:gap-6 scrollbar-hide"
        >
          {meals.map((meal, i) => (
            <motion.div
              key={`${meal.src}-${i}`}
              className="meal-card group w-[240px] flex-none snap-start overflow-hidden rounded-xl shadow-md shadow-black/[0.07] lg:w-[360px] lg:rounded-2xl lg:shadow-lg lg:shadow-black/[0.08]"
              initial={{ opacity: 0, x: 32 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + Math.min(i, 8) * 0.08 }}
              whileHover={{ scale: 1.02, rotate: -0.4 }}
            >
              <MealPostCard meal={meal} />
            </motion.div>
          ))}
          <div className="w-2 flex-none sm:w-5" aria-hidden />
        </div>
      </div>
    </section>
  )
}
