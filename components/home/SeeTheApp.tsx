import Image from "next/image"
import { getTranslations } from "next-intl/server"
import Reveal from "@/components/motion/Reveal"

// The two screens a diner actually uses: the game that teaches Makan taste,
// and the diary the answer is drawn from. Real signed-in screenshots.
const SHOTS = [
  { src: "/app-screens/story/eat-or-yeet.webp", titleKey: "shot1Title", bodyKey: "shot1Body", altKey: "shot1Alt" },
  { src: "/app-screens/story/diary.webp", titleKey: "shot2Title", bodyKey: "shot2Body", altKey: "shot2Alt" },
] as const

export default async function SeeTheApp() {
  const t = await getTranslations("Decision.App")
  return (
    <section id="features" className="w-full bg-brand-cream px-6 py-20 md:px-10 md:py-28">
      <Reveal className="mx-auto max-w-5xl">
        <p data-beat className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-orange md:text-[0.74rem]">
          {t("eyebrow")}
        </p>
        <h2
          data-beat
          style={{ "--beat": 1 } as React.CSSProperties}
          className="mt-4 max-w-[18ch] text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.02em] text-brand-ink"
        >
          {t("title")}
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          {SHOTS.map((shot, i) => (
            <figure key={shot.src} data-beat style={{ "--beat": 2 + i } as React.CSSProperties} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-6">
              {/* Phone frame: ink bezel, rounded, the screenshot inside. */}
              <div className="mx-auto w-full max-w-[15rem] rounded-[2.2rem] border-[6px] border-brand-ink bg-brand-ink shadow-[0_1px_2px_rgba(43,21,3,0.08),0_16px_32px_-18px_rgba(43,21,3,0.5)]">
                <div className="overflow-hidden rounded-[1.8rem]">
                  <Image src={shot.src} alt={t(shot.altKey)} width={720} height={1565} sizes="(min-width: 768px) 240px, 60vw" className="block h-auto w-full" />
                </div>
              </div>
              <figcaption>
                <p className="text-[1.25rem] font-bold tracking-[-0.01em] text-brand-ink">{t(shot.titleKey)}</p>
                <p className="mt-2 text-[1rem] leading-[1.55] text-brand-ink">{t(shot.bodyKey)}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
