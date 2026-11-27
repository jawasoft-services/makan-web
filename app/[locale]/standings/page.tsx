import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import SiteSchema from '@/components/SiteSchema'
import StandingsTable from '@/components/standings/StandingsTable'
import { getStandingsPhotos } from '@/components/standings/standings-photos'
import { em, SLOT, withSlot } from '@/components/site/text'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import { CITY_FLOOR, EVIDENCE_FLOOR, getEatStandingsSnapshot } from '@/lib/eat-standings'
import { getPlaceIndex } from '@/lib/place-directory'
import { safeJsonLd } from '@/lib/safe-json-ld'
import { localizePath } from '@/i18n/paths'

// Standings snapshot and its actual last-check time (lib/eat-standings.ts).
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

const MOSAIC = 6

/** RM20773: the approved prototype's standings page (strategy/website-direction-2026-11-25/site/standings.html), drawn from the live standings. */
export default async function StandingsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const [t, dir] = await Promise.all([getTranslations('Standings'), getTranslations('PlaceDirectory')])
  const [{ standings, checkedAt }, index] = await Promise.all([getEatStandingsSnapshot(), getPlaceIndex()])
  const photos = await getStandingsPhotos(standings.rows.map(r => r.placeId), index.slice(0, 12).map(p => p.placeId), MOSAIC)
  const dayMonthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const computedAt = standings.computedAt ? new Date(standings.computedAt) : new Date()
  const pageUrl = `${SITE_URL}${locale === 'id' ? '/id' : ''}/standings`
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
  const leader = standings.rows[0]
  const countries = t('countries', { count: standings.countries })
  const countryWords = countries.match(/(\d[\d.,]*)(\s+[^\s.]+)/u)

  return (
    <main id="main-content" className="sx">
      <SiteSchema locale={locale} />
      {checkedAt ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} /> : null}

      <section className="ch st-hero" aria-label={t('title')}>
        <div className="wrap">
          <h1 className="big xl" data-rise="">{t.rich('titleRich', { em })}</h1>
          <p className="lede" data-rise="" style={{ '--d': '.12s' } as React.CSSProperties}>{t('guideLine')}</p>
        </div>
      </section>

      <section className="ch dark st-guide tight" aria-label={t('storySumSub')}>
        <div className="wrap">
          <div className="vs" data-stop="">
            <p className="one" data-rise="">{t('storyOne')}<small>{t('storyOneSub')}</small></p>
            <span className="vsb" data-pop="" style={{ '--d': '.2s' } as React.CSSProperties} aria-hidden="true">{t('storyVs')}</span>
            <figure style={{ margin: 0 }}>
              {photos.mosaic.length ? <div className="mosaic" aria-hidden="true">
                {photos.mosaic.map((m, i) => <Image key={m.id} className="ph" data-pop="" style={{ '--d': `${(0.3 + i * 0.08).toFixed(2)}s` } as React.CSSProperties} src={m.src} alt="" width={240} height={240} loading="lazy" />)}
              </div> : null}
              <figcaption className="all">{t('storyAll')}<small>{t('storyAllSub')}</small></figcaption>
            </figure>
          </div>
          {leader ? <div className="sum">
            <p data-rise="">{t('storySum')}<small>{t('storySumSub')}</small></p>
            <StandingsTable variant="leader" rows={[leader]} locale={locale} labels={labels} caption={t('leader')} photos={photos.thumbs} />
          </div> : null}
        </div>
      </section>

      <section className="ch st-board" id="standings" aria-label={t('boardLabel')}>
        <div className="wrap">
          <p className="lede" data-rise="" style={{ maxWidth: '52ch', marginTop: 0 }}>
            {withSlot(t('intro', { floor: SLOT }), <b data-count={EVIDENCE_FLOOR}>{EVIDENCE_FLOOR}</b>)}
            {standings.countries > 1 ? <> {countryWords ? <>{countries.slice(0, countryWords.index)}<b data-count={standings.countries} data-suffix={countryWords[2]}>{countryWords[0]}</b>{countries.slice((countryWords.index ?? 0) + countryWords[0].length)}</> : countries}</> : null}
          </p>
          {standings.rows.length ? <>
            <StandingsTable rows={standings.rows} locale={locale} labels={labels} caption={t('title')} photos={photos.thumbs} />
            <p className="small fresh" data-rise="">
              {t('belowFloor', { count: standings.belowFloor, floor: EVIDENCE_FLOOR })}{' '}
              <time dateTime={computedAt.toISOString()}>{t('scoresChangedOn', { date: dayMonthYear.format(computedAt) })}</time>{' '}
              {checkedAt ? <time dateTime={checkedAt}>{t('checkedOn', { date: dayMonthYear.format(new Date(checkedAt)) })}</time> : t('checkUnavailable')}
            </p>
          </> : <p className="small fresh">{checkedAt ? t('empty', { floor: EVIDENCE_FLOOR }) : t('checkUnavailable')}</p>}
        </div>
      </section>

      {standings.cities.length ? <section className="ch white st-cities" aria-label={t('byCityTitle')}>
        <div className="wrap split">
          <div>
            <h2 className="big" data-rise="">{t('byCityTitle')}</h2>
            <p className="lede" data-rise="" style={{ '--d': '.12s' } as React.CSSProperties}>{t('byCityBody', { floor: CITY_FLOOR })}</p>
          </div>
          <ul className="rows" aria-label={t('byCityTitle')}>
            {standings.cities.map((c, i) => <li key={c.slug} className="link" data-rise="" style={{ '--d': `${Math.min(i, 9) * 0.05}s` } as React.CSSProperties} {...(i === 0 ? { 'data-stop': '' } : {})}>
              <Link href={localizePath(locale, `/standings/${c.slug}`)}><span><b>{c.city}</b><small>{c.country}</small></span><span className="n">{t('cityRows', { count: c.rows.length })}</span></Link>
            </li>)}
          </ul>
        </div>
      </section> : null}

      <section className="ch peach st-how" aria-label={t('howTitle')}>
        <div className="wrap split">
          <h2 className="big" data-rise="">{t('howTitle')}</h2>
          <div>
            <ul className="steps">
              {(['how1', 'how2', 'how3', 'how4'] as const).map(k => <li key={k} data-read="">{t(k, { floor: EVIDENCE_FLOOR })}</li>)}
            </ul>
            <div className="btns"><Link className="btn line" href={localizePath(locale, '/partner')}>{t('partnerCta')}</Link></div>
          </div>
        </div>
      </section>
    </main>
  )
}
