import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/Footer'
import SiteSchema from '@/components/SiteSchema'
import StoreLink from '@/components/home/StoreLink'
import PlacesMapLoader from '@/components/map/PlacesMapLoader'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import { CITY_FLOOR, EVIDENCE_FLOOR, getEatStandings, type StandingRow } from '@/lib/eat-standings'
import { getDirectoryPlace, getPlaceDirectory, type DirectoryPlace } from '@/lib/place-directory'
import { getPlacePhoto } from '@/lib/place-photo'
import { localizePath } from '@/i18n/paths'
import { thumbUrl } from '@/lib/thumb'

/**
 * One restaurant on Makan, laid out like the app's place screen
 * (app/(modals)/restaurantPage.tsx): a hero photo with the info sheet
 * overlapping it; name; a meta row (cuisine · meals · city); the address as
 * a directions link; then the bands (the app shows YOU and FRIENDS, which
 * need a signed-in user, so the web shows the place's standing instead);
 * "RECENT MEALS" as a two-column grid, each card opening the meal's page;
 * and a sticky "Post a meal here" pill, which on the web is the App Store.
 */
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
  const hasGeo = place.lat !== null && place.lng !== null
  const directionsUrl = hasGeo
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name)}&destination_place_id=${encodeURIComponent(place.placeId)}`
    : null
  // The hero is the place's Google photo, as in the app; a public meal if none.
  const googlePhoto = await getPlacePhoto(place.placeId)
  const hero = googlePhoto ? { src: googlePhoto.uri, alt: place.name } : place.meals[0] ? { src: place.meals[0].src, alt: place.meals[0].caption ? `${place.meals[0].caption}, ${place.name}` : t('mealAlt', { name: place.name }) } : null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': pageUrl,
    name: place.name,
    url: pageUrl,
    ...(place.address ? { address: { '@type': 'PostalAddress', streetAddress: place.address, ...(place.where ? { addressLocality: place.where.city, addressCountry: place.where.country } : {}) } } : {}),
    ...(hasGeo ? { geo: { '@type': 'GeoCoordinates', latitude: place.lat, longitude: place.lng } } : {}),
    ...(place.cuisine.length ? { servesCuisine: place.cuisine } : {}),
    ...(googlePhoto || place.meals.length ? { image: [...(googlePhoto ? [googlePhoto.uri] : []), ...place.meals.slice(0, 6).map((m) => m.src)] } : {}),
    ...(directionsUrl ? { hasMap: directionsUrl } : {}),
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

  const eyebrow = 'text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-brand-orange'

  return (
    <div className="min-h-screen bg-brand-cream">
      <SiteSchema locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <main id="main-content" className="pb-28">
        {/* Hero: the latest public meal, full-bleed, as the app does. */}
        <div className="relative h-[16rem] w-full bg-brand-card pt-20 sm:h-[22rem]">
          {hero ? <Image src={hero.src} alt={hero.alt} fill sizes="100vw" priority className="object-cover" /> : null}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-brand-cream/70" />
          {/* Google requires the photographer's credit beside a Places photo. */}
          {googlePhoto ? (
            <p className="absolute bottom-2 right-3 z-[1] rounded-full bg-brand-ink/60 px-2.5 py-1 text-[0.68rem] text-white/90">
              {googlePhoto.authorUri ? (
                <a href={googlePhoto.authorUri} rel="noopener" target="_blank" className="hover:underline">
                  {t('photoCredit', { author: googlePhoto.author || 'Google Maps' })}
                </a>
              ) : (
                t('photoCredit', { author: googlePhoto.author || 'Google Maps' })
              )}
            </p>
          ) : null}
        </div>

        {/* Info sheet: overlaps the hero with rounded corners and a handle. */}
        <div className="relative z-10 mx-auto -mt-8 max-w-3xl rounded-t-[1.75rem] bg-brand-cream px-5 pt-3 sm:px-8">
          <div aria-hidden className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-brand-line" />
          <p className={eyebrow}>
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
          <h1 className="mt-2 text-3xl font-bold text-brand-ink sm:text-4xl" style={{ letterSpacing: '-0.02em' }}>
            {place.name}
          </h1>

          {/* Meta row: cuisine · meals · since. */}
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-brand-muted">
            {place.cuisine.length ? <span>{place.cuisine.join(', ')}</span> : null}
            {place.cuisine.length ? <span aria-hidden>·</span> : null}
            <span>{t('mealsShort', { count: place.meals.length })}</span>
            {place.since ? (
              <>
                <span aria-hidden>·</span>
                <span>{t('since', { date: monthYear.format(new Date(place.since)) })}</span>
              </>
            ) : null}
          </p>

          {/* Address row, tappable for directions, as in the app. */}
          {place.address ? (
            <p className="mt-4 flex items-start gap-2 text-base leading-[1.5] text-brand-ink">
              <svg aria-hidden viewBox="0 0 24 24" className="mt-1 h-4 w-4 shrink-0 text-brand-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {directionsUrl ? (
                <a href={directionsUrl} rel="noopener" target="_blank" className="underline decoration-brand-orange/50 underline-offset-4 hover:decoration-brand-orange">
                  {place.address}
                  <span className="ml-2 text-sm font-semibold text-brand-orange">{t('directions')} ↗</span>
                </a>
              ) : (
                <span>{place.address}</span>
              )}
            </p>
          ) : null}

          {hasGeo ? (
            <PlacesMapLoader
              className="mt-5 h-[13rem] sm:h-[15rem]"
              label={t('mapLabel', { name: place.name })}
              zoom={16}
              markers={[{ slug: place.slug, name: place.name, lat: place.lat as number, lng: place.lng as number, href: pageUrl }]}
            />
          ) : null}

          {/* The band the app fills with YOU and FRIENDS; on the web, the place's standing. */}
          {row && (ranked || row.cityRank !== null || row.matchups > 0) ? (
            <section className="mt-8 rounded-2xl border border-brand-line bg-brand-card p-5">
              <p className={eyebrow}>{t('standingBand')}</p>
              {ranked || row.cityRank !== null ? (
                <p className="mt-2 text-xl font-bold leading-[1.2] text-brand-ink sm:text-2xl" style={{ letterSpacing: '-0.015em' }}>
                  {row.cityRank !== null && city ? t('rankCity', { rank: row.cityRank, city: city.city }) : t('rankGlobal', { rank: row.rank ?? 0 })}
                  {row.cityRank !== null && city && ranked ? (
                    <span className="block text-base font-semibold text-brand-muted">{t('rankGlobal', { rank: row.rank ?? 0 })}</span>
                  ) : null}
                </p>
              ) : (
                <p className="mt-2 text-base font-semibold leading-[1.4] text-brand-ink">
                  {t('underFloor', { matchups: row.matchups, floor: EVIDENCE_FLOOR, cityFloor: CITY_FLOOR })}
                </p>
              )}
              {stats.length ? (
                <dl className={`mt-4 grid gap-4 ${ranked ? 'grid-cols-4' : 'grid-cols-1'}`}>
                  {stats.map((s) => (
                    <div key={s.label}>
                      <dt className="text-2xl font-bold leading-none tracking-[-0.02em] text-brand-orange tabular-nums">{s.value}</dt>
                      <dd className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-brand-muted">{s.label}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </section>
          ) : null}

          {/* RECENT MEALS, two columns, as the app lays them out. */}
          <section className="mt-10">
            <div className="flex items-center justify-between border-t border-brand-line pt-6">
              <h2 className={eyebrow}>{t('recentMeals')}</h2>
              <span className="text-sm text-brand-muted">{t('savedCount', { count: place.meals.length })}</span>
            </div>
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
              {place.meals.map((m) => (
                <li key={m.id}>
                  <Link href={`/meal/${m.id}`} className="group block overflow-hidden rounded-2xl bg-brand-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink">
                    <Image
                      src={m.thumb || thumbUrl(m.src, 480)}
                      alt={m.caption ? `${m.caption}, ${place.name}` : t('mealAlt', { name: place.name })}
                      width={480}
                      height={480}
                      sizes="(min-width: 640px) 330px, 45vw"
                      className="aspect-square h-auto w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                    <span className="block px-3 py-2.5">
                      <span className="block truncate text-sm font-semibold text-brand-ink">{m.caption || m.mealType || t('mealFallback')}</span>
                      <span className="block truncate text-xs text-brand-muted">
                        {m.username ? `@${m.username} · ` : ''}
                        <time dateTime={m.at}>{dayMonthYear.format(new Date(m.at))}</time>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 border-t border-brand-line pt-8">
            <h2 className={eyebrow}>{t('howTitle')}</h2>
            <ul className="mt-3 space-y-2">
              {(['how1', 'how2', 'how3'] as const).map((k) => (
                <li key={k} className="flex items-baseline gap-3 text-sm leading-[1.6] text-brand-ink">
                  <span aria-hidden className="text-[0.5rem] text-brand-orange">●</span>
                  <span>{t(k, { floor: EVIDENCE_FLOOR })}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="mt-10 rounded-2xl border border-brand-line bg-brand-card p-5">
            <p className={eyebrow}>{t('ownerTitle')}</p>
            <p className="mt-2 text-base leading-[1.6] text-brand-ink">{t('ownerBody')}</p>
            <Link
              href={localizePath(locale, '/partner')}
              className="mt-4 inline-flex min-h-11 items-center rounded-full border-2 border-brand-ink px-6 text-sm font-bold text-brand-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
            >
              {t('ownerCta')}
            </Link>
          </section>
        </div>

        {/* Sticky "Post a meal here", the app's always-reachable verb. On the web it is the app. */}
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-brand-cream to-transparent pb-5 pt-10">
          <div className="mx-auto flex max-w-3xl justify-center px-5">
            <StoreLink
              location="place"
              className="pointer-events-auto inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-orange px-7 text-base font-bold text-white shadow-[0_10px_24px_-10px_rgba(255,153,50,0.7)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
            >
              <span aria-hidden className="text-xl leading-none">+</span>
              {t('postMeal', { name: place.name })}
            </StoreLink>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
