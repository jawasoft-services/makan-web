import Image from "next/image"
import { storyBlur } from "@/lib/story-blur"
import EatScoreTicker from "./EatScoreTicker"
import { restaurantScore } from "@/lib/example-standings"

export type DuelMeal = { name: string; restaurant: string; src: string; eats: number; matchups: number }
export type Duel = { a: DuelMeal; b: DuelMeal; winner: "a" | "b" }

/**
 * One Eat or Yeet comparison, staged: the pair settles in at `inStage`, the
 * pick lands at `pickStage` (the orange border highlights the winner, the loser
 * dims), and on md+ the whole duel makes way at `outStage` for the next one.
 * On mobile — and whenever the scene is not armed — duels stack in flow and
 * the window is ignored.
 */
export function EatOrYeetDuel({
  duel,
  or,
  pickedLabel,
  scoreLabel,
  eatsLabel,
  matchupsLabel,
  atLabel,
  inStage,
  pickStage,
  learnStage,
  learnLabel,
  learned,
  outStage,
  className = "",
}: {
  duel: Duel
  or: string
  pickedLabel: string
  scoreLabel: string
  eatsLabel: string
  matchupsLabel: string
  atLabel: string
  inStage: number
  pickStage: number
  /** The settle beat: the ring holds and Makan says what it just learned. */
  learnStage?: number
  learnLabel?: string
  learned?: string
  outStage?: number
  className?: string
}) {
  const cards = [
    { meal: duel.a, isWin: duel.winner === "a" },
    { meal: duel.b, isWin: duel.winner === "b" },
  ].map(card => ({ ...card, before: restaurantScore(card.meal), after: restaurantScore(card.meal, card.isWin) }))
  return (
    <div
      data-scene={inStage}
      {...(outStage !== undefined ? { "data-scene-until": outStage } : {})}
      data-place
      className={className}
    >
      <div className="relative grid grid-cols-2 gap-4">
        {cards.map(({ meal, isWin, before, after }) => (
          <figure
            key={meal.name}
            className="saved-card relative w-full"
          >
            <div
              {...(isWin ? {} : { "data-scene": pickStage, "data-eoy-dim": "" })}
              className="overflow-hidden rounded-xl"
            >
              <div className="relative aspect-[3/2]">
                <Image
                  src={meal.src}
                  placeholder="blur"
                  blurDataURL={storyBlur(meal.src)}
                  loading="eager"
                  alt={`${meal.name} ${atLabel} ${meal.restaurant}`}
                  fill
                  sizes="(min-width: 768px) 260px, 46vw"
                  className="object-cover object-top"
                />
              </div>
              <figcaption className="px-3 py-2.5 text-[0.92rem] font-bold text-brand-ink">
                {meal.name}
                <span className="block text-[0.78rem] font-semibold text-brand-muted">{meal.restaurant}</span>
                {isWin ? <span className="sr-only">: {pickedLabel}</span> : null}
                <EatScoreTicker before={before} after={after} scoreLabel={scoreLabel} eatsLabel={eatsLabel} matchupsLabel={matchupsLabel} />
              </figcaption>
            </div>
            {isWin ? (
              <span data-scene={pickStage} data-place data-winner-highlight aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 rounded-xl border-[3px] border-brand-orange" />
            ) : null}
          </figure>
        ))}
        <span
          {...(outStage !== undefined ? { "data-scene": inStage, "data-scene-until": outStage } : {})}
          className="pointer-events-none absolute left-1/2 top-[32%] z-20 -translate-x-1/2 rounded-full border border-brand-orange/30 bg-brand-cream px-2.5 py-1 text-[0.72rem] font-bold uppercase tracking-[0.12em] text-brand-orange md:text-[0.68rem]"
        >
          {or}
        </span>
      </div>
      {learnStage !== undefined && learned ? (
        <p
          data-scene={learnStage}
          {...(outStage !== undefined ? { "data-scene-until": outStage } : {})}
          className="mt-3 text-[0.92rem] leading-[1.5]"
        >
          {/* Own line on phones: the label and the lesson wrap as two boxes, never one over the other. */}
          <span className="block text-[0.74rem] font-bold uppercase tracking-[0.14em] text-brand-orange md:mr-2 md:inline md:text-[0.74rem]">
            {learnLabel}
          </span>
          <span className="font-bold text-brand-ink">{learned}</span>
        </p>
      ) : null}
    </div>
  )
}

