'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  /* Card drifts upward and straightens as you scroll */
  const cardY = useTransform(scrollYProgress, [0, 0.5], [40, -60])
  const cardRotate = useTransform(scrollYProgress, [0, 0.4], [-3, 1])

  /* Orange accent line grows on scroll */
  const lineWidth = useTransform(scrollYProgress, [0, 0.3], ['0%', '100%'])

  /* Parallax on the whole content block */
  const contentY = useTransform(scrollYProgress, [0, 1], [0, -80])

  return (
    <section ref={containerRef} className="relative h-[200vh]">
      <div className="sticky top-0 flex h-screen items-end overflow-hidden pb-16 lg:items-center lg:pb-0">
        {/* Soft radial gradient background */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand-bg via-white/60 to-brand-mint/30" />

        <motion.div
          className="relative z-10 mx-auto w-full max-w-7xl px-8"
          style={{ y: contentY }}
        >
          {/* Asymmetric two-column: text-heavy left, card drifts right */}
          <div className="grid items-end gap-8 lg:grid-cols-12 lg:items-center lg:gap-0">

            {/* ── Left: copy — visible on load ── */}
            <div className="lg:col-span-7 lg:pr-16">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1, ease: 'easeOut' }}
              >
                <p className="text-sm font-medium uppercase tracking-widest text-brand-orange">
                  A food journal for real life
                </p>
                <h1 className="mt-4 text-5xl font-bold leading-[1.08] text-brand-text lg:text-7xl">
                  Your meals.
                  <br />
                  <span className="italic">Your moments.</span>
                </h1>
              </motion.div>

              {/* Orange accent line — scroll-driven */}
              <motion.div
                className="mt-6 h-[3px] rounded-full bg-brand-orange"
                style={{ width: lineWidth }}
              />

              <motion.p
                className="mt-6 max-w-lg text-lg leading-relaxed text-brand-cyan"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
              >
                A food journal built around mutual friends. Your feed
                shows meals only from people who are friends with you
                back — no strangers, no algorithms. Just the people you
                actually eat with.
              </motion.p>

              <motion.div
                className="mt-8 flex items-center gap-5"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5, ease: 'easeOut' }}
              >
                <a
                  href="/contact"
                  className="rounded-full bg-brand-orange px-7 py-3 text-base font-semibold text-white shadow-lg shadow-brand-orange/25 transition-transform hover:scale-[1.03]"
                >
                  Request a Seat
                </a>
                <span className="text-sm text-brand-cyan/60">
                  Invite-only beta
                </span>
              </motion.div>
            </div>

            {/* ── Right: real share card ── */}
            <motion.div
              className="lg:col-span-5"
              style={{ y: cardY, rotate: cardRotate }}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 40 }}
              transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            >
              <div className="relative mx-auto w-80 lg:ml-auto lg:mr-0 lg:w-[32rem]">
                {/* Shadow behind for depth */}
                <div className="absolute -bottom-4 -right-4 h-full w-full rounded-2xl bg-brand-orange/10" />

                <div className="relative overflow-hidden rounded-2xl shadow-xl">
                  <Image
                    src="/meals/sharecard-9-hero.jpg"
                    alt="Pizza shared on Makan by @Ridorichard"
                    width={1600}
                    height={1600}
                    sizes="(min-width: 1024px) 32rem, 20rem"
                    quality={90}
                    className="h-auto w-full"
                    priority
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
