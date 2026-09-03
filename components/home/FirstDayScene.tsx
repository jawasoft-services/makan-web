import Image from "next/image"
import { storyBlur } from "@/lib/story-blur"
import { getTranslations } from "next-intl/server"
import PaperSheet from "@/components/paper/PaperSheet"
import MenuSheet, { type MenuSection } from "@/components/menu/MenuSheet"
import ScrollScene from "@/components/motion/ScrollScene"

// A second restaurant, so the reader's stand-in arrives with nothing:
// Lucky Plaza, the Hainanese chicken rice place in Pererenan. The friend's
// meal is a real public save from Lucky Plaza on Makan (that account has
// saved chicken rice there five times; the story says three), so the dish
// the pen rings is the dish in the photo.
const SECTIONS: MenuSection[] = [
  {
    heading: "Chicken rice",
    mobile: true,
    items: [
      { name: "Hainanese Chicken Rice", price: "48", description: "poached chicken, fragrant rice, soup, chilli, ginger" },
      { name: "Roasted Chicken Rice", price: "50", description: "soy-roasted, same rice, same soup" },
      { name: "Half Chicken to Share", price: "135", description: "poached or roasted, rice for two" },
    ],
  },
  {
    heading: "On the side",
    mobile: true,
    items: [
      { name: "Braised Egg", price: "10" },
      { name: "Extra Rice", price: "12" },
      { name: "Chicken Soup", price: "15", description: "spring onion, white pepper" },
      { name: "Cucumber & Pickles", price: "12" },
    ],
  },
  {
    heading: "Drinks",
    items: [
      { name: "Iced Coffee", price: "28" },
      { name: "Teh Tarik", price: "22" },
      { name: "Lime Juice", price: "20" },
    ],
  },
]

// The story: a new place → the objection said out loud → a friend's real
// meal (offered as an example, never as a claim about the reader's friends)
// → the pen rings her dish on this menu → the note from someone who really
// knows the place → and the honest state where nobody's been.
// The friend's three plates, oldest first (dates in copy).
const VISITS = [
  { src: "/meals/story/lucky-plaza-chicken-rice-1.jpg", dateKey: "visit1" },
  { src: "/meals/story/lucky-plaza-chicken-rice-2.jpg", dateKey: "visit2" },
  { src: "/meals/story/lucky-plaza-chicken-rice-3.jpg", dateKey: "visit3" },
] as const

// Scroll budget per beat, in viewport heights (see EatOrYeetScene). The
// Maître d' slip is the beat with the most to read, so it holds longest.
//  0 setting · 1 the place · 2 what Makan knows / friends · 3 three plates
//  4 the ring · 5 the Maître d' · 6 the place nobody has tried
const HOLD_VH = [40, 50, 60, 80, 60, 170, 90]
const TRAVEL_VH = HOLD_VH.reduce((a, b) => a + b, 0)
const STAGES = HOLD_VH.map((_, i) => HOLD_VH.slice(0, i).reduce((a, b) => a + b, 0) / TRAVEL_VH)
const SCENE_VARS = { "--scene-h": `${TRAVEL_VH + 100}vh` } as React.CSSProperties

