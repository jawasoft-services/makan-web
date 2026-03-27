'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useScroll, useTransform } from 'framer-motion'

const heroMeals = [
  { src: '/meals/sharecard-1.jpg', alt: 'Chicken noodles on Makan' },
  { src: '/meals/sharecard-2.jpg', alt: 'Sausages and couscous on Makan' },
  { src: '/meals/sharecard-3.jpg', alt: 'Burger and fries on Makan' },
  { src: '/meals/sharecard-4.jpg', alt: 'Schnitzel on Makan' },
  { src: '/meals/sharecard-5.jpg', alt: 'Chicken and veg on Makan' },
  { src: '/meals/sharecard-6.jpg', alt: 'Carbonara on Makan' },
  { src: '/meals/sharecard-7.jpg', alt: 'Taco on Makan' },
  { src: '/meals/sharecard-8.jpg', alt: 'Korean BBQ on Makan' },
]

const photoPositions = [
  { x: -38, y: -30, size: 140, rotate: -6, speed: 0.7 },
  { x: 32, y: -35, size: 120, rotate: 4, speed: 0.6 },
  { x: -42, y: 20, size: 130, rotate: 3, speed: 0.8 },
  { x: 36, y: 25, size: 110, rotate: -5, speed: 0.65 },
  { x: -20, y: -42, size: 100, rotate: 2, speed: 0.75 },
  { x: 25, y: 40, size: 115, rotate: -3, speed: 0.55 },
  { x: -35, y: 42, size: 105, rotate: 5, speed: 0.7 },
  { x: 40, y: -10, size: 125, rotate: -2, speed: 0.6 },
]

function CascadePhoto({
  src,
  alt,
  position,
  index,
  scrollYProgress,
}: {
  src: string
  alt: string
  position: (typeof photoPositions)[number]
  index: number
  scrollYProgress: ReturnType<typeof useScroll>['scrollYProgress']
}) {
  const enterStart = 0.05 + index * 0.04
  const enterEnd = enterStart + 0.15

  const opacity = useTransform(scrollYProgress, [enterStart, enterEnd], [0, 0.85])
  const scale = useTransform(scrollYProgress, [enterStart, enterEnd], [0.8, 1])
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [position.y * 2, position.y * position.speed]
  )

  return (
    <motion.div
      className="absolute hidden sm:block"
      style={{
        left: `calc(50% + ${position.x}%)`,
        top: `calc(50% + ${position.y}%)`,
        width: position.size,
        height: position.size,
        opacity,
        scale,
        y,
        rotate: position.rotate,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <Image
        src={src}
        alt={alt}
        width={300}
        height={300}
        className="h-full w-full rounded-xl object-cover shadow-2xl shadow-black/50"
      />
    </motion.div>
  )
}

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  })

  const arrowOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0])

  return (
    <section ref={containerRef} className="relative h-[200vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {heroMeals.map((meal, i) => (
          <CascadePhoto
            key={meal.src}
            src={meal.src}
            alt={meal.alt}
            position={photoPositions[i]}
            index={i}
            scrollYProgress={scrollYProgress}
          />
        ))}

        <div className="relative z-10 text-center">
          <motion.h1
            className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl"
            style={{ letterSpacing: '-0.03em' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            makan
          </motion.h1>
          <motion.p
            className="mt-3 text-base italic text-brand-orange sm:text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            /mah·kahn/ — to eat
          </motion.p>

          <motion.div
            className="mt-12 text-brand-dim"
            style={{ opacity: arrowOpacity }}
          >
            <svg
              className="mx-auto h-5 w-5 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
