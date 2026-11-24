import type { Metadata } from 'next'
import { cache } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Footer from '@/components/Footer'
import SiteSchema from '@/components/SiteSchema'
import { OpenInMakanButton } from '@/components/share/ShareActions'
import styles from '@/components/share/share-pages.module.css'
import { localizePath } from '@/i18n/paths'
import { getEatStandings } from '@/lib/eat-standings'
import { getMaitredStateAt } from '@/lib/maitred'
import { getDirectoryPlace } from '@/lib/place-directory'
import { getPlacePhoto } from '@/lib/place-photo'
import { safeJsonLd } from '@/lib/safe-json-ld'
import { getPlaceShareCard, sharePageUrl, smartAppBanner } from '@/lib/share-page'
import { shareV2PagesOn } from '@/lib/share-v2'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import { thumbUrl } from '@/lib/thumb'

/**
 * RM20616 A12 U3 — the restaurant page a shared place link opens for a friend without the app
 * (boards X2, A7, E3, F3). Served at /places/<slug> by proxy.ts while SHARE_V2_PAGES is on; the
 * page it stands in for (app/[locale]/places/[slug]/page.tsx) is not edited.
 *
 * Nobody is named here (Devon, 24 Nov 2026): the Maître d' reads "A regular" for every visitor,
 * with no photo and no initial, and the meal photos carry no handle. Each photo links to its
 * meal's own page, where the diner is credited. The Eat or Yeet rank only: no Google rating.
 */
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; slug: string }> }

const load = cache(async (slug: string) => {
  const place = await getDirectoryPlace(slug)
  if (!place) return null
  const standings = await getEatStandings()
  const row = standings.all.find((r) => r.placeId === place.placeId) ?? null
  return { place, row, standings, indexable: place.indexable || Boolean(row && row.matchups > 0) }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!shareV2PagesOn()) return {}
  const { locale, slug } = await params
  const found = await load(slug)
  if (!found) return {}
  const { place, indexable } = found
  const t = await getTranslations({ locale, namespace: 'Places' })
  const path = `${locale === 'id' ? '/id' : ''}/places/${place.slug}`
  const publicMealCount = place.publicMealCount ?? place.meals.length
  const placeText = place.where ? `${place.name}, ${place.where.city}, ${place.where.country}` : place.name
  // The stored card when the app's backend has rendered one; otherwise today's per-request card.
  const card = await getPlaceShareCard(place.placeId)
  const meta = createPageMetadata({
    title: place.name,
    description: publicMealCount ? t('metaDescriptionFood', { place: placeText, count: publicMealCount }) : t('metaDescriptionEmpty', { place: placeText }),
    path, locale, image: card ?? `${SITE_URL}${path}/opengraph-image`,
  })
  return { ...meta, itunes: smartAppBanner(`${SITE_URL}${path}`), ...(indexable ? {} : { robots: { index: false, follow: true } }) }
}

