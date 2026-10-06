import { getLocale, getTranslations } from "next-intl/server"
import Image from "next/image"
import Reveal from "@/components/motion/Reveal"
import AppQr from "@/components/home/AppQr"
import StoreLink from "@/components/home/StoreLink"
import { localizePath } from "@/i18n/paths"

/**
 * The page's closing ask, on saffron ground, with both store buttons.
 * White on saffron is the accepted button/text treatment (RM18846).
 */
export default async function FinalAsk() {
  const t = await getTranslations("Decision.Final")
  const landing = await getTranslations("Decision.Landing")
  const home = await getTranslations("Home.Hero")
  const locale = await getLocale()

  return (
    <section className="w-full bg-brand-orange px-6 py-24 text-white md:py-32">
      <Reveal className="mx-auto max-w-2xl text-center">
        <p data-beat className="text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-white">
          {t("eyebrow")}
        </p>
        <h2
          data-beat
          style={{ "--beat": 1 } as React.CSSProperties}
          className="mt-4 text-[clamp(2.2rem,5vw,4rem)] font-bold leading-[1.02] tracking-[-0.025em] text-white"
        >
          {t("title")}
        </h2>
        <p
          data-beat
          style={{ "--beat": 2 } as React.CSSProperties}
          className="mx-auto mt-5 max-w-[36ch] text-[1.1rem] font-semibold leading-[1.45] text-white"
        >
          {t("body")}
        </p>
        {/* Both store badges, and the desktop QR, share one reveal beat. */}
        <span data-beat style={{ "--beat": 3 } as React.CSSProperties} className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-3">
          <StoreLink
            location="final"
            size="large"
            className="inline-flex min-h-11 items-center rounded-[10px] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-0"
          >
            <Image src="/app-store-badge.svg" alt={landing("badgeAlt")} width={180} height={60} className="h-[clamp(2rem,10.8vw,2.25rem)] w-auto sm:h-14" />
          </StoreLink>
          <AppQr href={localizePath(locale, "/app")} label={home("qr")} alt={home("qrAlt")} />
        </span>
      </Reveal>
    </section>
  )
}
