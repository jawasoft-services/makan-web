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

export const revalidate = 3600

export async function generateMetadata({ params }: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Partner' })
  return createPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: locale === 'id' ? '/id/partner' : '/partner',
    locale,
    image: SITE_URL + (locale === 'id' ? '/id' : '') + '/partner/opengraph-image',
  })
}

export default async function PartnerPage({ params }: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('Partner')
  const [stats, mealCount] = await Promise.all([getPlaceStats(), getMealCount()])
  const numberFormat = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-GB')
  const numbers = [
    { value: stats.places, label: t('num1Label') },
    { value: stats.recentMeals, label: t('num2Label') },
    { value: mealCount, label: t('num3Label') },
  ]
  const heading = 'text-balance text-3xl font-bold leading-tight tracking-tight text-brand-ink sm:text-4xl'
  const prose = 'text-base leading-relaxed text-brand-muted'
  const link = 'inline-flex min-h-11 items-center gap-2 font-bold text-brand-ink underline decoration-brand-orange decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink'

  return (
    <div className="min-h-screen bg-brand-cream">
      <SiteSchema locale={locale} />
      <main id="main-content" className="mx-auto max-w-6xl [overflow-wrap:anywhere] px-[20px] pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-36">
        <section aria-labelledby="partner-title" className="grid items-center gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:gap-16">
          <div>
            <h1 id="partner-title" className="max-w-[15ch] text-balance text-[clamp(2.5rem,5vw,4.8rem)] font-bold leading-[1.06] tracking-[-0.035em] text-brand-ink">
              {t('heroTitle')}
            </h1>
            <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-brand-muted">{t('heroBody')}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3">
              <a href="#enquire" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-brand-orange px-[18px] font-bold sm:px-7 text-white transition-colors hover:bg-brand-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink">
                {t('heroCta')}
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </a>
              <a href="#how-it-works" className={link}>{t('howCta')}</a>
            </div>
            <p className="mt-5 text-sm font-semibold text-brand-ink">{t('heroOffer')}</p>
          </div>
          <figure className="rounded-3xl bg-brand-card px-[24px] pb-[24px] pt-[32px] sm:px-10">
            <Image src="/app-screens/story/feed.webp" alt={t('screen1Alt')} width={760} height={1572} sizes="(min-width: 1024px) 260px, 240px" placeholder="blur" blurDataURL={storyBlur('/app-screens/story/feed.webp')} priority className="mx-auto h-auto w-full max-w-[14rem] drop-shadow-[0_14px_24px_rgba(43,21,3,0.16)]" />
            <figcaption className="mx-auto mt-5 max-w-[25ch] text-center text-sm font-semibold leading-relaxed text-brand-ink">{t('screen1Caption')}</figcaption>
          </figure>
        </section>

        <section id="how-it-works" aria-labelledby="visibility-title" className="mt-16 scroll-mt-28 border-t border-brand-line pt-12 sm:mt-20 sm:pt-16">
          <div className="grid items-center gap-10 md:grid-cols-[1.25fr_0.75fr] md:gap-16">
            <div>
              <h2 id="visibility-title" className={heading}>{t('liveTitle')}</h2>
              <ul className="mt-8 space-y-6">
                {(['live1', 'live2', 'live3', 'live4'] as const).map((key) => (
                  <li key={key}>
                    <h3 className="text-lg font-bold text-brand-ink">{t(key + 'Title')}</h3>
                    <p className={'mt-2 max-w-[55ch] ' + prose}>{t(key)}</p>
                  </li>
                ))}
              </ul>
            </div>
            <figure className="flex flex-col items-center">
              <Image src="/app-screens/story/discover.webp" alt={t('screen2Alt')} width={760} height={1572} sizes="240px" placeholder="blur" blurDataURL={storyBlur('/app-screens/story/discover.webp')} className="h-auto w-full max-w-[13rem] drop-shadow-[0_14px_24px_rgba(43,21,3,0.16)]" />
              <figcaption className="mt-5 max-w-[27ch] text-center text-sm font-semibold leading-relaxed text-brand-ink">{t('screen2Caption')}</figcaption>
            </figure>
          </div>
        </section>

        <section aria-labelledby="regulars-title" className="mt-16 rounded-3xl bg-brand-card p-[24px] sm:mt-20 sm:p-10">
          <div className="grid gap-8 md:grid-cols-[0.9fr_1.1fr] md:gap-12">
            <div>
              <h2 id="regulars-title" className={heading}>{t('maitreDTitle')}</h2>
              <p className="mt-5 text-lg font-semibold leading-relaxed text-brand-ink">{t('maitreDAlready')}</p>
            </div>
            <div className="space-y-4">
              <p className={prose}>{t('maitreDBody')}</p>
              <p className={prose}>{t('maitreDGuide')}</p>
              <p className="text-base font-semibold leading-relaxed text-brand-ink">{t('maitreDTell')}</p>
            </div>
          </div>
          <div className="mt-8 border-t border-brand-line pt-6">
            <h3 className="text-xl font-bold text-brand-ink">{t('rewardsTitle')}</h3>
            <p className={'mt-3 max-w-[75ch] ' + prose}>{t('rewardsBody')}</p>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-brand-ink">{t('rewardsRule')}</p>
          </div>
        </section>

        <section aria-labelledby="eats-title" className="mt-16 grid items-start gap-10 sm:mt-20 lg:grid-cols-2 lg:gap-12">
          <div>
            <h2 id="eats-title" className={heading}>{t('eatsTitle')}</h2>
            <p className="mt-5 text-lg font-semibold leading-relaxed text-brand-ink">{t('eatsLine')}</p>
            <p className={'mt-4 ' + prose}>{t('eatsBody')}</p>
            <ul className="mt-5 list-disc space-y-3 pl-5 text-base leading-relaxed text-brand-muted marker:text-brand-ink">
              {(['eats1', 'eats2', 'eats3'] as const).map((key) => <li key={key}>{t(key)}</li>)}
            </ul>
            <Link href={localizePath(locale, '/standings')} className={'mt-5 ' + link}>{t('standingsCta')}</Link>
          </div>
          <figure className="flex flex-col items-center">
            <Image src="/app-screens/story/eat-or-yeet.webp" alt={t('eatsScreenAlt')} width={760} height={1572} sizes="220px" className="h-auto w-full max-w-[12rem] drop-shadow-[0_14px_24px_rgba(43,21,3,0.16)]" />
            <figcaption className="mt-5 max-w-[28ch] text-center text-sm font-semibold leading-relaxed text-brand-ink">{t('eatsScreenCaption')}</figcaption>
          </figure>
        </section>

        <section aria-labelledby="activity-title" className="mt-16 border-t border-brand-line pt-12 sm:mt-20">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
            <div>
              <h2 id="activity-title" className={heading}>{t('numbersTitle')}</h2>
              <p className={'mt-4 ' + prose}>{t('numbersWhere')}</p>
              <p className={'mt-3 ' + prose}>{t('numbersContext')}</p>
            </div>
            <div>
              <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
                {numbers.map((number) => (
                  <div key={number.label} className="border-b border-brand-line pb-4">
                    <dt className="text-3xl font-bold tracking-tight text-brand-orange tabular-nums">{numberFormat.format(number.value)}</dt>
                    <dd className="mt-2 text-sm leading-relaxed text-brand-muted">{number.label}</dd>
                  </div>
                ))}
              </dl>
              {stats.topPlaces.length > 0 && (
                <details className="mt-6">
                  <summary className="min-h-11 cursor-pointer py-2 text-base font-bold text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink">{t('topPlacesTitle')}</summary>
                  <ol className="mt-3 space-y-3">
                    {stats.topPlaces.map((place) => <li key={place.name} className="flex items-baseline justify-between gap-4 border-b border-brand-line pb-3 text-sm"><span className="min-w-0 font-semibold text-brand-ink">{place.name}</span><span className="shrink-0 text-brand-muted tabular-nums">{t('topPlacesMeals', { count: place.meals })}</span></li>)}
                  </ol>
                </details>
              )}
            </div>
          </div>
        </section>

        <section aria-labelledby="research-title" className="mt-12 grid gap-8 border-t border-brand-line pt-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
          <div>
            <h2 id="research-title" className="text-2xl font-bold tracking-tight text-brand-ink">{t('statsTitle')}</h2>
            <p className={'mt-3 ' + prose}>{t('researchContext')}</p>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2">
            {(['stat1', 'stat2'] as const).map((key, index) => (
              <div key={key}>
                <dt className="text-3xl font-bold text-brand-orange">{t(key + 'Number')}</dt>
                <dd className={'mt-2 ' + prose}>{t(key + 'Body')}</dd>
                <dd className="mt-3 text-sm text-brand-muted"><a href={index === 0 ? 'https://www.olo.com/blog/the-high-cost-of-anonymous-restaurant-guests' : 'https://pos.toasttab.com/blog/data/regulars-report'} className="inline-flex min-h-11 items-center underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink">{t(key + 'Src')}</a></dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="questions-title" className="mt-16 sm:mt-20">
          <h2 id="questions-title" className={heading}>{t('faqTitle')}</h2>
          <div className="mt-6 border-t border-brand-line">
            {(['faqCost', 'faqDiscount', 'faqDemand', 'faqNext'] as const).map((key) => (
              <details key={key} className="border-b border-brand-line py-4">
                <summary className="min-h-11 cursor-pointer py-2 text-lg font-bold text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink">{t(key)}</summary>
                <p className={'mt-3 max-w-[75ch] pb-2 ' + prose}>{t(key + 'Answer')}</p>
              </details>
            ))}
          </div>
        </section>

        <section id="enquire" aria-labelledby="enquiry-title" className="mt-16 scroll-mt-28 rounded-3xl bg-brand-espresso p-[24px] sm:mt-20 sm:p-10">
          <div className="grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-12">
            <div>
              <h2 id="enquiry-title" className="text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">{t('costsTitle')}</h2>
              <p className="mt-5 text-base leading-relaxed text-brand-espresso-muted">{t('costsFree')}</p>
              <ul className="mt-6 space-y-3 text-base font-semibold leading-relaxed text-white">
                {(['costsNever1', 'costsNever2', 'costsNever3'] as const).map((key) => <li key={key}>{t(key)}</li>)}
              </ul>
              <h3 className="mt-8 text-lg font-bold text-white">{t('rulesTitle')}</h3>
              <ul className="mt-4 list-disc space-y-3 pl-5 text-sm leading-relaxed text-brand-espresso-muted">
                {(['rule1', 'rule2', 'rule3'] as const).map((key) => <li key={key}>{t(key)}</li>)}
              </ul>
            </div>
            <div className="min-w-0 rounded-2xl bg-brand-card p-[24px] sm:p-7"><PartnerForm /></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
