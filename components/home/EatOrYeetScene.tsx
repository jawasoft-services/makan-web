import { getTranslations } from "next-intl/server"
import {
  EatOrYeetDuel,
  SettledDuel,
  type Duel,
} from "@/components/decision/EatOrYeetDuel"
import ScrollScene from "@/components/motion/ScrollScene"
import { APP_STORE_URL } from "@/lib/links"

// Real saved meals (share cards already published on the live meal strip).
// They are shown as what they are — other people's Eat or Yeet picks, the
// evidence Makan learns from — never as the reader's own. Three comparisons,
// each teaching one taste fact that adds up to the barramundi: fish over
// beef, fresh spice over fried, chilli over creamy.
const DUELS: Duel[] = [
  {
    a: { name: "ROS BEEEEF", src: "/meals/card-30.jpg" },
    b: { name: "Sushi", src: "/meals/card-40.jpg" },
    winner: "b",
  },
  {
    a: { name: "Fish Sando", src: "/meals/card-46.jpg" },
    b: { name: "Hangover Tom yum", src: "/meals/IMG_6959.jpg" },
    winner: "b",
  },
  {
    a: { name: "Bacon and Brie", src: "/meals/card-05.jpg" },
    b: { name: "Date night", src: "/meals/card-15.jpg" },
    winner: "b",
  },
]

// Beat map (never more than two new things at once):
//  0 the doubt · 1 what Eat or Yeet is
//  2 pair 1 in · 3 pick · 4 learn · 5 hand off (+ pair 2 in, receipt 1)
//  6 pick · 7 learn · 8 hand off (+ pair 3 in, receipt 2) · 9 pick · 10 learn
// 11 hand off (+ receipt 3, recap) · 12 the two kinds of evidence · 13 the ask
// The settle (learn → hand off) is the longest hold; the ring sits on the
// winner while Makan says what it learned.
const STAGES = [0, 0.06, 0.13, 0.19, 0.25, 0.36, 0.42, 0.48, 0.59, 0.65, 0.71, 0.82, 0.89, 0.95]

// The slot is as wide as the viewport height allows (two 3:2 cards plus
// heading, learn line and receipts must fit above the fold), capped at the
// column's inner width (max-w-5xl 64rem minus 2×2.5rem padding = 59rem, or
// the viewport minus that padding when narrower — the cap MUST equal the
// real layout width, or the flight maths below aims past the receipt). Everything derives from --slot-w, so the cards grow on
// a tall screen instead of leaving floor, and the flights still land.
//   card b centre x = 0.75·W + 0.25rem (1rem gap, winner is always b)
//   card b centre y = (W − 1rem)/6 + 1.35rem
//   receipt pile: left-aligned under the slot, one settled duel every
//   8.175rem, winner thumb centred 5.475rem in, 2.125rem below the slot.
const SLOT_VARS = {
  "--slot-w": "min(59rem, calc(100vw - 5rem), calc((100vh - 26.5rem) * 3))",
  "--slot-h": "calc((var(--slot-w) - 1rem) / 3 + 5.2rem)",
} as React.CSSProperties
const FLIGHT = [0, 1, 2].map((k) => ({
  x: `calc(${(5.475 + k * 8.175).toFixed(3)}rem - 0.75 * var(--slot-w) - 0.25rem)`,
  y: "calc(var(--slot-h) + 2.125rem - (var(--slot-w) - 1rem) / 6 - 1.35rem)",
  scale: 0.12,
}))

/**
 * The proof, full width. The menu scene ends on the ring; this one answers
 * "How does Makan know?" with the mechanism running: three comparisons at
 * card size, each settling on the pen ring while Makan says what it learned,
 * the winners piling up as receipts, then what the pile means.
 */
