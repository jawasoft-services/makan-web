'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const pillars = [
  {
    number: '01',
    title: 'No audience required',
    copy: "Your meal doesn't need likes to be worth sharing.",
  },
  {
    number: '02',
    title: 'Ordinary is the point',
    copy: "The best food stories aren't from restaurants. They're from your kitchen at 11pm.",
  },
  {
    number: '03',
    title: 'No algorithm required',
    copy: "Find places through what your friends actually ate. Not what an algorithm thinks you'll click.",
  },
]

export default function BrandPillars() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-brand-bg px-5 sm:px-8 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          className="text-center text-xl font-semibold text-white sm:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          What we believe
        </motion.h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.number}
              className="rounded-xl border border-brand-border bg-brand-surface p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
            >
              <p className="text-3xl font-bold text-brand-orange">{pillar.number}</p>
              <h3 className="mt-4 text-sm font-semibold text-white">{pillar.title}</h3>
              <p className="mt-3 text-xs leading-relaxed text-brand-muted">
                {pillar.copy}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
