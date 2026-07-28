'use client'

import { useRef, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { track } from '@vercel/analytics'
import { APP_STORE_URL } from '@/lib/links'
import StaticPicture from './StaticPicture'

// Source pool for the waterfall. Only five per visible column are rendered,
// then repeated once for the seamless loop; mobile mounts three columns and
// desktop mounts five, avoiding CSS-hidden image trees.
const columns: { src: string; alt: string }[][] = [
  [
    { src: '/meals/card-01.jpg', alt: "Riverview brekkie at Riverview Kitchen \u2014 shared on Makan" },
    { src: '/meals/card-02.jpg', alt: "Biang biang at Murger Han \u2014 shared on Makan" },
    { src: '/meals/card-03.jpg', alt: "Cannon of Lamb at Brasserie Quartier \u2014 shared on Makan" },
    { src: '/meals/card-04.jpg', alt: "Fash n Chaps at Nick's Fish Bar \u2014 shared on Makan" },
    { src: '/meals/card-05.jpg', alt: "Bacon and Brie at DISH \u2014 shared on Makan" },
    { src: '/meals/card-06.jpg', alt: "Truffle Wagyu donburi at Fat Cow \u2014 shared on Makan" },
    { src: '/meals/card-07.jpg', alt: "Full englais at Treats Cafe & Tea Room \u2014 shared on Makan" },
    { src: '/meals/card-08.jpg', alt: "Wee bit of \u2018Sush at AKI - Japanese Restaurant & Cocktail Bar \u2014 shared on Makan" },
    { src: '/meals/card-09.jpg', alt: "White asparagus. at Restaurante Albacara \u2014 shared on Makan" },
    { src: '/meals/card-10.jpg', alt: "Cheese at Brasserie Quartier \u2014 shared on Makan" },
  ],
  [
    { src: '/meals/card-11.jpg', alt: "Makan it at Zen \u2014 shared on Makan" },
    { src: '/meals/card-12.jpg', alt: "The speciality of the house - Beef Bourgnignan. at Au Bourguignon du Marais \u2014 shared on Makan" },
    { src: '/meals/card-13.jpg', alt: "Lunch at Sphinx \u2014 shared on Makan" },
    { src: '/meals/card-14.jpg', alt: "Lunch at Franco Manca Aldwych \u2014 shared on Makan" },
    { src: '/meals/card-15.jpg', alt: "Date night at Kendal Street Kitchen \u2014 shared on Makan" },
    { src: '/meals/card-16.jpg', alt: "with fwendss \ud83d\ude0b at GYUKICHI \u2014 shared on Makan" },
    { src: '/meals/card-17.jpg', alt: "Dinner at Donostia Restaurant \u2014 shared on Makan" },
    { src: '/meals/card-18.jpg', alt: "Yum at Gaucho Piccadilly \u2014 shared on Makan" },
    { src: '/meals/card-19.jpg', alt: "Tom yum at Fusha Asian Fusion - Durham \u2014 shared on Makan" },
    { src: '/meals/card-20.jpg', alt: "Dinner at Thai Spot \u2014 shared on Makan" },
  ],
  [
    { src: '/meals/card-21.jpg', alt: "Chinese food at HAKA Dimsum Shop Tebet \u2014 shared on Makan" },
    { src: '/meals/card-22.jpg', alt: "Service station lunch at Burger King \u2014 shared on Makan" },
    { src: '/meals/card-23.jpg', alt: "Japanese BBQ \ud83d\ude0b at Gyu-Kaku \"\u725b\u89d2\" Japanese BBQ Restaurant (VivoCity) \u2014 shared on Makan" },
    { src: '/meals/card-24.jpg', alt: "Lunch at Fire Street Food \u2014 shared on Makan" },
    { src: '/meals/card-25.jpg', alt: "Lunch at Crisp W1 \u2014 shared on Makan" },
    { src: '/meals/card-26.jpg', alt: "Borgir at Hub Box Exeter \u2014 shared on Makan" },
    { src: '/meals/card-27.jpg', alt: "Lunch at The French Table \u2014 shared on Makan" },
    { src: '/meals/card-28.jpg', alt: "Carbonara truffle fries and risotto at Kendal Street Kitchen \u2014 shared on Makan" },
    { src: '/meals/card-29.jpg', alt: "Oyster! at AKI - Japanese Restaurant & Cocktail Bar \u2014 shared on Makan" },
    { src: '/meals/card-30.jpg', alt: "ROS BEEEEF at Heaney & Mill \u2014 shared on Makan" },
  ],
  [
    { src: '/meals/card-31.jpg', alt: "Proper pie at a proper pub at The White Hart \u2014 shared on Makan" },
    { src: '/meals/card-32.jpg', alt: "Snack at Breadstall Pizza \u2014 shared on Makan" },
    { src: '/meals/card-33.jpg', alt: "Dinner at Bordelaise Surbiton \u2014 shared on Makan" },
    { src: '/meals/card-34.jpg', alt: "Lunch at LE BON TEMPS \u2014 shared on Makan" },
    { src: '/meals/card-35.jpg', alt: "Lunch at Sphinx \u2014 shared on Makan" },
    { src: '/meals/card-36.jpg', alt: "Give me all the oysters! at Common Thread \u2014 shared on Makan" },
    { src: '/meals/card-37.jpg', alt: "Tiramis at Kendal Street Kitchen \u2014 shared on Makan" },
    { src: '/meals/card-38.jpg', alt: "Chicken at Honest Greens Pedralbes Centre \u2014 shared on Makan" },
    { src: '/meals/card-39.jpg', alt: "Wingstop at Wingstop Leeds Boar Lane \u2014 shared on Makan" },
    { src: '/meals/card-40.jpg', alt: "Lunch at NOBU Singapore \u2014 shared on Makan" },
  ],
  [
    { src: '/meals/card-41.jpg', alt: "Snack at Le Parisien \u2014 shared on Makan" },
    { src: '/meals/card-42.jpg', alt: "Dinner at Flat Iron Covent Garden \u2014 shared on Makan" },
    { src: '/meals/card-43.jpg', alt: "Clam chowder, fries , & bourbon at Earls Kitchen + Bar \u2014 shared on Makan" },
    { src: '/meals/card-44.jpg', alt: "Full English \u263a\ufe0f at Treats Cafe & Tea Room \u2014 shared on Makan" },
    { src: '/meals/card-45.jpg', alt: "Lunch at Estia Kitchen \u2014 shared on Makan" },
    { src: '/meals/card-46.jpg', alt: "Fish Sando at Fire Street Food \u2014 shared on Makan" },
    { src: '/meals/card-47.jpg', alt: "Snack at Ladur\u00e9e \u2014 shared on Makan" },
    { src: '/meals/card-48.jpg', alt: "Lunch at The Hero \u2014 shared on Makan" },
    { src: '/meals/card-49.jpg', alt: "Dinner at Eel Sushi Bar \u2014 shared on Makan" },
    { src: '/meals/card-50.jpg', alt: "Snack at Sushi TONARI \u2014 shared on Makan" },
  ],
]

// Varied speeds keep the columns feeling organic.
const columnSpeeds = [28, 22, 32, 24, 30]
const HERO_CARDS_PER_COLUMN = 5
const HERO_IMAGE_WIDTHS = [320, 640, 800] as const

export default function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isWide, setIsWide] = useState(false)

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
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const wide = window.matchMedia('(min-width: 640px)')
    const syncPreferences = () => {
      setPrefersReducedMotion(reducedMotion.matches)
      setIsWide(wide.matches)
    }
    syncPreferences()
    reducedMotion.addEventListener('change', syncPreferences)
    wide.addEventListener('change', syncPreferences)
    return () => {
      reducedMotion.removeEventListener('change', syncPreferences)
      wide.removeEventListener('change', syncPreferences)
    }
  }, [])

  const visibleColumns = columns.slice(0, isWide ? 5 : 3)

  return (
    <section ref={containerRef} className="relative h-[100svh] min-h-[720px]">
      <div className="sticky top-0 h-[100svh] min-h-[720px] overflow-hidden bg-brand-night">
        {/* Waterfall grid — 5 columns of scrolling meal cards */}
        <div className="waterfall-container absolute inset-0 grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3 px-2 sm:px-3">
          {visibleColumns.map((col, i) => {
            const loop = col.slice(0, HERO_CARDS_PER_COLUMN)
            const doubled = [...loop, ...loop]
            return (
              <div
                key={i}
                className="relative h-screen overflow-hidden"
              >
                <div
                  className="flex flex-col gap-2 sm:gap-3"
                  style={
                    prefersReducedMotion
                      ? {}
                      : {
                          animation: `waterfall-scroll ${columnSpeeds[i]}s linear infinite`,
                          // Settle the first viewport before this decorative
                          // layer moves new image candidates into view.
                          animationDelay: '6s',
                        }
                  }
                >
                  {doubled.map((card, j) => (
                    <div key={`${card.src}-${j}`} className="shrink-0">
                      <StaticPicture
                        basePath={card.src
                          .replace('/meals/', '/static-images/v1/hero/')
                          .replace(/\.jpg$/i, '')}
                        widths={HERO_IMAGE_WIDTHS}
                        alt={j >= loop.length ? '' : card.alt}
                        width={300}
                        height={300}
                        sizes="(min-width: 640px) 20vw, 33vw"
                        className="w-full aspect-square rounded-lg sm:rounded-xl object-cover"
                        loading={j < 2 ? 'eager' : 'lazy'}
                        fetchPriority={j === 0 && i < 3 ? 'high' : undefined}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Top/bottom fades — blend waterfall edges into the dark bg */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b from-brand-night to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-brand-night to-transparent" />

        {/* Scroll-driven darkening */}
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 bg-brand-night"
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

            {/* Glass panel with wordmark + loss hook + CTA */}
            <div className="inverse-ground mt-4 max-w-[340px] rounded-3xl bg-brand-night/75 px-5 py-5 text-center backdrop-blur-lg sm:mt-6 sm:max-w-xl sm:px-8 sm:py-7">
              <Image
                src="/makan-logo.png"
                alt="makan"
                width={600}
                height={120}
                className="mx-auto h-auto w-full max-w-[160px] sm:max-w-[220px]"
              />

              {/* The hook — loss aversion. Cold-acquisition only (per product brief). */}
              <h1
                className="mt-4 text-center text-2xl font-bold leading-[1.1] text-white sm:mt-5 sm:text-4xl"
                style={{ letterSpacing: '-0.025em' }}
              >
                Three weeks ago you ate something{' '}
                <span className="perfect-shimmer">perfect.</span>
                <span className="mt-2 block text-brand-orange">
                  Where was that again?
                </span>
              </h1>

              <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-white/85 sm:text-base">
                Save what you ate, where you ate it and who was there.
              </p>

              <div className="mt-5">
                <div className="flex items-center justify-center gap-4">
                  <Link
                    href={APP_STORE_URL}
                    onClick={() => track('App Store CTA Clicked', { location: 'hero' })}
                    className="relative inline-flex min-h-11 items-center justify-center rounded-full bg-brand-orange px-6 py-3 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-brand-orange/25 active:scale-[0.98] sm:px-8 sm:py-3.5 sm:text-base"
                  >
                    <span className="pointer-events-none absolute -inset-3 rounded-full bg-brand-orange/10 blur-xl" aria-hidden />
                    <span className="relative">Start your food diary</span>
                  </Link>
                  <Link
                    href="/app"
                    className="hidden items-center gap-2 rounded-2xl bg-white p-2 pr-3 text-left text-brand-ink shadow-lg shadow-black/20 lg:flex"
                  >
                    <Image
                      src="/app-download-qr.svg"
                      alt="QR code to download Makan"
                      width={72}
                      height={72}
                      className="h-[72px] w-[72px] rounded-lg"
                    />
                    <span className="max-w-[76px] text-[11px] font-semibold leading-snug">
                      Scan with your iPhone
                    </span>
                  </Link>
                </div>
                <p className="mt-3 text-[13px] font-medium text-white/85">
                  Free on iPhone
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
