'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  const cardScale = useTransform(scrollYProgress, [0, 0.3], [0.85, 1])
  const cardRotate = useTransform(scrollYProgress, [0, 0.3], [-2, 0])
  const textOpacity = useTransform(scrollYProgress, [0.1, 0.4], [0, 1])
  const textY = useTransform(scrollYProgress, [0.1, 0.4], [20, 0])
  const bgOpacity = useTransform(scrollYProgress, [0.5, 1], [0, 1])
  const ctaScale = useTransform(scrollYProgress, [0.6, 0.8], [0.8, 1])
  const ctaOpacity = useTransform(scrollYProgress, [0.6, 0.8], [0, 1])
  const parallaxY = useTransform(scrollYProgress, [0, 1], [0, -100])

  return (
    <section ref={containerRef} className="relative h-[200vh]">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-white"
          style={{ opacity: bgOpacity }}
        />

        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center gap-12 px-6 lg:flex-row lg:gap-16">
          <motion.div
            className="w-72 lg:w-96"
            style={{
              scale: cardScale,
              rotate: cardRotate,
              y: parallaxY,
            }}
          >
            <div className="overflow-hidden rounded-2xl shadow-2xl">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="bg-brand-orange p-4">
                <p className="text-xs font-semibold text-white/80">@foodie</p>
                <p className="mt-1 text-sm font-bold text-white">Sunday Brunch</p>
                <p className="mt-0.5 text-xs text-white/70">Soho, London</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="text-center lg:text-left"
            style={{ opacity: textOpacity, y: textY }}
          >
            <h1 className="text-4xl font-bold leading-tight text-brand-text lg:text-6xl">
              Your meals.<br />Your moments.
            </h1>
            <p className="mt-4 max-w-md text-lg text-brand-cyan">
              Capture meals as they happen. Share with friends or publicly,
              or keep them just for you. Nothing is shared until you choose.
            </p>
            <motion.div
              className="mt-8"
              style={{ scale: ctaScale, opacity: ctaOpacity }}
            >
              <a
                href="#download"
                className="inline-block rounded-full bg-brand-orange px-8 py-3 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105"
              >
                Get Makan Free
              </a>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="h-8 w-5 rounded-full border-2 border-brand-cyan/40 p-1">
            <div className="mx-auto h-2 w-1.5 rounded-full bg-brand-cyan/40" />
          </div>
        </motion.div>
      </div>
    </section>
  )
}
