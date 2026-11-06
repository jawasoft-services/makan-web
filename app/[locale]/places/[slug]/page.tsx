import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/Footer'
import styles from '@/components/standings/public-pages.module.css'
import PlaceMaitred from '@/components/PlaceMaitred'
import SiteSchema from '@/components/SiteSchema'
import StoreLink from '@/components/home/StoreLink'
import PlacesMapLoader from '@/components/map/PlacesMapLoader'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import { CITY_FLOOR, EVIDENCE_FLOOR, getEatStandings, type StandingRow } from '@/lib/eat-standings'
import { getDirectoryPlace, getPlaceIndex, type DirectoryPlace } from '@/lib/place-directory'
import { getMaitredAt } from '@/lib/maitred'
import { getPlacePhoto } from '@/lib/place-photo'
import { localizePath } from '@/i18n/paths'
import { thumbUrl } from '@/lib/thumb'
import { safeJsonLd } from '@/lib/safe-json-ld'

/** A public restaurant: original meal photos, Maître d’ notes, standings and directions.
 * Data, visibility gates and SEO remain the same public projections as the app.
 */
export const revalidate = 3600
export const dynamicParams = true

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

// Prerender the places worth a search result; the rest render on demand.
export async function generateStaticParams() {
  const all = await getPlaceIndex()
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
  const placeText = place.where ? `${place.name}, ${place.where.city}, ${place.where.country}` : place.name
  const meta = createPageMetadata({
    title: place.where
      ? t('metaTitleLocated', { name: place.name, city: place.where.city })
      : t('metaTitle', { name: place.name }),
    description:
      row && row.rank !== null
        ? t('metaDescriptionRanked', { place: placeText, count: place.meals.length, eats: row.eats, rank: row.rank })
        : place.meals.length
          ? t('metaDescriptionMeals', { place: placeText, count: place.meals.length })
          : t('metaDescriptionEmpty', { place: placeText }),
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
  // Lead with a real public meal tagged to this venue; keep the source photo as fallback.
  const [googlePhoto, maitred] = await Promise.all([getPlacePhoto(place.placeId), getMaitredAt(place.placeId)])
  const heroMeal = place.meals[0]
  const hero = heroMeal ? { src: heroMeal.src, alt: heroMeal.caption ? `${heroMeal.caption}, ${place.name}` : t('mealAlt', { name: place.name }) } : googlePhoto ? { src: googlePhoto.uri, alt: place.name } : null

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
        { value: percent.format(row.eatRate), label: t('eatRate') },
        { value: String(row.eats), label: t('eats') },
        { value: String(row.yeets), label: t('yeets') },
        { value: String(row.matchups), label: t('matchups') },
      ]
    : row && row.matchups > 0
      ? [{ value: `${row.matchups}/${EVIDENCE_FLOOR}`, label: t('matchupsToward') }]
      : []

  // Meta row: cuisine · meals · since, leaving out what this place lacks.
  const meta = [
    place.cuisine.join(', '),
    place.meals.length ? t('mealsShort', { count: place.meals.length }) : '',
    place.since ? t('since', { date: monthYear.format(new Date(place.since)) }) : '',
  ].filter(Boolean)

  return (
    <div className={styles.page}>
      <SiteSchema locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
      <main id="main-content" className={`${styles.wrap} ${styles.placeMain}`}>
        <header className={styles.placeTitle}>
          <p className={styles.kicker}>
            <Link href={localizePath(locale, '/standings')}>{t('standings')}</Link>
            {city ? <><span aria-hidden> · </span><Link href={localizePath(locale, `/standings/${city.slug}`)}>{city.city}</Link></> : place.where ? <><span aria-hidden> · </span>{place.where.city}</> : null}
          </p>
          <h1>{place.name}</h1>
          {meta.length ? <p className={styles.placeMeta}>{meta.map((part, i) => <span key={part} className="contents">{i ? <span aria-hidden>·</span> : null}<span>{part}</span></span>)}</p> : null}
        </header>

        {hero ? <figure className={styles.placeCover}>
          <Image src={hero.src} alt={hero.alt} fill sizes="(min-width: 1352px) 1240px, (max-width: 700px) calc(100vw - 40px), calc(100vw - 64px)" priority />
          {heroMeal?.username ? <figcaption className={styles.photoCredit}>@{heroMeal.username} · {place.name}</figcaption> : !heroMeal && googlePhoto ? <figcaption className={styles.photoCredit}>
            {googlePhoto.authorUri ? <a href={googlePhoto.authorUri} rel="noopener" target="_blank">{t('photoCredit', { author: googlePhoto.author || 'Google Maps' })}</a> : t('photoCredit', { author: googlePhoto.author || 'Google Maps' })}
          </figcaption> : null}
        </figure> : null}

        <div className={styles.placeDetails}>
          <div>
            {/* Unknown is deliberately omitted; null is a confirmed empty seat. */}
            {maitred !== undefined ? <PlaceMaitred locale={locale} placeName={place.name} held={maitred} faqHref={localizePath(locale, '/#faq')} /> : null}
            {row && (ranked || row.cityRank !== null || row.matchups > 0) ? <section className={styles.standing}>
              <p className={styles.kicker}>{t('standingBand')}</p>
              {ranked || row.cityRank !== null ? <p className={styles.rank}>
                {row.cityRank !== null && city ? t('rankCity', { rank: row.cityRank, city: city.city }) : t('rankGlobal', { rank: row.rank ?? 0 })}
                {row.cityRank !== null && city && ranked ? <span>{t('rankGlobal', { rank: row.rank ?? 0 })}</span> : null}
              </p> : <p className="text-base leading-relaxed">{t('underFloor', { matchups: row.matchups, floor: EVIDENCE_FLOOR, cityFloor: CITY_FLOOR })}</p>}
              {stats.length ? <dl>{stats.map((s) => <div key={s.label}><dt>{s.value}</dt><dd>{s.label}</dd></div>)}</dl> : null}
            </section> : null}
          </div>
          <aside>
            {place.address ? <p className={styles.address}>
              {directionsUrl ? <a href={directionsUrl} rel="noopener" target="_blank">{place.address}<span>{t('directions')} ↗</span></a> : <span>{place.address}</span>}
            </p> : null}
            {place.claimed ? null : <Link href={localizePath(locale, `/claim/${place.slug}`)} className={styles.textLink}>{t('claimRow')}</Link>}
            {hasGeo ? <PlacesMapLoader className={styles.placeMap} label={t('mapLabel', { name: place.name })} zoom={16} markers={[{ slug: place.slug, name: place.name, lat: place.lat as number, lng: place.lng as number, href: pageUrl }]} /> : null}
          </aside>
        </div>

        <section className={styles.meals}>
          <div className={styles.sectionHeading}><h2>{t('recentMeals')}</h2><span>{t('savedCount', { count: place.meals.length })}</span></div>
          <ul className={styles.mealGrid}>
            {place.meals.map((m) => <li key={m.id}>
              <Link href={`/meal/${m.id}`} className={styles.mealCard}>
                <Image src={m.thumb || thumbUrl(m.src, 480)} alt={m.caption ? `${m.caption}, ${place.name}` : t('mealAlt', { name: place.name })} width={480} height={480} sizes="(min-width: 1352px) 398px, (min-width: 701px) 31vw, calc(100vw - 40px)" loading="lazy" />
                <span><span>{m.caption || m.mealType || t('mealFallback')}</span><span>{m.username ? `@${m.username} · ` : ''}<time dateTime={m.at}>{dayMonthYear.format(new Date(m.at))}</time></span></span>
              </Link>
            </li>)}
          </ul>
        </section>

        <section className={styles.method}>
          <h2>{t('howTitle')}</h2>
          <ul>{(['how1', 'how2', 'how3'] as const).map((k) => <li key={k}>{t(k, { floor: EVIDENCE_FLOOR })}</li>)}</ul>
        </section>
        <section className={styles.owner}>
          <h2>{t('ownerTitle')}</h2><p>{t('ownerBody')}</p>
          <Link href={localizePath(locale, '/partner')} className={styles.secondary}>{t('ownerCta')}</Link>
        </section>
        <div className={styles.postMeal}>
          <StoreLink location="place" className={styles.primary}><span aria-hidden className="text-xl leading-none">+</span>{t('postMeal', { name: place.name })}</StoreLink>
        </div>
      </main>
      <Footer />
    </div>
  )
}
