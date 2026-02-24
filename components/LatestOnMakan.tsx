'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'

const meals = [
  { src: '/meals/sharecard-1.jpg', alt: 'Chicken noodles shared on Makan by @Will' },
  { src: '/meals/sharecard-2.jpg', alt: 'Sausages and couscous shared on Makan by @Mia' },
  { src: '/meals/sharecard-3.jpg', alt: 'Burger and fries shared on Makan by @Lizzie' },
  { src: '/meals/sharecard-4.jpg', alt: 'Schnitzel and fries shared on Makan by @Valesca' },
  { src: '/meals/sharecard-5.jpg', alt: 'Chicken and veg shared on Makan by @Laura' },
  { src: '/meals/sharecard-6.jpg', alt: 'Carbonara shared on Makan by @Valesca' },
  { src: '/meals/sharecard-7.jpg', alt: 'Taco shared on Makan by @Christopher Halkas' },
  { src: '/meals/sharecard-8.jpg', alt: 'Korean BBQ cheesesteak shared on Makan by @Christopher Halkas' },
]

export default function LatestOnMakan() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-brand-bg py-28 px-8 lg:py-36">
      <div className="mx-auto max-w-7xl">
        {/* Header — centered */}
        <div className="text-center">
          <motion.h2
            className="text-4xl font-bold text-brand-text lg:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            Latest{' '}
            <span className="italic text-brand-orange">on makan</span>
          </motion.h2>

          <motion.p
            className="mx-auto mt-4 max-w-sm text-[15px] leading-relaxed text-brand-cyan"
            initial={{ opacity: 0, y: 16 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            Real meals from real friends — ordinary by design.
          </motion.p>
        </div>

        {/* Share card grid */}
        <div className="mt-14 grid gap-5 grid-cols-2 lg:grid-cols-3">
          {meals.map((meal, i) => (
            <motion.div
              key={meal.src}
              className="overflow-hidden rounded-xl shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
            >
              <Image
                src={meal.src}
                alt={meal.alt}
                width={800}
                height={800}
                className="h-auto w-full"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
