'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

export default function B2BTeaser() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-[#0a0808] px-5 sm:px-8 py-16 sm:py-24">
      <motion.div
        className="mx-auto max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          Own a restaurant?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-muted">
          We&apos;re building something for you too. Get early access.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-full border border-brand-orange px-6 py-2.5 text-sm font-medium text-brand-orange transition-colors hover:bg-brand-orange hover:text-brand-bg"
        >
          Tell me more →
        </Link>
      </motion.div>
    </section>
  )
}
