# Live Stat Ticker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded "From 160 people in our beta. 581 meals this month." headline on `makan-web` with live, animated numbers that count up to real Firestore totals when the section scrolls into view.

**Architecture:** A new server component fetches `users` and `meals` collection sizes via Firestore aggregation queries (one read per ~1000 docs each) and passes them as plain primitives to the existing client section, which renders each number through a framer-motion count-up ticker. The homepage is ISR-cached daily so Firestore is queried at most ~2 times per day regardless of traffic.

**Tech Stack:** Next.js 16.2.6 (App Router, server components), React 19, framer-motion 12 (already a dep — no new packages), firebase-admin 13 (already wired), Tailwind 4.

**Security:** `lib/makan-stats.ts` carries `import 'server-only'` — a build-time guard that fails compilation if any client component imports it. No `/api/stats` route is created, so there is no client-reachable endpoint to abuse or rate-limit. Counts are validated as non-negative integers before display.

---

## Design lock-ins (from brainstorming)

- **Behavior:** Count up on scroll. Not continuous live ticking. (At ~20 meals/day a continuous ticker would either sit still or have to fake increments, which violates the "honest" brand value.)
- **What it counts:** All-time totals — never resets. The original "this month" framing would reset to near-zero every 1st; all-time only ever climbs.
- **Freshness:** Daily revalidation (`revalidate = 86400`). Page stays static-fast; Firestore cost trivial.
- **Copy:** Eyebrow stays "From the beta". Headline becomes `{userCount} people in the beta. {mealCount} meals and counting.` with both numbers as count-up tickers.

## Pre-flight check

- [ ] **Step 0a:** Confirm working directory: `pwd` should be `/Users/devonmakepeace/Desktop/Projects/MAKAN/MakanGit/makan-web`.

- [ ] **Step 0b:** Confirm the post-security-hardening baseline still builds.
  Run: `npm run build 2>&1 | tail -5`
  Expected: `✓ Compiled successfully` and 13 routes generated.

---

## Task 1 — Data layer: `lib/makan-stats.ts`

**Files:**
- Create: `lib/makan-stats.ts`

- [ ] **Step 1.1: Create the file** with this exact content:

```ts
import 'server-only'
import { getDb } from '@/lib/firebase-admin'

export interface MakanStats {
  userCount: number
  mealCount: number
}

// Shown if Firestore is unreachable at render time. Set to the prior
// hardcoded copy values so a fallback render is never "worse than today".
// Update if the live numbers grow far above this floor.
export const FALLBACK_STATS: MakanStats = {
  userCount: 160,
  mealCount: 581,
}

/**
 * Returns live total user and meal counts via Firestore aggregation queries
 * (.count() — billed at ~1 read per 1000 docs, vs 1 per doc for a fetch).
 *
 * Server-only: the `server-only` import causes build failure if any client
 * component imports this file, so the Firebase Admin credential cannot leak
 * into a browser bundle.
 *
 * On any error / missing env / unreachable Firebase, returns FALLBACK_STATS.
 * The homepage cannot break on this path.
 */
export async function getMakanStats(): Promise<MakanStats> {
  try {
    const db = getDb()
    if (!db) return FALLBACK_STATS

    const [usersSnap, mealsSnap] = await Promise.all([
      db.collection('users').count().get(),
      db.collection('meals').count().get(),
    ])

    return {
      userCount: clamp(usersSnap.data().count, FALLBACK_STATS.userCount),
      mealCount: clamp(mealsSnap.data().count, FALLBACK_STATS.mealCount),
    }
  } catch {
    console.error('makan-stats: failed to fetch counts; using fallback.')
    return FALLBACK_STATS
  }
}

/** Coerce to a non-negative integer or fall back to a safe floor. */
function clamp(value: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return fallback
  }
  return Math.floor(value)
}
```

- [ ] **Step 1.2: Verify the build still compiles** (the file is created but nothing imports it yet — should still pass).
  Run: `npm run build 2>&1 | tail -5`
  Expected: `✓ Compiled successfully`.

- [ ] **Step 1.3: Commit.**

```bash
git add lib/makan-stats.ts
git commit -m "feat(web): add makan-stats lib for live Firestore aggregation counts

Server-only data accessor returning {userCount, mealCount} via .count()
aggregation queries. Validates counts to non-negative integers and falls
back to known-good constants if Firebase is unreachable.

Refs ticker design 2026-05-21."
```

---

