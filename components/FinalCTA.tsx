'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

export default function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-brand-bg px-5 sm:px-8 py-20 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <motion.h2
          className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          Join the table.
        </motion.h2>

        <motion.p
          className="mt-4 text-sm text-brand-muted sm:text-base"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          We&apos;re letting people in slowly. Request your seat.
        </motion.p>

        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href="/contact"
            className="inline-block rounded-full bg-brand-orange px-7 py-3 text-sm font-semibold text-brand-bg transition-shadow hover:shadow-lg hover:shadow-brand-orange/25"
          >
            Request a Seat
          </Link>
        </motion.div>

        <motion.div
          className="mx-auto mt-12 max-w-xl border-t border-brand-border pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-sm italic leading-relaxed text-brand-dim sm:text-base">
            &ldquo;Makan started as a Snapchat story shared between our closest
            friends. Over six years and thousands of meals later, we realised
            we&apos;d built a habit worth keeping — so we built an app around
            it.&rdquo;
          </p>
          <p className="mt-4 text-xs text-brand-muted">
            — Devon Makepeace, Founder of Makan, London
          </p>
        </motion.div>
      </div>
    </section>
  )
}
