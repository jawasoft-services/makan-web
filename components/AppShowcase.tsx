'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useMotionValueEvent,
} from 'framer-motion'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

// Each screen pairs a real app screenshot with the manifesto line it delivers.
// `src: null` renders an intentional placeholder frame — drop a PNG at the
// path in /public/app-screens/ to replace it (e.g. /app-screens/diary.png).
type Screen = {
  id: string
  label: string // orienting eyebrow — what screen is this (cold-context test)
  caption: string // the manifesto line this screen delivers
  src: string | null
}

const screens: Screen[] = [
  {
    id: 'diary',
    label: 'The diary',
    caption: "You'll forget today's best meal by Friday. Makan won't.",
    src: '/app-screens/diary.png',
  },
  {
    id: 'feed',
    label: 'Friends',
    caption: "Your friends' meals. Not strangers' reviews.",
    src: '/app-screens/feed.png',
  },
  {
    id: 'rank',
    label: 'Your ranking',
    caption: "A meal isn't 4.2 out of 5. It's your #3 of all time.",
    src: '/app-screens/rank.png',
  },
  {
    id: 'map',
    label: 'The map',
    caption: 'See what your friends actually ordered.',
    src: '/app-screens/map-lolas.png',
  },
  {
    id: 'detail',
    label: 'A meal',
    caption: 'What you ate. Who you were with. The day it happened.',
    src: '/app-screens/detail.png',
  },
]

// The frame is capped at 280px. A fixed `sizes` hint lets the browser choose
// the closest density candidate (including the 320/512 widths in next.config)
// instead of jumping from 384 straight to 640.
function ScreenImage({ screen }: { screen: Screen }) {
  if (screen.src) {
    return (
      <Image
        src={screen.src}
        alt={`Makan — ${screen.label}`}
        width={280}
        height={609}
        sizes="280px"
        className="absolute inset-0 h-full w-full object-cover"
      />
    )
  }
  // Placeholder until the real screenshot lands at screen.src
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-orange-ink">
        {screen.label}
      </span>
      <span className="text-xs leading-relaxed text-brand-muted">
        Screenshot drops in here
      </span>
    </div>
  )
}

function PhoneShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      {/* Ambient glow */}
      <div className="absolute -inset-8 rounded-[3rem] bg-brand-orange/[0.05] blur-3xl" />
      <div className="relative aspect-[1206/2622] overflow-hidden rounded-[2.2rem] border border-brand-line bg-brand-card shadow-2xl shadow-black/20">
        {children}
      </div>
    </div>
  )
}

export default function AppShowcase() {
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '-80px' })
  const mobileRef = useRef<HTMLDivElement>(null)
  const mobileInView = useInView(mobileRef, { once: true, margin: '-80px' })
  const prefersReducedMotion = useReducedMotion()

  // Desktop scroll-story: the track is N viewport-heights tall; the phone is
  // sticky inside it and the visible screen follows scroll progress.
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  })
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const idx = Math.min(screens.length - 1, Math.max(0, Math.floor(v * screens.length)))
    setActive(idx)
  })

  const swap = { duration: prefersReducedMotion ? 0 : 0.35, ease: EASE_OUT }

  return (
    <section id="features" className="bg-brand-cream py-20 sm:py-32">
      {/* Section header */}
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 20 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="mb-16 sm:mb-24"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange-ink">
            Inside the app
          </p>
          <h2
            className="mt-4 max-w-2xl text-3xl font-bold leading-[1.1] text-brand-ink sm:text-5xl"
            style={{ letterSpacing: '-0.025em' }}
          >
            Six years of meals. Built into every screen.
          </h2>
        </motion.div>
      </div>

      {/* Desktop: pinned phone, scroll-driven screens */}
      <div
        ref={trackRef}
        className="relative hidden lg:block"
        style={{ height: `${screens.length * 100}vh` }}
      >
        <div className="sticky top-0 flex h-screen items-center">
          <div className="mx-auto grid w-full max-w-6xl grid-cols-2 items-center gap-24 px-8">
            <PhoneShell>
              {screens.map((screen, i) => (
                <motion.div
                  key={screen.id}
                  className="absolute inset-0"
                  initial={false}
                  animate={{ opacity: active === i ? 1 : 0 }}
                  transition={swap}
                >
                  <ScreenImage screen={screen} />
                </motion.div>
              ))}
            </PhoneShell>

            {/* Captions — stacked in one grid cell, active one visible */}
            <div>
              <div className="grid">
                {screens.map((screen, i) => (
                  <motion.div
                    key={screen.id}
                    className={active === i ? '' : 'pointer-events-none'}
                    style={{ gridArea: '1 / 1' }}
                    initial={false}
                    animate={{
                      opacity: active === i ? 1 : 0,
                      y: prefersReducedMotion ? 0 : active === i ? 0 : 12,
                    }}
                    transition={swap}
                  >
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange-ink">
                      {screen.label}
                    </p>
                    <p
                      className="mt-5 max-w-md text-2xl font-bold leading-[1.15] text-brand-ink sm:text-4xl"
                      style={{ letterSpacing: '-0.02em' }}
                    >
                      {screen.caption}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Progress dots */}
              <div className="mt-10 flex gap-2" aria-hidden>
                {screens.map((screen, i) => (
                  <span
                    key={screen.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === active ? 'w-8 bg-brand-orange' : 'w-1.5 bg-brand-line'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile / tablet: stacked phone + caption rows */}
      <div ref={mobileRef} className="mx-auto max-w-6xl space-y-24 px-5 sm:px-8 lg:hidden">
        {screens.map((screen) => (
          <div key={screen.id} className="flex flex-col items-center gap-10">
            <motion.div
              className="w-full"
              initial={{ opacity: 0, y: 28 }}
              animate={mobileInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.05, ease: EASE_OUT }}
            >
              <PhoneShell>
                <ScreenImage screen={screen} />
              </PhoneShell>
            </motion.div>
            <div className="w-full text-center">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange-ink">
                {screen.label}
              </p>
              <p
                className="mx-auto mt-4 max-w-md text-2xl font-bold leading-[1.15] text-brand-ink"
                style={{ letterSpacing: '-0.02em' }}
              >
                {screen.caption}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Screen 6 — the brand statement card. No app UI. The climax. */}
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          className="mt-24 overflow-hidden rounded-3xl border border-brand-line bg-brand-card px-8 py-16 text-center shadow-sm sm:mt-40 sm:px-12 sm:py-24"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: EASE_OUT }}
        >
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-brand-orange-ink">
            No ads · No algorithm · No AI
          </p>
          <h3
            className="mx-auto mt-8 max-w-3xl text-4xl font-bold leading-[1.02] text-brand-ink sm:text-6xl lg:text-7xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            AI has never
            <br />
            tasted food.
          </h3>
          <p className="mx-auto mt-8 max-w-md text-base leading-relaxed text-brand-muted sm:text-lg">
            It can&apos;t smell, can&apos;t chew, can&apos;t remember being
            hungry as a kid. The point of remembering what you ate is that you
            tasted it.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
