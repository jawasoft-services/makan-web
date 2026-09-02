import { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Footer from '@/components/Footer'
import PartnerForm from './PartnerForm'
import { createPageMetadata } from '@/lib/site-metadata'

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

  return (
    <div className="min-h-screen bg-brand-cream">
      <main
        id="main-content"
        className="mx-auto max-w-2xl px-5 sm:px-8 pt-24 sm:pt-32 pb-16 sm:pb-24"
      >
        {/* Hero — statement 1: this is the app people open when they can't decide. */}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
          {t('heroEyebrow')}
        </p>
        <h1
          className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-ink"
          style={{ letterSpacing: '-0.02em' }}
        >
          {t('heroTitle')}
        </h1>
        <p className="mt-6 text-[15px] sm:text-base leading-[1.75] text-brand-muted">
          {t('heroBody')}
        </p>

        {/* Maître d' — statements 2, 3, 4. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
            {t('maitreDEyebrow')}
          </p>
          <h2 className="mt-3 text-xl sm:text-2xl font-bold text-brand-ink">
            {t('maitreDTitle')}
          </h2>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {t('maitreDBody')}
          </p>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {t('maitreDGuide')}
          </p>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {t('maitreDAlready')}
          </p>
        </section>

        {/* Why it matters — statement 5, the two figures with their sources. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
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
                <dd className="mt-2 text-[15px] leading-[1.6] text-brand-ink">
                  {t(`${k}Body`)}
                </dd>
                <dd className="mt-1 text-[13px] leading-[1.4] text-brand-muted">
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
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {t('rewardsBody')}
          </p>
          <p className="mt-4 text-[15px] font-semibold leading-[1.75] text-brand-ink">
            {t('rewardsRule')}
          </p>
        </section>

        {/* What you do — statement 7. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">
            {t('doTitle')}
          </h2>
          <ol className="mt-4 space-y-3">
            {(['do1', 'do2', 'do3'] as const).map((k, i) => (
              <li key={k} className="flex items-baseline gap-3 text-[15px] leading-[1.65] text-brand-muted">
                <span className="shrink-0 text-[13px] font-bold text-brand-orange">{i + 1}.</span>
                <span>{t(k)}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* New customers — statement 8. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">
            {t('newTitle')}
          </h2>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {t('newBody')}
          </p>
        </section>

        {/* Costs — statement 9. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">
            {t('costsTitle')}
          </h2>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {t('costsFree')}
          </p>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {t('costsPerk')}
          </p>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {t('costsDiscount')}
          </p>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {t('costsFlat')}
          </p>
          <p className="mt-6 text-[15px] font-semibold text-brand-ink">
            {t('costsNeverTitle')}
          </p>
          <ul className="mt-3 space-y-2">
            {(['costsNever1', 'costsNever2', 'costsNever3'] as const).map((k) => (
              <li key={k} className="flex items-baseline gap-3 text-[15px] leading-[1.65] text-brand-muted">
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
              <li key={k} className="flex items-baseline gap-3 text-[15px] leading-[1.65] text-brand-muted">
                <span aria-hidden className="text-[0.6rem] text-brand-orange">●</span>
                <span>{t(k)}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* The honest bit — statement 11. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">
            {t('honestTitle')}
          </h2>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {t('honestBody1')}
          </p>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {t('honestBody2')}
          </p>
        </section>

        {/* Sign-up form — unchanged component, just given a home in the page flow. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
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
