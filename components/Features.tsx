'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const features = [
  { icon: '📸', title: 'Share Meals', desc: 'Snap, share, and show off your plate.' },
  { icon: '🔥', title: 'Keep Streaks', desc: 'Build daily habits with your crew.' },
  { icon: '👀', title: 'Discover', desc: 'See what your friends are eating.' },
]

export default function Features() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-brand-bg py-24 px-6">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-brand-text lg:text-4xl">
          Why Makan?
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              className="rounded-2xl border-t-4 border-brand-orange bg-white p-8 shadow-sm"
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.15, ease: 'easeOut' }}
            >
              <span className="text-4xl">{f.icon}</span>
              <h3 className="mt-4 text-xl font-semibold text-brand-text">{f.title}</h3>
              <p className="mt-2 text-brand-cyan">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
