'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { motion, useInView } from 'framer-motion'

export default function ForYou() {
  const t = useTranslations('Home.ForYou')
  const signals = [1, 2, 3].map((number) => ({
    title: t(`signal${number}Title`),
    copy: t(`signal${number}Body`),
  }))
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="bg-brand-cream px-5 py-20 sm:px-8 sm:py-28">
      <div ref={ref} className="mx-auto max-w-6xl">
        <motion.div
          className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end lg:gap-16"
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
              {t('eyebrow')}
            </p>
            <h2
              className="mt-4 text-3xl font-bold leading-[1.1] text-brand-ink sm:text-5xl"
              style={{ letterSpacing: '-0.025em' }}
            >
              {t('title')}
            </h2>
          </div>
          <p className="max-w-xl text-base leading-relaxed text-brand-muted sm:text-lg">
            {t('body')}
          </p>
        </motion.div>

        <div className="mt-12 divide-y divide-brand-line border-y border-brand-line sm:mt-16 lg:grid lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {signals.map((signal, index) => (
            <motion.article
              key={signal.title}
              className="py-7 lg:px-8 lg:py-9 lg:first:pl-0 lg:last:pr-0"
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.1 + index * 0.08 }}
            >
              <h3 className="text-xl font-bold text-brand-ink">
                {signal.title}
              </h3>
              <p className="mt-3 max-w-sm text-base leading-relaxed text-brand-muted">
                {signal.copy}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
