import type { Metadata } from 'next'
import { cache } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Footer from '@/components/Footer'
import DishSection from '@/components/share/DishSection'
import SiteSchema from '@/components/SiteSchema'
import { OpenInMakanButton } from '@/components/share/ShareActions'
import styles from '@/components/share/share-pages.module.css'
import { localizePath } from '@/i18n/paths'
import { getEatStandings } from '@/lib/eat-standings'
import { getMaitredStateAt } from '@/lib/maitred'
import { getDirectoryPlace } from '@/lib/place-directory'
import { getPlacePhoto } from '@/lib/place-photo'
import { safeJsonLd } from '@/lib/safe-json-ld'
import PlacesMapLoader from '@/components/map/PlacesMapLoader'
import legacy from '@/components/standings/public-pages.module.css'
import { getReviewForPlace } from '@/lib/reviews'
import { SHARE_V2_NOT_SERVED, getPlaceShareCard, getVisiblePlaceMealIds, sharePageUrl, shareV2PageServed, smartAppBanner } from '@/lib/share-page'
import { PLACE_MAITRED_LINE, PLACE_PAGE_KEEPS } from '@/lib/share-page-choices'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import { MAX_RATED_DISHES } from '@/lib/aggregates/dishes'
import { dishPagesOn } from '@/lib/dish-pages'
import { matchDishPhotos } from '@/lib/dish-photo-match'
import { thumbUrl } from '@/lib/thumb'

