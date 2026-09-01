import { getTranslations } from "next-intl/server"
import PaperSheet from "@/components/paper/PaperSheet"
import MenuSheet, { type MenuSection } from "@/components/menu/MenuSheet"
import {
  EatOrYeetDuel,
  SettledDuel,
  type Duel,
} from "@/components/decision/EatOrYeetDuel"
import ScrollScene from "@/components/motion/ScrollScene"

// A Western Berawa menu is a genuinely incoherent decision — brunch, poke,
// pizza and wagyu with no cuisine logic tying them together. That is the real
// paralysis, and it is what makes the answer's reason line land.
const SECTIONS: MenuSection[] = [
  {
    heading: "Brunch, served all day",
    items: [
      { name: "Smashed Avocado", diet: "VG", price: "85", description: "sourdough, whipped feta, chilli oil, dukkah" },
      { name: "Coconut Chia Bowl", diet: "VG GF", price: "78", description: "mango, passionfruit, toasted coconut" },
      { name: "Eggs Benedict", price: "98", description: "house hollandaise, muffin, smoked bacon or spinach" },
    ],
  },
  {
    heading: "Bowls & Greens",
    items: [
      { name: "Nourish Bowl", diet: "VG GF", price: "95", description: "quinoa, roast pumpkin, kale, tahini, pickled onion" },
      { name: "Tuna Poke", diet: "GF", price: "110", description: "yellowfin, sushi rice, edamame, sesame, nori" },
    ],
  },
  {
    heading: "From the Grill",
    items: [
      { name: "Wagyu Cheeseburger", price: "145", description: "aged cheddar, pickles, house sauce, fries" },
      { name: "Grilled Barramundi", diet: "GF", price: "165", description: "whole fish, sambal matah, charred lime, greens" },
      { name: "Half Chicken", price: "138", description: "lemon, garlic, chimichurri" },
    ],
  },
  {
    heading: "From the Oven",
    items: [
      { name: "Margherita", diet: "V", price: "95", description: "fior di latte, san marzano, basil" },
      { name: "Nduja & Hot Honey", price: "115", description: "fior di latte, nduja, oregano" },
    ],
  },
]

// Real saved meals (share cards already published on the live meal strip).
// Three comparisons, each teaching one taste fact that adds up to the
// barramundi: fish over beef, fresh spice over fried, bold over safe.
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
    a: { name: "Riverview brekkie", src: "/meals/card-01.jpg" },
    b: { name: "Biang biang", src: "/meals/card-02.jpg" },
    winner: "b",
  },
]

// The story at the reader's own pace: the menu alone → "Everything sounds
// good." → the problem → the ring on the menu → the doubt → three Eat or
// Yeet comparisons resolving one after another, each settling into a pile
// of receipts → what the pile means → the ask.
const STAGES = [0.04, 0.13, 0.24, 0.33, 0.4, 0.47, 0.54, 0.61, 0.68, 0.75, 0.84, 0.93]

export default async function HeroDiptych() {
  const t = await getTranslations("Decision.Hero")

  return (
    <ScrollScene thresholds={STAGES} className="relative md:h-[420vh]">
      <div className="md:sticky md:top-0 md:h-screen">
        <PaperSheet fold className="h-full w-full">
          <div className="relative grid h-full grid-cols-1 md:grid-cols-2">
            <div className="relative md:max-h-full md:overflow-hidden">
              <MenuSheet
                house={t("house")}
                meta={t("meta")}
                sections={SECTIONS.map((section) => ({
                  ...section,
                  items: section.items.map((item) =>
                    item.name === "Grilled Barramundi"
                      ? { ...item, circled: { label: t("answerMark") } }
                      : item,
                  ),
                }))}
                legal={t("legal")}
                className="px-8 py-10 md:px-10"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 hidden h-24 bg-gradient-to-b from-transparent to-brand-cream md:block"
              />
            </div>


            <div className="flex flex-col justify-center px-8 py-10 md:justify-start md:px-12 md:py-0 md:pt-24">
              <p
                data-scene="0"
                className="text-[clamp(1.2rem,1.9vw,1.6rem)] font-semibold leading-[1.2] text-brand-muted"
              >
                {t("hook")}
              </p>
              <h1
                data-scene="1"
                className="mt-2 max-w-[13ch] text-[clamp(2rem,3.6vw,3.1rem)] font-bold leading-[1.04] tracking-[-0.015em] text-brand-ink"
              >
                {t("headline")}
              </h1>
              {/* The reader's doubt, then the receipts: the Eat or Yeet picks
                  that taught Makan the taste the answer just claimed. */}
              <p
                data-scene="3"
                data-scene-until="6"
                className="mt-6 text-[0.95rem] font-bold text-brand-ink"
              >
                {t("thought")}
              </p>
              <p data-scene="4" data-scene-until="10" className="mt-2 text-[0.8rem] font-semibold leading-[1.5] text-brand-ink">
                {t("proofLead")}
              </p>
              <p data-scene="4" data-scene-until="10" className="mt-2 text-[0.95rem] font-bold text-brand-ink">
                {t("eoyQuestion")}
              </p>
              <div className="mt-3 md:relative md:h-[15rem] md:max-w-[30rem]">
                <EatOrYeetDuel
                  duel={DUELS[0]}
                  or={t("eoyOr")}
                  pickedLabel={t("eoyPicked")}
                  inStage={4}
                  pickStage={5}
                  outStage={6}
                  shrinkTo={{ x: "-16.5rem", y: "11rem" }}
                  className="md:absolute md:inset-x-0 md:top-0"
                />
                <EatOrYeetDuel
                  duel={DUELS[1]}
                  or={t("eoyOr")}
                  pickedLabel={t("eoyPicked")}
                  inStage={6}
                  pickStage={7}
                  outStage={8}
                  shrinkTo={{ x: "-7.3rem", y: "11rem" }}
                  className="mt-6 md:absolute md:inset-x-0 md:top-0 md:mt-0"
                />
                <EatOrYeetDuel
                  duel={DUELS[2]}
                  or={t("eoyOr")}
                  pickedLabel={t("eoyPicked")}
                  inStage={8}
                  pickStage={9}
                  outStage={10}
                  shrinkTo={{ x: "1.9rem", y: "11rem" }}
                  className="mt-6 md:absolute md:inset-x-0 md:top-0 md:mt-0"
                />
                {/* Once the duels have vacated the slot, the payoff takes it
                    over — nothing stacks below an empty stage. */}
                <div className="md:absolute md:inset-x-0 md:bottom-2">
                  <p data-scene="10" style={{ transitionDelay: "0.5s" }} className="mt-6 max-w-[30rem] text-[0.85rem] font-semibold leading-[1.5] text-brand-ink md:mt-0">
                    {t("proofTally")}
                  </p>
                  <div data-scene="11" className="mt-4 flex items-center gap-4">
                <span className="inline-flex items-center rounded-full bg-brand-orange px-7 py-3.5 text-sm font-bold text-white shadow-[0_7px_16px_-7px_rgba(255,153,50,0.55)]">
                  {t("cta")}
                </span>
                <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brand-muted">
                  {t("platform")}
                </span>
                  </div>
                </div>
              </div>
              {/* The receipts pile up — Makan learns from all of them together. */}
              <div className="mt-3 hidden items-center gap-3 md:flex">
                <SettledDuel duel={DUELS[0]} appearStage={6} />
                <SettledDuel duel={DUELS[1]} appearStage={8} />
                <SettledDuel duel={DUELS[2]} appearStage={10} />
              </div>
            </div>
          </div>
        </PaperSheet>
      </div>
    </ScrollScene>
  )
}
