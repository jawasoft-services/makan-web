import type { CSSProperties } from "react"
import PenRing from "@/components/decision/PenRing"

export type MenuEntry = {
  name: string
  description?: string
  price: string
  /** Dietary markers as printed, e.g. "VG GF". */
  diet?: string
  /** Makan's annotation: a hand-drawn ring around the name, with a label.
   *  `stage` is the scroll-scene index the ring draws at (default 2). */
  circled?: { label: string; stage?: number }
}

/**
 * One printed menu line. Prices are right-aligned and tabular; cafés that
 * describe their dishes do not use dot leaders — those are a fine-dining
 * convention for undescribed items.
 *
 * `circled` renders Makan's mark on the menu: the pen ring around the name
 * and the page's ONE saffron pill — the answer itself. Every other label on
 * the page is plain ink so this one stays loud. The name itself stays plain
 * DOM text and is never hidden.
 */
export default function MenuItem({ name, description, price, diet, circled }: MenuEntry) {
  // A ringed line takes extra air above it so the label sits on blank paper,
  // never across the previous line's description or a section rule. The
  // margin collapses with the previous item's, so it is sized as the whole
  // gap, not as an addition.
  return (
    <li className={`mb-[0.8em] list-none ${circled ? "mt-[2.4rem]" : ""}`}>
      <div className="flex items-baseline justify-between gap-5">
        <span className="text-[1.05rem] font-semibold text-brand-ink">
          {circled ? (
            <span className="relative inline-block">
              <span className="relative z-[2]">{name}</span>
              <span
                data-scene={circled.stage ?? 2}
                aria-hidden
                className="absolute left-[-12%] top-[-48%] z-[1] block h-[196%] w-[124%]"
              >
                <PenRing className="-rotate-2" />
                <span
                  data-deal
                  style={{ "--deal": 7 } as CSSProperties}
                  className="absolute left-1/2 top-[-1.2rem] -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-orange px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-white rotate-[-2deg]"
                >
                  {circled.label}
                </span>
              </span>
              <span className="sr-only">{circled.label}</span>
            </span>
          ) : (
            name
          )}
          {diet ? (
            <span className="ml-1.5 text-[0.6rem] font-bold tracking-[0.1em] text-brand-muted">
              {diet}
            </span>
          ) : null}
        </span>
        <span className="text-[0.95rem] font-semibold tabular-nums text-brand-muted">
          {price}
        </span>
      </div>
      {description ? (
        <p className="mt-[0.16em] max-w-[88%] text-[0.8rem] leading-[1.42] text-brand-muted">
          {description}
        </p>
      ) : null}
    </li>
  )
}
