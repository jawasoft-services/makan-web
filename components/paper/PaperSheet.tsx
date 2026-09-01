import type { ReactNode } from "react"

type PaperSheetProps = {
  children: ReactNode
  /** Renders the centre crease of an open spread. */
  fold?: boolean
  className?: string
}

/**
 * The paper ground every decision-first section sits on. Four CSS-only
 * layers — no image asset, so nothing to download and nothing to go soft on a
 * retina screen. All layers are pointer-events:none and sit below the content
 * in z-order, so the text above them stays real, selectable and translatable.
 */
export default function PaperSheet({
  children,
  fold = false,
  className = "",
}: PaperSheetProps) {
  return (
    <div className={`paper-sheet ${className}`.trim()}>
      <div className="paper-tone" aria-hidden />
      <div className="paper-relief" aria-hidden />
      <div className="paper-tooth" aria-hidden />
      {fold ? <div className="paper-fold hidden md:block" aria-hidden /> : null}
      <div className="paper-edge" aria-hidden />
      <div className="paper-body">{children}</div>
    </div>
  )
}
