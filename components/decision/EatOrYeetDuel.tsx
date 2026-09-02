import Image from "next/image"
import PenRing from "./PenRing"

export type DuelMeal = { name: string; src: string }
export type Duel = { a: DuelMeal; b: DuelMeal; winner: "a" | "b" }

/**
 * One Eat or Yeet comparison, staged: the pair settles in at `inStage`, the
 * pick lands at `pickStage` (the saffron pen rings the winner, the loser
 * dims), and on md+ the whole duel makes way at `outStage` for the next one.
 * On mobile — and whenever the scene is not armed — duels stack in flow and
 * the window is ignored.
 */
export function EatOrYeetDuel({
  duel,
  or,
  pickedLabel,
  inStage,
  pickStage,
  learnStage,
  learnLabel,
  learned,
  outStage,
  shrinkTo,
  className = "",
}: {
  duel: Duel
  or: string
  pickedLabel: string
  inStage: number
  pickStage: number
  /** The settle beat: the ring holds and Makan says what it just learned. */
  learnStage?: number
  learnLabel?: string
  learned?: string
  outStage?: number
  /** Where the ringed winner flies at handoff — its receipt's position —
   *  and how small it gets (scale, default 0.24). */
  shrinkTo?: { x: string; y: string; scale?: number }
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
                  style: { "--shx": shrinkTo?.x, "--shy": shrinkTo?.y, "--shs": shrinkTo?.scale } as React.CSSProperties,
                }
              : {})}
            {...(!isWin && outStage !== undefined
              ? { "data-scene": inStage, "data-scene-until": outStage }
              : {})}
            className="saved-card relative w-full"
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
                {isWin ? (
                  <span data-scene={pickStage} className="pointer-events-none absolute -inset-[6%] z-10 block">
                    <PenRing className="-rotate-1" />
                  </span>
                ) : null}
              </div>
              <figcaption className="px-3 py-2.5 text-[0.85rem] font-bold text-brand-ink">
                {meal.name}
                {isWin ? <span className="sr-only">: {pickedLabel}</span> : null}
              </figcaption>
            </div>
          </figure>
        ))}
        {/* Windowed with the loser: at handoff only the flying winner remains,
            so the next pair's "or" never lands on top of this one. */}
        <span
          {...(outStage !== undefined ? { "data-scene": inStage, "data-scene-until": outStage } : {})}
          className="pointer-events-none absolute left-1/2 top-[32%] z-20 -translate-x-1/2 rounded-full border border-brand-orange/30 bg-brand-cream px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-brand-orange"
        >
          {or}
        </span>
      </div>
      {learnStage !== undefined && learned ? (
        <p
          data-scene={learnStage}
          {...(outStage !== undefined ? { "data-scene-until": outStage } : {})}
          className="mt-3 text-[0.85rem] leading-[1.5]"
        >
          <span className="mr-2 text-[0.66rem] font-bold uppercase tracking-[0.14em] text-brand-orange">
            {learnLabel}
          </span>
          <span className="font-bold text-brand-ink">{learned}</span>
        </p>
      ) : null}
    </div>
  )
}

/**
 * A resolved comparison at receipt size: two thumbnails, winner ringed,
 * loser dimmed. These accumulate in a row as the big duels resolve — the
 * pile is the point: Makan learns from all of them together.
 */
export function SettledDuel({
  duel,
  appearStage,
  pickedLabel,
}: {
  duel: Duel
  appearStage: number
  pickedLabel: string
}) {
  const cards = [
    { meal: duel.a, isWin: duel.winner === "a" },
    { meal: duel.b, isWin: duel.winner === "b" },
  ]
  const winner = duel.winner === "a" ? duel.a : duel.b
  return (
    <span
      data-scene={appearStage}
      style={{ transitionDelay: "0.45s" }}
      className="relative flex items-center gap-1.5"
    >
      {cards.map(({ meal, isWin }) => (
        <span
          key={meal.name}
          className="relative block h-9 w-[3.4rem] overflow-hidden rounded-md border border-brand-muted/25"
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
              <PenRing className="-rotate-1" />
            </span>
          ) : null}
        </span>
      ))}
      <span className="sr-only">
        {duel.a.name} / {duel.b.name}: {winner.name} {pickedLabel}
      </span>
    </span>
  )
}
