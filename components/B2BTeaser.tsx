'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

export default function B2BTeaser() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="for-restaurants" ref={ref} className="bg-brand-surface px-5 sm:px-8 py-16 sm:py-24">
      <motion.div
        className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left"
        initial={{ opacity: 0, y: 16 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-brand-orange mb-3">
            For restaurants
          </p>
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Memory is the moat.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-brand-muted sm:text-base">
            Yelp tells you what customers said once. Makan tells you what they remember.
          </p>
        </div>
        <Link
          href="/partner"
          className="shrink-0 rounded-xl bg-brand-orange px-6 py-3 text-sm font-semibold text-brand-bg transition-all hover:brightness-110 active:scale-[0.98]"
        >
          Claim your restaurant
        </Link>
      </motion.div>
    </section>
  )
}
