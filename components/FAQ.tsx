'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { motion, useInView } from 'framer-motion'
import type { FaqItem } from '@/lib/faq'

export default function FAQ({ items }: { items: FaqItem[] }) {
  const t = useTranslations('Home.Faq')
  const [open, setOpen] = useState<number | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="faq" ref={ref} className="bg-brand-cream py-20 sm:py-32 px-5 sm:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Editorial heading — left-aligned, bold */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange">
            FAQ
          </p>
          <h2
            className="mt-4 text-3xl font-bold text-brand-ink sm:text-4xl lg:text-5xl"
            style={{ letterSpacing: '-0.02em' }}
          >
            {t('titleLine1')}
            <br />
            {' '}{t('titleLine2')}
          </h2>
        </motion.div>

        {/* FAQ items — editorial numbered list */}
        <div className="mt-12 sm:mt-16">
          {items.map((faq, i) => {
            const isOpen = open === i
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.06 }}
                className="border-t border-brand-line last:border-b"
              >
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center gap-5 py-5 sm:py-6 text-left"
                >
                  {/* Number */}
                  <span className={`shrink-0 text-xs font-medium tabular-nums transition-colors duration-300 ${
                    isOpen ? 'text-brand-orange' : 'text-brand-muted/60 group-hover:text-brand-muted'
                  }`}>
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Question */}
                  <span className={`flex-1 text-[15px] font-semibold transition-colors duration-300 sm:text-base ${
                    isOpen ? 'text-brand-ink' : 'text-brand-muted group-hover:text-brand-ink'
                  }`}>
                    {faq.q}
                  </span>

                  {/* Indicator — orange dash that morphs */}
                  <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                    <span className={`absolute h-[1.5px] w-3 rounded-full transition-all duration-300 ${
                      isOpen ? 'bg-brand-orange' : 'bg-brand-muted/60 group-hover:bg-brand-muted'
                    }`} />
                    <span className={`absolute h-[1.5px] w-3 rounded-full transition-all duration-300 ${
                      isOpen
                        ? 'rotate-0 bg-brand-orange opacity-0'
                        : 'rotate-90 bg-brand-muted/60 group-hover:bg-brand-muted'
                    }`} />
                  </span>
                </button>

                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                  style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <p className="pb-6 pl-[calc(0.75rem+1.25rem+0.25rem)] pr-10 text-sm leading-[1.7] text-brand-muted sm:text-[15px]">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
