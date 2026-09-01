import type { CSSProperties } from "react"

type Duel = { win: string; lose: string }

type EatOrYeetProofProps = {
  /** One short line introducing the receipts, in ink. */
  lead: string
  /** Head-to-head picks: the winner kept, the loser struck through. */
  duels?: Duel[]
  /** Alternative mode: dishes one fixed winner beat, struck through. */
  beaten?: string[]
  /** Trailing "and N more" chip for the beaten mode. */
  more?: string
  /** One quiet closing line under the chips. */
  tally?: string
  className?: string
}

const deal = (i: number) => ({ "--deal": i }) as CSSProperties

/**
 * The receipts behind a Makan answer: the reader's own Eat or Yeet picks,
 * dealt in one at a time. The saffron tick is emphasis only — the meaning
 * (which dish won) is carried by the strikethrough and the sr-only "beat".
 */
export default function EatOrYeetProof({
  lead,
  duels,
  beaten,
  more,
  tally,
  className = "",
}: EatOrYeetProofProps) {
  return (
    <div className={className}>
      <p className="text-[0.8rem] font-semibold leading-[1.5] text-brand-ink">{lead}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {duels?.map((duel, i) => (
          <li
            key={duel.win + duel.lose}
            data-deal
            style={deal(i)}
            className="inline-flex items-baseline gap-1.5 rounded-full border border-brand-muted/25 bg-white/60 px-3 py-1.5 text-[0.78rem]"
          >
            <span className="font-bold text-brand-ink">{duel.win}</span>
            <span aria-hidden className="font-bold text-brand-orange">✓</span>
            <span className="sr-only">beat</span>
            <span className="text-brand-muted line-through">{duel.lose}</span>
          </li>
        ))}
        {beaten?.map((dish, i) => (
          <li
            key={dish}
            data-deal
            style={deal(i)}
            className="inline-flex items-baseline rounded-full border border-brand-muted/25 bg-white/60 px-3 py-1.5 text-[0.78rem] text-brand-muted line-through"
          >
            {dish}
          </li>
        ))}
        {beaten && more ? (
          <li
            data-deal
            style={deal(beaten.length)}
            className="inline-flex items-baseline rounded-full border border-brand-muted/25 px-3 py-1.5 text-[0.78rem] font-semibold text-brand-muted"
          >
            {more}
          </li>
        ) : null}
      </ul>
      {tally ? (
        <p
          data-deal
          style={deal((duels?.length ?? beaten?.length ?? 0) + 1)}
          className="mt-2 text-[0.78rem] leading-[1.5] text-brand-muted"
        >
          {tally}
        </p>
      ) : null}
    </div>
  )
}
