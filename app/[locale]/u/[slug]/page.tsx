import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import StoreLink from '@/components/home/StoreLink'
import Footer from '@/components/Footer'
import { localizePath } from '@/i18n/paths'
import { getPublicProfile, profileKey, type ProfileMeal } from '@/lib/public-profile'
import publicStyles from '@/components/standings/public-pages.module.css'
import styles from './profile.module.css'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ locale: string; slug: string }> }
const robots = { index: false, follow: true }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params
  const key = profileKey(slug)
  const profile = key ? await getPublicProfile(key) : null
  if (!profile) return { robots }
  const [t, site] = await Promise.all([
    getTranslations({ locale, namespace: 'PublicProfile' }),
    getTranslations({ locale, namespace: 'Metadata.site' }),
  ])
  const title = t('title', { name: profile.name, handle: profile.handle })
  const description = (profile.bio || profile.top3.map(meal => meal.caption).filter(Boolean).join(', ') || site('description')).slice(0, 160)
  const path = localizePath(locale, `/u/${profile.slug}`)
  const url = `https://www.makanofficial.com${path}`
  const image = `${url}/opengraph-image`
  return {
    title, description, robots, alternates: { canonical: url },
    openGraph: { type: 'profile', title, description, url, images: [{ url: image, width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  }
}

export default async function ProfilePage({ params }: Props) {
  const { locale, slug } = await params
  setRequestLocale(locale)
  const key = profileKey(slug)
  const profile = key ? await getPublicProfile(key) : null
  if (!profile) notFound()
  if (slug !== profile.slug) permanentRedirect(localizePath(locale, `/u/${profile.slug}`))
  const [t, handoff] = await Promise.all([
    getTranslations({ locale, namespace: 'PublicProfile' }),
    getTranslations({ locale, namespace: 'TasteInvite' }),
  ])
  const initials = profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]?.toUpperCase()).join('')
  return (
    <div className={publicStyles.page}>
      <main id="main-content" className={styles.profile}>
        <header className={styles.identity}>
          <div className={styles.avatar}>
            {profile.avatar ? <Image src={profile.avatar} alt="" width={96} height={96} priority /> : initials}
          </div>
          <h1>{profile.name}</h1>
          <p className={styles.handle}>@{profile.handle}</p>
          {profile.bio ? <p className={styles.bio}>{profile.bio}</p> : null}
        </header>
        {profile.top3.length ? <section className={styles.section} aria-labelledby="profile-top3">
          <h2 id="profile-top3">{t('top3')}</h2>
          <ol className={styles.meals}>{profile.top3.map(meal => <li key={meal.id} value={meal.rank} style={{ gridColumn: meal.rank }}><Meal meal={meal} locale={locale} /></li>)}</ol>
        </section> : null}
        {profile.crowns.length ? <section className={styles.section} aria-labelledby="profile-maitred">
          <h2 id="profile-maitred">{t('maitred')}</h2>
          <ul className={styles.crowns}>{profile.crowns.map(venue => <li key={venue.placeId}>
            <Image src="/redesign/maitred-crown.svg" alt="" width={28} height={28} />
            <Link href={localizePath(locale, `/places/${venue.slug}`)}>{venue.name}</Link>
          </li>)}</ul>
        </section> : null}
        {profile.recent.length ? <section className={styles.section} aria-labelledby="profile-recent">
          <h2 id="profile-recent">{t('recent')}</h2>
          <ul className={styles.meals}>{profile.recent.map(meal => <li key={meal.id}><Meal meal={meal} locale={locale} /></li>)}</ul>
        </section> : null}
        <div className={styles.actions}>
          <StoreLink location="public-profile" className={publicStyles.primary}>{handoff('getApp')}</StoreLink>
          <a href={`makanapp://u/${profile.key}`} className={publicStyles.textLink}>{handoff('haveApp')}</a>
        </div>
      </main>
      <Footer />
    </div>
  )
}

function Meal({ meal, locale }: { meal: ProfileMeal; locale: string }) {
  return <>
    {meal.imageURL ? <Image src={meal.imageURL} alt="" width={222} height={222} sizes="(max-width: 700px) 30vw, 222px" className={styles.mealPhoto} /> : <div className={styles.mealPhoto} />}
    {meal.caption ? <p>{meal.caption}</p> : null}
    {meal.locationName ? <p className={styles.place}>{meal.placeSlug
      ? <Link href={localizePath(locale, `/places/${meal.placeSlug}`)}>{meal.locationName}</Link> : meal.locationName}</p> : null}
  </>
}
