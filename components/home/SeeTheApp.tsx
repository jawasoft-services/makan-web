import Image from "next/image"
import { getTranslations } from "next-intl/server"
import Reveal from "@/components/motion/Reveal"

// Supplied app screenshots, already sitting in device frames.
const SHOTS = [
  { src: "/mockup-assets/feed-seafood-risotto.webp", titleKey: "feedTitle", bodyKey: "feedBody", altKey: "feedAlt" },
  { src: "/mockup-assets/discovery-iphone.png", titleKey: "shot1Title", bodyKey: "shot1Body", altKey: "shot1Alt" },
  { src: "/mockup-assets/eat-or-yeet-iphone.png", titleKey: "shot2Title", bodyKey: "shot2Body", altKey: "shot2Alt" },
  { src: "/mockup-assets/diary-iphone.png", titleKey: "shot3Title", bodyKey: "shot3Body", altKey: "shot3Alt" },
] as const

export default async function SeeTheApp() {
  const t = await getTranslations("Decision.App")
  return (
    <section id="features" className="scroll-mt-[86px] w-full bg-brand-cream px-6 pb-12 pt-20 md:px-10 md:py-28">
      <Reveal className="mx-auto max-w-7xl text-center">
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
        <div className="mx-auto mt-14 grid max-w-7xl grid-cols-1 gap-14 md:grid-cols-2 md:gap-8 xl:grid-cols-4">
          {SHOTS.map((shot, i) => (
            <figure key={shot.src} data-beat style={{ "--beat": 2 + i } as React.CSSProperties}>
              <Image
                src={shot.src}
                loading="eager"
                alt={t(shot.altKey)}
                width={1066}
                height={2198}
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
