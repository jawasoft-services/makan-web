'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

export default function DownloadCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section
      ref={ref}
      id="download"
      className="relative overflow-hidden bg-brand-text py-28 px-8 lg:py-36"
    >
      {/* Subtle warm glow in corner */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[500px] w-[500px] rounded-full bg-brand-orange/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Centered CTA block */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.p
            className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange"
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
          >
            Early access
          </motion.p>

          <motion.h2
            className="mt-5 text-4xl font-bold leading-snug text-white lg:text-6xl"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            Join the{' '}
            <span className="italic text-brand-orange">table.</span>
          </motion.h2>

          <motion.p
            className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-white/60"
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Makan is in invite-only beta. We open access slowly and
            intentionally. Posting is optional. Private use is welcome.
          </motion.p>

          <motion.div
            className="mt-10 flex justify-center"
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <a
              href="/contact"
              className="rounded-full bg-brand-orange px-7 py-3 text-base font-semibold text-white transition-transform hover:scale-[1.03]"
            >
              Request a Seat
            </a>
          </motion.div>
        </div>

        {/* Quote — centered below */}
        <motion.div
          className="mx-auto mt-16 max-w-xl border-t border-white/10 pt-10 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <p className="text-lg leading-relaxed text-white/70">
            &ldquo;Makan started as a Snapchat story shared between our
            closest friends. Over six years and thousands of meals later,
            we realised we&apos;d built a habit worth keeping — so we
            built an app around it.&rdquo;
          </p>
          <p className="mt-4 text-sm text-white/40">
            &mdash; The Makan team, London
          </p>
        </motion.div>
      </div>
    </section>
  )
}