export default async function SharedPlacePage({ params }: Props) {
  if (!shareV2PagesOn()) notFound()
  const { locale, slug } = await params
  setRequestLocale(locale)
  const found = await load(slug)
  if (!found) notFound()
  const { place, row, standings } = found
  // A renamed place keeps its hash; send old links to the current address.
  if (place.slug !== slug) permanentRedirect(localizePath(locale, `/places/${place.slug}`))
  const [t, places, googlePhoto, maitred] = await Promise.all([
    getTranslations({ locale, namespace: 'SharePages' }), getTranslations({ locale, namespace: 'Places' }),
    getPlacePhoto(place.placeId), getMaitredStateAt(place.placeId),
  ])
  const prefix = locale === 'id' ? '/id' : ''
  const pageUrl = sharePageUrl(locale, `/places/${place.slug}`)
  const heroMeal = place.meals[0]
  const hero = heroMeal ? heroMeal.src : googlePhoto?.uri
  const mealAlt = places('mealAlt', { name: place.name })
  const pick = maitred.status === 'held' ? maitred.venue.notes.always.trim() : ''
  const city = place.where ? standings.cities.find((c) => c.city === place.where?.city) : undefined
  const computed = new Date(standings.computedAt)
  const month = Number.isNaN(computed.getTime()) ? '' : new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { month: 'long', timeZone: 'UTC' }).format(computed)
  const meta = [place.cuisine.join(', '), place.where?.city ?? ''].filter(Boolean)
  const hasGeo = place.lat !== null && place.lng !== null
  const directionsUrl = hasGeo
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name)}&destination_place_id=${encodeURIComponent(place.placeId)}`
    : null
  const schema = {
    '@context': 'https://schema.org', '@type': 'Restaurant', '@id': `${SITE_URL}/places/${place.slug}#restaurant`, name: place.name, url: pageUrl,
    ...(place.address ? { address: { '@type': 'PostalAddress', streetAddress: place.address, ...(place.where ? { addressLocality: place.where.city, addressCountry: place.where.country } : {}) } } : {}),
    ...(hasGeo ? { geo: { '@type': 'GeoCoordinates', latitude: place.lat, longitude: place.lng } } : {}),
    ...(place.cuisine.length ? { servesCuisine: place.cuisine } : {}),
    ...(googlePhoto || place.meals.length ? { image: [...(googlePhoto ? [googlePhoto.uri] : []), ...place.meals.slice(0, 6).map((m) => m.src)] } : {}),
    ...(directionsUrl ? { hasMap: directionsUrl } : {}),
  }

  return (
    <div className={styles.shell}>
      <SiteSchema locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
      <main id="main-content" className={styles.column}>
        {hero ? <figure className={styles.hero}>
          <Image src={hero} alt={heroMeal ? mealAlt : place.name} fill sizes="(min-width: 690px) 690px, 100vw" priority />
        </figure> : null}
        {!heroMeal && googlePhoto ? <p className={styles.credit}>
          {googlePhoto.authorUri ? <a href={googlePhoto.authorUri} rel="noopener" target="_blank">{places('photoCredit', { author: googlePhoto.author || 'Google Maps' })}</a> : places('photoCredit', { author: googlePhoto.author || 'Google Maps' })}
        </p> : null}
        <div className={styles.pad}>
          <h1 className={styles.name}>{place.name}</h1>
          {meta.length ? <p className={styles.meta}>{meta.join(' · ')}</p> : null}

          {pick ? <section className={styles.order} aria-labelledby="what-to-order">
            <h2 id="what-to-order" className={styles.eyebrow}>
              <Image src="/redesign/maitred-crown.svg" alt="" width={26} height={20} className={styles.crown} />
              {t('whatToOrder')}
            </h2>
            <p className={styles.dish}>{pick}</p>
            <p className={styles.by}>{t('maitredLine', { name: t('aRegular') })}</p>
          </section> : null}

          {place.meals.length ? <section aria-labelledby="what-people-ate">
            <h2 id="what-people-ate" className={styles.heading}>{t('whatPeopleAte')}</h2>
            <ul className={`${styles.grid} ${styles.two}`}>
              {place.meals.map((m) => <li key={m.id}>
                <Link href={`${prefix}/meal/${m.id}`} prefetch={false} className={styles.tile}>
                  <Image src={m.thumb || thumbUrl(m.src, 480)} alt={mealAlt} width={480} height={480} sizes="(min-width: 690px) 315px, 46vw" loading="lazy" />
                </Link>
              </li>)}
            </ul>
          </section> : null}

          {row && row.cityRank !== null && city && month ? <p className={styles.standing}>{t('rankCityMonth', { rank: row.cityRank, city: city.city, month })}</p> : null}

          {place.address ? <dl className={styles.details}>
            <dt>{t('address')}</dt>
            <dd>{place.address}</dd>
            {directionsUrl ? <dd><a href={directionsUrl} rel="noopener" target="_blank" className={styles.textLink}>{places('directions')}</a></dd> : null}
          </dl> : null}
          {place.claimed ? null : <p><Link href={localizePath(locale, `/claim/${place.slug}`)} prefetch={false} className={styles.textLink}>{places('claimRow')}</Link></p>}
        </div>
      </main>
      <div className={styles.bar}>
        <OpenInMakanButton link={pageUrl} appPath={`places/${place.slug}`} appPage={localizePath(locale, '/app')} label={t('openInMakan')} className={styles.cta} />
      </div>
      <Footer />
    </div>
  )
}
