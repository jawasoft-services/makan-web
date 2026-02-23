'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const features = [
  {
    number: '01',
    title: 'Camera-first posting',
    desc: 'Open the app, take a photo, done. Makan is built for the moment your food arrives — not for curating old camera roll photos later.',
  },
  {
    number: '02',
    title: 'Built around mutual friends',
    desc: 'Your Friends feed only shows meals from people who are friends with you — mutually. No one-sided follows, no strangers in your feed. If you both said yes, you see each other\u2019s meals. That\u2019s it.',
  },
  {
    number: '03',
    title: 'Streaks with your crew',
    desc: 'Log meals daily and build streaks with friends. A little accountability, a lot of fun. See who broke their streak over the weekend.',
  },
  {
    number: '04',
    title: 'Your friends\' taste, not strangers\' opinions',
    desc: 'Find your next spot through the plates of people you actually know. Mutual friends mean trusted recommendations — not star ratings from someone you\u2019ve never met.',
  },
  {
    number: '05',
    title: 'Three levels of visibility',
    desc: 'Every post has a toggle: Public, Friends, or Just Me. Use it as a social feed, a shared journal with close friends, or a private food diary. All three at once, if you want.',
  },
]

export default function Features() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-brand-bg py-28 px-8 lg:py-36">
      <div className="mx-auto max-w-7xl">
        {/* Section header — centered */}
        <div className="text-center">
          <motion.p
            className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
          >
            How it works
          </motion.p>
          <motion.h2
            className="mx-auto mt-4 max-w-2xl text-3xl font-bold text-brand-text lg:text-4xl"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Eat something. Capture it.{' '}
            <span className="italic">Decide who sees it.</span>
          </motion.h2>
        </div>

        {/* Feature rows — horizontal lines, not cards */}
        <div className="mt-16 divide-y divide-brand-cyan/10">
          {features.map((f, i) => (
            <motion.div
              key={f.number}
              className="grid items-start gap-4 py-10 lg:grid-cols-12 lg:gap-8"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
            >
              {/* Number */}
              <p className="text-sm font-bold text-brand-orange/60 lg:col-span-1">
                {f.number}
              </p>
              {/* Title */}
              <h3 className="text-xl font-semibold text-brand-text lg:col-span-3">
                {f.title}
              </h3>
              {/* Description */}
              <p className="text-[15px] leading-relaxed text-brand-cyan lg:col-span-8">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
