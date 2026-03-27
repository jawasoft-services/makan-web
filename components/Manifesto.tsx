'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

export default function Manifesto() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} id="story" className="bg-brand-bg px-5 sm:px-8 py-20 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <motion.h2
          className="text-2xl font-semibold leading-snug text-white sm:text-3xl lg:text-4xl"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          A food journal where your friends&apos;{' '}
          <em className="text-brand-orange">real meals</em> replace algorithms
          and influencers.
        </motion.h2>

        <motion.p
          className="mt-5 text-sm text-brand-muted sm:text-base"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          No filters. No star ratings. No calorie counts.
        </motion.p>

        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/contact"
            className="inline-block rounded-full bg-brand-orange px-7 py-3 text-sm font-semibold text-brand-bg transition-shadow hover:shadow-lg hover:shadow-brand-orange/25"
          >
            Request a Seat
          </Link>
        </motion.div>

        <motion.p
          className="mt-4 text-xs text-brand-dim"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          38 languages. Yes, already.
        </motion.p>
      </div>
    </section>
  )
}
