'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'

// 25 sharecards — best photos on outer columns (1 & 5), less visual in center (behind blur)
const columns: { src: string; alt: string }[][] = [
  // Column 1 (left edge — fully visible)
  [
    { src: '/meals/sharecard-12.PNG', alt: 'Smash burger on Makan' },
    { src: '/meals/sharecard-6.jpg', alt: 'Carbonara on Makan' },
    { src: '/meals/sharecard-10.PNG', alt: 'Thai green curry on Makan' },
    { src: '/meals/sharecard-28.PNG', alt: 'Pizza on Makan' },
    { src: '/meals/sharecard-8.jpg', alt: 'Korean BBQ on Makan' },
  ],
  // Column 2 (inner left — partially behind blur)
  [
    { src: '/meals/sharecard-11.PNG', alt: 'Deli sandwiches on Makan' },
    { src: '/meals/sharecard-25.PNG', alt: 'Rice bowl on Makan' },
    { src: '/meals/sharecard-23.PNG', alt: 'Kimchi egg rice on Makan' },
    { src: '/meals/sharecard-34.PNG', alt: 'Noodle soup on Makan' },
    { src: '/meals/sharecard-1.jpg', alt: 'Chicken noodles on Makan' },
  ],
  // Column 3 (center — fully behind blur)
  [
    { src: '/meals/sharecard-32.PNG', alt: 'Egg sandwich on Makan' },
    { src: '/meals/sharecard-9.jpg', alt: 'Meal on Makan' },
    { src: '/meals/sharecard-37.PNG', alt: 'Morning snack on Makan' },
    { src: '/meals/sharecard-22.PNG', alt: 'Pasta dish on Makan' },
    { src: '/meals/sharecard-18.PNG', alt: 'Fresh salad on Makan' },
  ],
  // Column 4 (inner right — partially behind blur)
  [
    { src: '/meals/sharecard-14.PNG', alt: 'Home cooked dinner on Makan' },
    { src: '/meals/sharecard-2.jpg', alt: 'Sausages and couscous on Makan' },
    { src: '/meals/sharecard-30.PNG', alt: 'Grilled chicken on Makan' },
    { src: '/meals/sharecard-36.PNG', alt: 'Lunch spread on Makan' },
    { src: '/meals/sharecard-5.jpg', alt: 'Chicken and veg on Makan' },
  ],
  // Column 5 (right edge — fully visible)
  [
    { src: '/meals/sharecard-16.PNG', alt: 'Sliced steak on Makan' },
    { src: '/meals/sharecard-3.jpg', alt: 'Burger and fries on Makan' },
    { src: '/meals/sharecard-20.PNG', alt: 'Brunch plate on Makan' },
    { src: '/meals/sharecard-7.jpg', alt: 'Taco on Makan' },
    { src: '/meals/sharecard-4.jpg', alt: 'Schnitzel on Makan' },
  ],
]

// Varied speeds and delays so columns feel organic
const columnSpeeds = [28, 22, 32, 24, 30]
const columnDelays = [0, -8, -4, -14, -2] // negative = start mid-way through

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0, 0.7])
  const contentY = useTransform(scrollYProgress, [0, 0.5], [0, -60])
  const contentScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.92])

  // Scroll-driven coin rotation — full 360° over the hero scroll range
  const coinRotation = useTransform(scrollYProgress, [0, 1], [0, 720])
  const coinRotationBack = useTransform(scrollYProgress, [0, 1], [180, 900])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mq.matches)
  }, [])

  return (
    <section ref={containerRef} className="relative h-[140vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Waterfall grid — 5 columns of scrolling meal cards */}
        <div className="waterfall-container absolute inset-0 grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 px-2 sm:px-3">
          {columns.map((col, i) => {
            const doubled = [...col, ...col]
            return (
              <div
                key={i}
                className={`relative h-screen overflow-hidden ${
                  i >= 3 ? 'hidden sm:block' : ''
                }`}
              >
                <div
                  className="flex flex-col gap-2 sm:gap-3"
                  style={
                    prefersReducedMotion
                      ? {}
                      : {
                          animation: `waterfall-scroll ${columnSpeeds[i]}s linear infinite`,
                          animationDelay: `${columnDelays[i]}s`,
                        }
                  }
                >
                  {doubled.map((card, j) => (
                    <div key={`${card.src}-${j}`} className="shrink-0">
                      <Image
                        src={card.src}
                        alt={card.alt}
                        width={300}
                        height={300}
                        className="w-full aspect-square rounded-lg sm:rounded-xl object-cover"
                        loading={j < 1 ? 'eager' : 'lazy'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Top/bottom fades — blend waterfall edges into the dark bg */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-brand-bg to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-brand-bg to-transparent" />

        {/* Scroll-driven darkening */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 bg-brand-bg"
          style={{ opacity: overlayOpacity }}
        />

        {/* Center content — 3D slab floats above, text in glass panel below */}
        <motion.div
          className="relative z-20 flex h-full items-center justify-center px-5 pb-8 sm:pb-0"
          style={{
            y: prefersReducedMotion ? 0 : contentY,
            scale: prefersReducedMotion ? 1 : contentScale,
          }}
        >
          <div className="flex flex-col items-center">
            {/* Spinning coin — two flat faces back-to-back, no 3D edge needed */}
            <div className="relative hidden sm:block h-[120px] w-[120px]" style={{ perspective: 600 }}>
              {/* Front face */}
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-[22%]"
                style={{
                  rotateY: prefersReducedMotion ? 0 : coinRotation,
                  backfaceVisibility: 'hidden',
                }}
              >
                <Image src="/makan-icon.svg" alt="Makan" fill className="object-cover" priority />
              </motion.div>
              {/* Back face — pre-flipped 180° so it shows when front is hidden */}
              <motion.div
                className="absolute inset-0 overflow-hidden rounded-[22%]"
                style={{
                  rotateY: prefersReducedMotion ? 180 : coinRotationBack,
                  backfaceVisibility: 'hidden',
                }}
              >
                <Image src="/makan-icon.svg" alt="" fill className="object-cover" />
              </motion.div>
            </div>

            {/* Glass panel with wordmark + text + CTA */}
            <div className="mt-4 sm:mt-6 text-center rounded-3xl bg-brand-bg/65 px-4 py-4 backdrop-blur-lg max-w-[300px] sm:max-w-md sm:px-6 sm:py-6">
              <Image
                src="/makan-logo.png"
                alt="makan"
                width={600}
                height={120}
                className="mx-auto h-auto w-full max-w-[240px] sm:max-w-[380px] lg:max-w-[420px]"
              />

              <p className="mt-2 sm:mt-3 text-xs text-white font-medium sm:text-base">
                A food journal shared with friends.
              </p>

              <p className="mt-1 text-[10px] italic text-white/60 sm:text-sm">
                /mah·kahn/ — to eat
              </p>

              <div className="mt-3 sm:mt-5">
                <Link
                  href="/contact"
                  className="relative inline-block rounded-full bg-brand-orange px-5 py-2.5 text-xs font-semibold text-brand-bg transition-all sm:px-7 sm:py-3 sm:text-sm hover:shadow-lg hover:shadow-brand-orange/25"
                >
                  <span className="pointer-events-none absolute -inset-3 rounded-full bg-brand-orange/10 blur-xl" aria-hidden />
                  <span className="relative">Request a Seat</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
