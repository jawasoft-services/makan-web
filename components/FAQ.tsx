'use client'

import { useState, useRef } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'

const faqs = [
  {
    q: 'What is Makan?',
    a: 'Makan is a food journal you share with friends. Snap what you eat, when you eat it. Share publicly, with friends, or keep it private. No reviews, no ratings — just real meals from real life.',
  },
  {
    q: 'Who can see my meals?',
    a: 'You decide. Every post can be set to Public (anyone on Makan), Friends (mutuals only), or Private (just you). The default is up to you.',
  },
  {
    q: 'What is the difference between the Public Feed and Friends Feed?',
    a: 'The Public Feed shows meals from anyone on Makan who posts publicly. The Friends Feed only shows meals from people you\u2019ve mutually added — no strangers, just your circle.',
  },
  {
    q: 'Is it meant to look \u201Cperfect\u201D?',
    a: 'No. Makan is for what you actually eat, not what looks best. Microwave meals, desk lunches, and burnt toast all belong here. The point is capturing the real, not performing for an audience.',
  },
  {
    q: 'What does \u201Creal-time\u201D mean on Makan?',
    a: 'When you post on Makan, you\u2019re posting as it happens. No scrolling back through old photos. The app is designed for in-the-moment sharing, which is what makes it feel honest.',
  },
  {
    q: 'Is there calorie counting?',
    a: 'No. Makan is not a diet app or a nutrition tracker. It\u2019s a place to document and share what you eat with the people you care about. That\u2019s it.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="faq" ref={ref} className="bg-brand-bg py-16 sm:py-28 px-5 sm:px-8 lg:py-36">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 sm:gap-12 md:grid-cols-12">
          {/* Left: heading */}
          <motion.div
            className="md:col-span-4"
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-xl font-semibold text-white sm:text-2xl">
              Questions?
            </h2>
            <p className="mt-2 text-sm text-brand-muted">
              The stuff people ask us.
            </p>
          </motion.div>

          {/* Right: accordion */}
          <div className="md:col-span-8">
            <div className="divide-y divide-brand-border">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
                >
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="flex w-full items-center gap-4 py-6 text-left transition-colors"
                  >
                    <span className="flex-1 text-base font-semibold text-white lg:text-lg">
                      {faq.q}
                    </span>
                    <span
                      className={`shrink-0 text-brand-dim transition-transform duration-300 ${
                        open === i ? 'rotate-45' : ''
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <AnimatePresence>
                    {open === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pr-10 text-[15px] leading-relaxed text-brand-muted">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