export default async function EatOrYeetScene() {
  const t = await getTranslations("Decision.Hero")

  return (
    <ScrollScene thresholds={STAGES} className="relative bg-brand-card md:staged:h-[520vh]">
      {/* Pinned, and vertically centred in whatever slack a tall viewport
          leaves; the top padding is the nav's clearance, so short viewports
          behave exactly as before. */}
      <div className="md:staged:sticky md:staged:top-0 md:staged:flex md:staged:h-screen md:staged:flex-col md:staged:justify-center md:staged:pt-24">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 md:px-10 md:staged:py-0">
          <h2
            data-scene="0"
            className="max-w-[18ch] text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.02em] text-brand-ink"
          >
            {t("thought")}
          </h2>
          <p data-scene="1" className="mt-5 max-w-[48ch] text-[1.05rem] font-bold leading-[1.4] text-brand-ink md:text-[1.15rem]">
            {t("proofLead")}
          </p>
          <p data-scene="1" className="mt-1.5 text-[0.9rem] font-semibold text-brand-orange">
            {t("eoyQuestion")}
          </p>

          {/* One slot, three tenants, then the payoff. Absolute only once
              staged; stacked naturally in flow. */}
          <div style={SLOT_VARS} className="mt-8 md:relative md:max-w-[var(--slot-w)] md:staged:h-[var(--slot-h)]">
            <EatOrYeetDuel
              duel={DUELS[0]}
              or={t("eoyOr")}
              pickedLabel={t("eoyPicked")}
              inStage={2}
              pickStage={3}
              learnStage={4}
              learnLabel={t("learnLabel")}
              learned={t("learn1")}
              outStage={5}
              shrinkTo={FLIGHT[0]}
              className="md:staged:absolute md:staged:inset-x-0 md:staged:top-0"
            />
            <EatOrYeetDuel
              duel={DUELS[1]}
              or={t("eoyOr")}
              pickedLabel={t("eoyPicked")}
              inStage={5}
              pickStage={6}
              learnStage={7}
              learnLabel={t("learnLabel")}
              learned={t("learn2")}
              outStage={8}
              shrinkTo={FLIGHT[1]}
              className="mt-8 md:staged:absolute md:staged:inset-x-0 md:staged:top-0 md:staged:mt-0"
            />
            <EatOrYeetDuel
              duel={DUELS[2]}
              or={t("eoyOr")}
              pickedLabel={t("eoyPicked")}
              inStage={8}
              pickStage={9}
              learnStage={10}
              learnLabel={t("learnLabel")}
              learned={t("learn3")}
              outStage={11}
              shrinkTo={FLIGHT[2]}
              className="mt-8 md:staged:absolute md:staged:inset-x-0 md:staged:top-0 md:staged:mt-0"
            />
            <div className="md:staged:absolute md:staged:inset-0 md:staged:flex md:staged:flex-col md:staged:justify-start md:staged:pt-1">
              <ul data-scene="11" style={{ transitionDelay: "0.4s" }} className="mt-8 hidden space-y-2 md:mt-0 md:staged:block">
                {[t("learn1"), t("learn2"), t("learn3")].map((fact) => (
                  <li key={fact} className="flex items-baseline gap-2.5 text-[1.05rem] font-semibold text-brand-ink">
                    <span aria-hidden className="text-[0.6rem] text-brand-orange">●</span>
                    {fact}
                  </li>
                ))}
              </ul>
              {/* Two kinds of evidence, said plainly: what your picks teach,
                  and what everyone's picks at this place teach — grouped,
                  privacy-safe (doctrine's fourth rung). */}
              <p data-scene="12" className="mt-8 max-w-[44ch] text-[1.05rem] font-semibold leading-[1.5] text-brand-ink md:mt-6">
                {t("proofTally")} {t("crowdTally")}
              </p>
              <p data-scene="12" style={{ transitionDelay: "0.15s" }} className="mt-2 max-w-[44ch] text-[0.9rem] font-semibold leading-[1.5] text-brand-orange">
                {t("crowdPrivacy")}
              </p>
              <div data-scene="13" className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
                <a
                  href={APP_STORE_URL}
                  className="inline-flex min-h-14 items-center rounded-full bg-brand-orange px-8 text-base font-bold text-white shadow-[0_10px_24px_-10px_rgba(255,153,50,0.6)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
                >
                  {t("cta")}
                </a>
                <span className="text-[0.74rem] font-semibold uppercase tracking-[0.14em] text-brand-orange">
                  {t("platform")}
                </span>
              </div>
            </div>
          </div>

          {/* The receipts pile up — Makan learns from all of them together. */}
          <div className="mt-4 hidden max-w-full flex-wrap items-center gap-4 md:staged:flex">
            <SettledDuel duel={DUELS[0]} appearStage={5} pickedLabel={t("eoyPicked")} />
            <SettledDuel duel={DUELS[1]} appearStage={8} pickedLabel={t("eoyPicked")} />
            <SettledDuel duel={DUELS[2]} appearStage={11} pickedLabel={t("eoyPicked")} />
          </div>
        </div>
      </div>
    </ScrollScene>
  )
}
