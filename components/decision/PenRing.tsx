import { useId } from "react"

/**
 * The site's one gesture: a hand-drawn saffron ring. Two laps (the second
 * sweeps back over the start, as a pen does) pushed around by low-frequency
 * displacement — a confident stroke that is simply not perfect. Colour comes
 * from the brand token via currentColor; the draw animation lives in CSS and
 * only runs when motion is allowed, so the ring is always fully visible by
 * default.
 */
export default function PenRing({ className = "" }: { className?: string }) {
  const penId = useId()
  return (
    <svg
      className={`hand-ring h-full w-full overflow-visible text-brand-orange ${className}`}
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
