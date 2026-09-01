import { useId, type ReactNode } from "react"

/**
 * A hand-drawn saffron ring around a dish name. Three things make it read as
 * a pen rather than a shape: the path is deliberately not an ellipse, a second
 * lighter lap sweeps back over the top-left past the start, and
 * feDisplacementMap pushes the edges around.
 *
 * baseFrequency must stay LOW (0.016). High-frequency displacement reads as a
 * shaky hand; low-frequency reads as a confident stroke that is simply not
 * perfect. Same amplitude, opposite character.
 */
export default function HandRing({ children }: { children: ReactNode }) {
  const filterId = useId()

  return (
    <span className="relative z-0 mx-[0.72em] my-[0.55em] inline-block">
      <span className="relative z-[2]">{children}</span>
      <svg
        className="hand-ring absolute left-[-23%] top-[-100%] z-[1] h-[300%] w-[148%] -rotate-[1.3deg] overflow-visible"
        viewBox="0 0 300 90"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <filter id={filterId} x="-25%" y="-45%" width="150%" height="190%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.016"
              numOctaves="2"
              seed="9"
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale="6"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <g filter={`url(#${filterId})`}>
          <path
            className="hand-ring-lap1"
            d="M31,54 C25,30 74,13 149,9 C221,5 289,17 286,42 C283,67 209,86 141,84 C71,82 22,73 33,45"
          />
          <path
            className="hand-ring-lap2"
            d="M33,45 C40,27 78,18 131,13 C167,9 205,10 231,15"
          />
        </g>
      </svg>
    </span>
  )
}
