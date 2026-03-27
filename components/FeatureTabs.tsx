'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useInView } from 'framer-motion'

const TAB_INTERVAL = 8000
const PROGRESS_TICK = 50

const tabs = [
  {
    id: 'feed',
    label: 'Feed',
    headline: 'Two feeds. Your choice.',
    description: 'One for friends, one for everyone else.',
    image: '/meals/sharecard-1.jpg',
  },
  {
    id: 'share-cards',
    label: 'Share Cards',
    headline: 'Makan cards.',
    description:
      'Share a meal and it goes out as a Makan card — Stories, WhatsApp, wherever.',
    image: '/meals/sharecard-3.jpg',
  },
  {
    id: 'explore',
    label: 'Explore & Map',
    headline: 'See where your friends ate.',
    description: "Discover where they haven't. Friend avatars on every pin.",
    image: '/meals/sharecard-5.jpg',
  },
  {
    id: 'streaks',
    label: 'Streaks & Titles',
    headline: 'From Curious Eater to Local Legend.',
    description: 'Post daily, earn titles, collect 100 badges.',
    image: '/meals/sharecard-7.jpg',
  },
  {
    id: 'journal',
    label: 'Food Journal',
    headline: 'Your food diary.',
    description:
      "Every meal, every day, on a calendar that doesn't look like a spreadsheet.",
    image: '/meals/sharecard-9.jpg',
  },
]

export default function FeatureTabs() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { amount: 0.3 })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Refs for direct DOM mutation — avoids a re-render every 50 ms
  const progressBarRef = useRef<HTMLDivElement>(null)
  const progressValueRef = useRef(0)

  function clearTimers() {
    if (timerRef.current) clearInterval(timerRef.current)
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current)
  }

  function resetProgress() {
    progressValueRef.current = 0
    if (progressBarRef.current) progressBarRef.current.style.width = '0%'
  }

  useEffect(() => {
    if (!inView || isPaused) {
      clearTimers()
      return
    }

    resetProgress()

    progressIntervalRef.current = setInterval(() => {
      const next = Math.min(
        progressValueRef.current + 100 / (TAB_INTERVAL / PROGRESS_TICK),
        100,
      )
      progressValueRef.current = next
      if (progressBarRef.current) progressBarRef.current.style.width = `${next}%`
    }, PROGRESS_TICK)

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % tabs.length)
      resetProgress()
    }, TAB_INTERVAL)

    return clearTimers
    // Intentionally omit activeIndex: adding it would restart timers on every
    // advance. The functional updater in setActiveIndex handles correct sequencing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, isPaused])

  const handleTabClick = (index: number) => {
    setActiveIndex(index)
    resetProgress()
    setIsPaused(true)
    setTimeout(() => setIsPaused(false), 20000)
  }

  const activeTab = tabs[activeIndex]

  return (
    <section ref={sectionRef} id="features" className="bg-brand-bg px-5 sm:px-8 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-xl font-semibold text-white sm:text-2xl">
          How it works
        </h2>

        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(i)}
              className={`relative rounded-full px-4 py-2 text-xs font-medium transition-colors sm:text-sm ${
                i === activeIndex
                  ? 'bg-brand-orange text-brand-bg'
                  : 'bg-brand-surface text-brand-muted hover:text-white'
              }`}
            >
              {tab.label}
              {i === activeIndex && (
                <div className="absolute bottom-0 left-0 h-0.5 rounded-full bg-white/30 w-full overflow-hidden">
                  <div
                    ref={progressBarRef}
                    className="h-full bg-brand-bg/40"
                    style={{ width: '0%' }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-12 lg:gap-16">
          <div className="flex-1 text-center md:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-white sm:text-xl lg:text-2xl">
                  {activeTab.headline}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-muted sm:text-base">
                  {activeTab.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex-shrink-0">
            <div className="relative mx-auto w-52 sm:w-60 lg:w-64">
              <div className="overflow-hidden rounded-[2rem] border-2 border-brand-border bg-brand-surface shadow-2xl shadow-black/40">
                <div className="aspect-[9/19.5] relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={activeTab.image}
                        alt={activeTab.headline}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 256px, (min-width: 640px) 240px, 208px"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
