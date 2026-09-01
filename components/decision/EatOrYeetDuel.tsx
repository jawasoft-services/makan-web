import { useId } from "react"
import Image from "next/image"

type Meal = { name: string; src: string }

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

function Card({
  meal,
  isWin,
  pickedLabel,
}: {
  meal: Meal
  isWin: boolean
  pickedLabel: string
}) {
  const body = (
    <>
      <div className="relative aspect-[1080/720]">
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
    </>
  )

  return (
    <figure
      data-scene="4"
      data-place
      className="relative w-full rounded-xl border border-brand-muted/20 bg-brand-card shadow-[0_12px_28px_-14px_rgba(43,21,3,0.4)]"
    >
      {isWin ? (
        <>
          <div className="overflow-hidden rounded-xl">{body}</div>
          {/* The pick: the same pen that marks the menu rings the winner. */}
          <span data-scene="5" className="pointer-events-none absolute -inset-[7%] z-10 block">
            <PenRing />
          </span>
        </>
      ) : (
        <div data-scene="5" data-eoy-dim className="overflow-hidden rounded-xl">
          {body}
        </div>
      )}
    </figure>
  )
}

/**
 * The Eat or Yeet mechanism, played out on the page. Both meals settle in
 * together (stage 4); one scroll stage later the pick lands — the saffron
 * pen rings the winner while the loser dims and steps back (stage 5).
 */
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
      <p data-scene="4" className="text-[0.95rem] font-bold text-brand-ink">{question}</p>
      <div className="relative mt-3 grid grid-cols-2 gap-4">
        <Card meal={a} isWin={winner === "a"} pickedLabel={pickedLabel} />
        <Card meal={b} isWin={winner === "b"} pickedLabel={pickedLabel} />
        <span
          data-scene="4"
          className="pointer-events-none absolute left-1/2 top-[34%] z-20 -translate-x-1/2 rounded-full border border-brand-muted/25 bg-brand-cream px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-brand-muted"
        >
          {or}
        </span>
      </div>
    </div>
  )
}
