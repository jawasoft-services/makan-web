'use client'

import { useRef } from 'react'
import Image from 'next/image'
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from 'framer-motion'
import StaticPicture from './StaticPicture'

const MEAL_IMAGE_WIDTHS = [480, 720] as const
const DIARY_IMAGE_WIDTHS = [560, 800] as const

// Alternate movement with flat "catch" zones so the story reads as distinct
// physical beats instead of one continuous scrub.
const SCROLL_STOPS = [
  0, 0.1, 0.18, 0.25, 0.33, 0.43, 0.51, 0.62, 0.69, 0.8, 0.87, 0.94, 0.97,
  1,
]
const STORY_STOPS = [
  0, 0.12, 0.12, 0.22, 0.22, 0.4, 0.4, 0.58, 0.58, 0.72, 0.72, 0.9, 0.9,
  1,
]

function PinIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[1em] w-[1em]"
      aria-hidden
    >
      <path d="M20 10c0 5.5-8 12-8 12S4 15.5 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  )
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[1em] w-[1em]"
      aria-hidden
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  )
}

function MealTypeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[1em] w-[1em]"
      aria-hidden
    >
      <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8Z" />
      <path d="M6 1v3M10 1v3M14 1v3" />
    </svg>
  )
}

function MemoryChip({
  className,
  children,
}: {
  className: string
  children: React.ReactNode
}) {
  return (
    <div
      className={`absolute z-30 flex items-center gap-2 rounded-full border border-white/20 bg-brand-orange px-3 py-2 text-[11px] font-bold text-white shadow-lg shadow-black/20 sm:px-4 sm:text-xs ${className}`}
    >
      {children}
    </div>
  )
}

function MealMemoryCard() {
  return (
    <article className="aspect-square w-full overflow-hidden rounded-[1.6rem] bg-brand-orange text-white shadow-2xl shadow-black/30 sm:rounded-[2rem]">
      <div className="relative aspect-[1080/740] overflow-hidden">
        <StaticPicture
          basePath="/static-images/v1/meals/IMG_6959"
          widths={MEAL_IMAGE_WIDTHS}
          alt="Hangover Tom Yum at Zaap Thai Street Food Durham, shared on Makan by Richard"
          width={720}
          height={720}
          sizes="(min-width: 768px) 380px, min(78vw, 330px)"
          className="absolute inset-0 h-full w-full object-cover object-top"
        />
      </div>

      <div className="flex h-[31.5%] flex-col justify-between px-[5%] py-[4%]">
        <div className="flex items-center justify-between gap-3">
          <Image
            src="/makan-logo-white.svg"
            alt="Makan"
            width={130}
            height={30}
            className="h-auto w-[31%]"
          />
          <span className="flex items-center gap-1.5 rounded-full border border-white/55 px-3 py-1 text-[10px] font-bold sm:text-xs">
            <MealTypeIcon />
            Snack
          </span>
        </div>

        <div>
          <p className="text-[10px] font-medium text-white/80 sm:text-xs">
            @Ridorichard
          </p>
          <p className="mt-1 truncate text-sm font-bold sm:text-lg">
            Hangover Tom Yum
          </p>
        </div>

        <div className="flex items-center justify-between gap-3 text-[9px] font-medium text-white/80 sm:text-[11px]">
          <span className="flex min-w-0 items-center gap-1 truncate">
            <PinIcon />
            <span className="truncate">Zaap Thai Street Food Durham</span>
          </span>
          <span className="shrink-0">makanofficial.com</span>
        </div>
      </div>
    </article>
  )
}

