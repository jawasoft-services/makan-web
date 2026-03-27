# Makan Website Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Makan homepage from a light-themed landing page to a dark, cinematic, air.inc-inspired beta waitlist experience.

**Architecture:** Retheme Tailwind config + globals.css to dark palette, then rewrite each component top-to-bottom in section order. One new component (FeatureTabs), one new section (B2B teaser). Hero gets a full scroll-reveal rewrite. All other components are restyle + copy updates. Firebase meal integration stays unchanged.

**Tech Stack:** Next.js 16, Tailwind CSS v4, Framer Motion, Firebase Admin SDK, Plus Jakarta Sans

**Design Spec:** `docs/superpowers/specs/2026-03-27-website-redesign-design.md`

---

## File map

```
MODIFY  tailwind.config.ts             — Replace brand colors with dark palette tokens
MODIFY  app/globals.css                 — Dark background, remove grain, update selection
MODIFY  app/layout.tsx                  — Add font weight 800, update metadata description
MODIFY  app/page.tsx                    — New section composition order
MODIFY  components/Navbar.tsx           — Dark theme, add nav links, mobile hamburger
REWRITE components/Hero.tsx             — Scroll-reveal word-first with photo cascade
CREATE  components/Manifesto.tsx        — Centered manifesto text block with CTA
CREATE  components/FeatureTabs.tsx      — Auto-rotating 5-tab interface with phone mockup
MODIFY  components/LatestOnMakan.tsx    — Dark card restyle, reduce to 6 cards, hover effects
REWRITE components/BrandStory.tsx → components/BrandPillars.tsx — 3-card layout, new copy
MODIFY  components/FAQ.tsx              — Dark restyle, new header copy
CREATE  components/B2BTeaser.tsx        — Restaurant teaser section
REWRITE components/DownloadCTA.tsx → components/FinalCTA.tsx — New copy, founder quote
MODIFY  components/Footer.tsx           — Simplified dark footer
```

---

### Task 1: Tailwind config — dark palette

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace brand color tokens**

Replace the entire `colors.brand` object in `tailwind.config.ts`:

```ts
colors: {
  brand: {
    bg: "#050505",
    surface: "#0f0f0f",
    border: "#1a1a1a",
    orange: "#FF9932",
    text: "#FFFFFF",
    muted: "#888888",
    dim: "#555555",
  },
},
```

- [ ] **Step 2: Verify config is valid**

Run: `npx next lint`
Expected: no errors related to Tailwind config

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: update tailwind config to dark palette"
```

---

### Task 2: Global styles — dark background, remove grain

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace globals.css content**

```css
@import "tailwindcss";
@config "../tailwind.config.ts";

@layer base {
  body {
    background-color: #050505;
    color: #FFFFFF;
  }

  html {
    scroll-behavior: smooth;
  }

  ::selection {
    background-color: #FF993240;
    color: #FFFFFF;
  }
}
```

This removes the grain texture SVG filter entirely and sets the dark background.

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: dark background, remove grain texture overlay"
```

---

### Task 3: Layout — add font weight 800, update metadata

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add weight "800" to the Plus Jakarta Sans config**

In `app/layout.tsx`, update the font initialization:

```ts
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
})
```

- [ ] **Step 2: Update metadata description**

Replace the `description` in both `metadata` and `openGraph` and `twitter`:

```ts
export const metadata: Metadata = {
  title: "Makan — Share What You Eat",
  description:
    "A food journal where your friends' real meals replace algorithms and influencers.",
  alternates: {
    canonical: "https://www.makanofficial.com",
  },
  openGraph: {
    title: "Makan — Share What You Eat",
    description:
      "A food journal where your friends' real meals replace algorithms and influencers.",
    url: "https://www.makanofficial.com",
    siteName: "Makan",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Makan — Share What You Eat",
    description:
      "A food journal where your friends' real meals replace algorithms and influencers.",
    site: "@app_makan",
  },
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add font weight 800, update meta descriptions"
```

---

### Task 4: Navbar — dark theme with nav links

**Files:**
- Modify: `components/Navbar.tsx`

- [ ] **Step 1: Rewrite Navbar for dark theme**

