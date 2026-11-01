import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import StoreLink from '@/components/home/StoreLink'
import type { MaitredVenue } from '@/lib/maitred'

/**
 * The Maître'D block on a restaurant page.
 *
 * Ported from the app's Maître'D UI (munchies-rn components/maitred: the
 * Crown, the Squiggle underline) so the web reads as the same product.
 *
 * Three states, from the daily Maître d' aggregate (lib/maitred.ts):
 *  - HELD WITH A NOTE: what to order here, the holder's name and photo,
 *    their other notes as written (never translated), and what a Maître d' is.
 *  - HELD, NO NOTE: who holds the seat, and that they have not left a note.
 *  - EMPTY SEAT: nobody holds it; the funnel with the App Store CTA.
 * The page renders none of them when the aggregate cannot be read, so a
 * failed read never claims an empty seat.
 */

// The app's crown (components/maitred/MaitredUi.tsx Crown), same viewBox + path.
function Crown({ hollow = false }: { hollow?: boolean }) {
  return (
    <svg width={30} height={30 * 0.78} viewBox="0 0 35 27" aria-hidden className="text-brand-orange">
      <path
        d="M4 7 L11 12 L17 3 L23 12 L31 6 L28 21 Q17 24 7 21 Z"
        fill={hollow ? 'none' : 'currentColor'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  )
}

// The app's hand-drawn underline (MaitredUi.tsx Squiggle).
function Squiggle() {
  return (
    <svg height={10} width="100%" viewBox="0 0 340 12" preserveAspectRatio="none" aria-hidden className="mt-1 text-brand-orange">
      <path
        d="M2 6 Q10 0 18 6 T34 6 T50 6 T66 6 T82 6 T98 6 T114 6 T130 6 T146 6 T162 6 T178 6 T194 6 T210 6 T226 6 T242 6 T258 6 T274 6 T290 6 T306 6 T322 6 T338 6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.4}
      />
    </svg>
  )
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
  held,
  faqHref,
}: {
  locale: string
  placeName: string
  held: MaitredVenue | null
  faqHref: string
}) {
  const t = await getTranslations({ locale, namespace: 'Places' })
  const eyebrow = 'text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-brand-orange'
  const howLink = (
    <div className="mt-5 border-t border-white/10 pt-4">
      <p className="text-[0.95rem] leading-[1.5] text-brand-cream/80">{t('maitredExplain')}</p>
      <a
        href={faqHref}
        className="inline-flex min-h-11 items-center text-[0.95rem] font-semibold text-brand-cream underline decoration-brand-orange/70 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-cream"
      >
        {t('maitredHow')}
      </a>
    </div>
  )

  if (held?.notes.always) {
    const extra = [
      { label: t('maitredAnother'), body: held.notes.another },
      { label: t('maitredWhy'), body: held.notes.why },
      { label: t('maitredTip'), body: held.notes.tip },
    ].filter((e) => e.body)
    return (
      <section aria-label={t('maitredOrderEyebrow')} className="mt-6 overflow-hidden rounded-2xl bg-brand-ink p-6 text-brand-cream sm:p-7">
        <div className="flex items-center gap-2">
          <Crown />
          <p className={eyebrow}>{t('maitredOrderEyebrow')}</p>
        </div>
        <p className="mt-3.5 text-[1.75rem] font-bold leading-[1.2]" style={{ letterSpacing: '-0.015em' }}>
          {held.notes.always}
        </p>
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
      <section aria-label={t('maitredHeldEyebrow')} className="mt-6 overflow-hidden rounded-2xl bg-brand-ink p-6 text-brand-cream sm:p-7">
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

  // EMPTY SEAT: the funnel.
  return (
    <section className="mt-8 overflow-hidden rounded-2xl bg-brand-ink p-6 text-center text-brand-cream">
      <div className="flex items-center justify-center gap-2">
        <Crown hollow />
        <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-brand-orange">
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
      <div className="mx-auto mt-4 max-w-md rounded-xl border border-brand-orange/30 bg-brand-orange/[0.12] px-4 py-3 text-[0.95rem] font-semibold leading-snug">
        {t('maitredReward', { name: placeName })}
      </div>
      <div className="mx-auto mt-5 max-w-xs">
        <Squiggle />
      </div>
      <div className="mt-5">
        <StoreLink
          location="place-maitred"
          className="inline-flex h-12 items-center justify-center rounded-full bg-brand-orange px-7 text-base font-bold text-white transition-shadow hover:shadow-lg hover:shadow-black/20"
        >
          {t('maitredCta')}
        </StoreLink>
      </div>
    </section>
  )
}
