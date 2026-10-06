'use client'

import { useTranslations } from 'next-intl'
import type { FaqItem } from '@/lib/faq'

export default function FAQ({ items }: { items: FaqItem[] }) {
  const t = useTranslations('Home.Faq')

  return (
    <section id="faq" aria-labelledby="faq-title" className="scroll-mt-[86px] bg-brand-cream px-6 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[12rem_1fr] md:gap-12">
        <h2 id="faq-title" className="text-3xl font-bold leading-tight tracking-[-0.02em] text-brand-ink sm:text-4xl">
          {t('title')}
        </h2>
        <div className="border-t border-brand-line">
          {/* Exclusive accordion with CSS-only height motion, after Vercel's pricing FAQ:
              ::details-content eases between 0 and auto, so the closing and opening
              answers share one duration and curve and the page below holds still. */}
          {items.map(faq => (
            <details key={faq.q} name="makan-faq" className="group border-b border-brand-line details-content:h-0 details-content:overflow-clip open:details-content:h-auto motion-safe:[interpolate-size:allow-keywords] motion-safe:details-content:transition-[height,content-visibility] motion-safe:details-content:transition-discrete motion-safe:details-content:duration-300 motion-safe:details-content:ease-[cubic-bezier(0.23,1,0.32,1)]">
              <summary className="flex min-h-14 cursor-pointer list-none items-center gap-4 py-4 text-base font-semibold leading-snug text-brand-ink transition-colors hover:text-brand-muted focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink sm:text-lg [&::-webkit-details-marker]:hidden">
                <span className="flex-1">{faq.q}</span>
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-brand-orange" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M4 10h12" />
                  <path d="M10 4v12" className="origin-center transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-open:rotate-90 motion-reduce:transition-none" />
                </svg>
              </summary>
              <p className="max-w-[65ch] -translate-y-1 pb-5 pr-9 text-base leading-relaxed text-brand-muted opacity-0 group-open:translate-y-0 group-open:opacity-100 motion-safe:transition-[opacity,translate] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.23,1,0.32,1)] motion-safe:group-open:delay-75">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
