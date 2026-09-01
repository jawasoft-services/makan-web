import type { CSSProperties } from "react"
import { getTranslations } from "next-intl/server"
import PaperSheet from "@/components/paper/PaperSheet"
import MenuSheet, { type MenuSection } from "@/components/menu/MenuSheet"
import AnswerCard from "@/components/decision/AnswerCard"
import EatOrYeetProof from "@/components/decision/EatOrYeetProof"
import Reveal from "@/components/motion/Reveal"

const beat = (n: number) => ({ "--beat": n }) as CSSProperties

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

export default async function HeroDiptych() {
  const t = await getTranslations("Decision.Hero")

  return (
    <PaperSheet fold className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <div className="relative max-h-[42vh] overflow-hidden md:max-h-none md:overflow-visible">
          <MenuSheet
            house={t("house")}
            meta={t("meta")}
            sections={SECTIONS}
            legal={t("legal")}
            className="px-8 py-10 md:px-10"
          />
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-brand-cream md:hidden" />
        </div>
        <Reveal className="flex flex-col justify-center px-8 py-10 md:px-12">
          <h1
            data-beat
            style={beat(0)}
            className="max-w-[13ch] text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.015em] text-brand-ink"
          >
            {t("headline")}
          </h1>
          <p data-beat style={beat(1)} className="mt-4 max-w-[34ch] text-base leading-[1.55] text-brand-muted">
            {t("body")}
          </p>
          <div data-beat style={beat(2)}>
            <AnswerCard
              className="mt-7"
              level="personal_taste"
              mark={t("answerMark")}
              dish={t("answerDish")}
              reason={t("answerReason")}
            />
          </div>
          {/* The reader's doubt, then the receipts: the Eat or Yeet picks that
              taught Makan the taste the answer just claimed. */}
          <p data-beat style={beat(3)} className="mt-6 text-[0.95rem] font-bold text-brand-ink">
            {t("thought")}
          </p>
          <div data-beat style={beat(4)}>
            <EatOrYeetProof
              className="mt-2"
              lead={t("proofLead")}
              duels={[
                { win: t("duel1Win"), lose: t("duel1Lose") },
                { win: t("duel2Win"), lose: t("duel2Lose") },
                { win: t("duel3Win"), lose: t("duel3Lose") },
              ]}
              tally={t("proofTally")}
            />
          </div>
          <div data-beat style={beat(9)} className="mt-7 flex items-center gap-4">
            <span className="inline-flex items-center rounded-full bg-brand-orange px-7 py-3.5 text-sm font-bold text-white shadow-[0_7px_16px_-7px_rgba(255,153,50,0.55)]">
              {t("cta")}
            </span>
            <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brand-muted">
              {t("platform")}
            </span>
          </div>
        </Reveal>
      </div>
    </PaperSheet>
  )
}
