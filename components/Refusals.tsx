'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

// The "we won't" commitments — tribe recruitment. Each is a real, public
// promise. Lifted from the manifesto. The AI line is the climax: given its
// own beat below the list because it's the most shareable line we own.
const refusals = [
  {
    no: 'No star ratings.',
    line: "A meal isn't 4.2 out of 5. The only rankings we show are your own.",
  },
  {
    no: 'No algorithm.',
    line: 'Your feed is your friends, in the order their meals happened.',
  },
  {
    no: 'No paid placements.',
    line: "Restaurants can't buy their way in. Ever.",
  },
  {
    no: 'No strangers.',
    line: "Your meals are for your friends, unless you say otherwise.",
  },
]

export default function Refusals() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-brand-bg px-5 sm:px-8 py-20 sm:py-32">
      <div ref={ref} className="mx-auto max-w-4xl">
        <motion.p
          className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          What we won&apos;t do
        </motion.p>

        <motion.h2
          className="mt-4 max-w-2xl text-3xl font-bold leading-[1.1] text-white sm:text-5xl"
          style={{ letterSpacing: '-0.025em' }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.05, ease: EASE_OUT }}
        >
          Some things would
          <br className="hidden sm:inline" /> defeat the point.
        </motion.h2>

        {/* The refusals — stacked, left-aligned, hairline-separated. Not a grid. */}
        <div className="mt-14 sm:mt-20">
          {refusals.map((r, i) => (
            <motion.div
              key={r.no}
              className="flex flex-col gap-1 border-t border-brand-border py-6 sm:flex-row sm:items-baseline sm:gap-10 sm:py-7"
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.08, ease: EASE_OUT }}
            >
              <h3
                className="shrink-0 text-2xl font-bold text-white sm:w-64 sm:text-3xl"
                style={{ letterSpacing: '-0.02em' }}
              >
                {r.no}
              </h3>
              <p className="text-base leading-relaxed text-brand-muted sm:text-lg">
                {r.line}
              </p>
            </motion.div>
          ))}
        </div>

        {/* The climax — AI, given its own oversized beat. */}
        <motion.div
          className="mt-16 sm:mt-24"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE_OUT }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange">
            And one more, that matters more every year
          </p>
          <h2
            className="mt-5 text-4xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            AI has never
            <br />
            tasted food.
          </h2>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-brand-muted sm:text-lg">
            It can&apos;t smell, can&apos;t chew, can&apos;t remember being
            hungry as a kid. So it won&apos;t write your meals, generate your
            recipes, or guess what you ate from a photo. The point of
            remembering what you ate is that you tasted it.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
