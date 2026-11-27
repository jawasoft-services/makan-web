import type { Metadata } from 'next'
import { cache } from 'react'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import SiteSchema from '@/components/SiteSchema'
import PlaceSeat from '@/components/places/PlaceSeat'
import StoreButtons from '@/components/site/StoreButtons'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import { CITY_FLOOR, EVIDENCE_FLOOR, getEatStandings, type EatStandings, type StandingRow } from '@/lib/eat-standings'
import { getDirectoryPlace, getPlaceIndex, type DirectoryPlace } from '@/lib/place-directory'
import { getMaitredStateAt } from '@/lib/maitred'
import { localPhoto } from '@/lib/local-photo'
import { getPlacePhoto } from '@/lib/place-photo'
import { localizePath } from '@/i18n/paths'
import { thumbUrl } from '@/lib/thumb'
import { safeJsonLd } from '@/lib/safe-json-ld'
import { getReviewForPlace } from '@/lib/reviews'
import { appClipBannerMetadata, appStoreBanner } from '@/lib/app-clip'
import { APP_STORE_URL } from '@/lib/links'

/** A public restaurant: original meal photos, Maître d’ notes, standings and directions.
 * The web publishes a separate, filtered projection; app-only progress is never included.
 * RM20773: drawn as the approved prototype's place page (strategy/website-direction-2026-11-25/site/
 * place-kendal-street-kitchen.html), from this place's own data; a part shows only when its data exists.
 */
// Holder identity is revalidated by the shared strict-expiry data cache.
export const dynamic = 'force-dynamic'
export const dynamicParams = true

interface Props {
  params: Promise<{ locale: string; slug: string }>
}

// Prerender the places worth a search result; the rest render on demand.
export async function generateStaticParams() {
  const all = await getPlaceIndex()
  return all.filter((p) => p.indexable).map((p) => ({ slug: p.slug }))
}

const load = cache(async (slug: string): Promise<{ place: DirectoryPlace; row: StandingRow | null; standings: EatStandings; indexable: boolean } | null> => {
  const place = await getDirectoryPlace(slug)
  if (!place) return null
  const standings = await getEatStandings()
  const row = standings.all.find((r) => r.placeId === place.placeId) ?? null
  return { place, row, standings, indexable: place.indexable || Boolean(row && row.matchups > 0) }
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const found = await load(slug)
  if (!found) return {}
  const { place, row, indexable } = found
  const publicMealCount = place.publicMealCount ?? place.meals.length
  const t = await getTranslations({ locale, namespace: 'Places' })
  const path = `${locale === 'id' ? '/id' : ''}/places/${place.slug}`
  const placeText = place.where ? `${place.name}, ${place.where.city}, ${place.where.country}` : place.name
  const review = getReviewForPlace(place.slug)
  const meta = createPageMetadata({
    title: place.where
      ? t(publicMealCount ? 'metaTitleFoodLocated' : 'metaTitleLocated', { name: place.name, city: place.where.city })
      : t(publicMealCount ? 'metaTitleFood' : 'metaTitle', { name: place.name }),
    description:
      review
        ? t('metaDescriptionReview', { place: placeText, count: publicMealCount, date: new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(review.visitDate)) })
        : row && row.rank !== null
          ? t('metaDescriptionRanked', { place: placeText, count: publicMealCount, eats: row.eats, rank: row.rank })
        : publicMealCount
          ? t('metaDescriptionFood', { place: placeText, count: publicMealCount })
          : t('metaDescriptionEmpty', { place: placeText }),
    path,
    locale,
    image: `${SITE_URL}${path}/opengraph-image`,
  })
  // RM20616 U4: the Smart App Banner naming the dev App Clip, only with APP_CLIP_DEV_BANNER on (lib/app-clip.ts).
  // With it off nothing is added and this page has no banner, as before.
  const clip = appClipBannerMetadata(appStoreBanner(APP_STORE_URL, `${SITE_URL}${path}`))
  const withClip = clip ? { ...meta, ...clip } : meta
  // A single meal with no matchups is a real page but not a search result.
  return indexable ? withClip : { ...withClip, robots: { index: false, follow: true } }
}

