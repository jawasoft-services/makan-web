import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import SiteSchema from '@/components/SiteSchema'
import PlacesHero from '@/components/places/PlacesHero'
import RestaurantDirectory from '@/components/places/RestaurantDirectory'
import { getPlaceIndex } from '@/lib/place-directory'
import { getEatStandings } from '@/lib/eat-standings'
import { createPageMetadata } from '@/lib/site-metadata'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PlaceDirectory' })
  return createPageMetadata({ title: t('metaTitle'), description: t('metaDescription'), path: locale === 'id' ? '/id/places' : '/places', locale })
}

/** The place behind the hero photo (Devon's visit to Kendal Street Kitchen), found by its slug hash in the live index. */
const FEATURED_HASH = 'f7d46b'

/** RM20773: the approved prototype's directory page (strategy/website-direction-2026-11-25/site/places.html). */
export default async function PlacesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('PlaceDirectory')
  const [places, standings] = await Promise.all([getPlaceIndex(), getEatStandings()])
  // Match the sitemap's public evidence threshold; never fetch every venue document.
  const matchupIds = new Set(standings.all.filter(row => row.matchups > 0).map(row => row.placeId))
  const entries = places.filter(place => place.indexable || matchupIds.has(place.placeId))
    .map(({ placeId, slug, name, city }) => ({ placeId, slug, name, city }))
    .sort((a, b) => a.name.localeCompare(b.name, locale === 'id' ? 'id-ID' : 'en-GB'))
  const found = places.find(place => place.hash === FEATURED_HASH) ?? places.find(place => /^kendal street kitchen$/i.test(place.name))
  const featured = found ? { slug: found.slug, name: found.name, city: found.city } : null
  return <main id="main-content" className="sx"><SiteSchema locale={locale} />
    <PlacesHero locale={locale} featured={featured} />
    <section className="ch tight pl-dir" aria-label={t('search')}>
      <div className="wrap">
        {entries.length ? <RestaurantDirectory entries={entries} locale={locale} /> : <p className="lede">{t('unavailable')}</p>}
      </div>
    </section>
  </main>
}
