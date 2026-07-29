'use client'

import { useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { useTranslations } from 'next-intl'
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion'
import StaticPicture from './StaticPicture'

const EASE_OUT = [0.23, 1, 0.32, 1] as const
const MOCKUP_IMAGE_WIDTHS = [560, 800] as const

type Screen = {
  id: string
  label: string
  headline: string
  copy: string
  src: string
}

function DeviceMockup({ screen, alt }: { screen: Screen; alt: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[280px] sm:max-w-[340px]">
      <div className="absolute -inset-10 rounded-[4rem] bg-brand-orange/10 blur-3xl" aria-hidden />
      <div className="relative aspect-[1527/2900] drop-shadow-2xl">
        <StaticPicture
          basePath={screen.src
            .replace('/app-mockups/', '/static-images/v1/app-mockups/')
            .replace(/\.png$/i, '')}
          widths={MOCKUP_IMAGE_WIDTHS}
          alt={alt}
          width={1527}
          height={2900}
          sizes="(min-width: 640px) 340px, 280px"
          className="absolute inset-0 h-full w-full object-contain"
          loading={screen.id === 'diary' ? 'eager' : 'lazy'}
          fetchPriority={screen.id === 'diary' ? 'high' : undefined}
        />
      </div>
    </div>
  )
}

export default function AppShowcase() {
  const t = useTranslations('Home.Showcase')
  const screens: Screen[] = [
    {
      id: 'diary',
      label: t('diaryLabel'),
      headline: t('diaryTitle'),
      copy: t('diaryBody'),
      src: '/app-mockups/01-diary.png',
    },
    {
      id: 'journey',
      label: t('journeyLabel'),
      headline: t('journeyTitle'),
      copy: t('journeyBody'),
      src: '/app-mockups/02-journey.png',
    },
    {
      id: 'friends',
      label: t('friendsLabel'),
      headline: t('friendsTitle'),
      copy: t('friendsBody'),
      src: '/app-mockups/03-friends.png',
    },
    {
      id: 'map',
      label: t('mapLabel'),
      headline: t('mapTitle'),
      copy: t('mapBody'),
      src: '/app-mockups/04-map.png',
    },
    {
      id: 'details',
      label: t('detailsLabel'),
      headline: t('detailsTitle'),
      copy: t('detailsBody'),
      src: '/app-mockups/05-meal.png',
    },
  ]
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reducedMotion = useReducedMotion()
  const [activeIndex, setActiveIndex] = useState(0)
  const active = screens[activeIndex]

  const handleTabKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next = index
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      next = (index + 1) % screens.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      next = (index - 1 + screens.length) % screens.length
    } else if (event.key === 'Home') {
      next = 0
    } else if (event.key === 'End') {
      next = screens.length - 1
    } else {
      return
    }

    event.preventDefault()
    setActiveIndex(next)
    const tabs = event.currentTarget
      .closest('[role="tablist"]')
      ?.querySelectorAll<HTMLButtonElement>('[role="tab"]')
    tabs?.[next]?.focus()
  }

  return (
    <section id="features" className="bg-brand-card px-5 py-20 sm:px-8 sm:py-32">
      <div ref={ref} className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE_OUT }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
            {t('eyebrow')}
          </p>
          <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end lg:gap-16">
            <h2
              className="max-w-2xl text-3xl font-bold leading-[1.1] text-brand-ink sm:text-5xl"
              style={{ letterSpacing: '-0.025em' }}
            >
              {t('title')}
            </h2>
            <p className="max-w-xl text-base leading-relaxed text-brand-muted sm:text-lg">
              {t('body')}
            </p>
          </div>
        </motion.div>

        <div className="mt-12 overflow-hidden rounded-3xl border border-brand-line bg-brand-cream sm:mt-16 lg:grid lg:min-h-[690px] lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div
            className="flex items-center justify-center px-6 py-12 sm:px-10 lg:py-14"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.08, ease: EASE_OUT }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reducedMotion ? 0 : -10 }}
                transition={{ duration: reducedMotion ? 0 : 0.3, ease: EASE_OUT }}
                className="w-full"
              >
                <DeviceMockup
                  screen={active}
                  alt={t('screenAlt', { feature: active.label })}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <div className="border-t border-brand-line bg-brand-card lg:border-l lg:border-t-0">
            <div
              role="tablist"
              aria-label={t('tabLabel')}
              className="flex gap-2 overflow-x-auto border-b border-brand-line px-5 py-4 scrollbar-hide lg:hidden"
            >
              {screens.map((screen, index) => (
                <button
                  key={screen.id}
                  id={`feature-tab-${screen.id}`}
                  type="button"
                  role="tab"
                  aria-selected={activeIndex === index}
                  aria-controls="feature-panel"
                  tabIndex={activeIndex === index ? 0 : -1}
                  onClick={() => setActiveIndex(index)}
                  onKeyDown={(event) => handleTabKey(event, index)}
                  className={`min-h-11 shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeIndex === index
                      ? 'bg-brand-orange text-white'
                      : 'bg-brand-cream text-brand-muted hover:text-brand-ink'
                  }`}
                >
                  {screen.label}
                </button>
              ))}
            </div>

            <div className="hidden divide-y divide-brand-line lg:block" role="tablist" aria-label={t('tabLabel')}>
              {screens.map((screen, index) => (
                <button
                  key={screen.id}
                  id={`feature-tab-desktop-${screen.id}`}
                  type="button"
                  role="tab"
                  aria-selected={activeIndex === index}
                  aria-controls="feature-panel"
                  tabIndex={activeIndex === index ? 0 : -1}
                  onClick={() => setActiveIndex(index)}
                  onKeyDown={(event) => handleTabKey(event, index)}
                  className={`group flex w-full items-center gap-5 px-7 py-6 text-left transition-colors ${
                    activeIndex === index ? 'bg-brand-orange/10' : 'hover:bg-brand-cream'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                      activeIndex === index
                        ? 'bg-brand-orange text-white'
                        : 'bg-brand-cream text-brand-muted'
                    }`}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-bold text-brand-ink">{screen.label}</span>
                </button>
              ))}
            </div>

            <div
              id="feature-panel"
              role="tabpanel"
              aria-label={t('featureLabel', { feature: active.label })}
              className="p-6 sm:p-8 lg:border-t lg:border-brand-line lg:p-10"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, y: reducedMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reducedMotion ? 0 : -8 }}
                  transition={{ duration: reducedMotion ? 0 : 0.25, ease: EASE_OUT }}
                >
                  <p
                    className="max-w-lg text-2xl font-bold leading-[1.15] text-brand-ink sm:text-3xl"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {active.headline}
                  </p>
                  <p className="mt-4 max-w-lg text-base leading-relaxed text-brand-muted">
                    {active.copy}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
