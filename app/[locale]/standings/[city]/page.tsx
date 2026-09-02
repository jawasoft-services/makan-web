import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import Footer from '@/components/Footer'
import SiteSchema from '@/components/SiteSchema'
import StandingsTable from '@/components/standings/StandingsTable'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import { CITY_FLOOR, getCityStanding, getEatStandings } from '@/lib/eat-standings'
import { localizePath } from '@/i18n/paths'

// One city, the same rule, a smaller pool: ranked from CITY_FLOOR matchups.
export const revalidate = 3600
export const dynamicParams = true

interface Props {
  params: Promise<{ locale: string; city: string }>
}

export async function generateStaticParams() {
  const standings = await getEatStandings()
  return standings.cities.map((c) => ({ city: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, city: slug } = await params
  const found = await getCityStanding(slug)
  if (!found) return {}
  const t = await getTranslations({ locale, namespace: 'Standings' })
  const { city } = found
  const path = `${locale === 'id' ? '/id' : ''}/standings/${city.slug}`
  return createPageMetadata({
    title: t('cityMetaTitle', { city: city.city }),
    description: t('cityMetaDescription', { city: city.city, country: city.country, floor: CITY_FLOOR }),
    path,
    locale,
    image: `${SITE_URL}${path}/opengraph-image`,
  })
}

export default async function CityStandingsPage({ params }: Props) {
  const { locale, city: slug } = await params
  setRequestLocale(locale)
  const found = await getCityStanding(slug)
  if (!found) notFound()
  const { city, standings } = found
  const t = await getTranslations('Standings')
  const dayMonthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const computedAt = standings.computedAt ? new Date(standings.computedAt) : new Date()
  const prefix = locale === 'id' ? '/id' : ''
  const pageUrl = `${SITE_URL}${prefix}/standings/${city.slug}`
  const labels = {
    rank: t('colRank'),
    restaurant: t('colRestaurant'),
    where: t('colWhere'),
    eats: t('colEats'),
    yeets: t('colYeets'),
    rate: t('colRate'),
    since: t('colSince'),
  }
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': pageUrl,
    name: t('cityMetaTitle', { city: city.city }),
    description: t('cityMetaDescription', { city: city.city, country: city.country, floor: CITY_FLOOR }),
    dateModified: computedAt.toISOString(),
    inLanguage: locale === 'id' ? 'id' : 'en',
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t('eyebrow'), item: `${SITE_URL}${prefix}/standings` },
        { '@type': 'ListItem', position: 2, name: city.city, item: pageUrl },
      ],
    },
    mainEntity: {
      '@type': 'ItemList',
      name: t('cityTitle', { city: city.city }),
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: city.rows.length,
      itemListElement: city.rows.map((row, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE_URL}${prefix}/places/${row.slug}`,
        description: `${row.eats} Eats, ${row.yeets} Yeets, ${row.matchups} matchups`,
        item: {
          '@type': 'Restaurant',
          name: row.name,
          url: `${SITE_URL}${prefix}/places/${row.slug}`,
          address: { '@type': 'PostalAddress', addressLocality: city.city, addressCountry: city.country },
        },
      })),
    },
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <SiteSchema locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main id="main-content" className="mx-auto max-w-3xl px-5 pb-16 pt-24 sm:px-8 sm:pb-24 sm:pt-32">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
          <Link href={localizePath(locale, '/standings')} className="hover:underline">
            {t('eyebrow')}
          </Link>
          <span aria-hidden> · </span>
          {city.country}
        </p>
        <h1 className="mt-4 text-3xl font-bold text-brand-ink sm:text-4xl lg:text-5xl" style={{ letterSpacing: '-0.02em' }}>
          {t('cityTitle', { city: city.city })}
        </h1>
        <p className="mt-6 max-w-[60ch] text-base leading-[1.75] text-brand-muted">
          {t('cityIntro', { city: city.city, floor: CITY_FLOOR })}
        </p>

        <StandingsTable rows={city.rows} locale={locale} labels={labels} showWhere={false} caption={t('cityTitle', { city: city.city })} />
        <p className="mt-4 text-sm leading-[1.6] text-brand-muted">
          <time dateTime={computedAt.toISOString()}>{t('updatedOn', { date: dayMonthYear.format(computedAt) })}</time> {t('updated')}
        </p>

        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl font-bold text-brand-ink sm:text-2xl">{t('howTitle')}</h2>
          <ul className="mt-4 space-y-3">
            {(['how1', 'how2', 'cityHow', 'how4'] as const).map((k) => (
              <li key={k} className="flex items-baseline gap-3 text-base leading-[1.7] text-brand-ink">
                <span aria-hidden className="text-[0.55rem] text-brand-orange">●</span>
                <span>{t(k, { floor: CITY_FLOOR, city: city.city })}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={localizePath(locale, '/standings')}
              className="inline-flex min-h-12 items-center rounded-full border-2 border-brand-ink px-7 text-base font-bold text-brand-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
            >
              {t('allStandings')}
            </Link>
            <Link
              href={localizePath(locale, '/partner')}
              className="inline-flex min-h-12 items-center px-2 text-base font-bold text-brand-ink underline decoration-brand-orange decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink"
            >
              {t('partnerCta')}
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
