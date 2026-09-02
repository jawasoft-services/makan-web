import { getTranslations } from "next-intl/server"
import Reveal from "@/components/motion/Reveal"
import AndroidWaitlist from "@/components/AndroidWaitlist"
import StoreLink from "@/components/home/StoreLink"

/**
 * The page's closing ask, on saffron ground. One promise, one button, and the
 * Android waitlist (reused from the live site) so nobody leaves with nothing.
 * White on saffron is the accepted button/text treatment (RM18846).
 */
export default async function FinalAsk() {
  const t = await getTranslations("Decision.Final")
  const home = await getTranslations("Home.Final")

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
        {/* StoreLink's props are location/className/children only, so the
            beat-rise entrance animation lives on this wrapper instead of on
            the anchor itself. */}
        <span data-beat style={{ "--beat": 3 } as React.CSSProperties} className="block">
          <StoreLink
            location="final"
            className="mt-9 inline-flex min-h-14 items-center rounded-full bg-white px-9 text-base font-bold text-brand-orange transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:translate-y-0"
          >
            {t("cta")}
          </StoreLink>
        </span>
        <div
          data-beat
          style={{ "--beat": 4 } as React.CSSProperties}
          className="mt-9 rounded-2xl bg-white p-6 text-left md:p-8"
        >
          <p className="text-base font-semibold text-brand-ink">{home("android")}</p>
          <p className="mt-1 text-sm text-brand-muted">{home("androidBody")}</p>
          <AndroidWaitlist />
        </div>
      </Reveal>
    </section>
  )
}
