'use client'

import { useRef } from 'react'
import { Link } from 'next-view-transitions'
import { motion, useInView } from 'framer-motion'
import { track } from '@vercel/analytics'
import { APP_STORE_URL } from '@/lib/links'
import StatTicker from './StatTicker'
import AndroidWaitlist from './AndroidWaitlist'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

interface FinalCTAProps {
  /** Live total meal count — the launch proof in the "Live now" badge. */
  mealCount: number
}

export default function FinalCTA({ mealCount }: FinalCTAProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-brand-orange px-5 sm:px-8 py-24 sm:py-36 text-white">
      <div className="mx-auto max-w-2xl text-center">
        {/* Live signal — the launch fact is the hook. Pulsing dot = live on the
            App Store; the count is the real cumulative total, not real-time. */}
        <motion.p
          className="mb-6 inline-flex items-center gap-2.5 rounded-full bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-brand-orange"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <span className="cta-ping h-2 w-2 rounded-full bg-brand-orange" aria-hidden />
          Live now
          <span className="font-semibold text-brand-orange/80 normal-case tracking-normal">
            · <StatTicker value={mealCount} inView={inView} /> meals logged
          </span>
        </motion.p>

        <motion.h2
          className="text-4xl font-bold leading-[1.05] text-white sm:text-6xl"
          style={{ letterSpacing: '-0.03em' }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          Makan is <span className="cta-live-word">live.</span>
        </motion.h2>

        <motion.p
          className="mx-auto mt-5 max-w-xl text-xl font-semibold leading-snug text-white"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
        >
          Start with the next meal you do not want to lose. Free on iPhone;
          choose Public or Friends Only.
        </motion.p>

        <motion.div
          className="mt-9"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT }}
        >
          <Link
            href={APP_STORE_URL}
            onClick={() => track('App Store CTA Clicked', { location: 'final' })}
            className="relative inline-block overflow-hidden rounded-full bg-white px-9 py-4 text-base font-semibold text-brand-orange shadow-lg shadow-black/15 transition-all hover:shadow-xl hover:shadow-black/20 active:scale-[0.98]"
          >
            <span className="pointer-events-none absolute -inset-4 rounded-full bg-white/20 blur-xl" aria-hidden />
            <span className="cta-btn-glint" aria-hidden />
            <span className="relative">Start your food diary — free</span>
          </Link>
        </motion.div>

        <motion.div
          id="android-waitlist"
          className="mt-9 rounded-3xl bg-white p-6 sm:p-8"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3, ease: EASE_OUT }}
        >
          <p className="text-base font-semibold text-brand-ink">On Android?</p>
          <p className="mt-1 text-sm text-brand-muted">
            It&apos;s in the works. Get one email when it launches.
          </p>
          <AndroidWaitlist />
        </motion.div>
      </div>
    </section>
  )
}
