import { getTranslations } from 'next-intl/server'
import StoreLink from '@/components/home/StoreLink'

/**
 * The Maître'D block on a restaurant page — the download hook.
 *
 * Ported 1:1 from the app's Maître'D UI (munchies-rn components/maitred: the
 * Crown, the Squiggle underline, the "Paper" card, the three menu entries) so
 * the web reads as the same product, not a lookalike.
 *
 * Two states, chosen by whether a published Maître'D exists here:
 *  - EMPTY SEAT (the default): the app feature ships dark, so almost every venue
 *    has no holder. This is the funnel — "nobody runs this yet, claim it" — with
 *    the reward line and the App Store CTA.
 *  - HELD: a real holder's name + their published menu ("Always order this" /
 *    "Try this if…" / "Good to know"). Rendered only when a public roster exists
 *    for the place; that projection is not web-readable yet (RM19505 unmerged),
 *    so `held` is always null today and the block safely shows the empty seat.
 *    When RM19505 ships a public roster read, pass `held` and this lights up with
 *    no further change here.
 */

export type MaitredMenuEntry = { label: string; body: string }
export type MaitredHeld = {
  holderName: string
  entries: MaitredMenuEntry[]
}

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

export default async function PlaceMaitred({
  locale,
  placeName,
  held = null,
}: {
  locale: string
  placeName: string
  held?: MaitredHeld | null
}) {
  const t = await getTranslations({ locale, namespace: 'Places' })

  // HELD: a real holder and their published menu. Inert until RM19505 exposes a
  // public roster; kept here so the page lights up with no further edit.
  if (held && held.entries.length > 0) {
    return (
      <section className="mt-8 overflow-hidden rounded-2xl bg-brand-ink p-6 text-brand-cream">
        <div className="flex items-center gap-2">
          <Crown />
          <p className="text-[0.72rem] font-extrabold uppercase tracking-[0.16em] text-brand-orange">
            {t('maitredHeldEyebrow')}
          </p>
        </div>
        <p className="mt-3 text-xl font-bold">{held.holderName}</p>
        <p className="text-sm text-brand-cream/70">{t('maitredHeldSub')}</p>
        <div className="mt-5 space-y-3">
          {held.entries.map((entry) => (
            <div key={entry.label} className="rounded-xl bg-white/[0.06] p-4">
              <p className="text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-brand-orange">{entry.label}</p>
              <p className="mt-1 text-[0.95rem] leading-snug">{entry.body}</p>
            </div>
          ))}
        </div>
        <p className="mt-5 text-center text-sm text-brand-cream/70">{t('maitredHeldFooter')}</p>
      </section>
    )
  }

  // EMPTY SEAT: the funnel. The default state for ~every venue today.
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
