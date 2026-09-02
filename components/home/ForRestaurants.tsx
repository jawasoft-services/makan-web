import { getLocale, getTranslations } from "next-intl/server"
import Image from "next/image"
import Reveal from "@/components/motion/Reveal"
import { localizePath } from "@/i18n/paths"
import type { PlaceStats } from "@/lib/makan-stats"

/**
 * The restaurant's side of what the diner just saw. Opens with a signpost
 * (the page has been talking to diners; "you" changes meaning here), then
 * the Eat (D-033, spec 2026-09-02-eats-standings-design.md), what a place
 * gets from the very first saved meal (every line live and verified), two
 * live numbers for the owner's first question ("how many of my customers?"),
 * and the Maître d' rule beside the slip from the story.
 */
export default async function ForRestaurants({ stats }: { stats: PlaceStats }) {
  const t = await getTranslations("Decision.Restaurants")
  const slip = await getTranslations("Decision.FirstDay")
  const locale = await getLocale()
  const numbers = [
    { value: stats.places, label: t("num1Label") },
    { value: stats.recentMeals, label: t("num2Label") },
  ]

  return (
    <section id="for-restaurants" className="w-full bg-brand-card px-6 py-20 md:px-10 md:py-28">
      <Reveal className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-12 md:grid-cols-[1.15fr_0.85fr] md:gap-16">
        <div>
          <p data-beat className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-orange md:text-[0.82rem]">
            {t("eyebrow")}
          </p>
          <p data-beat style={{ "--beat": 1 } as React.CSSProperties} className="mt-3 text-[1rem] font-semibold text-brand-muted">
            {t("lead")}
          </p>
          <h2
            data-beat
            style={{ "--beat": 1 } as React.CSSProperties}
            className="mt-4 max-w-[18ch] text-balance text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.02em] text-brand-ink"
          >
            {t("title")}
          </h2>
          <p
            data-beat
            style={{ "--beat": 2 } as React.CSSProperties}
            className="mt-6 max-w-[52ch] text-[1.05rem] leading-[1.55] text-brand-ink md:text-[1.1rem]"
          >
            {t("body")}
          </p>
          <ul className="mt-8 max-w-[52ch] space-y-3">
            {(["p1", "p2", "p3"] as const).map((key, i) => (
              <li
                key={key}
                data-beat
                style={{ "--beat": 3 + i } as React.CSSProperties}
                className="flex items-baseline gap-3 text-[1rem] font-semibold leading-[1.5] text-brand-ink"
              >
                <span aria-hidden className="text-[0.6rem] text-brand-orange">●</span>
                {t(key)}
              </li>
            ))}
          </ul>

          {/* What exists today, before the Eat exists: feed name, Cravings
              nudge (RM18642), Top 4 on the profile, the table QR (RM18720). */}
          <h3 data-beat style={{ "--beat": 6 } as React.CSSProperties} className="mt-12 text-[1.25rem] font-bold tracking-[-0.01em] text-brand-ink">
            {t("todayTitle")}
          </h3>
          <ul className="mt-4 max-w-[52ch] space-y-3">
            {(["today1", "today2", "today3", "today4"] as const).map((key, i) => (
              <li
                key={key}
                data-beat
                style={{ "--beat": 7 + i } as React.CSSProperties}
                className="flex items-baseline gap-3 text-[1rem] leading-[1.55] text-brand-ink"
              >
                <span aria-hidden className="text-[0.6rem] text-brand-orange">●</span>
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-center gap-10">
          {/* The claim in today1, as the friend sees it: a saved meal with
              the restaurant's name under the photo. */}
          <Image
            data-beat
            style={{ "--beat": 2 } as React.CSSProperties}
            src="/app-screens/story/feed.webp"
            alt={t("feedAlt")}
            width={760}
            height={1572}
            sizes="(min-width: 768px) 280px, 70vw"
            className="block h-auto w-full max-w-[16.5rem] drop-shadow-[0_18px_28px_rgba(43,21,3,0.22)]"
          />
          {/* Two live figures: distinct places with meals saved, and the
              trailing 30 days. Both from Firestore (lib/makan-stats.ts). */}
          <div data-beat style={{ "--beat": 3 } as React.CSSProperties} className="w-full max-w-[22rem]">
            <p className="text-[0.82rem] font-extrabold uppercase tracking-[0.15em] text-brand-ink md:text-[0.76rem]">{t("numbersTitle")}</p>
            <dl className="mt-4 grid grid-cols-2 gap-6">
              {numbers.map((n) => (
                <div key={n.label}>
                  <dt className="text-[2.4rem] font-bold leading-none tracking-[-0.02em] text-brand-orange tabular-nums">
                    {n.value.toLocaleString("en-GB")}
                  </dt>
                  <dd className="mt-2 text-[0.95rem] font-semibold leading-[1.4] text-brand-ink">{n.label}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-[0.95rem] leading-[1.5] text-brand-muted">{t("numbersWhere")}</p>
          </div>
        </div>
      </Reveal>

      {/* The Maître d', with the slip from the story seen from the other side
          of the counter. */}
      <Reveal className="mx-auto mt-16 grid max-w-5xl grid-cols-1 items-start gap-10 border-t border-brand-line pt-12 md:mt-20 md:grid-cols-[1.15fr_0.85fr] md:gap-16 md:pt-16">
        <div>
          <h3 data-beat className="text-[1.25rem] font-bold tracking-[-0.01em] text-brand-ink">
            {t("maitredTitle")}
          </h3>
          <p data-beat style={{ "--beat": 1 } as React.CSSProperties} className="mt-3 max-w-[52ch] text-[1rem] leading-[1.55] text-brand-ink">
            {t("maitredBody")}
          </p>
          <a
            data-beat
            style={{ "--beat": 2 } as React.CSSProperties}
            href={localizePath(locale, "/partner")}
            className="mt-8 inline-flex min-h-12 items-center rounded-full border-2 border-brand-ink px-7 text-base font-bold text-brand-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
          >
            {t("cta")}
          </a>
        </div>
        <div
          data-beat
          style={{ "--beat": 1 } as React.CSSProperties}
          className="mx-auto w-full max-w-[22rem] rotate-1 rounded-[3px] border border-brand-muted/25 bg-brand-cream p-5 shadow-[0_1px_2px_rgba(43,21,3,0.08),0_10px_24px_-16px_rgba(43,21,3,0.35)]"
        >
          <p className="text-[0.82rem] font-extrabold uppercase tracking-[0.15em] text-brand-ink md:text-[0.76rem]">{slip("slipFrom")}</p>
          <p className="mt-1.5 text-[0.95rem] leading-[1.5] text-brand-muted">{slip("maitredWho")}</p>
          <dl className="mt-3 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-2">
            {[
              [slip("alwaysKey"), slip("slipAlways")],
              [slip("tryKey"), slip("slipTry")],
              [slip("knowKey"), slip("slipKnow")],
            ].map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-brand-ink md:text-[0.66rem]">{key}</dt>
                <dd className="text-[0.92rem] font-medium leading-[1.45] text-brand-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </Reveal>
    </section>
  )
}
