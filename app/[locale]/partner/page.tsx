import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Footer from '@/components/Footer'
import SiteSchema from '@/components/SiteSchema'
import PartnerForm from './PartnerForm'
import Image from 'next/image'
import { storyBlur } from '@/lib/story-blur'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import Link from 'next/link'
import { getMealCount, getPlaceStats } from '@/lib/makan-stats'
import { localizePath } from '@/i18n/paths'

// The numbers below are live from Firestore; refresh them hourly rather than
// freezing them at build.
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Partner' })
  return createPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: locale === 'id' ? '/id/partner' : '/partner',
    locale,
    image: `${SITE_URL}${locale === 'id' ? '/id' : ''}/partner/opengraph-image`,
  })
}

export default async function PartnerPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Partner')
  const [stats, mealCount] = await Promise.all([getPlaceStats(), getMealCount()])
  const numbers = [
    { value: stats.places, label: t('num1Label') },
    { value: stats.recentMeals, label: t('num2Label') },
    { value: mealCount, label: t('num3Label') },
  ]

  return (
    <div className="min-h-screen bg-brand-cream">
      <SiteSchema locale={locale} />
      <main
        id="main-content"
        className="mx-auto max-w-2xl px-5 sm:px-8 pt-24 sm:pt-32 pb-16 sm:pb-24"
      >
        {/* Hero — statement 1: this is the app people open when they can't decide. */}
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
          {t('heroEyebrow')}
        </p>
        <h1
          className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-ink"
          style={{ letterSpacing: '-0.02em' }}
        >
          {t('heroTitle')}
        </h1>
        <p className="mt-6 text-base sm:text-base leading-[1.75] text-brand-muted">
          {t('heroBody')}
        </p>

        {/* Where Makan is today — the owner's first question, answered with
            live figures (distinct places, trailing 30 days, total). */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            {t('numbersEyebrow')}
          </p>
          <h2 className="mt-3 text-2xl font-bold text-brand-ink sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
            {t('numbersTitle')}
          </h2>
          <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {numbers.map((n) => (
              <div key={n.label}>
                <dt className="text-3xl font-bold leading-none tracking-[-0.02em] text-brand-orange tabular-nums">
                  {n.value.toLocaleString('en-GB')}
                </dt>
                <dd className="mt-2 text-base leading-[1.5] text-brand-ink">{n.label}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-base leading-[1.75] text-brand-muted">
            {t('numbersWhere')}
          </p>
          {stats.topPlaces.length ? (
            <div className="mt-8">
              <h3 className="text-base font-bold text-brand-ink">{t('topPlacesTitle')}</h3>
              <ol className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 sm:grid-cols-2">
                {stats.topPlaces.map((p) => (
                  <li key={p.name} className="flex items-baseline justify-between gap-4 border-b border-brand-line pb-2 text-base leading-[1.4] text-brand-ink">
                    <span className="min-w-0 truncate font-semibold">{p.name}</span>
                    <span className="shrink-0 tabular-nums text-brand-muted">{t('topPlacesMeals', { count: p.meals })}</span>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
        </section>

        {/* What it looks like — two real screens, both live today: the
            Friends feed with the venue named (every saved meal carries
            locationName) and Discover (RM18642). */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            {t('screensEyebrow')}
          </p>
          <h2 className="mt-3 text-2xl font-bold text-brand-ink sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
            {t('screensTitle')}
          </h2>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:gap-10">
            {(
              [
                { src: '/app-screens/story/feed.webp', alt: t('screen1Alt'), caption: t('screen1Caption') },
                { src: '/app-screens/story/discover.webp', alt: t('screen2Alt'), caption: t('screen2Caption') },
              ] as const
            ).map((shot) => (
              <figure key={shot.src} className="flex flex-col items-center">
                <Image
                  src={shot.src}
                  placeholder="blur"
                  blurDataURL={storyBlur(shot.src)}
                  alt={shot.alt}
                  width={760}
                  height={1572}
                  sizes="(min-width: 640px) 240px, 42vw"
                  className="block h-auto w-full max-w-[15rem] drop-shadow-[0_18px_28px_rgba(43,21,3,0.22)]"
                />
                <figcaption className="mt-4 max-w-[22ch] text-center text-base font-semibold leading-[1.5] text-brand-ink">
                  {shot.caption}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Eats — D-033. Copy mirrors the homepage restaurant section. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            {t('eatsEyebrow')}
          </p>
          <h2 className="mt-3 text-2xl font-bold text-brand-ink sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
            {t('eatsTitle')}
          </h2>
          <p className="mt-4 text-base leading-[1.75] text-brand-ink">
            {t('eatsBody')}
          </p>
          <ul className="mt-5 space-y-3">
            {(['eats1', 'eats2', 'eats3'] as const).map((k) => (
              <li key={k} className="flex items-baseline gap-3 text-base leading-[1.75] text-brand-ink">
                <span aria-hidden className="text-[0.55rem] text-brand-orange">●</span>
                {t(k)}
              </li>
            ))}
          </ul>
          <Link
            href={localizePath(locale, '/standings')}
            className="mt-6 inline-flex min-h-11 items-center text-base font-bold text-brand-ink underline decoration-brand-orange decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink"
          >
            {t('standingsCta')}
          </Link>
        </section>

        {/* What happens today — every line verified live: Discover RM18642,
            Cravings/Want to Try RM19115 + RM17819, Eat or Yeet, venue QR
            RM18720. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            {t('liveEyebrow')}
          </p>
          <h2 className="mt-3 text-2xl font-bold text-brand-ink sm:text-3xl" style={{ letterSpacing: '-0.02em' }}>
            {t('liveTitle')}
          </h2>
          <ul className="mt-5 space-y-3">
            {(['live1', 'live2', 'live3', 'live4'] as const).map((k) => (
              <li key={k} className="flex items-baseline gap-3 text-base leading-[1.75] text-brand-ink">
                <span aria-hidden className="text-[0.55rem] text-brand-orange">●</span>
                {t(k)}
              </li>
            ))}
          </ul>
        </section>

        {/* Maître d' — statements 2, 3, 4. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            {t('maitreDEyebrow')}
          </p>
          <h2 className="mt-3 text-xl sm:text-2xl font-bold text-brand-ink">
            {t('maitreDTitle')}
          </h2>
          <p className="mt-4 text-base leading-[1.75] text-brand-muted">
            {t('maitreDBody')}
          </p>
          <p className="mt-4 text-base leading-[1.75] text-brand-muted">
            {t('maitreDGuide')}
          </p>
          <p className="mt-4 text-base leading-[1.75] text-brand-muted">
            {t('maitreDAlready')}
          </p>
          <p className="mt-4 text-base font-semibold leading-[1.75] text-brand-ink">
            {t('maitreDTell')}
          </p>
        </section>

        {/* Why it matters — statement 5, the two figures with their sources. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            {t('statsEyebrow')}
          </p>
          <h2 className="mt-3 text-xl sm:text-2xl font-bold text-brand-ink">
            {t('statsTitle')}
          </h2>
          <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
            {(['stat1', 'stat2'] as const).map((k) => (
              <div key={k}>
                <dt className="text-3xl font-bold leading-none tracking-[-0.02em] text-brand-orange">
                  {t(`${k}Number`)}
                </dt>
                <dd className="mt-2 text-base leading-[1.6] text-brand-ink">
                  {t(`${k}Body`)}
                </dd>
                <dd className="mt-1 text-sm leading-[1.4] text-brand-muted">
                  {t(`${k}Src`)}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Rewards — statement 6. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">
            {t('rewardsTitle')}
          </h2>
          <p className="mt-4 text-base leading-[1.75] text-brand-muted">
            {t('rewardsBody')}
          </p>
          <p className="mt-4 text-base font-semibold leading-[1.75] text-brand-ink">
            {t('rewardsRule')}
          </p>
        </section>

        {/* Costs — statement 9. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">
            {t('costsTitle')}
          </h2>
          <p className="mt-4 text-base leading-[1.75] text-brand-muted">
            {t('costsFree')}
          </p>
          <p className="mt-6 text-base font-semibold text-brand-ink">
            {t('costsNeverTitle')}
          </p>
          <ul className="mt-3 space-y-2">
            {(['costsNever1', 'costsNever2', 'costsNever3'] as const).map((k) => (
              <li key={k} className="flex items-baseline gap-3 text-base leading-[1.65] text-brand-muted">
                <span aria-hidden className="text-[0.6rem] text-brand-orange">●</span>
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* What Makan will never do — statement 10. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">
            {t('rulesTitle')}
          </h2>
          <ul className="mt-4 space-y-3">
            {(['rule1', 'rule2', 'rule3'] as const).map((k) => (
              <li key={k} className="flex items-baseline gap-3 text-base leading-[1.65] text-brand-muted">
                <span aria-hidden className="text-[0.6rem] text-brand-orange">●</span>
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Sign-up form — unchanged component, just given a home in the page flow. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-orange">
            {t('formEyebrow')}
          </p>
          <div className="mt-6 flex justify-center">
            <PartnerForm />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
