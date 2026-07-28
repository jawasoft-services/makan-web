'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const signals = [
  {
    title: 'You photograph meals.',
    copy: 'The picture survives in your camera roll. The name of the restaurant usually does not.',
  },
  {
    title: 'You ask friends where to eat.',
    copy: 'Seeing what they actually ordered is more useful than another average from strangers.',
  },
  {
    title: 'You want the memory.',
    copy: 'No calories, macros or reason to perform for people you do not know.',
  },
]

export default function ForYou() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-brand-cream px-5 py-20 sm:px-8 sm:py-28">
      <div ref={ref} className="mx-auto max-w-6xl">
        <motion.div
          className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-16"
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange-ink">
              Who it is for
            </p>
            <h2
              className="mt-4 text-3xl font-bold leading-[1.1] text-brand-ink sm:text-5xl"
              style={{ letterSpacing: '-0.025em' }}
            >
              For people who keep the photo and lose the details.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-brand-muted sm:text-lg">
            Makan is a personal food record that happens to be shared with
            friends. Every meal goes into your diary, and you choose Public or
            Friends Only when you post.
          </p>
        </motion.div>

        <div className="mt-12 divide-y divide-brand-line border-y border-brand-line sm:mt-16 lg:grid lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {signals.map((signal, index) => (
            <motion.article
              key={signal.title}
              className="py-7 lg:px-8 lg:py-9 lg:first:pl-0 lg:last:pr-0"
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.1 + index * 0.08 }}
            >
              <h3 className="text-xl font-bold text-brand-ink">
                {signal.title}
              </h3>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-brand-muted">
                {signal.copy}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
