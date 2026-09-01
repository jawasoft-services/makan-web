import type { CSSProperties, ReactNode } from "react"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import PaperSheet from "@/components/paper/PaperSheet"
import HandRing from "@/components/decision/HandRing"
import { MARK_CLASSES, markFormFor, type DecisionEvidenceLevel } from "@/components/decision/evidence"
import EatOrYeetProof from "@/components/decision/EatOrYeetProof"
import Reveal from "@/components/motion/Reveal"

const beat = (n: number) => ({ "--beat": n }) as CSSProperties

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

function Rung({ n, children }: { n: number; children: ReactNode }) {
  return (
    <Reveal className="border-t border-brand-muted/20 first:border-t-0">
      <article className={`grid grid-cols-[3rem_minmax(0,1fr)] gap-x-6 ${RUNG_PADDING[n]}`}>
        <div data-beat style={beat(0)} className="text-[1.6rem] font-extralight leading-none tabular-nums text-brand-muted">
          {String(n).padStart(2, "0")}
        </div>
        <div data-beat style={beat(1)}>{children}</div>
      </article>
    </Reveal>
  )
}

export default async function EvidenceLadder() {
  const t = await getTranslations("Decision.Ladder")
  const title = t("title")
  const accent = t("titleAccent")
  const hasAccent = title.includes(accent)
  const [before, after] = hasAccent ? title.split(accent) : [title, ""]

  return (
    <PaperSheet className="w-full">
      <div className="px-8 py-14 md:px-16">
        <Reveal>
        <header className="mb-10">
          <p data-beat style={beat(0)} className="text-[0.82rem] font-extrabold uppercase tracking-[0.2em] text-brand-orange">
            {t("eyebrow")}
          </p>
          <h2 data-beat style={beat(1)} className="mt-3 max-w-[13ch] text-[clamp(1.9rem,3.4vw,3rem)] font-bold leading-[1.02] tracking-[-0.03em] text-brand-ink">
            {before}
            {hasAccent ? (
              <em className="font-extrabold not-italic text-brand-ink underline decoration-brand-orange decoration-4 underline-offset-4">
                {accent}
              </em>
            ) : null}
            {after}
          </h2>
          <p data-beat style={beat(2)} className="mt-4 max-w-[34em] text-[0.95rem] leading-[1.62] text-brand-muted">
            {t("intro")}
          </p>
        </header>
        </Reveal>

        <div>

        <Rung n={1}>
          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_clamp(150px,22vw,240px)] md:items-center">
            <div>
              <Mark level="personal_taste">{t("l1Mark")}</Mark>
              <p className="mt-3 text-lg font-bold text-brand-ink">{t("l1When")}</p>
              <p className="text-[clamp(1.5rem,2.6vw,2.4rem)] font-bold leading-[1.1] text-brand-ink">
                <HandRing>{t("l1Dish")}</HandRing>
              </p>
              <p className="mt-2 text-[0.9rem] leading-[1.6] text-brand-muted">{t("l1Reason")}</p>
              <EatOrYeetProof
                className="mt-3"
                lead={t("l1ProofLead")}
                beaten={[t("l1Beat1"), t("l1Beat2"), t("l1Beat3")]}
                more={t("l1More")}
              />
              <p className="mt-3 max-w-[34em] border-l-2 border-brand-orange pl-3 text-[0.8rem] leading-[1.55] text-brand-muted">
                {t("l1Note")}
              </p>
            </div>
            <figure className="relative -rotate-1 overflow-hidden rounded-[3px] shadow-[0_2px_4px_rgba(43,21,3,0.14),0_18px_34px_-18px_rgba(43,21,3,0.5)]">
              <div className="relative aspect-[1200/828]">
                <Image
                  src="/meals/IMG_6952.jpg"
                  alt="Eggs Benedict saved on Makan by @Valesca"
                  fill
                  sizes="(min-width: 768px) 240px, 100vw"
                  className="object-cover object-top"
                />
              </div>
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(36,17,2,0.82)] to-transparent px-3 pb-2 pt-8 text-[0.6rem] font-semibold tracking-[0.06em] text-white">
                Saved by @Valesca · Eggs Benedict
              </figcaption>
            </figure>
          </div>
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
          <dl className="mt-3 grid grid-cols-[max-content_minmax(0,1fr)] gap-x-3 gap-y-1.5">
            {[
              [t("alwaysKey"), t("l3Always")],
              [t("tryKey"), t("l3Try")],
              [t("knowKey"), t("l3Know")],
            ].map(([key, value]) => (
              <div key={key} className="contents">
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
        </div>

        <Reveal>
          <p data-beat style={beat(0)} className="mt-10 max-w-[22em] border-t-2 border-brand-ink pt-6 text-[clamp(1rem,1.5vw,1.3rem)] font-bold leading-[1.38] tracking-[-0.018em] text-brand-ink">
            {t("closer")}
          </p>
        </Reveal>
      </div>
    </PaperSheet>
  )
}
