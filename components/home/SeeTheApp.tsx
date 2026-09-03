import Image from "next/image"
import { storyBlur } from "@/lib/story-blur"
import { getTranslations } from "next-intl/server"
import Reveal from "@/components/motion/Reveal"

// The three screens a diner actually uses, as real signed-in screenshots
// already sitting in a device frame: Discover (the nudge back to a saved
// place), the game that teaches Makan taste, and the diary the answer is
// drawn from.
const SHOTS = [
  { src: "/app-screens/story/discover.webp", titleKey: "shot1Title", bodyKey: "shot1Body", altKey: "shot1Alt" },
  { src: "/app-screens/story/eat-or-yeet.webp", titleKey: "shot2Title", bodyKey: "shot2Body", altKey: "shot2Alt" },
  { src: "/app-screens/story/diary.webp", titleKey: "shot3Title", bodyKey: "shot3Body", altKey: "shot3Alt" },
] as const

export default async function SeeTheApp() {
  const t = await getTranslations("Decision.App")
  return (
    <section id="features" className="w-full bg-brand-cream px-6 pb-12 pt-20 md:px-10 md:py-28">
      <Reveal className="mx-auto max-w-5xl text-center">
        <p data-beat className="text-[0.86rem] font-semibold uppercase tracking-[0.16em] text-brand-orange md:text-[0.82rem]">
          {t("eyebrow")}
        </p>
        <h2
          data-beat
          style={{ "--beat": 1 } as React.CSSProperties}
          className="mx-auto mt-4 max-w-[18ch] text-balance text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.02em] text-brand-ink"
        >
          {t("title")}
        </h2>
        <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-14 md:grid-cols-3 md:gap-8">
          {SHOTS.map((shot, i) => (
            <figure key={shot.src} data-beat style={{ "--beat": 2 + i } as React.CSSProperties}>
              <Image
                src={shot.src}
                placeholder="blur"
                blurDataURL={storyBlur(shot.src)}
                loading="eager"
                alt={t(shot.altKey)}
                width={760}
                height={1572}
                sizes="(min-width: 768px) 280px, 70vw"
                className="mx-auto block h-auto w-full max-w-[17.5rem] drop-shadow-[0_18px_28px_rgba(43,21,3,0.22)]"
              />
              <figcaption className="mx-auto mt-6 max-w-[22rem]">
                <p className="text-[1.15rem] font-bold tracking-[-0.01em] text-brand-ink">{t(shot.titleKey)}</p>
                <p className="mt-1.5 text-[1.02rem] leading-[1.5] text-brand-ink">{t(shot.bodyKey)}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </Reveal>
    </section>
  )
}