export default function MemoryThesis() {
  const sectionRef = useRef<HTMLElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  })
  const stagedProgress = useTransform(
    scrollYProgress,
    SCROLL_STOPS,
    STORY_STOPS,
  )
  const resistedProgress = useSpring(stagedProgress, {
    stiffness: 92,
    damping: 24,
    mass: 1.05,
  })

  const cardScaleX = useTransform(
    resistedProgress,
    [0, 0.16, 0.22, 0.3, 0.5],
    [1, 1, 0.93, 1.05, 0.18],
  )
  const cardScaleY = useTransform(
    resistedProgress,
    [0, 0.16, 0.22, 0.3, 0.5],
    [1, 1, 0.88, 1.05, 0.18],
  )
  const cardRotate = useTransform(
    resistedProgress,
    [0, 0.2, 0.34],
    [-1.5, 0, 0],
  )
  const cardY = useTransform(
    resistedProgress,
    [0, 0.16, 0.22, 0.3],
    [0, 14, 0, 0],
  )
  const cardOpacity = useTransform(
    resistedProgress,
    [0, 0.42, 0.5],
    [1, 1, 0],
  )

  const pillOpacity = useTransform(
    resistedProgress,
    [0.22, 0.27, 0.62, 0.72],
    [0, 1, 1, 0],
  )
  const pillScale = useTransform(
    resistedProgress,
    [0.22, 0.29, 0.62, 0.72],
    [0.35, 1, 1, 0.18],
  )
  const personX = useTransform(
    resistedProgress,
    [0.22, 0.29, 0.4, 0.58, 0.72],
    [0, -38, -122, -80, 0],
  )
  const personY = useTransform(
    resistedProgress,
    [0.22, 0.29, 0.4, 0.58, 0.72],
    [0, -28, -128, -48, 100],
  )
  const mealTypeX = useTransform(
    resistedProgress,
    [0.22, 0.29, 0.4, 0.58, 0.72],
    [0, 38, 122, 80, 0],
  )
  const mealTypeY = useTransform(
    resistedProgress,
    [0.22, 0.29, 0.4, 0.58, 0.72],
    [0, -18, -60, -32, 100],
  )
  const placeX = useTransform(
    resistedProgress,
    [0.22, 0.4, 0.58, 0.72],
    [0, 0, 0, 0],
  )
  const placeY = useTransform(
    resistedProgress,
    [0.22, 0.29, 0.4, 0.58, 0.72],
    [0, 36, 150, 82, 100],
  )

  const resistanceOpacity = useTransform(
    resistedProgress,
    [0, 0.04, 0.16, 0.23],
    [0, 0.7, 0.7, 0],
  )
  const resistanceScaleY = useTransform(
    resistedProgress,
    [0, 0.16, 0.23],
    [0.15, 1, 0.1],
  )
  const popRingOpacity = useTransform(
    resistedProgress,
    [0.2, 0.24, 0.36],
    [0, 0.65, 0],
  )
  const popRingScale = useTransform(
    resistedProgress,
    [0.2, 0.24, 0.36],
    [0.72, 0.82, 1.5],
  )

  const phoneOpacity = useTransform(
    resistedProgress,
    [0.46, 0.58],
    [0, 1],
  )
  const phoneScale = useTransform(
    resistedProgress,
    [0.46, 0.6, 0.7],
    [0.78, 0.94, 1],
  )
  const phoneY = useTransform(
    resistedProgress,
    [0.46, 0.62],
    [54, 0],
  )
  const calendarPulseOpacity = useTransform(
    resistedProgress,
    [0.69, 0.75],
    [0, 1],
  )
  const calendarPulseScale = useTransform(
    resistedProgress,
    [0.69, 0.76, 0.83],
    [0.5, 1.3, 1],
  )

  const copyOpacity = useTransform(
    resistedProgress,
    [0.08, 0.18],
    [0, 1],
  )
  const copyY = useTransform(
    resistedProgress,
    [0.08, 0.2],
    [24, 0],
  )
  const closingOpacity = useTransform(
    resistedProgress,
    [0.62, 0.72],
    [0, 1],
  )
  const closingY = useTransform(
    resistedProgress,
    [0.62, 0.74],
    [12, 0],
  )

  const hintOpacity = useTransform(
    resistedProgress,
    [0, 0.1, 0.2],
    [0.75, 0.75, 0],
  )

  if (prefersReducedMotion) {
    return (
      <section
        id="why-makan"
        className="bg-brand-espresso px-5 py-20 text-white sm:px-8 sm:py-28"
      >
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[0.9fr_1.1fr] md:items-center md:gap-16">
          <div className="mx-auto w-full max-w-[320px]">
            <MealMemoryCard />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
              Why Makan
            </p>
            <h2 className="mt-4 max-w-2xl text-3xl font-bold leading-[1.06] sm:text-5xl">
              The meals that matter deserve to be remembered.
            </h2>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-brand-espresso-muted sm:text-lg">
              The photo usually survives. The place, the people and why it
              mattered usually do not.{' '}
              <span className="font-semibold text-white">
                Makan keeps them together.
              </span>
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={sectionRef}
      id="why-makan"
      className="relative h-[460svh] bg-brand-espresso md:h-[500svh]"
    >
      <div className="sticky top-0 h-[100svh] min-h-[620px] overflow-hidden bg-brand-espresso text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          aria-hidden
          style={{
            background:
              'radial-gradient(circle at 25% 50%, rgba(255,153,50,0.2), transparent 42%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-y-0 left-[8%] hidden w-px bg-white/10 md:block"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-[8%] hidden w-px bg-white/10 md:block"
          aria-hidden
        />

        <div className="relative z-10 mx-auto grid h-full max-w-7xl grid-rows-[1fr_auto] px-5 pb-6 pt-24 sm:px-8 sm:pb-8 md:grid-rows-1 md:grid-cols-[0.92fr_1.08fr] md:items-center md:gap-12 md:pt-20 lg:gap-20">
          <div className="order-2 relative mx-auto h-[44svh] min-h-[300px] w-full max-w-[560px] md:order-1 md:h-[72svh] md:min-h-[520px]">
            <motion.div
              className="absolute left-1/2 top-1/2 z-10 w-[min(78vw,330px)] -translate-x-1/2 -translate-y-1/2 sm:w-[360px] md:w-[380px]"
              style={{
                scaleX: cardScaleX,
                scaleY: cardScaleY,
                rotate: cardRotate,
                y: cardY,
                opacity: cardOpacity,
              }}
            >
              <MealMemoryCard />
            </motion.div>

            <motion.div
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 aspect-square w-[min(88vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] border border-brand-orange/70"
              style={{ opacity: popRingOpacity, scale: popRingScale }}
              aria-hidden
            />

            <motion.div
              className="pointer-events-none absolute left-1/2 top-[7%] z-30 h-14 w-px origin-top bg-gradient-to-b from-brand-orange to-transparent md:top-[13%]"
              style={{
                opacity: resistanceOpacity,
                scaleY: resistanceScaleY,
              }}
              aria-hidden
            />

            <motion.div
              className="absolute inset-0 z-30"
              style={{
                opacity: pillOpacity,
                scale: pillScale,
                x: personX,
                y: personY,
              }}
            >
              <MemoryChip className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <UserIcon />
                with Richard
              </MemoryChip>
            </motion.div>

            <motion.div
              className="absolute inset-0 z-30"
              style={{
                opacity: pillOpacity,
                scale: pillScale,
                x: mealTypeX,
                y: mealTypeY,
              }}
            >
              <MemoryChip className="left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <MealTypeIcon />
                Snack
              </MemoryChip>
            </motion.div>

            <motion.div
              className="absolute inset-0 z-30"
              style={{
                opacity: pillOpacity,
                scale: pillScale,
                x: placeX,
                y: placeY,
              }}
            >
              <MemoryChip className="left-1/2 top-1/2 max-w-[88%] -translate-x-1/2 -translate-y-1/2">
                <PinIcon />
                <span className="truncate">Zaap Thai Street Food, Durham</span>
              </MemoryChip>
            </motion.div>

            <motion.div
              className="absolute inset-0 z-0 flex items-center justify-center"
              style={{
                opacity: phoneOpacity,
                scale: phoneScale,
                y: phoneY,
              }}
            >
              <div className="relative h-full aspect-[800/1519] max-w-[270px] md:max-w-[330px]">
                <div
                  className="absolute inset-[14%_12%_10%] rounded-[3rem] bg-brand-orange/20 blur-3xl"
                  aria-hidden
                />
                <StaticPicture
                  basePath="/static-images/v1/app-mockups/01-diary"
                  widths={DIARY_IMAGE_WIDTHS}
                  alt="Makan diary showing a month of saved meals"
                  width={800}
                  height={1519}
                  sizes="(min-width: 768px) 330px, 270px"
                  className="relative h-full w-full object-contain"
                  loading="lazy"
                />
                <motion.div
                  className="pointer-events-none absolute left-[40.2%] top-[75.6%] aspect-square w-[9.5%] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[25%] border border-brand-orange bg-brand-orange shadow-[0_0_0_3px_rgba(255,153,50,0.22)]"
                  style={{
                    opacity: calendarPulseOpacity,
                    scale: calendarPulseScale,
                  }}
                  aria-hidden
                >
                  <Image
                    src="/static-images/v1/meals/IMG_6959-480.webp"
                    alt=""
                    fill
                    sizes="40px"
                    className="object-cover object-top"
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>

          <motion.div
            className="order-1 relative z-30 self-end pb-1 md:order-2 md:self-center md:pb-0"
            style={{ opacity: copyOpacity, y: copyY }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
              Why Makan
            </p>
            <h2
              className="mt-3 max-w-2xl text-[clamp(2rem,4.4vw,4.6rem)] font-bold leading-[1.02]"
              style={{ letterSpacing: '-0.035em' }}
            >
              The meals that matter deserve to be remembered.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-brand-espresso-muted sm:mt-6 sm:text-lg">
              The photo usually survives. The place, the people and why it
              mattered usually do not.
            </p>
            <motion.p
              className="mt-3 text-lg font-bold text-white sm:mt-5 sm:text-2xl"
              style={{ opacity: closingOpacity, y: closingY }}
            >
              Makan keeps them together.
            </motion.p>
          </motion.div>
        </div>

        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-5 z-30 flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60"
          style={{ opacity: hintOpacity }}
          aria-hidden
        >
          <span className="h-px w-8 bg-brand-orange" />
          Scroll to unpack this meal
          <span className="h-px w-8 bg-brand-orange" />
        </motion.div>

      </div>
    </section>
  )
}
