import type { ReactNode } from "react"
import {
  MARK_CLASSES,
  markFormFor,
  type DecisionEvidenceLevel,
} from "./evidence"

type AnswerCardProps = {
  level: DecisionEvidenceLevel
  /** The saffron label. Its meaning MUST also appear in ink nearby. */
  mark: string
  dish: ReactNode
  reason: string
  note?: string
  className?: string
}

export default function AnswerCard({
  level,
  mark,
  dish,
  reason,
  note,
  className = "",
}: AnswerCardProps) {
  const form = markFormFor(level)
  const insufficient = level === "insufficient"

  return (
    <div
      className={[
        insufficient
          ? "rounded-[3px] border border-dashed border-brand-muted/35 bg-white/30"
          : "rounded-xl border-[1.5px] border-brand-orange bg-brand-card shadow-[0_3px_7px_-2px_rgba(43,21,3,0.14),0_16px_30px_-14px_rgba(43,21,3,0.34)]",
        "p-[1.5em]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={`inline-block text-[0.72rem] font-extrabold uppercase tracking-[0.15em] ${MARK_CLASSES[form]}`}
      >
        {mark}
      </span>
      <p className="mt-[0.9em] text-[1.5rem] font-bold leading-[1.1] text-brand-ink">
        {dish}
      </p>
      <p className="mt-[0.5em] text-[0.85rem] leading-[1.55] text-brand-muted">
        {reason}
      </p>
      {note ? (
        <p className="mt-[0.85em] border-l-2 border-brand-orange pl-[0.9em] text-[0.78rem] leading-[1.55] text-brand-muted">
          {note}
        </p>
      ) : null}
    </div>
  )
}
