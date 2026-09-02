import { getTranslations } from "next-intl/server"
import Reveal from "@/components/motion/Reveal"

/**
 * Doctrine §17, unhedged, in the page's ten-year-old voice: the things Makan
 * refuses to do, because each one would spoil the answer. Stacked and
 * hairline-separated, not a grid; the climax ("No guessing.") gets its own
 * beat because it is the promise the whole page rests on.
 */
export default async function WontDo() {
  const t = await getTranslations("Decision.Not")
  const items = [1, 2, 3, 4, 5].map((n) => ({ no: t(`n${n}`), line: t(`l${n}`) }))

  return (
    <section className="w-full bg-brand-card px-6 py-20 md:px-10 md:py-28">
      <Reveal className="mx-auto max-w-4xl">
        <p data-beat className="text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-brand-muted">
          {t("eyebrow")}
        </p>
        <h2
          data-beat
          style={{ "--beat": 1 } as React.CSSProperties}
          className="mt-4 max-w-[18ch] text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.02em] text-brand-ink"
        >
          {t("title")}
        </h2>

        <dl className="mt-12 md:mt-16">
          {items.map((item, i) => (
            <div
              key={item.no}
              data-beat
              style={{ "--beat": 2 + i } as React.CSSProperties}
              className="grid gap-1 border-t border-brand-muted/20 py-6 md:grid-cols-[16rem_minmax(0,1fr)] md:gap-10 md:py-7"
            >
              <dt className="text-[1.35rem] font-bold tracking-[-0.01em] text-brand-ink md:text-[1.6rem]">
                {item.no}
              </dt>
              <dd className="text-[1rem] leading-[1.55] text-brand-muted md:text-[1.1rem]">{item.line}</dd>
            </div>
          ))}
        </dl>

        <div
          data-beat
          style={{ "--beat": 8 } as React.CSSProperties}
          className="mt-16 border-t border-brand-muted/20 pt-12 md:mt-20"
        >
          <p className="text-[0.74rem] font-semibold uppercase tracking-[0.16em] text-brand-muted">
            {t("climaxEyebrow")}
          </p>
          <p className="mt-4 text-[clamp(2.6rem,6vw,5rem)] font-bold leading-[0.98] tracking-[-0.025em] text-brand-ink">
            {t("climax")}
          </p>
          <p className="mt-6 max-w-[40ch] text-[1.05rem] leading-[1.55] text-brand-muted md:text-[1.15rem]">
            {t("climaxBody")}
          </p>
        </div>
      </Reveal>
    </section>
  )
}
