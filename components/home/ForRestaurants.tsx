import { getLocale, getTranslations } from "next-intl/server"
import Image from "next/image"
import Reveal from "@/components/motion/Reveal"
import { localizePath } from "@/i18n/paths"

/**
 * The restaurant's side of what the diner just saw. Everything in the first
 * half is live and verified (Discover RM18642, Cravings and Want to Try
 * RM19115/RM17819, the venue QR RM18720, nothing to pay); the Maitre'D rule follows as the second half. The slip from the
 * story appears again beside it, from the other side of the counter.
 */
export default async function ForRestaurants() {
  const t = await getTranslations("Decision.Restaurants")
  const slip = await getTranslations("Decision.FirstDay")
  const locale = await getLocale()

  return (
    <section id="for-restaurants" className="w-full bg-brand-card px-6 py-20 md:px-10 md:py-28">
      <Reveal className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-12 md:grid-cols-[1.15fr_0.85fr] md:gap-16">
        <div>
          <p data-beat className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-orange md:text-[0.74rem]">
            {t("eyebrow")}
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

          <p data-beat style={{ "--beat": 6 } as React.CSSProperties} className="mt-12 text-[1.25rem] font-bold tracking-[-0.01em] text-brand-ink">
            {t("maitredTitle")}
          </p>
          <p data-beat style={{ "--beat": 7 } as React.CSSProperties} className="mt-3 max-w-[52ch] text-[1rem] leading-[1.55] text-brand-ink">
            {t("maitredBody")}
          </p>

          {/* Two numbers from the handout, each with its source in ink. */}
          <dl className="mt-10 grid max-w-[52ch] grid-cols-2 gap-6">
            {(["stat1", "stat2"] as const).map((k, i) => (
              <div key={k} data-beat style={{ "--beat": 8 + i } as React.CSSProperties}>
                <dt className="text-[2.4rem] font-bold leading-none tracking-[-0.02em] text-brand-orange">{t(k)}</dt>
                <dd className="mt-2 text-[0.95rem] font-semibold leading-[1.45] text-brand-ink">{t(`${k}Body`)}</dd>
                <dd className="mt-1 text-[0.78rem] leading-[1.4] text-brand-muted">{t(`${k}Src`)}</dd>
              </div>
            ))}
          </dl>
          <a
            data-beat
            style={{ "--beat": 10 } as React.CSSProperties}
            href={localizePath(locale, "/partner")}
            className="mt-10 inline-flex min-h-12 items-center rounded-full border-2 border-brand-ink px-7 text-sm font-bold text-brand-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
          >
            {t("cta")}
          </a>
        </div>

        <div className="flex flex-col items-center gap-10">
          {/* The nudge, as the diner sees it: one good option nearby, from
              their Cravings, with the distance (Discover, RM18642). */}
          <Image
            data-beat
            style={{ "--beat": 2 } as React.CSSProperties}
            src="/app-screens/story/discover.webp"
            alt={t("discoverAlt")}
            width={760}
            height={1572}
            sizes="(min-width: 768px) 280px, 70vw"
            className="block h-auto w-full max-w-[16.5rem] drop-shadow-[0_18px_28px_rgba(43,21,3,0.22)]"
          />
        {/* The same slip the diner saw, from the restaurant's side. */}
        <div
          data-beat
          style={{ "--beat": 3 } as React.CSSProperties}
          className="mx-auto w-full max-w-[22rem] rotate-1 rounded-[3px] border border-brand-muted/25 bg-brand-cream p-5 shadow-[0_1px_2px_rgba(43,21,3,0.08),0_10px_24px_-16px_rgba(43,21,3,0.35)] md:mt-10"
        >
          <p className="text-[0.74rem] font-extrabold uppercase tracking-[0.15em] text-brand-ink md:text-[0.68rem]">{slip("slipFrom")}</p>
          <p className="mt-1.5 text-[0.8rem] leading-[1.5] text-brand-muted">{slip("maitredWho")}</p>
          <dl className="mt-3 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-2">
            {[
              [slip("alwaysKey"), slip("slipAlways")],
              [slip("tryKey"), slip("slipTry")],
              [slip("knowKey"), slip("slipKnow")],
            ].map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-brand-ink md:text-[0.66rem]">{key}</dt>
                <dd className="text-[0.85rem] font-medium leading-[1.45] text-brand-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        </div>
      </Reveal>
    </section>
  )
}
