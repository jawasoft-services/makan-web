import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Footer from '@/components/Footer'
import GonePage from '@/components/share/GonePage'
import { OpenInMakanButton } from '@/components/share/ShareActions'
import styles from '@/components/share/share-pages.module.css'
import { localizePath } from '@/i18n/paths'
import { getDirectoryPlaceById } from '@/lib/place-directory'
import { shareCardFor } from '@/lib/share-card'
import { SHARE_V2_NOT_SERVED, sharePageUrl, shareV2PageServed, smartAppBanner } from '@/lib/share-page'
import { getSharedMeal } from '@/lib/shared-meal'
import { getHiddenPlaceIds } from '@/lib/web-listing'

/**
 * RM20616 A12 U3 — a shared meal for a friend without the app (board G3): the photo, "Meal by
 * @handle", the dish and a link to the place. Served at /meal/<id> by proxy.ts while
 * SHARE_V2_PAGES is on; the page it stands in for (app/[locale]/meal/[id]/page.tsx) is not edited.
 *
 * Visibility is checked on every request, as today. A meal that is gone (deleted, no longer
 * public, moderated, or by an account that is closed, held, under age or being deleted) gets the gone page,
 * which shows nothing of it; its metadata is empty too.
 */
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!(await shareV2PageServed())) return SHARE_V2_NOT_SERVED
  const { locale, id } = await params
  const meal = await getSharedMeal(id)
  if (!meal) return { robots: { index: false, follow: false } }
  const t = await getTranslations({ locale, namespace: 'SharePages' })
  const url = sharePageUrl(locale, `/meal/${meal.id}`)
  const title = meal.handle ? t('mealBy', { username: meal.handle }) : meal.dish || undefined
  // The stored card when the app's backend has rendered one; otherwise the image today's page uses.
  // The card for this page's language only: an English page never shows the Bahasa card, nor the reverse.
  const cardUrl = shareCardFor(meal.cardUrls, locale)
  const image = cardUrl ? { url: cardUrl, width: 1200, height: 630 } : { url: meal.fallbackImage, width: 1080, height: 1920 }
  return {
    ...(title ? { title } : {}),
    alternates: { canonical: url },
    itunes: smartAppBanner(url),
    openGraph: { ...(title ? { title } : {}), url, type: 'article', images: [image] },
    twitter: { card: 'summary_large_image', ...(title ? { title } : {}), images: [image.url] },
  }
}

export default async function SharedMealPage({ params }: Props) {
  if (!(await shareV2PageServed())) notFound()
  const { locale, id } = await params
  setRequestLocale(locale)
  const [meal, t] = await Promise.all([getSharedMeal(id), getTranslations({ locale, namespace: 'SharePages' })])
  const appPage = localizePath(locale, '/app')
  if (!meal) return <GonePage title={t('unavailable')} body={t('mealGone')} getLabel={t('getApp')} appPage={appPage} />

  // The way on from a meal: the restaurant it was saved at. One aggregate document, as today's meal page reads.
  // RM20616 dish pages U2: a venue taken down has no page, so the venue line is its name in plain text (below).
  const place = meal.placeId && !(await getHiddenPlaceIds()).has(meal.placeId) ? await getDirectoryPlaceById(meal.placeId) : null
  const byline = meal.handle ? t('mealBy', { username: meal.handle }) : ''
  // One heading per page: the dish when the meal has one, else the byline, else the place.
  const Byline = meal.dish ? 'p' : 'h1'
  const Venue = meal.dish || byline ? 'p' : 'h1'
  return (
    <div className={styles.shell}>
      <div className={styles.screen}>
      <main id="main-content" className={styles.column}>
        <figure className={`${styles.hero} ${styles.heroSquare}`}>
          <Image src={meal.photo} alt={meal.dish || byline} fill sizes="(min-width: 690px) 690px, 100vw" priority />
        </figure>
        <div className={styles.pad}>
          {byline ? <Byline className={styles.byline}>
            <span className={`${styles.avatar} ${styles.avatarSmall}`} aria-hidden>
              {meal.avatar ? <Image src={meal.avatar} alt="" width={44} height={44} /> : meal.handle.slice(0, 1).toUpperCase()}
            </span>
            {byline}
          </Byline> : null}
          {meal.dish ? <h1 className={styles.dish}>{meal.dish}</h1> : null}
          {place
            ? <Venue><Link href={localizePath(locale, `/places/${place.slug}`)} prefetch={false} className={styles.placeLink}>{place.name}</Link></Venue>
            : meal.locationName ? <Venue className={styles.meta}>{meal.locationName}</Venue> : null}
        </div>
      </main>
      <div className={styles.bar}>
        <OpenInMakanButton link={sharePageUrl(locale, `/meal/${meal.id}`)} appPath={`meal/${meal.id}`} appPage={appPage} label={t('openInMakan')} className={styles.cta} />
      </div>
      </div>
      <Footer />
    </div>
  )
}
