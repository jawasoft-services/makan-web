import Image from "next/image"
import { getLocale, getTranslations } from "next-intl/server"
import Reveal from "@/components/motion/Reveal"
import AppQr from "@/components/home/AppQr"
import MealCount from "@/components/home/MealCount"
import RegularsWidget from "@/components/home/RegularsWidget"
import StoreLink from "@/components/home/StoreLink"
import StaticPicture from "@/components/StaticPicture"
import RatingBand from "@/components/home/RatingBand"
import { localizePath } from "@/i18n/paths"

export default async function Hero({
  mealCount,
  rating,
}: {
  /** Live total from Firestore; shown rounded down to the nearest hundred. */
  mealCount: number
  /** Real App Store rating, or null when the storefront has none yet. */
  rating: { rating: number; count: number } | null
}) {
  const t = await getTranslations("Decision.Landing")
  const home = await getTranslations("Home.Hero")
  const locale = await getLocale()
  const meals = Math.max(100, Math.floor(mealCount / 100) * 100)
  const penId = "landing-underline-pen"
  const title = t("title")
  const accent = t("titleAccent")
  const hasAccent = title.includes(accent)
  const [before, after] = hasAccent ? title.split(accent) : [title, ""]

  return (
    <section className="w-full bg-brand-card">
      {rating ? <RatingBand text={t("trustRating", { rating: rating.rating.toFixed(1) })} rating={rating.rating} /> : null}
      <Reveal className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-14 md:grid-cols-[1.1fr_0.9fr] md:px-10 md:pb-24 md:pt-16">
        <div>
          <h1
            data-beat
            className="max-w-[12ch] text-[clamp(2.8rem,7vw,5.4rem)] font-bold leading-[0.96] tracking-[-0.025em] text-brand-ink"
          >
            {hasAccent ? (
              <>
                {before}
                <span className="whitespace-nowrap font-bold text-brand-orange">
                  <span className="relative inline-block">
                    <span className="relative z-[1]">{accent}</span>
                    <svg
                      className="hand-underline absolute -bottom-[0.2em] left-[-3%] z-0 h-[0.34em] w-[106%] overflow-visible text-brand-orange"
                      viewBox="0 0 300 24"
                      preserveAspectRatio="none"
                      aria-hidden
                    >
                      <defs>
                        <filter id={penId} x="-10%" y="-80%" width="120%" height="260%">
                          <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="7" result="n" />
                          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G" />
                        </filter>
                      </defs>
                      <g filter={`url(#${penId})`}>
                        <path className="hand-underline-1" d="M8,11 C80,5 222,5 292,10" />
                        <path className="hand-underline-2" d="M14,19 C92,14 212,14 286,17" />
                      </g>
                    </svg>
                  </span>
                  {after}
                </span>
              </>
            ) : (
              title
            )}
          </h1>
          <p
            data-beat
            style={{ "--beat": 1 } as React.CSSProperties}
            className="mt-6 max-w-[34ch] text-[clamp(1.05rem,1.5vw,1.3rem)] font-bold leading-[1.5] text-brand-ink"
          >
            {t("sub")}
          </p>
          <div
            data-beat
            style={{ "--beat": 2 } as React.CSSProperties}
            className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3"
          >
            <StoreLink
              location="hero"
              size="large"
              className="inline-flex min-h-11 items-center rounded-[10px] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
            >
              <Image src="/app-store-badge.svg" alt={t("badgeAlt")} width={180} height={60} className="h-[clamp(2rem,10.8vw,2.25rem)] w-auto sm:h-14" />
            </StoreLink>
            <AppQr href={localizePath(locale, "/app")} label={home("qr")} alt={home("qrAlt")} />
          </div>
          {/* The live meal count beside the ask; the rating moved to the pill above. */}
          <p
            data-beat
            style={{ "--beat": 3 } as React.CSSProperties}
            className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[clamp(1.05rem,1.4vw,1.2rem)] font-semibold text-brand-ink"
          >
            {t.rich("trustMeals", {
              meals: meals.toLocaleString(locale),
              num: () => <MealCount value={meals} locale={locale} />,
            })}
          </p>
          <a
            data-beat
            style={{ "--beat": 4 } as React.CSSProperties}
            href="#how-it-works"
            className="mt-8 inline-flex min-h-11 items-center gap-2 text-[1rem] font-semibold text-brand-ink underline decoration-brand-orange decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink"
          >
            {t("secondary")}
            <svg
              aria-hidden
              className="scroll-cue-arrow ml-1 h-7 w-5 shrink-0 text-brand-orange"
              viewBox="0 0 20 28"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 3v21m-6-6 6 6 6-6" />
            </svg>
          </a>
        </div>

        {/* Valesca's real Makan export card behind the widget (after Partiful's hero:
            product UI floating over a real moment). The widget stays on top and
            interactive; the card's own name, dish and meal-type band stays in view. */}
        <div className="relative mx-auto w-full max-w-[32rem] md:aspect-[1/1.02]">
          <div className="relative z-10 drop-shadow-[0_24px_28px_rgba(43,21,3,0.18)] md:absolute md:left-0 md:top-0 md:w-[80%]">
            <RegularsWidget
              labels={[t("regularsLabel"), t("usualLabel")]}
              alts={[t("regularsAlt"), t("usualAlt")]}
              label={t("widgetLabel")}
              rulesLabel={t("rulesLabel")}
              rules={{ title: t("rulesTitle"), qualify: t("rulesQualify"), holder: t("rulesHolder"), usual: t("rulesUsual") }}
              key={locale}
            />
          </div>
          {/* Reveal on the wrapper, tilt on the image: the reveal animation ends at
              transform: none, which would otherwise flatten the tilt. */}
          <div data-beat style={{ "--beat": 3 } as React.CSSProperties} className="relative -mt-[8%] ml-auto w-[62%] md:absolute md:right-0 md:top-[45%] md:mt-0 md:w-[56%]">
            <StaticPicture
              basePath="/static-images/v1/meals/IMG_6952"
              widths={[480, 720]}
              alt={t("heroCardAlt")}
              width={600}
              height={600}
              sizes="(min-width: 768px) 290px, 62vw"
              loading="eager"
              className="block h-auto w-full rotate-[3deg] rounded-[14px] shadow-[0_18px_40px_-12px_rgba(43,21,3,0.35)]"
            />
          </div>
        </div>
      </Reveal>
    </section>
  )
}