## Task 2 — Count-up component: `components/StatTicker.tsx`

**Files:**
- Create: `components/StatTicker.tsx`

- [ ] **Step 2.1: Create the file** with this exact content:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion'

interface StatTickerProps {
  /** Final numeric value to display. */
  value: number
  /** When true, the count-up animation runs (parent controls via useInView). */
  inView: boolean
  /** Animation duration in seconds. Default 1.4. */
  duration?: number
}

/**
 * Animates a number from 0 up to `value` once when `inView` first becomes true.
 * Respects `prefers-reduced-motion` — users with reduced motion see the final
 * value instantly. Screen readers get the final formatted number via aria-label,
 * not intermediate animation frames.
 */
export default function StatTicker({ value, inView, duration = 1.4 }: StatTickerProps) {
  const prefersReducedMotion = useReducedMotion()
  const count = useMotionValue(0)
  const rounded = useTransform(count, (latest) => Math.round(latest).toLocaleString())
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!inView || hasAnimated.current) return
    hasAnimated.current = true

    if (prefersReducedMotion) {
      count.set(value)
      return
    }

    const controls = animate(count, value, { duration, ease: 'easeOut' })
    return () => controls.stop()
  }, [inView, value, duration, prefersReducedMotion, count])

  return <motion.span aria-label={value.toLocaleString()}>{rounded}</motion.span>
}
```

- [ ] **Step 2.2: Verify build.**
  Run: `npm run build 2>&1 | tail -5`
  Expected: `✓ Compiled successfully`.

- [ ] **Step 2.3: Commit.**

```bash
git add components/StatTicker.tsx
git commit -m "feat(web): add StatTicker count-up component

Client component that animates a number from 0 to its final value when a
parent-controlled inView prop flips true. Uses framer-motion (already a
dep), respects prefers-reduced-motion, and exposes the final value to
screen readers via aria-label."
```

---

## Task 3 — Server wrapper: `components/LatestOnMakanSection.tsx`

**Files:**
- Create: `components/LatestOnMakanSection.tsx`

- [ ] **Step 3.1: Create the file** with this exact content:

```tsx
import { getMakanStats } from '@/lib/makan-stats'
import LatestOnMakan from './LatestOnMakan'

/**
 * Server component: fetches live stats from Firestore (or returns fallback
 * if unreachable) and passes them as plain primitives to the client section.
 * The homepage's `revalidate` controls how often Firestore is actually hit.
 */
export default async function LatestOnMakanSection() {
  const stats = await getMakanStats()
  return <LatestOnMakan userCount={stats.userCount} mealCount={stats.mealCount} />
}
```

- [ ] **Step 3.2: Do NOT build yet.** `LatestOnMakan` doesn't accept those props until Task 4. Building here will fail with `Type '{ userCount: number; mealCount: number; }' is not assignable to type 'IntrinsicAttributes'` — expected. Task 4 resolves it.

- [ ] **Step 3.3: Do NOT commit yet.** The repo must stay in a buildable state at every commit boundary; Tasks 3 + 4 commit together at the end of Task 4.

---

## Task 4 — Wire ticker into `LatestOnMakan.tsx`

**Files:**
- Modify: `components/LatestOnMakan.tsx`

- [ ] **Step 4.1: Update imports.** Add `StatTicker`.

Old (lines 1-5):
```tsx
'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
```

New:
```tsx
'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import StatTicker from './StatTicker'
```

- [ ] **Step 4.2: Add props interface and update the function signature.**

Old (around line 16):
```tsx
export default function LatestOnMakan() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
```

New:
```tsx
interface LatestOnMakanProps {
  userCount: number
  mealCount: number
}

