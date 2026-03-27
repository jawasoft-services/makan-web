'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'

const meals = [
  { src: '/meals/sharecard-1.jpg', alt: 'Chicken noodles on Makan', user: '@Will', name: 'Chicken noodles' },
  { src: '/meals/sharecard-2.jpg', alt: 'Sausages on Makan', user: '@Mia', name: 'Sausages & couscous' },
  { src: '/meals/sharecard-3.jpg', alt: 'Burger on Makan', user: '@Lizzie', name: 'Burger and fries' },
  { src: '/meals/sharecard-4.jpg', alt: 'Schnitzel on Makan', user: '@Valesca', name: 'Schnitzel' },
  { src: '/meals/sharecard-5.jpg', alt: 'Chicken on Makan', user: '@Laura', name: 'Chicken and veg' },
  { src: '/meals/sharecard-6.jpg', alt: 'Carbonara on Makan', user: '@Valesca', name: 'Carbonara' },
]

export default function LatestOnMakan() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-brand-bg px-5 sm:px-8 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <motion.h2
            className="text-xl font-semibold text-white sm:text-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            Latest on Makan
          </motion.h2>
          <motion.p
            className="mt-2 text-sm text-brand-muted"
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Meals from beta users right now.
          </motion.p>
        </div>

        <div className="mt-10 grid gap-3 grid-cols-2 md:grid-cols-3">
          {meals.map((meal, i) => (
            <motion.div
              key={meal.src}
              className="group relative overflow-hidden rounded-xl border border-brand-border bg-brand-surface transition-all duration-300 hover:-translate-y-1 hover:border-brand-orange/30 hover:shadow-lg hover:shadow-brand-orange/10"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
            >
              <div className="relative aspect-square">
                <Image
                  src={meal.src}
                  alt={meal.alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 768px) 33vw, 50vw"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-xs font-medium text-white/90">{meal.name}</p>
                  <p className="text-[10px] text-white/50">{meal.user}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
