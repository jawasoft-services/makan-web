'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function BrandStory() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="bg-white py-24 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Main headline */}
        <motion.div
          className="mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <h2 className="text-3xl font-bold text-brand-text lg:text-5xl">
            Food is better shared.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-brand-cyan">
            Every meal tells a story — where you were, who you were with, what
            made it special. Makan is a place to capture those moments in
            real time and share them with the people who matter most.
          </p>
        </motion.div>

        {/* Three pillars of the ethos */}
        <div className="mt-20 grid gap-16 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
          >
            <div className="mb-4 h-1 w-12 rounded-full bg-brand-orange" />
            <h3 className="text-xl font-semibold text-brand-text">Real, not curated</h3>
            <p className="mt-3 leading-relaxed text-brand-cyan">
              Makan is about what you actually eat, not what looks best on a
              grid. Monday morning porridge counts just as much as Friday
              night out. We celebrate the everyday.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.35, ease: 'easeOut' }}
          >
            <div className="mb-4 h-1 w-12 rounded-full bg-brand-orange" />
            <h3 className="text-xl font-semibold text-brand-text">You decide what gets shared</h3>
            <p className="mt-3 leading-relaxed text-brand-cyan">
              Post publicly, share with friends, or keep it private — every
              meal is yours first. Nothing leaves your phone until you say so.
              No pressure, no algorithms pushing you to perform.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
          >
            <div className="mb-4 h-1 w-12 rounded-full bg-brand-orange" />
            <h3 className="text-xl font-semibold text-brand-text">Food connects people</h3>
            <p className="mt-3 leading-relaxed text-brand-cyan">
              See what your friends had for lunch. Discover the spot they
              can&apos;t stop going back to. Build streaks together and turn
              eating into something you do as a crew — not just alone at
              your desk.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
