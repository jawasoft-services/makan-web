'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'

const meals = [
  { src: '/meals/IMG_6831.jpg', alt: 'Octopus with orange sauce' },
  { src: '/meals/IMG_6952.jpg', alt: 'Eggs Benedict' },
  { src: '/meals/IMG_6944.jpg', alt: 'Beijing style Peking duck' },
  { src: '/meals/IMG_6959.jpg', alt: 'Hangover Tom Yum' },
  { src: '/meals/IMG_6942.jpg', alt: 'Tuna tartare' },
  { src: '/meals/IMG_6945.jpg', alt: 'Valentines brunch platter' },
]

export default function LatestOnMakan() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-brand-bg py-20 sm:py-32">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange">
            From the beta
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl lg:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            From 160 people in our beta. 581 meals this month.
          </h2>
        </motion.div>
      </div>

      {/* Mobile: horizontal scroll strip — full sharecards */}
      <div className="mt-10 lg:hidden">
        <div className="flex gap-3 overflow-x-auto px-5 sm:px-8 scrollbar-hide">
          {meals.map((meal, i) => (
            <motion.div
              key={meal.src}
              className="flex-none overflow-hidden rounded-xl"
              style={{ width: 200 }}
              initial={{ opacity: 0, x: 24 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.1 + i * 0.06 }}
            >
              <Image
                src={meal.src}
                alt={meal.alt}
                width={1200}
                height={1200}
                className="w-full h-auto"
                sizes="200px"
              />
            </motion.div>
          ))}
          {/* Breathing room at scroll end */}
          <div className="flex-none w-5 sm:w-8" />
        </div>
      </div>

      {/* Desktop: 3-column grid — full sharecards, natural aspect ratio */}
      <div className="mx-auto mt-12 hidden max-w-7xl px-5 sm:px-8 lg:block">
        <div className="columns-3 gap-4">
          {meals.map((meal, i) => (
            <motion.div
              key={meal.src}
              className="group mb-4 overflow-hidden rounded-xl break-inside-avoid"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
            >
              <Image
                src={meal.src}
                alt={meal.alt}
                width={1200}
                height={1200}
                className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(min-width: 1024px) 33vw"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