export default function LatestOnMakan({ userCount, mealCount }: LatestOnMakanProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
```

- [ ] **Step 4.3: Replace the hardcoded headline with the live tickers.**

Old (around lines 32-34):
```tsx
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl lg:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            From 160 people in our beta. 581 meals this month.
          </h2>
```

New:
```tsx
          <h2 className="mt-3 text-2xl font-bold text-white sm:text-3xl lg:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            <StatTicker value={userCount} inView={inView} /> people in the beta.{' '}
            <StatTicker value={mealCount} inView={inView} /> meals and counting.
          </h2>
```

- [ ] **Step 4.4: Verify build.**
  Run: `npm run build 2>&1 | tail -10`
  Expected: `✓ Compiled successfully` with `/` still in the route table.

- [ ] **Step 4.5: Commit Tasks 3 + 4 together.**

```bash
git add components/LatestOnMakanSection.tsx components/LatestOnMakan.tsx
git commit -m "feat(web): wire live stat ticker into LatestOnMakan section

New LatestOnMakanSection (server component) fetches counts via
getMakanStats and passes them to the client LatestOnMakan, which now
renders both numbers through StatTicker. Headline becomes:
'{N} people in the beta. {M} meals and counting.'"
```

---

## Task 5 — Enable ISR on the homepage: `app/page.tsx`

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 5.1: Swap the import.**

Old (line 4):
```tsx
import LatestOnMakan from "@/components/LatestOnMakan"
```

New:
```tsx
import LatestOnMakanSection from "@/components/LatestOnMakanSection"
```

- [ ] **Step 5.2: Swap the JSX usage.**

Old (around line 15):
```tsx
      <LatestOnMakan />
```

New:
```tsx
      <LatestOnMakanSection />
```

- [ ] **Step 5.3: Add the ISR `revalidate` export.** Insert this block after the import lines, before `export default function Home`:

```tsx
// Regenerate the static homepage once per day — refreshes the live stats
// without hammering Firestore on every visit.
export const revalidate = 86400
```

- [ ] **Step 5.4: Verify build.**
  Run: `npm run build 2>&1 | tail -10`
  Expected: `✓ Compiled successfully`. In the route table, `/` should now be marked **ISR** (or show the revalidation interval) instead of `○ Static`.

- [ ] **Step 5.5: Commit.**

```bash
git add app/page.tsx
git commit -m "feat(web): enable daily ISR for the live stats homepage

Swaps LatestOnMakan for the new LatestOnMakanSection server wrapper and
adds revalidate=86400. Firestore is hit at most once a day regardless of
traffic; the page stays static-fast and is regenerated in the background."
```

---

## Task 6 — Final verification

- [ ] **Step 6.1: Build clean.**
  Run: `npm run build 2>&1 | tail -25`
  Expected: ✓ Compiled successfully; route table shows `/` as ISR; no new warnings introduced by Tasks 1–5.

- [ ] **Step 6.2: Lint clean (no new issues from this change).**
  Run: `npm run lint 2>&1 | tail -15`
  Expected: only pre-existing issues (`components/Navbar.tsx`, `tasks/sendWaitlistEmail.js`); no new errors from any file Tasks 1–5 touched.

- [ ] **Step 6.3: Local dev visual check.**
  Run (in a separate terminal): `npm run dev`
  Open: http://localhost:3000
  Scroll to the "From the beta" section.
  Expected behavior:
  - Both numbers start at `0` when the section first enters view.
  - They count up smoothly (~1.4 s ease-out) to the live values from Firestore.
  - They settle and stop. No re-animation on subsequent scrolls.
  - With OS "Reduce Motion" enabled (System Settings → Accessibility → Display → Reduce motion), the numbers appear at their final values instantly.
  - The 6 curated meal photos below the headline render unchanged.

- [ ] **Step 6.4: Confirm the `server-only` guard works.** Create a throwaway client component that imports the lib; the build must fail.

```bash
cat > components/_test-server-only.tsx <<'EOF'
'use client'
import { getMakanStats } from '@/lib/makan-stats'
export default function Test() { return null }
EOF
npm run build 2>&1 | tail -10
```

Expected: build **fails** with an error mentioning `server-only`. Then clean up:

```bash
rm components/_test-server-only.tsx
```

- [ ] **Step 6.5: Optional — verify the fallback path.** Temporarily blank one of `FIREBASE_PROJECT_ID`/`FIREBASE_CLIENT_EMAIL`/`FIREBASE_PRIVATE_KEY` in `.env.local`, run `npm run dev`, scroll to the section. Numbers should show `160` and `581` (the fallback). Restore the env var afterwards.

---

## What this plan does NOT change

- The 6 curated meal photos in `LatestOnMakan.tsx` — unchanged.
- Any other section of the homepage — unchanged.
- The `meals` / `users` Firestore collection schemas — read-only access via `.count()`, no writes.
- Zero new dependencies — framer-motion and firebase-admin are already installed.

## Rollback

Each task is its own commit. If anything misbehaves in production, `git revert <commit>` of the Task 5 commit restores the previous static homepage in seconds. Tasks 1–4 are forward-compatible — they introduce code that nothing yet imports until Task 5 wires it in.
