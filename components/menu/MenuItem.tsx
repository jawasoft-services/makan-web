import { useId, type CSSProperties } from "react"

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
 * `circled` renders Makan's mark on the menu: a hand-drawn saffron ring
 * around the name (staged as scene 2 in the hero scroll) and a small label.
 * The name itself stays plain DOM text and is never hidden.
 */
export default function MenuItem({ name, description, price, diet, circled }: MenuEntry) {
  const penId = useId()
  return (
    <li className="mb-[0.8em] list-none">
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
                <svg
                  className="hand-ring h-full w-full -rotate-2 overflow-visible"
                  viewBox="0 0 300 90"
                  preserveAspectRatio="none"
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
                <span
                  data-deal
                  style={{ "--deal": 7 } as CSSProperties}
                  className="absolute left-1/2 top-[-1.2rem] -translate-x-1/2 whitespace-nowrap rounded-full bg-brand-orange px-2.5 py-1 text-[0.62rem] font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_4px_10px_-4px_rgba(255,153,50,0.7)] rotate-[-2deg]"
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