export default async function FirstDayScene() {
  const t = await getTranslations("Decision.FirstDay")

  return (
    <ScrollScene id="first-day" thresholds={STAGES} style={SCENE_VARS} className="relative z-10 md:staged:h-[var(--scene-h)]">
      <div className="md:staged:sticky md:staged:top-0 md:staged:h-screen">
        <PaperSheet fold className="h-full w-full">
          <div className="relative grid h-full grid-cols-1 md:grid-cols-2 md:staged:grid-rows-[minmax(0,1fr)]">
            {/* Text page LEFT this time — the spread turned. */}
            <div className="order-2 flex flex-col justify-center px-8 py-10 md:order-1 md:px-12 md:py-0 md:pt-20">
              <p
                data-scene="0"
                className="text-[clamp(1.2rem,1.9vw,1.6rem)] font-semibold leading-[1.2] text-brand-muted"
              >
                {t("intro")}
              </p>
              <h2
                data-scene="1"
                className="mt-2 max-w-[16ch] text-[clamp(1.8rem,3vw,2.6rem)] font-bold leading-[1.05] tracking-[-0.015em] text-brand-ink"
              >
                {t("objection")}
              </h2>

              {/* One slot, four tenants: the turn + the three plates, then
                  Mali's note, then the noodle cart nobody has tried. Absolute only once staged, so retired beats
                  leave no hole; stacked naturally in flow. The cards sit
                  3.5rem down so a two-line lead never runs under them. */}
              <div className="mt-6 md:relative md:staged:h-[20rem]">
              {/* The scenario, spoon-fed: what Makan does not know, what your
                  friends do, and the thing you would have done anyway. */}
              <div data-scene="2" data-scene-until="5" className="md:staged:absolute md:staged:top-0">
                <p className="text-[1.02rem] font-bold leading-[1.4] text-brand-ink">{t("turn")}</p>
                <p className="mt-1.5 text-[0.92rem] font-semibold text-brand-muted">{t("turnWhy")}</p>
              </div>
              {/* Three visits, three plates: "three times" shown, not said.
                  Real public saves from one account (it has five; the story
                  uses three), dated. */}
              <figure
                data-scene="3"
                data-scene-until="5"
                data-place
                className="mt-3 w-full md:staged:absolute md:staged:top-[7.5rem] md:staged:mt-0"
              >
                <div className="grid grid-cols-3 gap-3">
                  {VISITS.map((visit, i) => (
                    <div key={visit.src} className="saved-card overflow-hidden">
                      <div className="relative aspect-[4/3]">
                        <Image
                          src={visit.src}
                          placeholder="blur"
                          blurDataURL={storyBlur(visit.src)}
                          loading="eager"
                          alt={t("friendMealAlt", { date: t(visit.dateKey) })}
                          fill
                          sizes="(min-width: 768px) 180px, 30vw"
                          className="object-cover"
                        />
                      </div>
                      <p className="px-3 py-2.5 text-[0.92rem] font-bold text-brand-ink">
                        <span className="text-brand-muted">{i + 1}.</span> {t(visit.dateKey)}
                      </p>
                    </div>
                  ))}
                </div>
                <figcaption className="mt-3 text-[1.02rem] font-semibold text-brand-ink">
                  {t("friendMealName")} <span className="font-medium text-brand-muted">· {t("friendMealSub")}</span>
                </figcaption>
              </figure>

              {/* Intro and slip share one positioned wrapper, so the slip
                  sits under the intro however many lines it wraps to (three
                  at laptop widths), never over its last line. */}
              <div data-scene="5" data-scene-until="6" className="md:staged:absolute md:staged:top-0">
              <p className="mt-6 text-[1.02rem] font-bold text-brand-ink md:staged:mt-0">
                {t("maitredIntro")}
              </p>
              {/* The slip: every label is ink. Saffron is reserved for the pen
                  and the answer on the menu, and no meaning here rides on
                  colour alone (D11). */}
              <div
                data-place
                className="mt-3 w-[21rem] max-w-full -rotate-1 rounded-[3px] border border-brand-muted/25 bg-brand-card p-4 shadow-[0_1px_2px_rgba(43,21,3,0.08),0_10px_24px_-16px_rgba(43,21,3,0.35)]"
              >
                <p className="text-[0.82rem] font-extrabold uppercase tracking-[0.15em] text-brand-ink md:text-[0.76rem]">
                  {t("slipFrom")}
                </p>
                <p className="mt-1.5 text-[0.9rem] leading-[1.5] text-brand-muted">
                  {t("maitredWho")}
                </p>
                <dl className="mt-2 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-1.5">
                  {[
                    [t("alwaysKey"), t("slipAlways")],
                    [t("tryKey"), t("slipTry")],
                    [t("knowKey"), t("slipKnow")],
                  ].map(([key, value]) => (
                    <div key={key} className="contents">
                      <dt className="text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-brand-ink md:text-[0.74rem]">
                        {key}
                      </dt>
                      <dd className="text-[0.9rem] font-medium leading-[1.45] text-brand-ink">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              </div>

              {/* Fourth tenant of the slot: the slip leaves, the question
                  and the honest empty state take its place. */}
              <div data-scene="6" className="md:staged:absolute md:staged:top-0">
              <p className="mt-4 text-[1.02rem] font-bold text-brand-ink md:staged:mt-0">
                {t("nowhereQ")}
              </p>
              <div className="mt-3 w-[19rem] max-w-full rounded-[3px] border border-dashed border-brand-muted/35 bg-white/30 p-4">
                <p className="text-[1.02rem] font-semibold text-brand-ink">{t("emptyState")}</p>
                <p className="mt-1.5 text-[0.9rem] leading-[1.5] text-brand-muted">{t("emptySub")}</p>
              </div>
              </div>
              </div>
            </div>

            <div className="relative order-1 md:order-2 md:min-h-0 md:staged:max-h-full md:staged:overflow-hidden">
              <MenuSheet
                house={t("house")}
                meta={t("meta")}
                sections={SECTIONS.map((section) => ({
                  ...section,
                  items: section.items.map((item) =>
                    item.name === "Hainanese Chicken Rice"
                      ? { ...item, circled: { label: t("friendMark"), stage: 4 } }
                      : item,
                  ),
                }))}
                legal={t("legal")}
                className="px-8 py-10 md:px-10 md:pt-24"
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 hidden h-24 bg-gradient-to-b from-transparent to-brand-cream md:staged:block"
              />
            </div>
          </div>
        </PaperSheet>
      </div>
    </ScrollScene>
  )
}
