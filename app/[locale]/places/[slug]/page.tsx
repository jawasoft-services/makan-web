import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/Footer'
import SiteSchema from '@/components/SiteSchema'
import StoreLink from '@/components/home/StoreLink'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import { CITY_FLOOR, EVIDENCE_FLOOR, getEatStandings, getPlaceStanding } from '@/lib/eat-standings'
import { localizePath } from '@/i18n/paths'

// One restaurant on Makan: its standing, its city rank, what people saved
// there. The page an owner links to.
export const revalidate = 3600
export const dynamicParams = true

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateStaticParams() {
  const standings = await getEatStandings()
  return standings.all.map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const found = await getPlaceStanding(slug)
  if (!found) return {}
  const t = await getTranslations({ locale, namespace: 'Places' })
  const { row } = found
  const path = `${locale === 'id' ? '/id' : ''}/places/${row.slug}`
  const whereText = row.where ? `${row.where.city}, ${row.where.country}` : t('somewhere')
  return createPageMetadata({
    title: t('metaTitle', { name: row.name }),
    description:
      row.rank !== null
        ? t('metaDescriptionRanked', { name: row.name, where: whereText, eats: row.eats, rank: row.rank })
        : t('metaDescription', { name: row.name, where: whereText, matchups: row.matchups }),
    path,
    locale,
    image: `${SITE_URL}${path}/opengraph-image`,
  })
}

export default async function PlacePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const found = await getPlaceStanding(slug)
  if (!found) notFound()
  const { row, standings } = found
  const t = await getTranslations('Places')
  const monthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { month: 'long', year: 'numeric' })
  const percent = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-GB', { style: 'percent', maximumFractionDigits: 0 })
  const prefix = locale === 'id' ? '/id' : ''
  const pageUrl = `${SITE_URL}${prefix}/places/${row.slug}`
  const city = row.where ? standings.cities.find((c) => c.city === row.where?.city) : undefined
  const ranked = row.rank !== null
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': pageUrl,
    name: row.name,
    url: pageUrl,
    ...(row.where ? { address: { '@type': 'PostalAddress', addressLocality: row.where.city, addressCountry: row.where.country } } : {}),
    description: ranked
      ? `${row.eats} Eats, ${row.yeets} Yeets from ${row.matchups} Eat or Yeet matchups on Makan.`
      : `${row.matchups} Eat or Yeet matchups on Makan.`,
    subjectOf: {
      '@type': 'WebPage',
      '@id': pageUrl,
      dateModified: standings.computedAt || new Date().toISOString(),
      inLanguage: locale === 'id' ? 'id' : 'en',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: t('standings'), item: `${SITE_URL}${prefix}/standings` },
          ...(city ? [{ '@type': 'ListItem', position: 2, name: city.city, item: `${SITE_URL}${prefix}/standings/${city.slug}` }] : []),
          { '@type': 'ListItem', position: city ? 3 : 2, name: row.name, item: pageUrl },
        ],
      },
    },
  }

  const stats = ranked
    ? [
        { value: String(row.eats), label: t('eats') },
        { value: String(row.yeets), label: t('yeets') },
        { value: percent.format(row.eatRate), label: t('eatRate') },
        { value: String(row.matchups), label: t('matchups') },
      ]
    : [{ value: `${row.matchups}/${EVIDENCE_FLOOR}`, label: t('matchupsToward') }]

  return (
    <div className="min-h-screen bg-brand-cream">
      <SiteSchema locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main id="main-content" className="mx-auto max-w-3xl px-5 pb-16 pt-24 sm:px-8 sm:pb-24 sm:pt-32">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
          <Link href={localizePath(locale, '/standings')} className="hover:underline">
            {t('standings')}
          </Link>
          {city ? (
            <>
              <span aria-hidden> · </span>
              <Link href={localizePath(locale, `/standings/${city.slug}`)} className="hover:underline">
                {city.city}
              </Link>
            </>
          ) : null}
        </p>
        <h1 className="mt-4 text-3xl font-bold text-brand-ink sm:text-4xl lg:text-5xl" style={{ letterSpacing: '-0.02em' }}>
          {row.name}
        </h1>
        <p className="mt-3 text-base text-brand-muted">
          {row.where ? `${row.where.city}, ${row.where.country}` : t('somewhere')}
          {row.since ? ` · ${t('since', { date: monthYear.format(new Date(row.since)) })}` : ''}
        </p>

        {/* The one line an owner will quote. */}
        {ranked || row.cityRank !== null ? (
          <p className="mt-8 text-2xl font-bold leading-[1.15] text-brand-ink sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
            {row.cityRank !== null && city
              ? t('rankCity', { rank: row.cityRank, city: city.city })
              : t('rankGlobal', { rank: row.rank ?? 0 })}
            {row.cityRank !== null && city && ranked ? (
              <span className="block text-lg font-semibold text-brand-muted sm:text-xl">{t('rankGlobal', { rank: row.rank ?? 0 })}</span>
            ) : null}
          </p>
        ) : (
          <p className="mt-8 max-w-[52ch] text-xl font-bold leading-[1.3] text-brand-ink">
            {t('underFloor', { matchups: row.matchups, floor: EVIDENCE_FLOOR, cityFloor: CITY_FLOOR })}
          </p>
        )}

        <dl className={`mt-8 grid gap-6 ${ranked ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1'}`}>
          {stats.map((s) => (
            <div key={s.label}>
              <dt className="text-3xl font-bold leading-none tracking-[-0.02em] text-brand-orange tabular-nums">{s.value}</dt>
              <dd className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-brand-muted">{s.label}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl font-bold text-brand-ink sm:text-2xl">{t('savedTitle')}</h2>
          <p className="mt-3 text-base leading-[1.7] text-brand-muted">{t('savedCount', { count: row.publicMeals })}</p>
          {row.recentCaptions.length ? (
            <ul className="mt-4 space-y-2">
              {row.recentCaptions.map((c) => (
                <li key={c} className="flex items-baseline gap-3 text-base leading-[1.6] text-brand-ink">
                  <span aria-hidden className="text-[0.55rem] text-brand-orange">●</span>
                  <span>“{c}”</span>
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl font-bold text-brand-ink sm:text-2xl">{t('howTitle')}</h2>
          <ul className="mt-4 space-y-3">
            {(['how1', 'how2', 'how3'] as const).map((k) => (
              <li key={k} className="flex items-baseline gap-3 text-base leading-[1.7] text-brand-ink">
                <span aria-hidden className="text-[0.55rem] text-brand-orange">●</span>
                <span>{t(k, { floor: EVIDENCE_FLOOR })}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-8 border-t border-brand-line pt-10 sm:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-brand-ink">{t('ownerTitle')}</h2>
            <p className="mt-3 text-base leading-[1.7] text-brand-muted">{t('ownerBody')}</p>
            <Link
              href={localizePath(locale, '/partner')}
              className="mt-5 inline-flex min-h-12 items-center rounded-full border-2 border-brand-ink px-7 text-base font-bold text-brand-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
            >
              {t('ownerCta')}
            </Link>
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-ink">{t('dinerTitle')}</h2>
            <p className="mt-3 text-base leading-[1.7] text-brand-muted">{t('dinerBody', { name: row.name })}</p>
            <StoreLink location="place" className="mt-5 inline-block rounded-[10px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink">
              <Image src="/app-store-badge.svg" alt={t('badgeAlt')} width={180} height={60} className="h-12 w-auto" />
            </StoreLink>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
