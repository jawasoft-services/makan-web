import { getTranslations } from "next-intl/server"
import PaperSheet from "@/components/paper/PaperSheet"
import MenuSheet, { type MenuSection } from "@/components/menu/MenuSheet"
import ScrollScene from "@/components/motion/ScrollScene"

// A Western Berawa menu is a genuinely incoherent decision — brunch, poke,
// pizza and wagyu with no cuisine logic tying them together. That is the real
// paralysis, and it is what makes the answer's reason line land. Eight
// dishes: enough to be a menu, few enough to fit above a 720px fold at the
// 18px base size.
const SECTIONS: MenuSection[] = [
  {
    heading: "Brunch, served all day",
    mobile: true,
    items: [
      { name: "Smashed Avocado", diet: "VG", price: "85", description: "sourdough, whipped feta, chilli oil, dukkah" },
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
    mobile: true,
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
    ],
  },
]

// Three beats only: the menu alone → "Everything sounds good." → the problem
// → the pen rings the answer and one line says when you'd use Makan. The
// proof (Eat or Yeet) gets its own full-width scene after this one; the
// menu has made its point by then.
const STAGES = [0, 0, 0.4]

export default async function HeroDiptych() {
  // Anchored: the landing hero's "See how it works" points here.
  const t = await getTranslations("Decision.Hero")

  return (
    <div id="how-it-works" className="scroll-mt-[86px]">
    {/* `staged:` = only once ScrollScene has armed the region. Without JS, or
        under reduced motion, the region is its natural height and every beat
        sits in flow — no pin, no absolute slot, nothing superimposed. */}
    <ScrollScene thresholds={STAGES} className="relative md:staged:h-[220vh]">
      <div className="md:staged:sticky md:staged:top-0 md:staged:h-screen">
        <PaperSheet fold className="h-full w-full">
          <div className="relative grid h-full grid-cols-1 md:grid-cols-2 md:staged:grid-rows-[minmax(0,1fr)]">
            <div className="order-2 relative md:order-none md:min-h-0 md:staged:max-h-full md:staged:overflow-hidden">
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
                className="px-8 py-10 md:px-10 md:pt-20"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 hidden h-24 bg-gradient-to-b from-transparent to-brand-cream md:staged:block"
              />
            </div>


            {/* Three lines beside a full-height visual: centred in the column, the
                way a pinned product page captions its hero — not stacked at
                the top with a bare floor beneath. */}
            <div className="order-1 flex flex-col justify-center px-8 py-10 md:order-none md:px-12 md:py-0 md:pt-20">
              <p
                data-scene="0"
                className="text-[clamp(1.3rem,2.2vw,1.9rem)] font-semibold leading-[1.2] text-brand-muted"
              >
                {t("hook")}
              </p>
              <h2
                data-scene="1"
                className="mt-2 max-w-[16ch] text-[clamp(2.4rem,4.6vw,4rem)] font-bold leading-[0.99] tracking-[-0.02em] text-brand-ink"
              >
                {t("headline")}
              </h2>
              {/* The moment of use, said once, in the same beat as the ring. */}
              <p data-scene="2" className="mt-4 text-[1.02rem] font-bold text-brand-ink">
                {t("openLine")}
              </p>
            </div>
          </div>
        </PaperSheet>
      </div>
    </ScrollScene>
    </div>
  )
}
