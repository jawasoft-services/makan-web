'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const features = [
  {
    icon: '📸',
    title: 'Capture in real time',
    desc: 'Snap your meal as it happens. Makan is built for the moment — not for scrolling back through your camera roll two days later.',
  },
  {
    icon: '🔥',
    title: 'Streaks with your crew',
    desc: 'Log meals daily and build streaks with friends. It turns a solo habit into something shared — a little accountability, a lot of fun.',
  },
  {
    icon: '🗺️',
    title: 'Discover through friends',
    desc: 'No reviews. No ratings. Just real meals from real people you trust. Find your next spot through what your friends are actually eating.',
  },
  {
    icon: '🔒',
    title: 'Private by default',
    desc: 'Every meal starts as yours. Share publicly, with friends, or keep it as a personal food journal. You control who sees what, always.',
  },
]

export default function Features() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-brand-bg py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold text-brand-text lg:text-4xl">
          How it works
        </h2>
        <p className="mx-auto mb-12 max-w-xl text-center text-brand-cyan">
          Makan keeps it simple. Eat something, capture it, decide who sees it.
        </p>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="rounded-2xl border-t-4 border-brand-orange bg-white p-8 shadow-sm"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.12, ease: 'easeOut' }}
            >
              <span className="text-4xl">{f.icon}</span>
              <h3 className="mt-4 text-lg font-semibold text-brand-text">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-brand-cyan">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
