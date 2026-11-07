import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import styles from '@/components/standings/public-pages.module.css'
import StoreLink from '@/components/home/StoreLink'
import type { MaitredPlaceState, MaitredVenue } from '@/lib/maitred'
import { getVerifiedMenuPrice } from '@/lib/verified-menu-price'

// Only an explicit vacant standing may show the empty-seat invitation.
function Crown({ hollow = false }: { hollow?: boolean }) {
  return <Image src="/redesign/maitred-crown.svg" alt="" width={68} height={52} className={hollow ? 'opacity-70' : ''} />
}

function HolderPhoto({ venue }: { venue: MaitredVenue }) {
  return venue.holderPhoto ? (
    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white/10">
      <Image src={venue.holderPhoto} alt="" fill sizes="48px" className="object-cover" />
    </span>
  ) : (
    <span aria-hidden className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-brand-cream/80">
      {venue.holderName.slice(0, 1).toUpperCase()}
    </span>
  )
}

export default async function PlaceMaitred({
  locale,
  placeName,
  state,
  faqHref,
}: {
  locale: string
  placeName: string
  state: MaitredPlaceState
  faqHref: string
}) {
  const t = await getTranslations({ locale, namespace: 'Places' })
  if (state.status === 'unavailable') return null
  const held = state.status === 'held' ? state.venue : null
  const eyebrow = styles.kicker
  const howLink = (
    <div className="mt-5 border-t border-white/10 pt-4">
      <p className="text-[0.95rem] leading-[1.5] text-brand-cream/80">{t('maitredExplain')}</p>
      <a
        href={faqHref}
        className="inline-flex min-h-11 items-center text-[0.95rem] font-semibold text-brand-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cream"
      >
        {t('maitredHow')}
      </a>
    </div>
  )

  if (held?.notes.always) {
    const menuPrice = getVerifiedMenuPrice(held.slug, held.notes.always)
    const extra = [
      { label: t('maitredAnother'), body: held.notes.another },
      { label: t('maitredWhy'), body: held.notes.why },
      { label: t('maitredTip'), body: held.notes.tip },
    ].filter((e) => e.body)
    return (
      <section aria-label={t('maitredOrderEyebrow')} className={styles.maitred}>
        <div className="flex items-center gap-2">
          <Crown />
          <p className={eyebrow}>{t('maitredOrderEyebrow')}</p>
        </div>
        <p className="mt-3.5 text-[1.75rem] font-bold leading-[1.2]" style={{ letterSpacing: '-0.015em' }}>
          {held.notes.always}
        </p>
        {menuPrice ? <a href={menuPrice.menuUrl} className="mt-1 inline-flex min-h-11 items-center text-base font-semibold leading-[1.4] text-brand-cream focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cream">{t('menuPriceLabel', { price: menuPrice.price })}</a> : null}
        <div className="mt-3.5 flex items-center gap-3">
          <HolderPhoto venue={held} />
          <p className="text-[1.0625rem] leading-[1.45]">
            {t.rich('maitredBy', { name: held.holderName, strong: (chunks) => <strong className="font-semibold">{chunks}</strong> })}
          </p>
        </div>
        {extra.length ? (
          <dl className="mt-5 space-y-3 border-t border-white/10 pt-4">
            {extra.map((e) => (
              <div key={e.label}>
                <dt className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-brand-cream/60">{e.label}</dt>
                <dd className="mt-0.5 text-[1.0625rem] leading-[1.45]">{e.body}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {howLink}
      </section>
    )
  }

  if (held) {
    return (
      <section aria-label={t('maitredHeldEyebrow')} className={styles.maitred}>
        <div className="flex items-center gap-2">
          <Crown />
          <p className={eyebrow}>{t('maitredHeldEyebrow')}</p>
        </div>
        <div className="mt-3.5 flex items-center gap-3">
          <HolderPhoto venue={held} />
          <p className="text-[1.375rem] font-bold leading-[1.25]" style={{ letterSpacing: '-0.015em' }}>
            {held.holderName}
          </p>
        </div>
        <p className="mt-3 text-[1.0625rem] leading-[1.45] text-brand-cream/80">{t('maitredNoNote')}</p>
        {howLink}
      </section>
    )
  }

  if (state.status === 'disabled' || state.status === 'unresolved') {
    return <section className={styles.maitred} aria-label="Maître d’">
      <Crown hollow />
      <p className="mt-3 text-lg font-semibold">{t(state.status === 'disabled' ? 'maitredDisabled' : 'maitredUnresolved')}</p>
      {howLink}
    </section>
  }

  // Proven vacancy only; qualifying is not a guaranteed title.
  return (
    <section className={`${styles.maitred} ${styles.maitredEmpty}`}>
      <div className="flex items-center justify-center gap-2">
        <Crown hollow />
        <p className={styles.kicker}>
          {t('maitredEyebrow')}
        </p>
      </div>
      <div
        aria-hidden
        className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-brand-orange/60 text-2xl font-bold text-brand-orange/70"
      >
        ?
      </div>
      <h2 className="mx-auto mt-4 max-w-md text-xl font-extrabold leading-snug">
        {t('maitredEmptyHead', { name: placeName })}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-[0.95rem] leading-relaxed text-brand-cream/75">
        {t('maitredEmptyBody', { name: placeName })}
      </p>
      {howLink}
      <div className="mt-5">
        <StoreLink
          location="place-maitred"
          className={styles.primary}
        >
          {t('maitredCta')}
        </StoreLink>
      </div>
    </section>
  )
}