Replace the full content of `components/Navbar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const navLinks = [
  { label: 'Story', href: '#story' },
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-brand-bg/90 backdrop-blur-md shadow-sm shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 py-4 sm:py-5">
        {/* Wordmark */}
        <Link href="/" className="text-base font-bold text-white">
          makan
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-brand-muted transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/contact"
            className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-brand-bg transition-shadow hover:shadow-lg hover:shadow-brand-orange/25"
          >
            Request a Seat
          </Link>
        </div>

        {/* Mobile: CTA only (hamburger optional — keeping it minimal for beta) */}
        <Link
          href="/contact"
          className="md:hidden rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-brand-bg"
        >
          Request a Seat
        </Link>
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`
Check: navbar is transparent on top, gets dark blur on scroll, orange CTA pill visible, nav links show on desktop

- [ ] **Step 3: Commit**

```bash
git add components/Navbar.tsx
git commit -m "feat: dark navbar with section links and orange CTA"
```

---

### Task 5: Hero — scroll-reveal with photo cascade

**Files:**
- Rewrite: `components/Hero.tsx`

This is the most complex component. The hero shows "makan" centered, then food photos cascade in from edges as the user scrolls, building a mosaic behind the text.

- [ ] **Step 1: Rewrite Hero.tsx**

Replace the full content of `components/Hero.tsx`:

```tsx
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

/* Fixed positions for the photo mosaic around center text.
   Each photo has: x/y offset from center (%), size, rotation, and scroll speed multiplier */
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
  /* Each photo fades in at a staggered scroll point */
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

  /* Scroll indicator fades out */
  const arrowOpacity = useTransform(scrollYProgress, [0, 0.1], [1, 0])

  return (
    <section ref={containerRef} className="relative h-[200vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
        {/* Photo cascade — positioned absolutely around the center text */}
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

        {/* Center text — always on top */}
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

          {/* Scroll indicator */}
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
```

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`
Check:
- "makan" centered on dark background
- Orange pronunciation below
- Scroll indicator arrow visible, fades on scroll
- On desktop, food photos cascade in from edges as you scroll
- Photos hidden on mobile (sm: breakpoint)

- [ ] **Step 3: Commit**

```bash
git add components/Hero.tsx
git commit -m "feat: scroll-reveal hero with photo cascade"
```

---

### Task 6: Manifesto section

**Files:**
- Create: `components/Manifesto.tsx`

- [ ] **Step 1: Create Manifesto.tsx**

Create `components/Manifesto.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

export default function Manifesto() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} id="story" className="bg-brand-bg px-5 sm:px-8 py-20 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <motion.h2
          className="text-2xl font-semibold leading-snug text-white sm:text-3xl lg:text-4xl"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          A food journal where your friends&apos;{' '}
          <em className="text-brand-orange">real meals</em> replace algorithms
          and influencers.
        </motion.h2>

        <motion.p
          className="mt-5 text-sm text-brand-muted sm:text-base"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          No filters. No star ratings. No calorie counts.
        </motion.p>

        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/contact"
            className="inline-block rounded-full bg-brand-orange px-7 py-3 text-sm font-semibold text-brand-bg transition-shadow hover:shadow-lg hover:shadow-brand-orange/25"
          >
            Request a Seat
          </Link>
        </motion.div>

        <motion.p
          className="mt-4 text-xs text-brand-dim"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          38 languages. Yes, already.
        </motion.p>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Manifesto.tsx
git commit -m "feat: add manifesto section with CTA and language callout"
```

---

### Task 7: Feature tabs — auto-rotating with phone mockup

**Files:**
- Create: `components/FeatureTabs.tsx`

This is the second most complex component. 5 tabs auto-rotate on ~8s with a progress bar, crossfade content, and a phone mockup frame on the right.

- [ ] **Step 1: Create FeatureTabs.tsx**

Create `components/FeatureTabs.tsx`:

```tsx
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useInView } from 'framer-motion'

const TAB_INTERVAL = 8000

const tabs = [
  {
    id: 'feed',
    label: 'Feed',
    headline: 'Two feeds. Your choice.',
    description: 'One for friends, one for everyone else.',
    image: '/meals/sharecard-1.jpg',
  },
  {
    id: 'share-cards',
    label: 'Share Cards',
    headline: 'Makan cards.',
    description:
      'Share a meal and it goes out as a Makan card — Stories, WhatsApp, wherever.',
    image: '/meals/sharecard-3.jpg',
  },
  {
    id: 'explore',
    label: 'Explore & Map',
    headline: 'See where your friends ate.',
    description: "Discover where they haven't. Friend avatars on every pin.",
    image: '/meals/sharecard-5.jpg',
  },
  {
    id: 'streaks',
    label: 'Streaks & Titles',
    headline: 'From Curious Eater to Local Legend.',
    description: 'Post daily, earn titles, collect 100 badges.',
    image: '/meals/sharecard-7.jpg',
  },
  {
    id: 'journal',
    label: 'Food Journal',
    headline: 'Your food diary.',
    description:
      "Every meal, every day, on a calendar that doesn't look like a spreadsheet.",
    image: '/meals/sharecard-9.jpg',
  },
]

