'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'

// 50 share cards — 10 per column. Strongest photos on outer columns (1 & 5),
// softer ones in the center (hidden behind the blur overlay).
const columns: { src: string; alt: string }[][] = [
  // Column 1 (left edge — fully visible)
  [
    { src: '/meals/IMG_6832.jpg', alt: 'Street tacos on Makan' },
    { src: '/meals/IMG_6836.jpg', alt: 'Stuffed chicken on Makan' },
    { src: '/meals/IMG_6898.jpg', alt: 'Wood-fired pizza on Makan' },
    { src: '/meals/IMG_6902.jpg', alt: 'Pepperoni pizza on Makan' },
    { src: '/meals/IMG_6912.jpg', alt: 'Green curry prawns on Makan' },
    { src: '/meals/IMG_6923.jpg', alt: 'Artisan pizza on Makan' },
    { src: '/meals/IMG_6941.jpg', alt: 'Roast lamb dinner on Makan' },
    { src: '/meals/IMG_6946.jpg', alt: 'Skillet cookie on Makan' },
    { src: '/meals/IMG_6948.jpg', alt: 'Ribs and truffle fries on Makan' },
    { src: '/meals/IMG_6950.jpg', alt: 'Sliced steak on Makan' },
  ],
  // Column 2 (inner left — partially behind blur)
  [
    { src: '/meals/IMG_6833.jpg', alt: 'French toast with bacon on Makan' },
    { src: '/meals/IMG_6835.jpg', alt: 'Lunch spread on Makan' },
    { src: '/meals/IMG_6838.jpg', alt: 'Char siu rice on Makan' },
    { src: '/meals/IMG_6841.jpg', alt: 'Cookie and latte on Makan' },
    { src: '/meals/IMG_6849.jpg', alt: 'Grilled meat platter on Makan' },
    { src: '/meals/IMG_6854.jpg', alt: 'Fried egg sandwich on Makan' },
    { src: '/meals/IMG_6864.jpg', alt: 'Tuna crispy rice on Makan' },
    { src: '/meals/IMG_6866.jpg', alt: 'Beef and green salad on Makan' },
    { src: '/meals/IMG_6870.jpg', alt: 'Creamy pasta on Makan' },
    { src: '/meals/IMG_6873.jpg', alt: 'Snails in garlic butter on Makan' },
  ],
  // Column 3 (center — fully behind blur)
  [
    { src: '/meals/IMG_6839.jpg', alt: 'Easter roast on Makan' },
    { src: '/meals/IMG_6845.jpg', alt: 'Negroni cocktail on Makan' },
    { src: '/meals/IMG_6850.jpg', alt: 'Clams in white wine on Makan' },
    { src: '/meals/IMG_6858.jpg', alt: 'Tomato bruschetta on Makan' },
    { src: '/meals/IMG_6867.jpg', alt: 'Beef carpaccio on Makan' },
    { src: '/meals/IMG_6872.jpg', alt: 'Savoury pastry on Makan' },
    { src: '/meals/IMG_6874.jpg', alt: 'Burger and fries on Makan' },
    { src: '/meals/IMG_6875.jpg', alt: 'Salmon rice bowl on Makan' },
    { src: '/meals/IMG_6897.jpg', alt: 'Easter treats on Makan' },
    { src: '/meals/IMG_6900.jpg', alt: 'Garlic chicken noodles on Makan' },
  ],
  // Column 4 (inner right — partially behind blur)
  [
    { src: '/meals/IMG_6834.jpg', alt: 'Yorkshire pudding and steak on Makan' },
    { src: '/meals/IMG_6837.jpg', alt: 'Chicken Caesar salad on Makan' },
    { src: '/meals/IMG_6840.jpg', alt: 'Korean BBQ on Makan' },
    { src: '/meals/IMG_6847.jpg', alt: 'Pork belly with gravy on Makan' },
    { src: '/meals/IMG_6851.jpg', alt: 'Full English breakfast on Makan' },
    { src: '/meals/IMG_6862.jpg', alt: 'Mango sticky rice on Makan' },
    { src: '/meals/IMG_6865.jpg', alt: 'Avocado toast on Makan' },
    { src: '/meals/IMG_6868.jpg', alt: 'Sushi nigiri on Makan' },
    { src: '/meals/IMG_6871.jpg', alt: 'Dim sum spread on Makan' },
    { src: '/meals/IMG_6896.jpg', alt: 'Chinese feast on Makan' },
  ],
  // Column 5 (right edge — fully visible)
  [
    { src: '/meals/IMG_6842.jpg', alt: 'Teriyaki salmon rice bowl on Makan' },
    { src: '/meals/IMG_6859.jpg', alt: 'Salmon with carrots on Makan' },
    { src: '/meals/IMG_6863.jpg', alt: 'Mango sticky rice on Makan' },
    { src: '/meals/IMG_6869.jpg', alt: 'Sushi platter on Makan' },
    { src: '/meals/IMG_6876.jpg', alt: 'Noodles in chilli broth on Makan' },
    { src: '/meals/IMG_6901.jpg', alt: 'Shawarma rice on Makan' },
    { src: '/meals/IMG_6920.jpg', alt: 'Banh mi sandwich on Makan' },
    { src: '/meals/IMG_6925.jpg', alt: 'Pizza slice on Makan' },
    { src: '/meals/IMG_6958.jpg', alt: 'Oxtail ragu pasta on Makan' },
    { src: '/meals/IMG_6846.jpg', alt: 'Chilli with salad on Makan' },
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
                Share what you eat. A food diary, with friends.
              </p>

              <p className="mt-1 text-[10px] italic text-white/60 sm:text-sm">
                /mah·kahn/ — Indonesian for &ldquo;to eat&rdquo;
              </p>

              <div className="mt-3 sm:mt-5">
                <Link
                  href="/contact"
                  className="relative inline-block rounded-full bg-brand-orange px-5 py-2.5 text-xs font-semibold text-brand-bg transition-all sm:px-7 sm:py-3 sm:text-sm hover:shadow-lg hover:shadow-brand-orange/25"
                >
                  <span className="pointer-events-none absolute -inset-3 rounded-full bg-brand-orange/10 blur-xl" aria-hidden />
                  <span className="relative">Save My Seat</span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
