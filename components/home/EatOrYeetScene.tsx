import Image from "next/image"
import { getTranslations } from "next-intl/server"
import {
  EatOrYeetDuel,
  type Duel,
} from "@/components/decision/EatOrYeetDuel"
import ScrollScene from "@/components/motion/ScrollScene"
import StoreLink from "@/components/home/StoreLink"
import RankingExample from "@/components/decision/RankingExample"

// Real saved meals and venues, simulated picks/totals. Kendal’s after-pick 8/14 (57%) matches the dated Makan standings capture; its 7/13 starting point is reconstructed. Other venue totals are mock data.
const DUELS: Duel[] = [
  {
    "a": {
      "name": "Sushi",
      "restaurant": "NOBU Singapore",
      "src": "/meals/story/card-40.jpg",
      "eats": 12,
      "matchups": 18
    },
    "b": {
      "name": "Roast beef",
      "restaurant": "Heaney & Mill",
      "src": "/meals/story/card-30.jpg",
      "eats": 11,
      "matchups": 15
    },
    "winner": "b"
  },
  {
    "a": {
      "name": "Fish Sando",
      "restaurant": "Fire Street Food",
      "src": "/meals/story/card-46.jpg",
      "eats": 8,
      "matchups": 12
    },
    "b": {
      "name": "Tom yum",
      "restaurant": "Fusha Asian Fusion – Durham",
      "src": "/meals/card-19.jpg",
      "eats": 8,
      "matchups": 14
    },
    "winner": "b"
  },
  {
    "a": {
      "name": "Bacon and Brie",
      "restaurant": "DISH",
      "src": "/meals/story/card-05.jpg",
      "eats": 6,
      "matchups": 10
    },
    "b": {
      "name": "Chilli prawns",
      "restaurant": "Kendal Street Kitchen",
      "src": "/meals/story/card-15.jpg",
      "eats": 7,
      "matchups": 13
    },
    "winner": "b"
  }
]

// Beat map (never more than two new things at once):
//  0 the doubt · 1 what Eat or Yeet is
//  2 pair 1 in · 3 pick · 4 learn · 5 pair 2 in
//  6 pick · 7 learn · 8 pair 3 in · 9 pick · 10 learn
// 11 standings before · 12 standings after · 13 the ask
//
// Pacing is a scroll budget per beat, in viewport heights — how far the
// reader scrolls while that beat is on screen before the next arrives. The
// settle (the ring on the winner while Makan says what it learned) is the
// point of the whole section, so it holds two and a half times as long as
// any other beat. Long beats read; short beats skim. Prefer long.
const HOLD_VH = [50, 60, 60, 60, 150, 60, 60, 150, 60, 60, 150, 150, 150, 60]
const TRAVEL_VH = HOLD_VH.reduce((a, b) => a + b, 0)
const STAGES = HOLD_VH.map((_, i) => HOLD_VH.slice(0, i).reduce((a, b) => a + b, 0) / TRAVEL_VH)
// The pinned region is the travel plus the one viewport that stays on screen.
const SCENE_VARS = { "--scene-h": `${TRAVEL_VH + 100}vh` } as React.CSSProperties

// Fit two 3:2 cards, heading and result above the fold, capped at the column width.
const SLOT_VARS = {
  "--slot-w": "min(59rem, calc(100vw - 5rem), calc((100vh - 30rem) * 3))",
  "--slot-h": "calc((var(--slot-w) - 1rem) / 3 + 8rem)",
} as React.CSSProperties

/**
 * Three illustrative cross-restaurant picks, showing Eats, Yeets and each
 * restaurant’s Eat% after the result. Personal taste is a separate payoff.
 */
export default async function EatOrYeetScene() {
  const t = await getTranslations("Decision.Hero")
  const landing = await getTranslations("Decision.Landing")

  return (
    <ScrollScene id="proof" thresholds={STAGES} style={SCENE_VARS} className="relative bg-brand-card md:staged:h-[var(--scene-h)]">
      {/* Pinned, and vertically centred in whatever slack a tall viewport
          leaves; the top padding is the nav's clearance, so short viewports
          behave exactly as before. */}
      <div id="how-it-works" className="md:staged:sticky md:staged:top-0 md:staged:flex md:staged:h-screen md:staged:flex-col md:staged:justify-center md:staged:pt-24">
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

          {/* One slot, three tenants, then the payoff. Absolute only once
              staged; stacked naturally in flow. */}
          <div style={SLOT_VARS} className="mt-8 md:relative md:max-w-[var(--slot-w)] md:staged:h-[var(--slot-h)]">
            <EatOrYeetDuel
              duel={DUELS[0]}
              or={t("eoyOr")}
              pickedLabel={t("eoyPicked")}
              scoreLabel={t("eatScoreLabel")}
              eatsLabel={t("eatsLabel")}
              matchupsLabel={t("matchupsLabel")}
              atLabel={t("atLabel")}
              inStage={2}
              pickStage={3}
              learnStage={4}
              learnLabel={t("learnLabel")}
              learned={t("learn1")}
              outStage={5}
              className="md:staged:absolute md:staged:inset-x-0 md:staged:top-0"
            />
            <EatOrYeetDuel
              duel={DUELS[1]}
              or={t("eoyOr")}
              pickedLabel={t("eoyPicked")}
              scoreLabel={t("eatScoreLabel")}
              eatsLabel={t("eatsLabel")}
              matchupsLabel={t("matchupsLabel")}
              atLabel={t("atLabel")}
              inStage={5}
              pickStage={6}
              learnStage={7}
              learnLabel={t("learnLabel")}
              learned={t("learn2")}
              outStage={8}
              className="mt-8 md:staged:absolute md:staged:inset-x-0 md:staged:top-0 md:staged:mt-0"
            />
            <EatOrYeetDuel
              duel={DUELS[2]}
              or={t("eoyOr")}
              pickedLabel={t("eoyPicked")}
              scoreLabel={t("eatScoreLabel")}
              eatsLabel={t("eatsLabel")}
              matchupsLabel={t("matchupsLabel")}
              atLabel={t("atLabel")}
              inStage={8}
              pickStage={9}
              learnStage={10}
              learnLabel={t("learnLabel")}
              learned={t("learn3")}
              outStage={11}
              className="mt-8 md:staged:absolute md:staged:inset-x-0 md:staged:top-0 md:staged:mt-0"
            />
            <div className="md:staged:absolute md:staged:inset-0 md:staged:flex md:staged:flex-col md:staged:justify-start md:staged:pt-1">
              <div data-scene="11">
                <RankingExample duels={DUELS} labels={{
                  title: t("rankingTitle"), before: t("rankingBefore"), after: t("rankingAfter"), restaurant: t("rankingRestaurant"),
                  eats: t("eatsLabel"), score: t("eatScoreLabel"), movement: t("rankingMovement"),
                  up: t("rankingUp"), down: t("rankingDown"), unchanged: t("rankingUnchanged"),
                }} />
              </div>
              <div data-scene="13" className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                <StoreLink
                  location="proof"
                  className="inline-flex min-h-11 items-center rounded-[10px] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
                >
                  <Image src="/app-store-badge.svg" alt={landing("badgeAlt")} width={180} height={60} className="h-[clamp(2rem,10.8vw,2.25rem)] w-auto sm:h-12" />
                </StoreLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollScene>
  )
}
