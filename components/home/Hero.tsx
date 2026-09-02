import Image from "next/image"
import { getTranslations } from "next-intl/server"
import Reveal from "@/components/motion/Reveal"
import PenRing from "@/components/decision/PenRing"
import StoreLink from "@/components/home/StoreLink"

// Real saved meals (share cards already published on the live meal strip):
// the three Eat or Yeet winners from the story below, fanned like a hand of
// cards. The front card carries the pen ring — the site's one gesture, teased.
const CARDS = [
  { name: "Sushi", src: "/meals/story/card-40.jpg", rotate: "-8deg", x: "0rem", y: "1.2rem" },
  { name: "Hangover Tom yum", src: "/meals/story/IMG_6959.jpg", rotate: "2deg", x: "4.5rem", y: "0rem" },
  { name: "Chilli prawns", src: "/meals/story/card-15.jpg", rotate: "9deg", x: "9rem", y: "1.6rem" },
]

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
  const meals = Math.max(100, Math.floor(mealCount / 100) * 100)
  // A rating from a handful of people reads as thin; show it once it has weight.
  const MIN_RATINGS = 10
  const showRating = rating !== null && rating.count >= MIN_RATINGS
  const penId = "landing-underline-pen"
  const title = t("title")
  const accent = t("titleAccent")
  const hasAccent = title.includes(accent)
  const [before, after] = hasAccent ? title.split(accent) : [title, ""]

  return (
    <section className="w-full bg-brand-card">
      <Reveal className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-16 pt-24 md:grid-cols-[1.1fr_0.9fr] md:px-10 md:pb-24 md:pt-32">
        <div>
          <h1
            data-beat
            className="max-w-[12ch] text-[clamp(2.8rem,7vw,5.4rem)] font-bold leading-[0.96] tracking-[-0.025em] text-brand-ink"
          >
            {hasAccent ? (
              <>
                {before}
                <span className="whitespace-nowrap">
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
            className="mt-6 max-w-[34ch] text-[clamp(1.05rem,1.5vw,1.3rem)] font-semibold leading-[1.5] text-brand-orange"
          >
            {t("sub")}
          </p>
          <div
            data-beat
            style={{ "--beat": 2 } as React.CSSProperties}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3"
          >
            <StoreLink
              location="hero"
              className="inline-block rounded-[10px] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
            >
              <Image src="/app-store-badge.svg" alt={t("badgeAlt")} width={180} height={60} className="h-14 w-auto" />
            </StoreLink>
            <span className="text-[0.86rem] font-semibold uppercase tracking-[0.14em] text-brand-orange md:text-[0.82rem]">
              {t("platform")}
            </span>
          </div>
          {/* One trust signal beside the ask, both numbers real: the live
              meal count, where those meals are, and the storefront rating (only when
              it has one). */}
          <p
            data-beat
            style={{ "--beat": 3 } as React.CSSProperties}
            className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.95rem] font-semibold text-brand-muted"
          >
            <span className="whitespace-nowrap">{t("trustMeals", { meals: meals.toLocaleString() })}</span>
            {/* Answers "is this a Bali thing?" before the Bali menu below does. */}
            <span>{t("trustWhere")}</span>
            {showRating && rating ? (
              <span className="whitespace-nowrap">
                <span aria-hidden className="text-brand-orange">★ </span>
                {t("trustRating", { rating: rating.rating.toFixed(1), count: rating.count })}
              </span>
            ) : null}
          </p>
          <a
            data-beat
            style={{ "--beat": 4 } as React.CSSProperties}
            href="#how-it-works"
            className="mt-8 inline-flex min-h-11 items-center gap-2 text-[1rem] font-semibold text-brand-ink underline decoration-brand-orange decoration-2 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink"
          >
            {t("secondary")}
            {/* The cue. Once the hero has revealed, the arrow flies a drawn
                route (CSS motion path, nose leading the tangent): a wind-up
                dip, a climb, one full loop, a hook at the top, a swoop back
                over the words, and a straight-down landing with a squash. A
                hand-drawn trail draws itself behind it and fades. Then, on a
                loop, the plain cue: the shaft stretches downward and springs
                back. Fixed box, so none of it shifts the text
                (app/globals.css .scroll-cue). Reduced motion: a still arrow. */}
            <span aria-hidden className="scroll-cue relative ml-1 inline-block h-[1.45em] w-[1.25em] text-brand-orange">
              <svg
                className="scroll-cue-trail pointer-events-none absolute"
                style={{ left: -40, top: -60, width: 160, height: 110 }}
                viewBox="-40 -60 160 110"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              >
                <path d="M11,12 C11,22 18,28 30,22 C44,15 52,20 58,24 C69,24 78,15 78,4 C78,-7 69,-16 58,-16 C47,-16 38,-7 38,4 C38,15 47,24 58,24 C72,24 90,14 92,-2 C92,-14 92,-34 78,-34 C64,-34 62,-16 74,-14 C86,-12 60,-44 30,-38 C6,-33 -8,-16 -4,-6 C-1,0 11,0 11,12" pathLength={1} />
              </svg>
              <span className="scroll-cue-arrow absolute left-0 top-0 flex flex-col items-center">
                <span className="scroll-cue-shaft block w-[2.6px] rounded-full bg-current" />
                <svg viewBox="0 0 20 12" className="-mt-[1px] h-[0.6em] w-[1.1em]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 2l7 8 7-8" />
                </svg>
              </span>
            </span>
          </a>
        </div>

        {/* A hand of real meals. Rotations and offsets are deliberate: this is
            a pile on a table, not a grid. All three are above the fold, so all
            three load eagerly — a card popping in late is the first thing a
            visitor would notice. */}
        <div
          data-beat
          style={{ "--beat": 2 } as React.CSSProperties}
          className="relative mx-auto h-[19rem] w-[22rem] max-w-full md:h-[24rem] md:w-[26rem]"
          role="group"
          aria-label={t("cardsAlt")}
        >
          {CARDS.map((card, i) => (
            <figure
              key={card.name}
              className="saved-card absolute left-0 top-0 w-[13.5rem] md:w-[15.5rem]"
              style={{ transform: `translate(${card.x}, ${card.y}) rotate(${card.rotate})`, zIndex: i }}
            >
              <div className="overflow-hidden rounded-xl">
                <div className="relative aspect-[3/2]">
                  <Image src={card.src} alt={card.name} fill sizes="248px" className="object-cover object-top" priority />
                  {i === 2 ? (
                    <span aria-hidden className="pointer-events-none absolute -inset-[6%] block">
                      <PenRing className="-rotate-1" />
                    </span>
                  ) : null}
                </div>
                <figcaption className="px-3 py-2.5 text-[0.95rem] font-bold text-brand-ink">{card.name}</figcaption>
              </div>
            </figure>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
