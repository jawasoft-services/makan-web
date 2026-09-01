import { useId } from "react"
import Image from "next/image"

export type DuelMeal = { name: string; src: string }
export type Duel = { a: DuelMeal; b: DuelMeal; winner: "a" | "b" }

function PenRing() {
  const penId = useId()
  return (
    <svg
      className="hand-ring h-full w-full -rotate-1 overflow-visible"
      viewBox="0 0 300 90"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <filter id={penId} x="-25%" y="-45%" width="150%" height="190%">
          <feTurbulence type="fractalNoise" baseFrequency="0.016" numOctaves="2" seed="9" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="6" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      <g filter={`url(#${penId})`}>
        <path className="hand-ring-lap1" d="M31,54 C25,30 74,13 149,9 C221,5 289,17 286,42 C283,67 209,86 141,84 C71,82 22,73 33,45" />
        <path className="hand-ring-lap2" d="M33,45 C40,27 78,18 131,13 C167,9 205,10 231,15" />
      </g>
    </svg>
  )
}

/**
 * One Eat or Yeet comparison, staged: the pair settles in at `inStage`, the
 * pick lands at `pickStage` (the saffron pen rings the winner, the loser
 * dims), and on md+ the whole duel makes way at `outStage` for the next one.
 * On mobile duels stack in flow and the window is ignored.
 */
export function EatOrYeetDuel({
  duel,
  or,
  pickedLabel,
  inStage,
  pickStage,
  outStage,
  shrinkTo,
  className = "",
}: {
  duel: Duel
  or: string
  pickedLabel: string
  inStage: number
  pickStage: number
  outStage?: number
  /** Where the ringed winner flies at handoff — its receipt's position. */
  shrinkTo?: { x: string; y: string }
  className?: string
}) {
  const cards = [
    { meal: duel.a, isWin: duel.winner === "a" },
    { meal: duel.b, isWin: duel.winner === "b" },
  ]
  // The wrapper lingers one stage past outStage so the winner's handoff
  // flight is visible while the next duel arrives; the loser windows itself
  // out at outStage.
  return (
    <div
      data-scene={inStage}
      {...(outStage !== undefined ? { "data-scene-until": outStage + 1 } : {})}
      data-place
      className={className}
    >
      <div className="relative grid grid-cols-2 gap-4">
        {cards.map(({ meal, isWin }) => (
          <figure
            key={meal.name}
            {...(isWin && outStage !== undefined
              ? {
                  "data-scene": outStage,
                  "data-eoy-shrink": "",
                  style: { "--shx": shrinkTo?.x, "--shy": shrinkTo?.y } as React.CSSProperties,
                }
              : {})}
            {...(!isWin && outStage !== undefined
              ? { "data-scene": inStage, "data-scene-until": outStage }
              : {})}
            className="relative w-full rounded-xl border border-brand-muted/20 bg-brand-card shadow-[0_12px_28px_-14px_rgba(43,21,3,0.4)]"
          >
            <div
              {...(isWin ? {} : { "data-scene": pickStage, "data-eoy-dim": "" })}
              className="overflow-hidden rounded-xl"
            >
              <div className="relative aspect-[3/2]">
                <Image
                  src={meal.src}
                  alt={meal.name}
                  fill
                  sizes="(min-width: 768px) 260px, 46vw"
                  className="object-cover object-top"
                />
              </div>
              <figcaption className="px-3 py-2.5 text-[0.85rem] font-bold text-brand-ink">
                {meal.name}
                {isWin ? <span className="sr-only"> — {pickedLabel}</span> : null}
              </figcaption>
            </div>
            {isWin ? (
              <span data-scene={pickStage} className="pointer-events-none absolute -inset-[7%] z-10 block">
                <PenRing />
              </span>
            ) : null}
          </figure>
        ))}
        <span className="pointer-events-none absolute left-1/2 top-[32%] z-20 -translate-x-1/2 rounded-full border border-brand-muted/25 bg-brand-cream px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-brand-muted">
          {or}
        </span>
      </div>
    </div>
  )
}

/**
 * A resolved comparison at receipt size: two thumbnails, winner ringed,
 * loser dimmed. These accumulate in a row as the big duels resolve — the
 * pile is the point: Makan learns from all of them together.
 */
export function SettledDuel({ duel, appearStage }: { duel: Duel; appearStage: number }) {
  const cards = [
    { meal: duel.a, isWin: duel.winner === "a" },
    { meal: duel.b, isWin: duel.winner === "b" },
  ]
  return (
    <span
      data-scene={appearStage}
      style={{ transitionDelay: "0.45s" }}
      className="relative flex items-center gap-1.5"
    >
      {cards.map(({ meal, isWin }) => (
        <span
          key={meal.name}
          className="relative block h-11 w-16 overflow-hidden rounded-md border border-brand-muted/25"
        >
          <Image
            src={meal.src}
            alt=""
            fill
            sizes="64px"
            className={`object-cover object-top ${isWin ? "" : "opacity-50 grayscale-[0.4]"}`}
          />
          {isWin ? (
            <span className="pointer-events-none absolute -inset-[10%]">
              <PenRing />
            </span>
          ) : null}
        </span>
      ))}
      <span className="sr-only">
        {duel.winner === "a" ? duel.a.name : duel.b.name} ✓
      </span>
    </span>
  )
}