export default async function PlacePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const found = await load(slug)
  if (!found) notFound()
  const { place, row, standings } = found
  const publicMealCount = place.publicMealCount ?? place.meals.length
  // A renamed place keeps its hash; send old links to the current slug.
  if (place.slug !== slug) permanentRedirect(localizePath(locale, `/places/${place.slug}`))
  const t = await getTranslations('Places')
  const monthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { month: 'long', year: 'numeric' })
  const dayMonthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
  const percent = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-GB', { style: 'percent', maximumFractionDigits: 0 })
  const prefix = locale === 'id' ? '/id' : ''
  const pageUrl = `${SITE_URL}${prefix}/places/${place.slug}`
  const restaurantId = `${SITE_URL}/places/${place.slug}#restaurant`
  const city = place.where ? standings.cities.find((c) => c.city === place.where?.city) : undefined
  const ranked = Boolean(row && row.rank !== null)
  const hasGeo = place.lat !== null && place.lng !== null
  const directionsUrl = hasGeo
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.name)}&destination_place_id=${encodeURIComponent(place.placeId)}`
    : null
  // Lead with a real public meal tagged to this venue; keep the source photo as fallback.
  const [googlePhoto, maitred] = await Promise.all([getPlacePhoto(place.placeId), getMaitredStateAt(place.placeId)])
  const heroMeal = place.meals[0]
  const review = getReviewForPlace(place.slug)
  const hero = heroMeal ? { src: thumbUrl(heroMeal.src, 960), alt: heroMeal.caption ? `${heroMeal.caption}, ${place.name}` : t('mealAlt', { name: place.name }) } : googlePhoto ? { src: googlePhoto.uri, alt: place.name } : null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    '@id': restaurantId,
    name: place.name,
    url: pageUrl,
    ...(place.address ? { address: { '@type': 'PostalAddress', streetAddress: place.address, ...(place.where ? { addressLocality: place.where.city, addressCountry: place.where.country } : {}) } } : {}),
    ...(hasGeo ? { geo: { '@type': 'GeoCoordinates', latitude: place.lat, longitude: place.lng } } : {}),
    ...(place.cuisine.length ? { servesCuisine: place.cuisine } : {}),
    ...(googlePhoto || place.meals.length ? { image: [...(googlePhoto ? [googlePhoto.uri] : []), ...place.meals.slice(0, 6).map((m) => m.src)] } : {}),
    ...(directionsUrl ? { hasMap: directionsUrl } : {}),
    description: ranked && row
      ? `${row.eats} Eats, ${row.yeets} Yeets from ${row.matchups} Eat or Yeet matchups on Makan. ${publicMealCount} public meals saved here.`
      : `${publicMealCount} public meals saved here on Makan.`,
    subjectOf: {
      '@type': 'WebPage',
      '@id': pageUrl,
      dateModified: standings.computedAt || undefined,
      inLanguage: locale === 'id' ? 'id' : 'en',
      mainEntity: { '@id': restaurantId },
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

  // Meta row: cuisine · meals · since, leaving out what this place lacks.
  const meta = [
    place.cuisine.join(', '),
    publicMealCount ? t('mealsShort', { count: publicMealCount }) : '',
    place.since ? t('since', { date: monthYear.format(new Date(place.since)) }) : '',
  ].filter(Boolean)
  // The big name: its last word in orange, as the prototype sets it.
  const words = place.name.trim().split(/\s+/)
  const name = words.length > 1 ? <>{words.slice(0, -1).join(' ')} <em>{words.at(-1)}</em></> : place.name
  // The Maître d’ (components/places/PlaceSeat): a published usual sits in "What to order"; every other state is its own chapter after the meals.
  const usual = maitred.status === 'held' && Boolean(maitred.venue.notes.always)
  const reviewPhotos = review ? review.meals.filter(m => m.photo) : []
  const orderPhotos = reviewPhotos.length >= 3 ? reviewPhotos.slice(1, 3) : reviewPhotos.slice(0, 2)
  const standing = Boolean(row && (ranked || row.cityRank !== null || row.matchups > 0))
  const em = (chunks: React.ReactNode) => <em>{chunks}</em>

  return (
    <main id="main-content" className="sx">
      <SiteSchema locale={locale} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }} />

      <section className="ch pk-hero" aria-label={place.name}>
        <div className="wrap split mid">
          <div>
            <p className="pk-crumb" data-rise="">
              <Link href={localizePath(locale, '/standings')}>{t('standings')}</Link>
              {city ? <> · <Link href={localizePath(locale, `/standings/${city.slug}`)}>{city.city}</Link></> : place.where ? <> · {place.where.city}</> : null}
            </p>
            <h1 className="big xl" data-rise="" style={{ '--d': '.08s' } as React.CSSProperties}>{name}</h1>
            {meta.length ? <p className="pk-meta" data-rise="" style={{ '--d': '.16s' } as React.CSSProperties}>{meta.join(' · ')}</p> : null}
          </div>
          {hero ? <figure className="meal" data-pop="" style={{ '--d': '.2s' } as React.CSSProperties}>
            <Image className="ph" src={hero.src} alt={hero.alt} width={960} height={960} sizes="(max-width: 820px) 320px, 440px" priority />
            {heroMeal?.username ? <figcaption>@{heroMeal.username} · {place.name}</figcaption> : !heroMeal && googlePhoto ? <figcaption>
              {googlePhoto.authorUri ? <a href={googlePhoto.authorUri} rel="noopener" target="_blank">{t('photoCredit', { author: googlePhoto.author || 'Google Maps' })}</a> : t('photoCredit', { author: googlePhoto.author || 'Google Maps' })}
            </figcaption> : null}
          </figure> : null}
        </div>
      </section>

      {usual || review ? <section className="ch white pk-order" aria-labelledby="what-to-order">
        <div className="wrap split">
          <div className="sticky">
            <h2 className="big md" id="what-to-order" data-rise="">{t('whatToOrder', { name: place.name })}</h2>
            {review ? <p className="small" data-rise="" style={{ '--d': '.1s' } as React.CSSProperties}>{t('firsthandVisit', { author: review.author.name })} · <time dateTime={review.visitDate}>{dayMonthYear.format(new Date(review.visitDate))}</time></p> : null}
          </div>
          <div>
            {usual ? <PlaceSeat locale={locale} placeName={place.name} state={maitred} variant="usual" /> : null}
            {review ? <>
              <p lang="en" className="pk-say" data-rise="" data-stop="">{review.orderSummary}</p>
              <p className="pk-bill" data-rise="">{t('visitBill', { total: review.bill.total, covers: review.bill.covers })}</p>
              <div className="btns" data-rise=""><Link className="btn line" href={`/blog/${review.slug}`} prefetch={false}>{t('fullReview')} →</Link></div>
              {orderPhotos.length ? <div className="grid2">{orderPhotos.map((m, i) => <Image key={m.photo} className="ph" data-pop="" style={{ '--d': `${i * 0.12}s` } as React.CSSProperties} src={localPhoto(m.photo as string, 300)} alt={m.alt} width={1280} height={1280} loading="lazy" />)}</div> : null}
            </> : null}
          </div>
        </div>
      </section> : null}

      {place.meals.length ? <section className="ch pk-meals" id="meals" aria-labelledby="meals-at">
        <div className="wrap">
          <h2 className="big md" id="meals-at" data-rise="">{t('mealsAt', { name: place.name })}</h2>
          <ul className="rows" data-rise="" style={{ '--d': '.1s' } as React.CSSProperties}>
            {place.meals.map(m => <li key={m.id}><Link href={`/meal/${m.id}`} prefetch={false}><b>{m.caption || m.mealType || t('mealFallback')}</b><span>{m.username ? `@${m.username} · ` : ''}<time dateTime={m.at}>{dayMonthYear.format(new Date(m.at))}</time></span></Link></li>)}
          </ul>
        </div>
      </section> : null}

      {usual ? null : <PlaceSeat locale={locale} placeName={place.name} state={maitred} variant="seat" />}

      {standing || place.address || !place.claimed ? <section className="ch pk-stand" aria-label={standing ? t('standingBand') : t('directions')}>
        <div className="wrap">
          {standing && row ? <>
            <p className="cap" data-rise="">{t('standingBand')}</p>
            {ranked || row.cityRank !== null ? <>
              <h2 className="big" data-rise="" style={{ '--d': '.06s' } as React.CSSProperties}>{row.cityRank !== null && city ? t.rich('rankCityRich', { rank: row.cityRank, city: city.city, em }) : t('rankGlobal', { rank: row.rank ?? 0 })}</h2>
              {row.cityRank !== null && city && ranked ? <p className="lede pk-rank" data-rise="" style={{ '--d': '.12s' } as React.CSSProperties}>{t('rankGlobal', { rank: row.rank ?? 0 })}</p> : null}
            </> : <p className="lede pk-rank" data-rise="">{t('underFloor', { matchups: row.matchups, floor: EVIDENCE_FLOOR, cityFloor: CITY_FLOOR })}</p>}
            {ranked ? <dl className="nums" data-stop="">
              <div><dt className="num or" data-count={Math.round(row.eatRate * 100)} data-suffix="%">{percent.format(row.eatRate)}</dt><dd><small>{t('eatRate')}</small></dd></div>
              <div><dt className="num" data-count={row.eats}>{row.eats}</dt><dd><small>{t('eats')}</small></dd></div>
              <div><dt className="num" data-count={row.yeets}>{row.yeets}</dt><dd><small>{t('yeets')}</small></dd></div>
              <div><dt className="num" data-count={row.matchups}>{row.matchups}</dt><dd><small>{t('matchups')}</small></dd></div>
            </dl> : row.matchups > 0 ? <dl className="nums"><div><dt className="num">{row.matchups}/{EVIDENCE_FLOOR}</dt><dd><small>{t('matchupsToward')}</small></dd></div></dl> : null}
          </> : null}
          {place.address || !place.claimed ? <div className="pk-where" data-rise="">
            {place.address ? <p>{directionsUrl ? <a href={directionsUrl} target="_blank" rel="noopener">{place.address}<span className="dir">{t('directions')} →</span></a> : place.address}</p> : <span />}
            {place.claimed ? null : <Link className="tlink" href={localizePath(locale, `/claim/${place.slug}`)}>{t('claimRow')}</Link>}
          </div> : null}
        </div>
      </section> : null}

      <section className="ch peach pk-how" aria-labelledby="how-eat">
        <div className="wrap split">
          <h2 className="big" id="how-eat" data-rise="">{t('howTitle')}</h2>
          <ul className="steps">{(['how1', 'how2', 'how3'] as const).map(k => <li key={k} data-read="">{t(k, { floor: EVIDENCE_FLOOR })}</li>)}</ul>
        </div>
      </section>

      <section className="ch pk-owner" aria-labelledby="owner">
        <div className="wrap split mid">
          <h2 className="big" id="owner" data-rise="">{t('ownerTitle')}</h2>
          <div>
            <p className="lede" data-rise="" style={{ marginTop: 0 }}>{t('ownerBody')}</p>
            <div className="btns" data-rise="" style={{ '--d': '.1s' } as React.CSSProperties}><Link className="btn ink" href={localizePath(locale, '/partner')}>{t('ownerCta')}</Link></div>
          </div>
        </div>
      </section>

      <section className="ch tight peach pk-post" aria-label={t('postMeal', { name: place.name })}>
        <div className="wrap">
          <div className="btns" data-rise="" style={{ marginTop: 0 }}><StoreButtons location="place">+ {t('postMeal', { name: place.name })}</StoreButtons></div>
        </div>
      </section>
    </main>
  )
}
