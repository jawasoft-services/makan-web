'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const EASE_OUT = [0.23, 1, 0.32, 1] as const

// The authenticity engine — verified COVID/Snapchat origin, manifesto-voiced.
// Moved up from the page footer where almost nobody reached it.
export default function FounderStory() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-brand-card px-5 sm:px-8 py-20 sm:py-32">
      <div ref={ref} className="mx-auto max-w-2xl">
        <motion.p
          className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange"
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          Where it came from
        </motion.p>

        <motion.blockquote
          className="mt-8 text-xl font-medium leading-[1.45] text-brand-ink sm:text-2xl"
          style={{ letterSpacing: '-0.01em' }}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.05, ease: EASE_OUT }}
        >
          Makan started during COVID. I couldn&apos;t see my friends, so a few
          of us started a Snapchat story to stay in touch. It grew to over 300
          people without us trying.{' '}
          <span className="text-brand-orange">
            When you can&apos;t share a table, the photo of the meal becomes the
            table.
          </span>
        </motion.blockquote>

        <motion.p
          className="mt-6 text-base leading-relaxed text-brand-muted sm:text-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT }}
        >
          Six years and thousands of meals later, we built an app around the
          habit.
        </motion.p>

        <motion.p
          className="mt-8 text-sm text-brand-muted"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.35, ease: EASE_OUT }}
        >
          — Devon Makepeace, Founder
        </motion.p>
      </div>
    </section>
  )
}
