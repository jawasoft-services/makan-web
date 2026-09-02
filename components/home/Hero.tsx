import Image from "next/image"
import { getTranslations } from "next-intl/server"
import Reveal from "@/components/motion/Reveal"

// Real saved meals (share cards already published on the live meal strip):
// the three Eat or Yeet winners from the story below, fanned like a hand of
// cards. The front card carries the pen ring — the site's one gesture, teased.
const CARDS = [
  { name: "Sushi", src: "/meals/card-40.jpg", rotate: "-8deg", x: "0rem", y: "1.2rem" },
  { name: "Hangover Tom yum", src: "/meals/IMG_6959.jpg", rotate: "2deg", x: "4.5rem", y: "0rem" },
  { name: "Date night", src: "/meals/card-15.jpg", rotate: "9deg", x: "9rem", y: "1.6rem" },
]

export default async function Hero() {
  const t = await getTranslations("Decision.Landing")
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
                      className="absolute -bottom-[0.2em] left-[-3%] z-0 h-[0.34em] w-[106%] overflow-visible"
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
                        <path className="hand-underline-1" stroke="#FF9932" fill="none" strokeWidth="6" strokeLinecap="round" vectorEffect="non-scaling-stroke" d="M8,11 C80,5 222,5 292,10" />
                        <path className="hand-underline-2" stroke="#FF9932" fill="none" strokeWidth="3.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.9" d="M14,19 C92,14 212,14 286,17" />
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
            className="mt-6 max-w-[34ch] text-[clamp(1.05rem,1.5vw,1.3rem)] leading-[1.5] text-brand-muted"
          >
            {t("sub")}
          </p>
          <div
            data-beat
            style={{ "--beat": 2 } as React.CSSProperties}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3"
          >
            <span className="inline-flex items-center rounded-full bg-brand-orange px-8 py-4 text-base font-bold text-white shadow-[0_10px_24px_-10px_rgba(255,153,50,0.6)]">
              {t("cta")}
            </span>
            <span className="text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-brand-muted">
              {t("platform")}
            </span>
          </div>
          <a
            data-beat
            style={{ "--beat": 3 } as React.CSSProperties}
            href="#story"
            className="mt-8 inline-flex items-center gap-2 text-[0.9rem] font-semibold text-brand-ink underline decoration-brand-orange decoration-2 underline-offset-4"
          >
            {t("secondary")} <span aria-hidden>↓</span>
          </a>
        </div>

        {/* A hand of real meals. Rotations and offsets are deliberate: this is
            a pile on a table, not a grid. */}
        <div
          data-beat
          style={{ "--beat": 2 } as React.CSSProperties}
          className="relative mx-auto h-[19rem] w-[22rem] max-w-full md:h-[24rem] md:w-[26rem]"
          aria-label={t("cardsAlt")}
        >
          {CARDS.map((card, i) => (
            <figure
              key={card.name}
              className="absolute left-0 top-0 w-[13.5rem] rounded-xl border border-brand-muted/20 bg-brand-card shadow-[0_18px_40px_-18px_rgba(43,21,3,0.45)] md:w-[15.5rem]"
              style={{ transform: `translate(${card.x}, ${card.y}) rotate(${card.rotate})`, zIndex: i }}
            >
              <div className="overflow-hidden rounded-xl">
                <div className="relative aspect-[3/2]">
                  <Image src={card.src} alt={card.name} fill sizes="248px" className="object-cover object-top" priority={i === 2} />
                  {i === 2 ? (
                    <span aria-hidden className="pointer-events-none absolute -inset-[6%] block">
                      <svg className="hand-ring h-full w-full -rotate-1 overflow-visible" viewBox="0 0 300 90" preserveAspectRatio="none">
                        <path className="hand-ring-lap1" d="M31,54 C25,30 74,13 149,9 C221,5 289,17 286,42 C283,67 209,86 141,84 C71,82 22,73 33,45" />
                        <path className="hand-ring-lap2" d="M33,45 C40,27 78,18 131,13 C167,9 205,10 231,15" />
                      </svg>
                    </span>
                  ) : null}
                </div>
                <figcaption className="px-3 py-2.5 text-[0.85rem] font-bold text-brand-ink">{card.name}</figcaption>
              </div>
            </figure>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
