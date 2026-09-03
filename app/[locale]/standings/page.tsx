import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import Footer from '@/components/Footer'
import SiteSchema from '@/components/SiteSchema'
import StandingsTable from '@/components/standings/StandingsTable'
import PlacesMapLoader from '@/components/map/PlacesMapLoader'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import { CITY_FLOOR, EVIDENCE_FLOOR, getEatStandings } from '@/lib/eat-standings'
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
    image: `${SITE_URL}${locale === 'id' ? '/id' : ''}/standings/opengraph-image`,
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
  const dayMonthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const computedAt = standings.computedAt ? new Date(standings.computedAt) : new Date()
  const pageUrl = `${SITE_URL}${locale === 'id' ? '/id' : ''}/standings`
  const labels = {
    rank: t('colRank'),
    restaurant: t('colRestaurant'),
    where: t('colWhere'),
    eats: t('colEats'),
    yeets: t('colYeets'),
    rate: t('colRate'),
    since: t('colSince'),
  }
  // The list as a machine reads it: ranked restaurants with where they are.
  // Eats are given as the ListItem description rather than an invented
  // rating property, so nothing here is misread as a star score.
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': pageUrl,
    name: t('metaTitle'),
    description: t('metaDescription'),
    dateModified: computedAt.toISOString(),
    inLanguage: locale === 'id' ? 'id' : 'en',
    mainEntity: {
      '@type': 'ItemList',
      name: t('title'),
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: standings.rows.length,
      itemListElement: standings.rows.map((row, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}${locale === 'id' ? '/id' : ''}/places/${row.slug}`,
        description: `${row.eats} Eats, ${row.yeets} Yeets, ${row.matchups} matchups`,
        item: {
          '@type': 'Restaurant',
          name: row.name,
          url: `${SITE_URL}${locale === 'id' ? '/id' : ''}/places/${row.slug}`,
          ...(row.where
            ? { address: { '@type': 'PostalAddress', addressLocality: row.where.city, addressCountry: row.where.country } }
            : {}),
        },
      })),
    },
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <SiteSchema locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main id="main-content" className="mx-auto max-w-3xl px-5 pb-16 pt-24 sm:px-8 sm:pb-24 sm:pt-32">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">{t('eyebrow')}</p>
        <h1 className="mt-4 text-3xl font-bold text-brand-ink sm:text-4xl lg:text-5xl" style={{ letterSpacing: '-0.02em' }}>
          {t('title')}
        </h1>
        <p className="mt-6 max-w-[60ch] text-base leading-[1.75] text-brand-muted">
          {t('intro', { floor: EVIDENCE_FLOOR })}
          {standings.countries > 1 ? ' ' + t('countries', { count: standings.countries }) : ''}
        </p>

        {standings.rows.length ? (
          <>
            <StandingsTable rows={standings.rows} locale={locale} labels={labels} caption={t('title')} />
            <p className="mt-4 text-sm leading-[1.6] text-brand-muted">
              {t('belowFloor', { count: standings.belowFloor, floor: EVIDENCE_FLOOR })}{' '}
              <time dateTime={computedAt.toISOString()}>{t('updatedOn', { date: dayMonthYear.format(computedAt) })}</time> {t('updated')}
            </p>
          </>
        ) : (
          <p className="mt-10 rounded-2xl border border-dashed border-brand-muted/35 bg-white/30 p-6 text-base leading-[1.7] text-brand-ink">
            {t('empty', { floor: EVIDENCE_FLOOR })}
          </p>
        )}

        {standings.rows.some((r) => r.lat !== null && r.lng !== null) ? (
          <section className="mt-12 border-t border-brand-line pt-10">
            <h2 className="text-xl font-bold text-brand-ink sm:text-2xl">{t('mapTitle')}</h2>
            <p className="mt-3 max-w-[60ch] text-base leading-[1.7] text-brand-muted">{t('mapBody')}</p>
            <PlacesMapLoader
              className="mt-6 h-[22rem] sm:h-[26rem]"
              label={t('mapLabel')}
              markers={standings.rows
                .filter((r) => r.lat !== null && r.lng !== null)
                .map((r, i) => ({
                  slug: r.slug,
                  name: r.name,
                  lat: r.lat as number,
                  lng: r.lng as number,
                  line: `#${i + 1} · ${r.eats} ${t('colEats')}`,
                  href: localizePath(locale, `/places/${r.slug}`),
                }))}
            />
          </section>
        ) : null}

        {standings.cities.length ? (
          <section className="mt-12 border-t border-brand-line pt-10">
            <h2 className="text-xl font-bold text-brand-ink sm:text-2xl">{t('byCityTitle')}</h2>
            <p className="mt-3 max-w-[60ch] text-base leading-[1.7] text-brand-muted">{t('byCityBody', { floor: CITY_FLOOR })}</p>
            <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {standings.cities.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={localizePath(locale, `/standings/${c.slug}`)}
                    className="flex items-baseline justify-between gap-4 rounded-xl border border-brand-line bg-brand-card px-5 py-4 text-base text-brand-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{c.city}</span>
                      <span className="block text-sm text-brand-muted">{c.country}</span>
                    </span>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-brand-muted">
                      {t('cityRows', { count: c.rows.length })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

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
