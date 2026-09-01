import { getTranslations } from "next-intl/server"
import PaperSheet from "@/components/paper/PaperSheet"
import HandRing from "@/components/decision/HandRing"
import { MARK_CLASSES, markFormFor, type DecisionEvidenceLevel } from "@/components/decision/evidence"

// Air and type size contract from 01 to 06 alongside the saffron, so the
// layout performs the thinning evidence rather than the copy explaining it.
const RUNG_PADDING: Record<number, string> = {
  1: "pb-9",
  2: "py-6",
  3: "py-6",
  4: "py-4",
  5: "py-4",
  6: "pt-5",
}

function Mark({ level, children }: { level: DecisionEvidenceLevel; children: string }) {
  return (
    <span
      className={`inline-block text-[0.78rem] font-extrabold uppercase tracking-[0.15em] ${MARK_CLASSES[markFormFor(level)]}`}
    >
      {children}
    </span>
  )
}

function Rung({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <article
      className={`grid grid-cols-[3rem_minmax(0,1fr)] gap-x-6 border-t border-brand-muted/20 first:border-t-0 ${RUNG_PADDING[n]}`}
    >
      <div className="text-[1.6rem] font-extralight leading-none tabular-nums text-brand-muted opacity-40">
        {String(n).padStart(2, "0")}
      </div>
      <div>{children}</div>
    </article>
  )
}

export default async function EvidenceLadder() {
  const t = await getTranslations("Decision.Ladder")
  const title = t("title")
  const accent = t("titleAccent")
  const [before, after] = title.split(accent)

  return (
    <PaperSheet className="w-full">
      <div className="px-8 py-14 md:px-16">
        <header className="mb-10">
          <p className="text-[0.82rem] font-extrabold uppercase tracking-[0.2em] text-brand-orange">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 max-w-[13ch] text-[clamp(1.9rem,3.4vw,3rem)] font-bold leading-[1.02] tracking-[-0.03em] text-brand-ink">
            {before}
            <em className="font-extrabold not-italic text-brand-orange">{accent}</em>
            {after}
          </h2>
          <p className="mt-4 max-w-[34em] text-[0.95rem] leading-[1.62] text-brand-muted">
            {t("intro")}
          </p>
        </header>

        <Rung n={1}>
          <Mark level="personal_taste">{t("l1Mark")}</Mark>
          <p className="mt-3 text-lg font-bold text-brand-ink">{t("l1When")}</p>
          <p className="text-[clamp(1.5rem,2.6vw,2.4rem)] font-bold leading-[1.1] text-brand-ink">
            <HandRing>{t("l1Dish")}</HandRing>
          </p>
          <p className="mt-2 text-[0.9rem] leading-[1.6] text-brand-muted">{t("l1Reason")}</p>
          <p className="mt-3 max-w-[34em] border-l-2 border-brand-orange pl-3 text-[0.8rem] leading-[1.55] text-brand-muted">
            {t("l1Note")}
          </p>
        </Rung>

        <Rung n={2}>
          <Mark level="trusted_person">{t("l2Mark")}</Mark>
          <p className="mt-3 text-base font-bold text-brand-ink">{t("l2When")}</p>
          <p className="mt-1 text-xl font-bold text-brand-ink">{t("l2Dish")}</p>
          <p className="mt-2 text-[0.85rem] leading-[1.6] text-brand-muted">{t("l2Reason")}</p>
        </Rung>

        <Rung n={3}>
          <Mark level="maitred_menu">{t("l3Mark")}</Mark>
          <p className="mt-3 text-base font-bold text-brand-ink">{t("l3When")}</p>
          <dl className="mt-3 grid gap-1.5">
            {[
              [t("alwaysKey"), t("l3Always")],
              [t("tryKey"), t("l3Try")],
              [t("knowKey"), t("l3Know")],
            ].map(([key, value]) => (
              <div key={key} className="grid grid-cols-[max-content_minmax(0,1fr)] gap-3">
                <dt className="text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-brand-orange">
                  {key}
                </dt>
                <dd className="text-[0.9rem] font-medium leading-[1.5] text-brand-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[0.85rem] leading-[1.6] text-brand-muted">{t("l3Reason")}</p>
        </Rung>

        <Rung n={4}>
          <Mark level="community_evidence">{t("l4Mark")}</Mark>
          <p className="mt-3 text-base font-bold text-brand-ink">{t("l4When")}</p>
          <p className="mt-1 text-lg font-bold text-brand-ink">{t("l4Dish")}</p>
          <p className="mt-2 text-[0.85rem] leading-[1.6] text-brand-muted">{t("l4Reason")}</p>
        </Rung>

        <Rung n={5}>
          <Mark level="restaurant_provided">{t("l5Mark")}</Mark>
          <p className="mt-3 text-base font-bold text-brand-ink">{t("l5When")}</p>
          <p className="mt-1 text-lg font-bold text-brand-ink">{t("l5Dish")}</p>
          <p className="mt-2 text-[0.85rem] leading-[1.6] text-brand-muted">{t("l5Reason")}</p>
        </Rung>

        <Rung n={6}>
          <p className="text-base font-bold text-brand-ink">{t("l6When")}</p>
          <div className="mt-3 rounded-[3px] border border-dashed border-brand-muted/35 bg-white/30 p-6">
            <p className="text-lg font-semibold text-brand-ink">{t("l6Dish")}</p>
            <p className="mt-2 text-[0.85rem] leading-[1.6] text-brand-muted">{t("l6Reason")}</p>
          </div>
        </Rung>

        <p className="mt-10 max-w-[22em] border-t-2 border-brand-ink pt-6 text-[clamp(1rem,1.5vw,1.3rem)] font-bold leading-[1.38] tracking-[-0.018em] text-brand-ink">
          {t("closer")}
        </p>
      </div>
    </PaperSheet>
  )
}
