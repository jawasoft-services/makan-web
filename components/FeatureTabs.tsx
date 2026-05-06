'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useInView } from 'framer-motion'

const TAB_INTERVAL = 6000
const PROGRESS_TICK = 50

const features = [
  {
    id: 'feed',
    number: '01',
    label: 'Feed',
    headline: 'Two feeds. Your choice.',
    description: 'One for friends, one for everyone else. No algorithm decides what you see.',
    image: '/mockups/feed.png',
  },
  {
    id: 'share-cards',
    number: '02',
    label: 'Share Cards',
    headline: 'Makan cards.',
    description:
      'Share a meal and it goes out as a branded Makan card — Stories, WhatsApp, wherever.',
    image: '/mockups/share-cards.png',
  },
  {
    id: 'explore',
    number: '03',
    label: 'Explore & Map',
    headline: 'See where your friends ate.',
    description: "Friend avatars on every map pin. Discover places through people you trust.",
    image: '/mockups/explore.png',
  },
  {
    id: 'streaks',
    number: '04',
    label: 'Streaks & Titles',
    headline: 'Six titles, 100 badges, one habit.',
    description: 'Post a meal a day to keep your streak. Six foodie titles to climb, 100 badges to collect.',
    image: '/mockups/streaks.png',
  },
  {
    id: 'journal',
    number: '05',
    label: 'Food Journal',
    headline: 'Your food diary.',
    description:
      "Every meal on a calendar. Filter by breakfast, lunch, dinner. See your month at a glance.",
    image: '/mockups/journal.png',
  },
]

export default function FeatureTabs() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { amount: 0.3 })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
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
      setActiveIndex((prev) => (prev + 1) % features.length)
      resetProgress()
    }, TAB_INTERVAL)

    return clearTimers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, isPaused])

  const handleClick = (index: number) => {
    setActiveIndex(index)
    resetProgress()
    setIsPaused(true)
  }

  const active = features[activeIndex]

  return (
    <section ref={sectionRef} id="features" className="bg-brand-bg px-5 sm:px-8 py-20 sm:py-32">
      <div className="mx-auto max-w-6xl">

        {/* Desktop: side-by-side. Mobile: headline → mockup → feature list */}
        <div className="lg:flex lg:items-center lg:gap-16">

          {/* Left column (desktop) — section header + active headline + feature list */}
          <div className="w-full lg:w-1/2">
            {/* Section anchor — stable header above dynamic content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="mb-10 sm:mb-12"
            >
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange">
                Inside the app
              </p>
              <h2
                className="mt-4 text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
                style={{ letterSpacing: '-0.02em' }}
              >
                What you actually do here.
              </h2>
            </motion.div>
            {/* Active headline + description */}
            <div className="min-h-[80px] sm:min-h-[100px]" role="tabpanel" id={`tabpanel-${active.id}`} aria-label={active.label}>
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <h3
                    className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {active.headline}
                  </h3>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-muted sm:text-base">
                    {active.description}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Mockup — shown here on mobile only, between headline and list */}
            <div className="my-8 flex justify-center lg:hidden">
              <div className="relative w-full max-w-[240px] sm:max-w-[280px]">
                {/* Ambient glow behind mockup */}
                <div className="absolute -inset-6 rounded-3xl bg-brand-orange/[0.04] blur-2xl" />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, scale: 0.97 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.4 }}
                    className="relative"
                  >
                    <Image
                      src={active.image}
                      alt={active.headline}
                      width={460}
                      height={920}
                      className="w-full h-auto rounded-2xl shadow-2xl shadow-black/40"
                      sizes="280px"
                      priority={activeIndex === 0}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Feature list */}
            <div className="mt-2 lg:mt-8" role="tablist" aria-label="App features">
              {features.map((feature, i) => {
                const isActive = i === activeIndex
                return (
                  <button
                    key={feature.id}
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`tabpanel-${feature.id}`}
                    onClick={() => handleClick(i)}
                    className="group relative block w-full text-left"
                  >
                    <div className={`flex items-center gap-5 py-4 transition-colors duration-300 ${
                      isActive ? 'text-white' : 'text-brand-muted hover:text-white/70'
                    }`}>
                      <span className={`shrink-0 text-xs font-medium tabular-nums transition-colors duration-300 ${
                        isActive ? 'text-brand-orange' : 'text-brand-dim group-hover:text-brand-muted'
                      }`}>
                        {feature.number}
                      </span>
                      <span className="text-sm font-medium sm:text-base">
                        {feature.label}
                      </span>
                    </div>

                    <div className="h-px w-full bg-brand-border">
                      {isActive && (
                        <div
                          ref={progressBarRef}
                          className="h-full bg-brand-orange transition-none"
                          style={{ width: '0%' }}
                        />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Right column (desktop only) — mockup image */}
          <div className="hidden lg:flex lg:w-1/2 lg:justify-center">
            <div className="relative w-full max-w-[340px]">
              {/* Ambient glow behind mockup */}
              <div className="absolute -inset-8 rounded-3xl bg-brand-orange/[0.04] blur-3xl" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.4 }}
                  className="relative"
                >
                  <Image
                    src={active.image}
                    alt={active.headline}
                    width={460}
                    height={920}
                    className="w-full h-auto rounded-2xl shadow-2xl shadow-black/40"
                    sizes="340px"
                    priority={activeIndex === 0}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
