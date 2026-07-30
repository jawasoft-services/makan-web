'use client'

import { useRef } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { motion, useInView } from 'framer-motion'

interface WhyMakanProps {
  mealCount: number
}

export default function WhyMakan({ mealCount }: WhyMakanProps) {
  const t = useTranslations('Home.Why')
  const locale = useLocale()
  const principles = [1, 2, 3].map((number) => ({
    title: t(`principle${number}Title`),
    copy: t(`principle${number}Body`),
  }))
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const formattedMealCount = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-GB').format(mealCount)

  return (
    <section className="bg-brand-espresso px-5 py-20 sm:px-8 sm:py-32">
      <div ref={ref} className="inverse-ground mx-auto max-w-6xl">
        <motion.div
          className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start lg:gap-20"
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65 }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
              {t('eyebrow')}
            </p>
            <h2
              className="mt-4 text-3xl font-bold leading-[1.1] text-white sm:text-5xl"
              style={{ letterSpacing: '-0.025em' }}
            >
              {t('title')}
            </h2>
          </div>

          <div className="space-y-5 text-base leading-relaxed text-brand-espresso-muted sm:text-lg">
            <p>
              {t('body1')}
            </p>
            <p>
              {t('body2', { count: formattedMealCount })}
            </p>
            <p className="font-medium text-white">
              {t('body3')}
            </p>
          </div>
        </motion.div>

        <div className="mt-14 grid overflow-hidden rounded-3xl border border-white/10 sm:mt-20 lg:grid-cols-3">
          {principles.map((principle, index) => (
            <motion.article
              key={principle.title}
              className="border-b border-white/10 p-7 last:border-b-0 sm:p-9 lg:border-b-0 lg:border-r lg:last:border-r-0"
              initial={{ opacity: 0, y: 14 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.45, delay: 0.12 + index * 0.08 }}
            >
              <h3 className="text-xl font-bold text-white">
                {principle.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-brand-espresso-muted sm:text-base">
                {principle.copy}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