/**
 * RM20616 A12 U3 — the restaurant page a shared place link opens for a friend without the app
 * (boards X2, A7, E3, F3). Served at /places/<slug> by proxy.ts while SHARE_V2_PAGES is on; the
 * page it stands in for (app/[locale]/places/[slug]/page.tsx) is not edited.
 *
 * Nobody is named here (Devon, 24 Nov 2026): the Maître d' reads "A regular" for every visitor,
 * with no photo and no initial, and the meal photos carry no handle. Each photo links to its
 * meal's own page, where the diner is credited. The Eat or Yeet rank only: no Google rating.
 *
 * A meal photo is used (as the hero, in the grid, in the JSON-LD) only if its author's account may
 * appear on a public page: the same check the meal page makes, asked through `getVisiblePlaceMealIds`.
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
  if (!(await shareV2PageServed())) return SHARE_V2_NOT_SERVED
  const { locale, slug } = await params
  const found = await load(slug)
  if (!found) return {}
  const { place } = found
  const t = await getTranslations({ locale, namespace: 'Places' })
  const path = `${locale === 'id' ? '/id' : ''}/places/${place.slug}`
  const publicMealCount = place.publicMealCount ?? place.meals.length
  const placeText = place.where ? `${place.name}, ${place.where.city}, ${place.where.country}` : place.name
  // The stored card when the app's backend has rendered one; otherwise today's per-request card. That card can draw
  // the newest meal's photo, so it is used only when that meal's author may appear on a public page (the check the
  // page's own photos pass); if not, the preview is the site's own card, which shows nobody's content.
  const card = await getPlaceShareCard(place.placeId, locale)
  const newest = place.meals[0]
  const todaysCardShowsNobodyHidden = card !== null || !newest || (await getVisiblePlaceMealIds(place.placeId, place.meals.map((m) => m.id))).has(newest.id)
  // RM20616 dish pages U4 (DISH_PAGES): with the app's answer, the approved "What to order at …" title and description
  // (board dp-serp). Without one, whenever this page is served (switch or not: review L1), the live place page's own title
  // family (Devon, Q3 "Reuse live titles"), so Share v2 going on before dish pages loses no title. Names as written, never
  // translated. With DISH_PAGES on, a page with no visible meal and no answer is not indexed. The JSON-LD is not changed.
  const dishesOn = dishPagesOn()
  const answer = dishesOn ? place.dishes?.answer ?? null : null
  const share = answer ? await getTranslations({ locale, namespace: 'SharePages' }) : null
  const title = answer && share ? (place.where ? share('metaTitleWhatToOrderLocated', { name: place.name, city: place.where.city }) : share('metaTitleWhatToOrder', { name: place.name }))
    : place.where ? t(publicMealCount ? 'metaTitleFoodLocated' : 'metaTitleLocated', { name: place.name, city: place.where.city })
    : t(publicMealCount ? 'metaTitleFood' : 'metaTitle', { name: place.name })
  const meta = createPageMetadata({
    title,
    description: answer && share ? share(answer.maitred ? 'metaDescriptionDishMaitred' : 'metaDescriptionDishEat', { place: placeText, dish: answer.name })
      : publicMealCount ? t('metaDescriptionFood', { place: placeText, count: publicMealCount }) : t('metaDescriptionEmpty', { place: placeText }),
    path, locale, image: card ?? (todaysCardShowsNobodyHidden ? `${SITE_URL}${path}/opengraph-image` : undefined),
  })
  // The author check is the page's own, shared within the request: no extra read.
  const nothingToShow = dishesOn && !answer && !(place.meals.length && (await getVisiblePlaceMealIds(place.placeId, place.meals.map((m) => m.id))).size)
  const indexable = found.indexable && !nothingToShow
  return { ...meta, itunes: smartAppBanner(`${SITE_URL}${path}`), ...(indexable ? {} : { robots: { index: false, follow: true } }) }
}

export default async function SharedPlacePage({ params }: Props) {
  if (!(await shareV2PageServed())) notFound()
  const { locale, slug } = await params
  setRequestLocale(locale)
  const found = await load(slug)
  if (!found) notFound()
  const { place, row, standings } = found
  // A renamed place keeps its hash; send old links to the current address.
  if (place.slug !== slug) permanentRedirect(localizePath(locale, `/places/${place.slug}`))
  const [t, places, googlePhoto, maitred, visible] = await Promise.all([
    getTranslations({ locale, namespace: 'SharePages' }), getTranslations({ locale, namespace: 'Places' }),
    getPlacePhoto(place.placeId), getMaitredStateAt(place.placeId), getVisiblePlaceMealIds(place.placeId, place.meals.map((m) => m.id)),
  ])
  const meals = place.meals.filter((m) => visible.has(m.id))
  const prefix = locale === 'id' ? '/id' : ''
  const pageUrl = sharePageUrl(locale, `/places/${place.slug}`)
  const heroMeal = meals[0]
  const hero = heroMeal ? heroMeal.src : googlePhoto?.uri
  const mealAlt = places('mealAlt', { name: place.name })
  const pick = maitred.status === 'held' ? maitred.venue.notes.always.trim() : ''
  const city = place.where ? standings.cities.find((c) => c.city === place.where?.city) : undefined
  const computed = new Date(standings.computedAt)
  const month = Number.isNaN(computed.getTime()) ? '' : new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { month: 'long', timeZone: 'UTC' }).format(computed)
  const meta = [place.cuisine.join(', '), place.where?.city ?? ''].filter(Boolean)
  // Devon's choice (lib/share-page-choices.ts). The holder's name is not an option.
  const maitredLine = PLACE_MAITRED_LINE === 'a-regular-maitred' ? t('maitredLine', { name: t('aRegular') }) : PLACE_MAITRED_LINE === 'a-regular' ? t('aRegular') : ''
  // RM20616 dish pages U3 (DISH_PAGES, boards dp-*-a): the app's answer and the dishes diners rated, from the place
  // aggregate (no read of its own). It replaces the Maître d's note: the web shows the app's answer only (Devon, Q1).
  // With no `dishes` (not computed, or a venue that opted out of dish names) there is no block at all. A row's photo is
  // one of `meals`, the meals that passed the author check above, whose caption is exactly that dish (Devon, "Exact dish
  // only"), and is the grid tile's own file (Devon, Q5: "Let it repeat").
  const dishesOn = dishPagesOn()
  const dishes = dishesOn ? place.dishes : undefined
  const answer = dishes?.answer ?? null
  const rated = answer && dishes ? dishes.rated.slice(0, MAX_RATED_DISHES) : []
  const photoOf = matchDishPhotos(rated, meals)
  const dishRows = rated.map((name) => {
    const meal = meals.find((m) => m.id === photoOf.get(name))
    return { name, photo: meal ? { mealId: meal.id, src: meal.thumb || thumbUrl(meal.src, 480) } : null }
  })
  const firstDay = dishes ? await getTranslations({ locale, namespace: 'Decision.FirstDay' }) : null
  const review = PLACE_PAGE_KEEPS.firsthandReview ? getReviewForPlace(place.slug) : null
  const dayMonthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  const hasGeo = place.lat !== null && place.lng !== null
  const directionsUrl = hasGeo
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name)}&destination_place_id=${encodeURIComponent(place.placeId)}`
    : null
  const schema = {
    '@context': 'https://schema.org', '@type': 'Restaurant', '@id': `${SITE_URL}/places/${place.slug}#restaurant`, name: place.name, url: pageUrl,
    ...(place.address ? { address: { '@type': 'PostalAddress', streetAddress: place.address, ...(place.where ? { addressLocality: place.where.city, addressCountry: place.where.country } : {}) } } : {}),
    ...(hasGeo ? { geo: { '@type': 'GeoCoordinates', latitude: place.lat, longitude: place.lng } } : {}),
    ...(place.cuisine.length ? { servesCuisine: place.cuisine } : {}),
    ...(googlePhoto || meals.length ? { image: [...(googlePhoto ? [googlePhoto.uri] : []), ...meals.slice(0, 6).map((m) => m.src)] } : {}),
    ...(directionsUrl ? { hasMap: directionsUrl } : {}),
  }

  return (
    <div className={styles.shell}>
      <SiteSchema locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />
      <div className={styles.screen}>
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

          {dishes && firstDay ? <DishSection answer={answer} thin={!answer && meals.length > 0} rows={dishRows} prefix={prefix}
            labels={{ whatToOrder: t('whatToOrder'), maitredLine, notEnough: firstDay('emptyState'), dishesRatedHere: t('dishesRatedHere'), mealAlt }} /> : null}

          {!dishesOn && pick ? <section className={styles.order} aria-labelledby="what-to-order">
            <h2 id="what-to-order" className={styles.eyebrow}>
              <Image src="/redesign/maitred-crown.svg" alt="" width={26} height={20} className={styles.crown} />
              {t('whatToOrder')}
            </h2>
            <p className={styles.dish}>{pick}</p>
            {maitredLine ? <p className={styles.by}>{maitredLine}</p> : null}
          </section> : null}

          {meals.length ? <section aria-labelledby="what-people-ate">
            <h2 id="what-people-ate" className={styles.heading}>{t('whatPeopleAte')}</h2>
            <ul className={`${styles.grid} ${styles.two}`}>
              {meals.map((m) => <li key={m.id}>
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
          {/* Devon's choice (lib/share-page-choices.ts): today's map and firsthand-review block, which the board does not draw. */}
          {review ? <article className={legacy.firsthand}>
            <p className={legacy.kicker}>{places('firsthandVisit', { author: review.author.name })} · <time dateTime={review.visitDate}>{dayMonthYear.format(new Date(review.visitDate))}</time></p>
            <p lang="en" className={legacy.orderSummary}>{review.orderSummary}</p>
            <p className={legacy.visitBill}>{places('visitBill', { total: review.bill.total, covers: review.bill.covers })}</p>
            <Link href={`/blog/${review.slug}`} prefetch={false} className={styles.textLink}>{places('fullReview')}</Link>
          </article> : null}
          {PLACE_PAGE_KEEPS.map && hasGeo ? <PlacesMapLoader className={legacy.placeMap} label={places('mapLabel', { name: place.name })} zoom={16} markers={[{ slug: place.slug, name: place.name, lat: place.lat as number, lng: place.lng as number, href: pageUrl }]} /> : null}
        </div>
      </main>
      <div className={styles.bar}>
        <OpenInMakanButton link={pageUrl} appPath={`places/${place.slug}`} appPage={localizePath(locale, '/app')} label={t('openInMakan')} className={styles.cta} />
      </div>
      </div>
      <Footer />
    </div>
  )
}
