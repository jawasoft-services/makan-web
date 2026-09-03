import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/Footer'
import SiteSchema from '@/components/SiteSchema'
import StoreLink from '@/components/home/StoreLink'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import { CITY_FLOOR, EVIDENCE_FLOOR, getEatStandings, type StandingRow } from '@/lib/eat-standings'
import { getDirectoryPlace, getPlaceDirectory, type DirectoryPlace } from '@/lib/place-directory'
import { localizePath } from '@/i18n/paths'

// One restaurant on Makan, as the app's place screen shows it: name,
// address, the public meals saved there, and its standing if it has one.
// The page an owner links to and the page Google finds.
export const revalidate = 3600
export const dynamicParams = true

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

// Prerender the places worth a search result; the rest render on demand.
export async function generateStaticParams() {
  const all = await getPlaceDirectory()
  return all.filter((p) => p.indexable).map((p) => ({ slug: p.slug }))
}

async function load(slug: string): Promise<{ place: DirectoryPlace; row: StandingRow | null; indexable: boolean } | null> {
  const place = await getDirectoryPlace(slug)
  if (!place) return null
  const standings = await getEatStandings()
  const row = standings.all.find((r) => r.placeId === place.placeId) ?? null
  return { place, row, indexable: place.indexable || Boolean(row && row.matchups > 0) }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const found = await load(slug)
  if (!found) return {}
  const { place, row, indexable } = found
  const t = await getTranslations({ locale, namespace: 'Places' })
  const path = `${locale === 'id' ? '/id' : ''}/places/${place.slug}`
  const whereText = place.where ? `${place.where.city}, ${place.where.country}` : t('somewhere')
  const meta = createPageMetadata({
    title: t('metaTitle', { name: place.name }),
    description:
      row && row.rank !== null
        ? t('metaDescriptionRanked', { name: place.name, where: whereText, eats: row.eats, rank: row.rank })
        : t('metaDescriptionMeals', { name: place.name, where: whereText, count: place.meals.length }),
    path,
    locale,
    image: `${SITE_URL}${path}/opengraph-image`,
  })
  // A single meal with no matchups is a real page but not a search result.
  return indexable ? meta : { ...meta, robots: { index: false, follow: true } }
}

