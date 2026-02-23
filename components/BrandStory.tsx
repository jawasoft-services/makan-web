'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function BrandStory() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="bg-white py-24 px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-12 lg:flex-row lg:gap-16">
        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: -40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <h2 className="text-3xl font-bold text-brand-text lg:text-5xl">
            Food is better shared.
          </h2>
          <p className="mt-6 text-lg leading-relaxed text-brand-cyan">
            Makan is for people who love what they eat — and want their
            friends to see it too. Track your meals, keep streaks alive,
            and discover what your people are eating.
          </p>
        </motion.div>

        <motion.div
          className="flex-1"
          initial={{ opacity: 0, x: 40 }}
          animate={inView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
        >
          <div className="aspect-[4/3] rounded-2xl bg-brand-mint" />
        </motion.div>
      </div>
    </section>
  )
}
