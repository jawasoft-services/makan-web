import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import Footer from '@/components/Footer'
import { createPageMetadata } from '@/lib/site-metadata'
import { EVIDENCE_FLOOR, getEatStandings } from '@/lib/eat-standings'
import { localizePath } from '@/i18n/paths'

// Live standings, recomputed at most hourly (lib/eat-standings.ts).
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Standings' })
  return createPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: locale === 'id' ? '/id/standings' : '/standings',
    locale,
  })
}

export default async function StandingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Standings')
  const standings = await getEatStandings()
  const monthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { month: 'short', year: 'numeric' })
  const percent = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-GB', { style: 'percent', maximumFractionDigits: 0 })

  return (
    <div className="min-h-screen bg-brand-cream">
      <main id="main-content" className="mx-auto max-w-3xl px-5 pb-16 pt-24 sm:px-8 sm:pb-24 sm:pt-32">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">{t('eyebrow')}</p>
        <h1 className="mt-4 text-3xl font-bold text-brand-ink sm:text-4xl lg:text-5xl" style={{ letterSpacing: '-0.02em' }}>
          {t('title')}
        </h1>
        <p className="mt-6 max-w-[60ch] text-base leading-[1.75] text-brand-muted">{t('intro', { floor: EVIDENCE_FLOOR })}</p>

        {standings.rows.length ? (
          <>
            {/* Wide table scrolls inside its own box; the page never scrolls sideways. */}
            <div className="mt-10 overflow-x-auto rounded-2xl border border-brand-line bg-brand-card">
              <table className="w-full min-w-[34rem] border-collapse text-left">
                <caption className="sr-only">{t('title')}</caption>
                <thead>
                  <tr className="border-b border-brand-line text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                    <th scope="col" className="px-4 py-3 sm:px-5">{t('colRank')}</th>
                    <th scope="col" className="px-4 py-3 sm:px-5">{t('colRestaurant')}</th>
                    <th scope="col" className="px-4 py-3 text-right sm:px-5">{t('colEats')}</th>
                    <th scope="col" className="px-4 py-3 text-right sm:px-5">{t('colYeets')}</th>
                    <th scope="col" className="px-4 py-3 text-right sm:px-5">{t('colRate')}</th>
                    <th scope="col" className="px-4 py-3 text-right sm:px-5">{t('colSince')}</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.rows.map((row, i) => (
                    <tr key={row.placeId} className="border-b border-brand-line last:border-b-0">
                      <td className="px-4 py-4 text-base font-bold tabular-nums text-brand-orange sm:px-5">{i + 1}</td>
                      <th scope="row" className="px-4 py-4 text-base font-semibold text-brand-ink sm:px-5">
                        {row.name}
                      </th>
                      <td className="px-4 py-4 text-right text-base font-bold tabular-nums text-brand-ink sm:px-5">{row.eats}</td>
                      <td className="px-4 py-4 text-right text-base tabular-nums text-brand-muted sm:px-5">{row.yeets}</td>
                      <td className="px-4 py-4 text-right text-base tabular-nums text-brand-ink sm:px-5">{percent.format(row.eatRate)}</td>
                      <td className="px-4 py-4 text-right text-base tabular-nums text-brand-muted sm:px-5">
                        {row.since ? monthYear.format(new Date(row.since)) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-[1.6] text-brand-muted">
              {t('belowFloor', { count: standings.belowFloor, floor: EVIDENCE_FLOOR })} {t('updated')}
            </p>
          </>
        ) : (
          <p className="mt-10 rounded-2xl border border-dashed border-brand-muted/35 bg-white/30 p-6 text-base leading-[1.7] text-brand-ink">
            {t('empty', { floor: EVIDENCE_FLOOR })}
          </p>
        )}

        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl font-bold text-brand-ink sm:text-2xl">{t('howTitle')}</h2>
          <ul className="mt-4 space-y-3">
            {(['how1', 'how2', 'how3', 'how4'] as const).map((k) => (
              <li key={k} className="flex items-baseline gap-3 text-base leading-[1.7] text-brand-ink">
                <span aria-hidden className="text-[0.55rem] text-brand-orange">●</span>
                <span>{t(k, { floor: EVIDENCE_FLOOR })}</span>
              </li>
            ))}
          </ul>
          <Link
            href={localizePath(locale, '/partner')}
            className="mt-8 inline-flex min-h-12 items-center rounded-full border-2 border-brand-ink px-7 text-base font-bold text-brand-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
          >
            {t('partnerCta')}
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
