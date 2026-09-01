import Image from "next/image"

type Meal = { name: string; src: string }

/**
 * The Eat or Yeet mechanism, played out on the page: two meals the reader's
 * stand-in actually saved, the app's real question, and — one scroll stage
 * later — the pick. Cards carry data-scene="5" with data-eoy-win/-dim, so
 * they stay visible from the moment the duel appears and only the DECISION
 * animates: winner lifts and gains the saffron ring and tick, loser dims.
 */
function Card({
  meal,
  isWin,
  pickedLabel,
}: {
  meal: Meal
  isWin: boolean
  pickedLabel: string
}) {
  return (
    <figure
      data-scene="5"
      {...(isWin ? { "data-eoy-win": "" } : { "data-eoy-dim": "" })}
      className="relative w-full overflow-hidden rounded-xl border border-brand-muted/20 bg-brand-card shadow-[0_10px_24px_-12px_rgba(43,21,3,0.35)]"
    >
      <div className="relative aspect-[1080/720]">
        <Image
          src={meal.src}
          alt={meal.name}
          fill
          sizes="(min-width: 768px) 200px, 45vw"
          className="object-cover object-top"
        />
      </div>
      <figcaption className="px-2.5 py-2 text-[0.78rem] font-bold text-brand-ink">
        {meal.name}
        {isWin ? <span className="sr-only"> — {pickedLabel}</span> : null}
      </figcaption>
      {isWin ? (
        <>
          <span
            data-scene="5"
            aria-hidden
            className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-brand-orange text-sm font-extrabold text-white shadow-[0_4px_10px_-3px_rgba(255,153,50,0.8)]"
          >
            ✓
          </span>
          <span
            data-scene="5"
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-xl border-[3px] border-brand-orange"
          />
        </>
      ) : null}
    </figure>
  )
}

export default function EatOrYeetDuel({
  question,
  or,
  a,
  b,
  winner,
  pickedLabel,
  className = "",
}: {
  question: string
  or: string
  a: Meal
  b: Meal
  winner: "a" | "b"
  pickedLabel: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="text-[0.9rem] font-bold text-brand-ink">{question}</p>
      <div className="relative mt-2 grid grid-cols-2 gap-3">
        <Card meal={a} isWin={winner === "a"} pickedLabel={pickedLabel} />
        <Card meal={b} isWin={winner === "b"} pickedLabel={pickedLabel} />
        <span className="pointer-events-none absolute left-1/2 top-[34%] -translate-x-1/2 rounded-full border border-brand-muted/25 bg-brand-cream px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
          {or}
        </span>
      </div>
    </div>
  )
}
