'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function Manifesto() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} id="story" className="bg-brand-bg px-5 sm:px-8 pt-24 pb-16 sm:pt-40 sm:pb-24">
      <div className="mx-auto max-w-4xl">
        {/* Audaciously large headline — this is the core value prop */}
        <motion.h2
          className="text-center text-3xl font-bold leading-[1.15] text-white sm:text-5xl lg:text-7xl"
          style={{ letterSpacing: '-0.025em' }}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          Your friends&apos;{' '}
          <em className="not-italic text-brand-orange">real meals</em>
          {' '}replace algorithms and influencers.
        </motion.h2>

        <motion.p
          className="mx-auto mt-10 max-w-xl text-center text-base leading-relaxed text-brand-muted sm:mt-12 sm:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          No filters. No star ratings. No calorie counts.
          <br className="hidden sm:inline" />
          {' '}Just what you actually ate today.
        </motion.p>
      </div>
    </section>
  )
}
