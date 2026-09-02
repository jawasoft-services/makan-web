import { getLocale, getTranslations } from "next-intl/server"
import Link from "next/link"
import Reveal from "@/components/motion/Reveal"
import { localizePath } from "@/i18n/paths"
import { EVIDENCE_FLOOR, getEatStandings } from "@/lib/eat-standings"

const PREVIEW_ROWS = 5

/**
 * The top of the Eat or Yeet standings on the homepage: the one piece of
 * proof that names real restaurants with real numbers. Reads the same cached
 * standings as /standings and links there. Renders nothing while no
 * restaurant has reached the evidence floor.
 */
export default async function StandingsPreview() {
  const t = await getTranslations("Decision.Standings")
  const locale = await getLocale()
  const standings = await getEatStandings()
  if (!standings.rows.length) return null
  const rows = standings.rows.slice(0, PREVIEW_ROWS)
  const percent = new Intl.NumberFormat(locale === "id" ? "id-ID" : "en-GB", { style: "percent", maximumFractionDigits: 0 })

  return (
    <section id="standings" className="w-full bg-brand-cream px-6 py-20 md:px-10 md:py-28">
      <Reveal className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
        <div>
          <p data-beat className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-brand-orange">
            {t("eyebrow")}
          </p>
          <h2
            data-beat
            style={{ "--beat": 1 } as React.CSSProperties}
            className="mt-4 max-w-[18ch] text-balance text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.02em] text-brand-ink"
          >
            {t("title")}
          </h2>
          <p data-beat style={{ "--beat": 2 } as React.CSSProperties} className="mt-6 max-w-[44ch] text-[1.05rem] leading-[1.55] text-brand-ink">
            {t("body", { floor: EVIDENCE_FLOOR })}
          </p>
          <a
            data-beat
            style={{ "--beat": 3 } as React.CSSProperties}
            href={localizePath(locale, "/standings")}
            className="mt-8 inline-flex min-h-12 items-center rounded-full border-2 border-brand-ink px-7 text-base font-bold text-brand-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
          >
            {t("cta")}
          </a>
        </div>

        {/* The top five as a list, not a table: name and place on the left,
            Eats on the right, one line each on a phone. */}
        <ol data-beat style={{ "--beat": 2 } as React.CSSProperties} className="divide-y divide-brand-line rounded-2xl border border-brand-line bg-brand-card">
          {rows.map((row, i) => (
            <li key={row.placeId} className="flex items-center gap-4 px-5 py-4">
              <span className="w-6 shrink-0 text-[1.1rem] font-bold tabular-nums text-brand-orange">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <Link
                  href={localizePath(locale, `/places/${row.slug}`)}
                  className="block truncate text-[1.05rem] font-semibold leading-[1.3] text-brand-ink underline decoration-brand-orange/50 decoration-2 underline-offset-4 hover:decoration-brand-orange focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink"
                >
                  {row.name}
                </Link>
                {row.where ? (
                  <span className="block text-[0.9rem] leading-[1.3] text-brand-muted">
                    {row.where.city}, {row.where.country}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-[1.25rem] font-bold leading-none tabular-nums text-brand-ink">{row.eats}</span>
                <span className="block text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-brand-muted">
                  {t("eats", { rate: percent.format(row.eatRate) })}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  )
}
