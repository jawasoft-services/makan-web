'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import StatTicker from './StatTicker'

function ArrowButton({ dir, onClick }: { dir: 'left' | 'right'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={dir === 'left' ? 'Scroll to previous meals' : 'Scroll to more meals'}
      className={`absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-brand-line bg-brand-card text-brand-ink shadow-lg shadow-black/10 transition-transform hover:scale-105 active:scale-95 ${
        dir === 'left' ? '-left-2' : '-right-2'
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {dir === 'left' ? <path d="M10 3 5 8l5 5" /> : <path d="m6 3 5 5-5 5" />}
      </svg>
    </button>
  )
}

const meals = [
  { src: '/meals/IMG_6831.jpg', alt: 'Octopus with orange sauce' },
  { src: '/meals/IMG_6952.jpg', alt: 'Eggs Benedict' },
  { src: '/meals/IMG_6944.jpg', alt: 'Beijing style Peking duck' },
  { src: '/meals/IMG_6959.jpg', alt: 'Hangover Tom Yum' },
  { src: '/meals/IMG_6942.jpg', alt: 'Tuna tartare' },
  { src: '/meals/IMG_6945.jpg', alt: 'Valentines brunch platter' },
]

interface LatestOnMakanProps {
  mealCount: number
}

export default function LatestOnMakan({ mealCount }: LatestOnMakanProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const scroller = useRef<HTMLDivElement>(null)

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
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange">
            On Makan
          </p>
          <h2 className="mt-3 text-2xl font-bold text-brand-ink sm:text-3xl lg:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            <StatTicker value={mealCount} inView={inView} /> meals and counting.
          </h2>
        </motion.div>
      </div>

      {/* Mobile: horizontal scroll strip — full sharecards */}
      <div className="mt-10 lg:hidden">
        <div className="flex gap-3 overflow-x-auto px-5 sm:px-8 scrollbar-hide">
          {meals.map((meal, i) => (
            <motion.div
              key={meal.src}
              className="flex-none overflow-hidden rounded-xl"
              style={{ width: 200 }}
              initial={{ opacity: 0, x: 24 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.1 + i * 0.06 }}
            >
              <Image
                src={meal.src}
                alt={meal.alt}
                width={1200}
                height={1200}
                className="w-full h-auto"
                sizes="200px"
              />
            </motion.div>
          ))}
          {/* Breathing room at scroll end */}
          <div className="flex-none w-5 sm:w-8" />
        </div>
      </div>

      {/* Desktop: snap carousel — hovered card stays sharp, siblings soften */}
      <div className="relative mx-auto mt-12 hidden max-w-7xl px-5 sm:px-8 lg:block">
        <ArrowButton dir="left" onClick={() => scrollByCard(-1)} />
        <ArrowButton dir="right" onClick={() => scrollByCard(1)} />
        <div
          ref={scroller}
          className="meal-carousel flex snap-x snap-mandatory gap-6 overflow-x-auto pb-4 scrollbar-hide"
        >
          {meals.map((meal, i) => (
            <motion.div
              key={meal.src}
              className="meal-card group flex-none w-[360px] snap-start overflow-hidden rounded-2xl shadow-lg shadow-black/[0.08]"
              initial={{ opacity: 0, x: 32 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
              whileHover={{ scale: 1.02, rotate: -0.4 }}
            >
              <Image
                src={meal.src}
                alt={meal.alt}
                width={1200}
                height={1200}
                className="w-full h-auto"
                sizes="360px"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
