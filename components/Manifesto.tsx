'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

export default function Manifesto() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} id="story" className="bg-brand-cream px-5 sm:px-8 pt-24 pb-16 sm:pt-40 sm:pb-24">
      <div className="mx-auto max-w-4xl">
        {/* Audaciously large headline — this is the core value prop */}
        <motion.h2
          className="text-center text-3xl font-bold leading-[1.15] text-brand-ink sm:text-5xl lg:text-7xl"
          style={{ letterSpacing: '-0.025em' }}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          You remember who was there.{' '}
          <em className="not-italic text-brand-orange-ink">Not what you ate.</em>
        </motion.h2>

        <motion.p
          className="mx-auto mt-10 max-w-xl text-center text-base leading-relaxed text-brand-muted sm:mt-12 sm:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
        >
          The food diary that remembers what you&apos;d otherwise forget.
          <br className="hidden sm:inline" />
          {' '}Snap dinner, tag the spot, save it forever.
        </motion.p>

        <motion.div
          className="mt-10 flex justify-center sm:mt-12"
          initial={{ opacity: 0, y: 10 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.45 }}
        >
          <Link
            href="/manifesto"
            className="text-sm font-medium text-brand-orange-ink underline-offset-4 transition-opacity hover:underline hover:opacity-90"
          >
            Read the full manifesto →
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
