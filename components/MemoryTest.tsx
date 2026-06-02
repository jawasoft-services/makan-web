'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'

// Strong ease-out (ui-makan EASE_OUT) — entries feel responsive.
const EASE_OUT = [0.23, 1, 0.32, 1] as const

// The "ache" — cold-acquisition loss framing, kept warm not morbid.
// A gentle friend proving a point: you can't remember, and that's fine,
// because that's the whole reason Makan exists. Lands on relief, fast.
const QUESTIONS = [
  'What did you eat last Saturday?',
  'Three Tuesdays ago — lunch. Anything?',
  'The best thing you ate this month. Where were you?',
]

export default function MemoryTest() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const [step, setStep] = useState(0)

  const done = step >= QUESTIONS.length
  const answered = QUESTIONS.slice(0, step)
  const current = done ? null : QUESTIONS[step]

  // Button copy escalates gently — the user keeps admitting they forget.
  const buttonCopy = ['I forget', 'Still nothing', 'No idea, honestly']

  return (
    <section
      ref={ref}
      className="relative bg-brand-bg px-5 sm:px-8 py-24 sm:py-40"
    >
      <div className="mx-auto max-w-2xl">
        <motion.p
          className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          Try this
        </motion.p>

        {/* Answered questions stack up, struck through — visual proof of forgetting */}
        <div className="mt-8 space-y-4 sm:space-y-5">
          <AnimatePresence initial={false}>
            {answered.map((q) => (
              <motion.p
                key={q}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0.35 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="text-xl font-semibold leading-snug text-brand-muted line-through decoration-brand-orange/50 decoration-2 sm:text-2xl"
              >
                {q}
              </motion.p>
            ))}
          </AnimatePresence>

          {/* Current question — the live one */}
          <AnimatePresence mode="wait">
            {current && (
              <motion.h2
                key={current}
                initial={{ opacity: 0, y: 14 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: EASE_OUT }}
                className="text-2xl font-bold leading-[1.15] text-white sm:text-4xl"
                style={{ letterSpacing: '-0.02em' }}
              >
                {current}
              </motion.h2>
            )}
          </AnimatePresence>
        </div>

        {/* Advance button — press-shrink 0.97 per Makan motion rules */}
        {!done && (
          <motion.button
            onClick={() => setStep((s) => s + 1)}
            initial={{ opacity: 0, y: 12 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15, ease: EASE_OUT }}
            whileTap={{ scale: 0.97 }}
            className="mt-10 rounded-full border border-brand-border px-6 py-3 text-sm font-medium text-brand-muted transition-colors hover:border-brand-orange/40 hover:text-white"
          >
            {buttonCopy[step] ?? 'I forget'}
          </motion.button>
        )}

        {/* The payoff — warm relief, not guilt. The turn into Makan. */}
        <AnimatePresence>
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT }}
              className="mt-10"
            >
              <p className="text-xl leading-relaxed text-brand-muted sm:text-2xl">
                Don&apos;t worry. Nobody remembers.
              </p>
              <p
                className="mt-4 text-2xl font-bold leading-[1.2] text-white sm:text-4xl"
                style={{ letterSpacing: '-0.02em' }}
              >
                That&apos;s the whole reason we{' '}
                <span className="text-brand-orange">built Makan.</span>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
