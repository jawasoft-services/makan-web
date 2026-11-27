import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import SiteSchema from '@/components/SiteSchema'
import StandingsTable from '@/components/standings/StandingsTable'
import { getStandingsPhotos } from '@/components/standings/standings-photos'
import { em } from '@/components/site/text'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import { CITY_FLOOR, getCityStanding, getEatStandings, getEatStandingsSnapshot } from '@/lib/eat-standings'
import { safeJsonLd } from '@/lib/safe-json-ld'
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
  const { standings, checkedAt } = await getEatStandingsSnapshot()
  const city = standings.cities.find((candidate) => candidate.slug === slug)
  if (!city) notFound()
  const t = await getTranslations('Standings')
  const dayMonthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const computedAt = standings.computedAt ? new Date(standings.computedAt) : new Date()
  const prefix = locale === 'id' ? '/id' : ''
  const pageUrl = `${SITE_URL}${prefix}/standings/${city.slug}`
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

  const dir = await getTranslations('PlaceDirectory')
  const photos = await getStandingsPhotos(city.rows.map(r => r.placeId))
  const labels = {
    find: t('find'),
    shownOne: dir('results', { count: 1 }),
    shownOther: dir('results', { count: 2 }),
    colRank: t('colRank'),
    restaurant: t('colRestaurant'),
    rate: t('colRate'),
    since: t('colSince'),
    eats: t('colEats'),
    yeets: t('colYeets'),
    none: dir('empty'),
    clear: dir('clear'),
  }

  // RM20773: the approved prototype's city page (strategy/website-direction-2026-11-25/site/standings-london.html).
  return (
    <main id="main-content" className="sx">
      <SiteSchema locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />

      <section className="ch st-hero" aria-label={t('cityTitle', { city: city.city })}>
        <div className="wrap">
          <h1 className="big xl" data-rise="">{t.rich('cityTitleRich', { city: city.city, em })}</h1>
          <p className="lede" data-rise="" style={{ '--d': '.12s', maxWidth: '46ch' } as React.CSSProperties}>{t('cityIntro', { city: city.city, floor: CITY_FLOOR })}</p>
        </div>
      </section>

      <section className="ch tight st-board" id="standings" aria-label={t('cityBoardLabel', { city: city.city })}>
        <div className="wrap">
          <StandingsTable rows={city.rows} locale={locale} labels={labels} showWhere caption={t('cityTitle', { city: city.city })} photos={photos.thumbs} />
          <p className="small fresh" data-rise="">
            <time dateTime={computedAt.toISOString()}>{t('scoresChangedOn', { date: dayMonthYear.format(computedAt) })}</time>{' '}
            {checkedAt ? <time dateTime={checkedAt}>{t('checkedOn', { date: dayMonthYear.format(new Date(checkedAt)) })}</time> : t('checkUnavailable')}
          </p>
        </div>
      </section>

      <section className="ch peach st-how" aria-label={t('howTitle')}>
        <div className="wrap split">
          <h2 className="big" data-rise="">{t('howTitle')}</h2>
          <div>
            <ul className="steps">
              {(['how1', 'how2', 'cityHow', 'how4'] as const).map(k => <li key={k} data-read="" {...(k === 'cityHow' ? { 'data-stop': '' } : {})}>{t(k, { floor: CITY_FLOOR, city: city.city })}</li>)}
            </ul>
            <div className="btns">
              <Link className="btn ink" href={localizePath(locale, '/standings')}>{t('allStandings')}</Link>
              <Link className="btn line" href={localizePath(locale, '/partner')}>{t('partnerCta')}</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