export default function FeatureTabs() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { amount: 0.3 })
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goToTab = useCallback((index: number) => {
    setActiveIndex(index)
    setProgress(0)
  }, [])

  /* Auto-rotation: only when in view and not paused */
  useEffect(() => {
    if (!inView || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
      return
    }

    setProgress(0)

    progressRef.current = setInterval(() => {
      setProgress((prev) => Math.min(prev + 100 / (TAB_INTERVAL / 50), 100))
    }, 50)

    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % tabs.length)
      setProgress(0)
    }, TAB_INTERVAL)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (progressRef.current) clearInterval(progressRef.current)
    }
  }, [inView, isPaused, activeIndex])

  const handleTabClick = (index: number) => {
    goToTab(index)
    setIsPaused(true)
    /* Resume auto-rotation after 20s of inactivity */
    setTimeout(() => setIsPaused(false), 20000)
  }

  const activeTab = tabs[activeIndex]

  return (
    <section ref={sectionRef} id="features" className="bg-brand-bg px-5 sm:px-8 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <h2 className="text-center text-xl font-semibold text-white sm:text-2xl">
          How it works
        </h2>

        {/* Tab pills */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {tabs.map((tab, i) => (
            <button
              key={tab.id}
              onClick={() => handleTabClick(i)}
              className={`relative rounded-full px-4 py-2 text-xs font-medium transition-colors sm:text-sm ${
                i === activeIndex
                  ? 'bg-brand-orange text-brand-bg'
                  : 'bg-brand-surface text-brand-muted hover:text-white'
              }`}
            >
              {tab.label}
              {/* Progress bar under active tab */}
              {i === activeIndex && (
                <div className="absolute bottom-0 left-0 h-0.5 rounded-full bg-white/30 w-full overflow-hidden">
                  <div
                    className="h-full bg-brand-bg/40 transition-none"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-10 flex flex-col items-center gap-8 md:flex-row md:items-center md:gap-12 lg:gap-16">
          {/* Left: text */}
          <div className="flex-1 text-center md:text-left">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-semibold text-white sm:text-xl lg:text-2xl">
                  {activeTab.headline}
                </h3>
                <p className="mt-3 max-w-md text-sm leading-relaxed text-brand-muted sm:text-base">
                  {activeTab.description}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right: phone mockup */}
          <div className="flex-shrink-0">
            <div className="relative mx-auto w-52 sm:w-60 lg:w-64">
              {/* Phone frame */}
              <div className="overflow-hidden rounded-[2rem] border-2 border-brand-border bg-brand-surface shadow-2xl shadow-black/40">
                <div className="aspect-[9/19.5] relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0"
                    >
                      <Image
                        src={activeTab.image}
                        alt={activeTab.headline}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 256px, (min-width: 640px) 240px, 208px"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
```

Note: The `image` field in each tab uses existing share card images as placeholders. These can be swapped for app screen recordings later — the component accepts any image path, and can be extended to accept video sources by checking the file extension and rendering a `<video>` tag instead.

- [ ] **Step 2: Verify in browser**

Run: `npm run dev`
Check:
- 5 tab pills centered, active tab is orange
- Content crossfades every ~8s
- Phone mockup shows on right (desktop) or below (mobile)
- Clicking a tab switches immediately and pauses auto-rotation
- Progress indicator visible under active tab

- [ ] **Step 3: Commit**

```bash
git add components/FeatureTabs.tsx
git commit -m "feat: auto-rotating feature tabs with phone mockup"
```

---

### Task 8: LatestOnMakan — dark restyle

**Files:**
- Modify: `components/LatestOnMakan.tsx`

- [ ] **Step 1: Restyle for dark theme**

Replace the full content of `components/LatestOnMakan.tsx`:

```tsx
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
                {/* Dark gradient overlay at bottom */}
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
```

- [ ] **Step 2: Commit**

```bash
git add components/LatestOnMakan.tsx
git commit -m "feat: dark restyle latest meals grid with hover effects"
```

---

### Task 9: Brand pillars — replace BrandStory

**Files:**
- Delete: `components/BrandStory.tsx`
- Create: `components/BrandPillars.tsx`

- [ ] **Step 1: Create BrandPillars.tsx**

Create `components/BrandPillars.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const pillars = [
  {
    number: '01',
    title: 'No audience required',
    copy: "Your meal doesn't need likes to be worth sharing.",
  },
  {
    number: '02',
    title: 'Ordinary is the point',
    copy: "The best food stories aren't from restaurants. They're from your kitchen at 11pm.",
  },
  {
    number: '03',
    title: 'No algorithm required',
    copy: "Find places through what your friends actually ate. Not what an algorithm thinks you'll click.",
  },
]

export default function BrandPillars() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-brand-bg px-5 sm:px-8 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <motion.h2
          className="text-center text-xl font-semibold text-white sm:text-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          What we believe
        </motion.h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {pillars.map((pillar, i) => (
            <motion.div
              key={pillar.number}
              className="rounded-xl border border-brand-border bg-brand-surface p-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
            >
              <p className="text-3xl font-bold text-brand-orange">{pillar.number}</p>
              <h3 className="mt-4 text-sm font-semibold text-white">{pillar.title}</h3>
              <p className="mt-3 text-xs leading-relaxed text-brand-muted">
                {pillar.copy}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Delete old BrandStory.tsx**

```bash
rm components/BrandStory.tsx
```

- [ ] **Step 3: Commit**

```bash
git add components/BrandPillars.tsx
git rm components/BrandStory.tsx
git commit -m "feat: replace BrandStory with dark BrandPillars cards"
```

---

### Task 10: FAQ — dark restyle with new header

**Files:**
- Modify: `components/FAQ.tsx`

- [ ] **Step 1: Update FAQ for dark theme and new header copy**

In `components/FAQ.tsx`, make these changes:

1. Replace the section class background from `bg-white` to `bg-brand-bg`
2. Replace the header label and heading:
   - Remove the `<p>` tag with "FAQ" label
   - Change h2 content to: `Questions?` on first line, `<span className="text-brand-muted font-normal text-base sm:text-lg">The stuff people ask us.</span>` below
3. Update all text colors:
   - `text-brand-text` → `text-white`
   - `text-brand-cyan` → `text-brand-muted`
   - `text-brand-cyan/40` → `text-brand-dim`
   - `divide-brand-cyan/10` → `divide-brand-border`
4. Add `id="faq"` to the section tag

- [ ] **Step 2: Commit**

```bash
git add components/FAQ.tsx
git commit -m "feat: dark FAQ with updated header copy"
```

---

### Task 11: B2B teaser — new component

**Files:**
- Create: `components/B2BTeaser.tsx`

- [ ] **Step 1: Create B2BTeaser.tsx**

Create `components/B2BTeaser.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

export default function B2BTeaser() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-[#0a0808] px-5 sm:px-8 py-16 sm:py-24">
      <motion.div
        className="mx-auto max-w-md text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
      >
        <h2 className="text-lg font-semibold text-white sm:text-xl">
          Own a restaurant?
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-brand-muted">
          We&apos;re building something for you too. Get early access.
        </p>
        <Link
          href="/contact"
          className="mt-6 inline-block rounded-full border border-brand-orange px-6 py-2.5 text-sm font-medium text-brand-orange transition-colors hover:bg-brand-orange hover:text-brand-bg"
        >
          Tell me more →
        </Link>
      </motion.div>
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/B2BTeaser.tsx
git commit -m "feat: add B2B restaurant teaser section"
```

---

### Task 12: Final CTA — replace DownloadCTA

**Files:**
- Delete: `components/DownloadCTA.tsx`
- Create: `components/FinalCTA.tsx`

- [ ] **Step 1: Create FinalCTA.tsx**

Create `components/FinalCTA.tsx`:

```tsx
'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'

export default function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section ref={ref} className="bg-brand-bg px-5 sm:px-8 py-20 sm:py-32">
      <div className="mx-auto max-w-2xl text-center">
        <motion.h2
          className="text-2xl font-bold text-white sm:text-3xl lg:text-4xl"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          Join the table.
        </motion.h2>

        <motion.p
          className="mt-4 text-sm text-brand-muted sm:text-base"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          We&apos;re letting people in slowly. Request your seat.
        </motion.p>

        <motion.div
          className="mt-8"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link
            href="/contact"
            className="inline-block rounded-full bg-brand-orange px-7 py-3 text-sm font-semibold text-brand-bg transition-shadow hover:shadow-lg hover:shadow-brand-orange/25"
          >
            Request a Seat
          </Link>
        </motion.div>

        {/* Founder quote */}
        <motion.div
          className="mx-auto mt-12 max-w-xl border-t border-brand-border pt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-sm italic leading-relaxed text-brand-dim sm:text-base">
            &ldquo;Makan started as a Snapchat story shared between our closest
            friends. Over six years and thousands of meals later, we realised
            we&apos;d built a habit worth keeping — so we built an app around
            it.&rdquo;
          </p>
          <p className="mt-4 text-xs text-brand-muted">
            — Devon Makepeace, Founder of Makan, London
          </p>
        </motion.div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Delete old DownloadCTA.tsx**

```bash
rm components/DownloadCTA.tsx
```

- [ ] **Step 3: Commit**

```bash
git add components/FinalCTA.tsx
git rm components/DownloadCTA.tsx
git commit -m "feat: replace DownloadCTA with FinalCTA + founder quote"
```

---

### Task 13: Footer — dark simplified

**Files:**
- Modify: `components/Footer.tsx`

- [ ] **Step 1: Replace Footer with simplified dark version**

Replace the full content of `components/Footer.tsx`:

```tsx
import Link from 'next/link'

const links = [
  { label: 'Privacy', href: '/privacy-policy' },
  { label: 'Terms', href: '/tos' },
  { label: 'Instagram', href: 'https://www.instagram.com/makanappofficial/', external: true },
  { label: 'TikTok', href: 'https://www.tiktok.com/@makanapp', external: true },
]

export default function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-bg px-5 sm:px-8 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-xs text-brand-dim">
          &copy; {new Date().getFullYear()} Makan &middot; London, UK
        </p>
        <div className="flex gap-6">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-brand-dim transition-colors hover:text-white"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                href={link.href}
                className="text-xs text-brand-dim transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            )
          )}
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/Footer.tsx
git commit -m "feat: simplified dark footer"
```

---

### Task 14: Page composition — wire up new section order

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update page.tsx with new section order**

Replace the full content of `app/page.tsx`:

```tsx
import Hero from "@/components/Hero"
import Manifesto from "@/components/Manifesto"
import FeatureTabs from "@/components/FeatureTabs"
import LatestOnMakan from "@/components/LatestOnMakan"
import BrandPillars from "@/components/BrandPillars"
import FAQ from "@/components/FAQ"
import B2BTeaser from "@/components/B2BTeaser"
import FinalCTA from "@/components/FinalCTA"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <main>
      <Hero />
      <Manifesto />
      <FeatureTabs />
      <LatestOnMakan />
      <BrandPillars />
      <FAQ />
      <B2BTeaser />
      <FinalCTA />
      <Footer />
    </main>
  )
}
```

- [ ] **Step 2: Delete the old Features component**

```bash
rm components/Features.tsx
```

- [ ] **Step 3: Verify full page in browser**

Run: `npm run dev`
Walk through the entire page and verify:
- All 8 sections render in order
- No white/light sections bleeding through
- Scroll-reveal hero works
- Feature tabs auto-rotate
- All links work (/contact, /privacy-policy, /tos, social links)
- Mobile responsive at 375px width

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git rm components/Features.tsx
git commit -m "feat: wire up new section order, remove old Features"
```

---

### Task 15: Final verification and cleanup

**Files:**
- All modified files

- [ ] **Step 1: Run linter**

```bash
npx next lint
```

Fix any lint errors.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Ensure no build errors. Fix any TypeScript or import issues.

- [ ] **Step 3: Full browser QA**

Run `npm run dev` and verify:
- Desktop (1280px+): all sections render correctly, feature tabs auto-rotate, hover effects work
- Tablet (768px): feature tabs stack, brand pillars stack to 1-col, grid adjusts
- Mobile (375px): navbar shows only CTA, hero photos hidden, all text readable
- Scroll: hero photo cascade works smoothly, no jank
- Links: all CTAs go to /contact, footer links work, social links open in new tab

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: lint fixes and final cleanup for dark redesign"
```
