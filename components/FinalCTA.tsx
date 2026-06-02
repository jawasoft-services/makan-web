'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

export default function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-brand-bg px-5 sm:px-8 py-24 sm:py-36">
      <div className="mx-auto max-w-2xl text-center">
        <motion.h2
          className="text-4xl font-bold leading-[1.05] text-white sm:text-6xl"
          style={{ letterSpacing: '-0.03em' }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: EASE_OUT }}
        >
          The beta&apos;s open.
        </motion.h2>

        <motion.p
          className="mx-auto mt-5 max-w-md text-base text-brand-muted sm:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
        >
          Drop your email. The link lands in your inbox in seconds, and
          you&apos;re in the app a minute later.
        </motion.p>

        <motion.div
          className="mt-9"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE_OUT }}
        >
          <Link
            href="/contact"
            className="relative inline-block rounded-full bg-brand-orange px-9 py-4 text-base font-semibold text-brand-bg transition-all hover:shadow-lg hover:shadow-brand-orange/25 active:scale-[0.98]"
          >
            <span className="pointer-events-none absolute -inset-4 rounded-full bg-brand-orange/10 blur-xl" aria-hidden />
            <span className="relative">Get early access</span>
          </Link>
        </motion.div>

        <motion.p
          className="mt-5 text-xs text-brand-dim"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.35, ease: EASE_OUT }}
        >
          iPhone, via TestFlight. Android, you&apos;re next — leave your email
          and we&apos;ll tell you the day it&apos;s ready.
        </motion.p>
      </div>
    </section>
  )
}