export default async function PlacePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const found = await load(slug)
  if (!found) notFound()
  const { place, row } = found
  // A renamed place keeps its hash; send old links to the current slug.
  if (place.slug !== slug) permanentRedirect(localizePath(locale, `/places/${place.slug}`))
  const t = await getTranslations('Places')
  const monthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { month: 'long', year: 'numeric' })
  const dayMonthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const percent = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-GB', { style: 'percent', maximumFractionDigits: 0 })
  const prefix = locale === 'id' ? '/id' : ''
  const pageUrl = `${SITE_URL}${prefix}/places/${place.slug}`
  const standings = await getEatStandings()
  const city = place.where ? standings.cities.find((c) => c.city === place.where?.city) : undefined
  const ranked = Boolean(row && row.rank !== null)
  const mapUrl = place.lat !== null && place.lng !== null
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}&query_place_id=${encodeURIComponent(place.placeId)}`
    : null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': pageUrl,
    name: place.name,
    url: pageUrl,
    ...(place.address ? { address: { '@type': 'PostalAddress', streetAddress: place.address, ...(place.where ? { addressLocality: place.where.city, addressCountry: place.where.country } : {}) } } : {}),
    ...(place.lat !== null && place.lng !== null ? { geo: { '@type': 'GeoCoordinates', latitude: place.lat, longitude: place.lng } } : {}),
    ...(place.cuisine.length ? { servesCuisine: place.cuisine } : {}),
    ...(place.meals.length ? { image: place.meals.slice(0, 6).map((m) => m.src) } : {}),
    ...(mapUrl ? { hasMap: mapUrl } : {}),
    description: ranked && row
      ? `${row.eats} Eats, ${row.yeets} Yeets from ${row.matchups} Eat or Yeet matchups on Makan. ${place.meals.length} public meals saved here.`
      : `${place.meals.length} public meals saved here on Makan.`,
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
          { '@type': 'ListItem', position: city ? 3 : 2, name: place.name, item: pageUrl },
        ],
      },
    },
  }

  const stats = ranked && row
    ? [
        { value: String(row.eats), label: t('eats') },
        { value: String(row.yeets), label: t('yeets') },
        { value: percent.format(row.eatRate), label: t('eatRate') },
        { value: String(row.matchups), label: t('matchups') },
      ]
    : row && row.matchups > 0
      ? [{ value: `${row.matchups}/${EVIDENCE_FLOOR}`, label: t('matchupsToward') }]
      : []

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
          ) : place.where ? (
            <>
              <span aria-hidden> · </span>
              {place.where.city}
            </>
          ) : null}
        </p>
        <h1 className="mt-4 text-3xl font-bold text-brand-ink sm:text-4xl lg:text-5xl" style={{ letterSpacing: '-0.02em' }}>
          {place.name}
        </h1>
        <p className="mt-3 text-base leading-[1.6] text-brand-muted">
          {place.address ? (
            mapUrl ? (
              <a href={mapUrl} rel="noopener" target="_blank" className="underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange">
                {place.address}
              </a>
            ) : (
              place.address
            )
          ) : place.where ? (
            `${place.where.city}, ${place.where.country}`
          ) : (
            t('somewhere')
          )}
          {place.cuisine.length ? ` · ${place.cuisine.join(', ')}` : ''}
          {place.since ? ` · ${t('since', { date: monthYear.format(new Date(place.since)) })}` : ''}
        </p>

        {/* The one line an owner will quote. */}
        {row && (ranked || row.cityRank !== null) ? (
          <p className="mt-8 text-2xl font-bold leading-[1.15] text-brand-ink sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
            {row.cityRank !== null && city
              ? t('rankCity', { rank: row.cityRank, city: city.city })
              : t('rankGlobal', { rank: row.rank ?? 0 })}
            {row.cityRank !== null && city && ranked ? (
              <span className="block text-lg font-semibold text-brand-muted sm:text-xl">{t('rankGlobal', { rank: row.rank ?? 0 })}</span>
            ) : null}
          </p>
        ) : row && row.matchups > 0 ? (
          <p className="mt-8 max-w-[52ch] text-xl font-bold leading-[1.3] text-brand-ink">
            {t('underFloor', { matchups: row.matchups, floor: EVIDENCE_FLOOR, cityFloor: CITY_FLOOR })}
          </p>
        ) : null}

        {stats.length ? (
          <dl className={`mt-8 grid gap-6 ${ranked ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1'}`}>
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-3xl font-bold leading-none tracking-[-0.02em] text-brand-orange tabular-nums">{s.value}</dt>
                <dd className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-brand-muted">{s.label}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {/* Every public meal saved here, newest first, each linking to its own page. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl font-bold text-brand-ink sm:text-2xl">{t('savedTitle')}</h2>
          <p className="mt-3 text-base leading-[1.7] text-brand-muted">{t('savedCount', { count: place.meals.length })}</p>
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {place.meals.map((m) => (
              <li key={m.id}>
                <Link href={`/meal/${m.id}`} className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink">
                  <span className="block overflow-hidden rounded-xl bg-brand-card">
                    <Image
                      src={m.src}
                      alt={m.caption ? `${m.caption}, ${place.name}` : t('mealAlt', { name: place.name })}
                      width={480}
                      height={480}
                      sizes="(min-width: 640px) 220px, 45vw"
                      className="aspect-square h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  </span>
                  <span className="mt-2 block truncate text-sm font-semibold text-brand-ink">{m.caption || m.mealType || t('mealFallback')}</span>
                  <span className="block truncate text-xs text-brand-muted">
                    {m.username ? `@${m.username} · ` : ''}
                    <time dateTime={m.at}>{dayMonthYear.format(new Date(m.at))}</time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
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
            <p className="mt-3 text-base leading-[1.7] text-brand-muted">{t('dinerBody', { name: place.name })}</p>
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
