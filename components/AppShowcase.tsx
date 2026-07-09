'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'

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
    src: '/app-screens/map.png',
  },
  {
    id: 'detail',
    label: 'A meal',
    caption: 'What you ate. Who you were with. The day it happened.',
    src: '/app-screens/detail.png',
  },
]

function PhoneFrame({ screen }: { screen: Screen }) {
  return (
    <div className="relative mx-auto w-full max-w-[280px]">
      {/* Ambient glow */}
      <div className="absolute -inset-8 rounded-[3rem] bg-brand-orange/[0.05] blur-3xl" />
      <div className="relative aspect-[1206/2622] overflow-hidden rounded-[2.2rem] border border-brand-line bg-brand-card shadow-2xl shadow-black/20">
        {screen.src ? (
          <Image
            src={screen.src}
            alt={`Makan — ${screen.label}`}
            fill
            className="object-cover"
            sizes="280px"
          />
        ) : (
          // Placeholder until the real screenshot lands at screen.src
          <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-orange">
              {screen.label}
            </span>
            <span className="text-xs leading-relaxed text-brand-muted">
              Screenshot drops in here
            </span>
            <span className="mt-1 font-mono text-[10px] text-brand-muted/70">
              {screen.src?.replace('/app-screens/', '') ?? ''}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AppShowcase() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="features" className="bg-brand-cream px-5 sm:px-8 py-20 sm:py-32">
      <div ref={ref} className="mx-auto max-w-6xl">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, ease: EASE_OUT }}
          className="mb-16 sm:mb-24"
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange">
            Inside the app
          </p>
          <h2
            className="mt-4 max-w-2xl text-3xl font-bold leading-[1.1] text-brand-ink sm:text-5xl"
            style={{ letterSpacing: '-0.025em' }}
          >
            Six years of meals. Built into every screen.
          </h2>
        </motion.div>

        {/* Alternating phone + caption rows */}
        <div className="space-y-24 sm:space-y-40">
          {screens.map((screen, i) => {
            const flip = i % 2 === 1
            return (
              <div
                key={screen.id}
                className={`flex flex-col items-center gap-10 sm:gap-16 lg:flex-row lg:gap-24 ${
                  flip ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Phone */}
                <motion.div
                  className="w-full lg:w-1/2"
                  initial={{ opacity: 0, y: 28 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.7, delay: 0.05, ease: EASE_OUT }}
                >
                  <PhoneFrame screen={screen} />
                </motion.div>

                {/* Caption */}
                <motion.div
                  className="w-full lg:w-1/2"
                  initial={{ opacity: 0, y: 20 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.15, ease: EASE_OUT }}
                >
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange">
                    {screen.label}
                  </p>
                  <p
                    className="mt-5 max-w-md text-2xl font-bold leading-[1.15] text-brand-ink sm:text-4xl"
                    style={{ letterSpacing: '-0.02em' }}
                  >
                    {screen.caption}
                  </p>
                </motion.div>
              </div>
            )
          })}
        </div>

        {/* Screen 6 — the brand statement card. No app UI. The climax. */}
        <motion.div
          className="mt-24 overflow-hidden rounded-3xl border border-brand-line bg-brand-card px-8 py-16 text-center shadow-sm sm:mt-40 sm:px-12 sm:py-24"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE_OUT }}
        >
          <p className="text-sm font-medium uppercase tracking-[0.25em] text-brand-orange">
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
