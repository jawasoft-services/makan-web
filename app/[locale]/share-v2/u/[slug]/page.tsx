import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound, permanentRedirect } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Footer from '@/components/Footer'
import GonePage from '@/components/share/GonePage'
import { GetMakanButton } from '@/components/share/ShareActions'
import styles from '@/components/share/share-pages.module.css'
import { localizePath } from '@/i18n/paths'
import { getPublicProfile, profileKey, type ProfileMeal } from '@/lib/public-profile'
import { SHARE_V2_NOT_SERVED, sharePageUrl, shareV2PageServed, smartAppBanner } from '@/lib/share-page'
import { GONE_PROFILE_LINE } from '@/lib/share-page-choices'
import { createPageMetadata } from '@/lib/site-metadata'

/**
 * RM20616 A12 U3 — a person's public page, /u/<handle>-<key> (boards X1 and C6; resumed from
 * RM20603). Served by proxy.ts while SHARE_V2_PAGES is on; there was no page here before.
 *
 * The owner shared this link, so the page names them. It shows their name, @handle and photo,
 * their top 3 and recent public meals, and the venues where they are the Maître d' (only while
 * they let venues see their profile). No counts, no bio, no captions, no dates. Never indexed. An
 * account that is closed, held, under age, being deleted or unknown gets the gone page: no name,
 * no photo, no reason.
 */
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; slug: string }> }
const robots = { index: false, follow: true }

const load = async (slug: string) => {
  const key = profileKey(slug)
  return key ? getPublicProfile(key) : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!(await shareV2PageServed())) return SHARE_V2_NOT_SERVED
  const { locale, slug } = await params
  const profile = await load(slug)
  if (!profile) return { robots }
  const [t, site] = await Promise.all([getTranslations({ locale, namespace: 'SharePages' }), getTranslations({ locale, namespace: 'Metadata.site' })])
  const title = t('profileTitle', { name: profile.name, handle: profile.handle })
  const url = sharePageUrl(locale, `/u/${profile.slug}`)
  // The stored card when the app's backend has rendered one; otherwise the site's own card. Never drawn per request.
  const meta = createPageMetadata({ title, description: site('description'), path: `${locale === 'id' ? '/id' : ''}/u/${profile.slug}`, locale, image: profile.cardUrl ?? undefined })
  return { ...meta, robots, alternates: { canonical: url }, itunes: smartAppBanner(url), openGraph: { ...meta.openGraph, type: 'profile' } }
}

export default async function PublicProfilePage({ params }: Props) {
  if (!(await shareV2PageServed())) notFound()
  const { locale, slug } = await params
  setRequestLocale(locale)
  const [profile, t, places] = await Promise.all([load(slug), getTranslations({ locale, namespace: 'SharePages' }), getTranslations({ locale, namespace: 'Places' })])
  const appPage = localizePath(locale, '/app')
  // The board's gone line speaks of a meal, so a gone profile shows the title alone unless Devon chooses a line
  // (lib/share-page-choices.ts).
  if (!profile) return <GonePage title={t('unavailable')} body={GONE_PROFILE_LINE ? t(GONE_PROFILE_LINE) : undefined} getLabel={t('getApp')} appPage={appPage} />
  const prefix = locale === 'id' ? '/id' : ''
  // A renamed handle keeps its key; send old links to the current address.
  if (slug !== profile.slug) permanentRedirect(`${prefix}/u/${profile.slug}`)
  const initials = profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join('')
  // A photo is described by where the meal was saved, in the site's existing words. Never by its caption: a caption
  // is the diner's answer to "What was this?", not a description for strangers.
  const tile = (meal: ProfileMeal) => (
    <Link href={`${prefix}/meal/${meal.id}`} prefetch={false} className={styles.tile}>
      <Image src={meal.imageURL} alt={meal.locationName ? places('mealAlt', { name: meal.locationName }) : places('mealFallback')} width={222} height={222} sizes="(min-width: 690px) 209px, 30vw" loading="lazy" />
    </Link>
  )
  return (
    <div className={styles.shell}>
      <div className={styles.screen}>
      <main id="main-content" className={styles.column}>
        <div className={styles.pad}>
        <header className={styles.identity}>
          <div className={`${styles.avatar} ${styles.avatarLarge}`}>
            {profile.avatar ? <Image src={profile.avatar} alt="" width={84} height={84} priority /> : initials}
          </div>
          <div>
            <h1>{profile.name}</h1>
            <p className={styles.handle}>@{profile.handle}</p>
          </div>
        </header>
        {profile.top3.length ? <section aria-labelledby="profile-top3">
          <h2 id="profile-top3" className={styles.label}>{t('top3')}</h2>
          <ol className={`${styles.grid} ${styles.three}`}>{profile.top3.map((meal) => <li key={meal.id} value={meal.rank} style={{ gridColumn: meal.rank }}>{tile(meal)}</li>)}</ol>
        </section> : null}
        {profile.crowns.length ? <section aria-labelledby="profile-maitred">
          <h2 id="profile-maitred" className={styles.label}>{t('maitred')}</h2>
          <ul className={styles.crowns}>{profile.crowns.map((venue) => <li key={venue.placeId}>
            <Link href={localizePath(locale, `/places/${venue.slug}`)} prefetch={false} className={styles.crownRow}>
              <Image src="/redesign/maitred-crown.svg" alt="" width={26} height={20} className={styles.crown} />
              {venue.name}
            </Link>
          </li>)}</ul>
        </section> : null}
        {profile.recent.length ? <section aria-labelledby="profile-recent">
          <h2 id="profile-recent" className={styles.label}>{t('recent')}</h2>
          <ul className={`${styles.grid} ${styles.three}`}>{profile.recent.map((meal) => <li key={meal.id}>{tile(meal)}</li>)}</ul>
        </section> : null}
        </div>
      </main>
      <div className={styles.bar}>
        <GetMakanButton link={sharePageUrl(locale, `/u/${profile.slug}`)} appPage={appPage} label={t('getApp')} className={styles.cta} />
        <a href={`makanapp://u/${profile.slug}`} className={styles.plain}>{t('haveApp')}</a>
      </div>
      </div>
      <Footer />
    </div>
  )
}
