'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const beliefs = [
  {
    number: '01',
    title: 'Not a performance',
    copy: "Your meal isn't content. Friends will see it. Strangers won't, unless you say otherwise.",
  },
  {
    number: '02',
    title: 'The meal that mattered',
    copy: "Maybe a dinner you made at 11pm last Tuesday. Maybe a small restaurant nobody else seems to know about. The meal that mattered always beats the meal that trended.",
  },
  {
    number: '03',
    title: 'Friends, not strangers',
    copy: "Find places through what your friends actually ate. No 4.6 averages from people you've never met.",
  },
]

export default function BrandPillars() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-brand-bg px-5 sm:px-8 py-20 sm:py-32">
      <div className="mx-auto max-w-4xl">
        {/* Section heading */}
        <motion.p
          className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange-ink"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          What we believe
        </motion.p>

        {/* Beliefs as bold statements */}
        <div className="mt-14 sm:mt-20 space-y-16 sm:space-y-20">
          {beliefs.map((belief, i) => (
            <motion.div
              key={belief.number}
              className="flex items-start gap-5 sm:gap-8"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.12 }}
            >
              <span className="shrink-0 pt-1 text-sm font-medium text-brand-orange-ink sm:text-base">
                {belief.number}
              </span>
              <div>
                <h3 className="text-2xl font-bold text-white sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
                  {belief.title}
                </h3>
                <p className="mt-3 text-base leading-relaxed text-brand-muted sm:text-lg">
                  {belief.copy}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
