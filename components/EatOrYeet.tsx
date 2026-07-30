'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import StaticPicture from '@/components/StaticPicture'

const EASE_OUT = [0.23, 1, 0.32, 1] as const
const MEAL_IMAGE_WIDTHS = [480, 900, 1400] as const

type ComparisonCardProps = {
  basePath: string
  title: string
  detail: string
  tint: 'orange' | 'teal'
}

function ComparisonCard({
  basePath,
  title,
  detail,
  tint,
}: ComparisonCardProps) {
  const tintClass =
    tint === 'orange'
      ? 'from-[#1c1206]/5 via-[#1c1206]/20 to-[#1c1206]/95'
      : 'from-[#07171b]/5 via-[#07171b]/20 to-[#07171b]/95'

  return (
    <div className="relative min-h-40 flex-1 overflow-hidden rounded-[1.4rem] sm:min-h-44">
      <StaticPicture
        basePath={basePath}
        widths={MEAL_IMAGE_WIDTHS}
        alt=""
        width={900}
        height={640}
        sizes="(min-width: 1024px) 390px, (min-width: 640px) 440px, calc(100vw - 72px)"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-b ${tintClass}`}
        aria-hidden
      />
      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <p className="text-xl font-bold leading-tight sm:text-2xl">{title}</p>
        <p className="mt-1 text-xs font-medium text-white/80 sm:text-sm">
          {detail}
        </p>
      </div>
    </div>
  )
}

export default function EatOrYeet() {
  const t = useTranslations('Home.EatOrYeet')
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const reducedMotion = useReducedMotion()

  return (
    <section
      id="eat-or-yeet"
      className="scroll-mt-20 overflow-x-clip bg-brand-espresso px-5 py-20 sm:px-8 sm:py-28"
    >
      <div
        ref={ref}
        className="inverse-ground mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20"
      >
        <motion.div
          initial={{ opacity: 0, y: reducedMotion ? 0 : 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: reducedMotion ? 0 : 0.6, ease: EASE_OUT }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
            Eat or Yeet
          </p>
          <h2
            className="mt-4 max-w-xl text-3xl font-bold leading-[1.08] text-white sm:text-5xl"
            style={{ letterSpacing: '-0.025em' }}
          >
            {t('title')}
          </h2>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-brand-espresso-muted sm:text-lg">
            {t('body')}
          </p>
          <p className="mt-6 max-w-xl text-base font-semibold leading-relaxed text-white sm:text-lg">
            {t('closer')}
          </p>
        </motion.div>

        <motion.figure
          aria-label={t('figureLabel')}
          className="relative mx-auto w-full max-w-[29rem]"
          initial={{
            opacity: 0,
            y: reducedMotion ? 0 : 24,
            rotate: reducedMotion ? 0 : 1.2,
          }}
          animate={inView ? { opacity: 1, y: 0, rotate: 0 } : {}}
          transition={{
            duration: reducedMotion ? 0 : 0.7,
            delay: reducedMotion ? 0 : 0.08,
            ease: EASE_OUT,
          }}
        >
          <div
            className="absolute -inset-5 rotate-2 rounded-[3rem] bg-brand-orange"
            aria-hidden
          />
          <div className="relative rounded-[2.5rem] border border-white/10 bg-[#11100f] p-4 shadow-[0_30px_90px_rgba(0,0,0,0.38)] sm:p-5">
            <div className="flex items-center justify-between px-1 pb-4">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-white/8 text-lg text-white/80">
                ×
              </span>
              <span className="text-sm font-bold text-white sm:text-base">
                Eat or Yeet
              </span>
              <span className="text-xs font-semibold text-white/55">{t('skip')}</span>
            </div>

            <div className="mb-4 h-1 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-2/5 rounded-full bg-brand-orange" />
            </div>

            <div className="mb-4 px-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-orange">
                {t('comparison')}
              </p>
              <p className="mt-1 text-lg font-bold leading-tight text-white sm:text-xl">
                {t('question')}
              </p>
            </div>

            <div className="flex min-h-[23rem] flex-col gap-2">
              <ComparisonCard
                basePath="/static-images/v1/blog/kendal-street-kitchen/harissa-prawns"
                title="Harissa prawns"
                detail="Kendal Street Kitchen · Jul 21"
                tint="orange"
              />
              <div className="flex items-center gap-3 px-1 text-[11px] font-semibold text-white/45">
                <span className="h-px flex-1 bg-white/10" />
                {t('or')}
                <span className="h-px flex-1 bg-white/10" />
              </div>
              <ComparisonCard
                basePath="/static-images/v1/blog/kendal-street-kitchen/tiramisu"
                title="Tiramisu"
                detail="Kendal Street Kitchen · Jul 21"
                tint="teal"
              />
            </div>

            <p className="mt-4 text-center text-xs font-semibold text-white/75">
              {t('tap')}
            </p>
          </div>
        </motion.figure>
      </div>
    </section>
  )
}
