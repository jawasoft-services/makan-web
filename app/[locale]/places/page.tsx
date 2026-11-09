import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Footer from '@/components/Footer'
import SiteSchema from '@/components/SiteSchema'
import RestaurantDirectory from '@/components/places/RestaurantDirectory'
import { getPlaceIndex } from '@/lib/place-directory'
import { getEatStandings } from '@/lib/eat-standings'
import { createPageMetadata } from '@/lib/site-metadata'
import styles from '@/components/standings/public-pages.module.css'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'PlaceDirectory' })
  return createPageMetadata({ title: t('metaTitle'), description: t('metaDescription'), path: locale === 'id' ? '/id/places' : '/places', locale })
}

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
  return <><main id="main-content" className={`redesign-page ${styles.page}`}><SiteSchema locale={locale} />
    <div className={styles.wrap}>
      <header className={`${styles.heading} ${styles.directoryHeading}`}><h1>{t('title')}</h1><p className={styles.intro}>{t('intro')}</p><Image className={styles.headingArt} src="/redesign/food-noodles.svg" alt="" width={120} height={140} /></header>
      {entries.length ? <RestaurantDirectory entries={entries} locale={locale} /> : <p className={styles.empty}>{t('unavailable')}</p>}
    </div>
  </main><Footer /></>
}
