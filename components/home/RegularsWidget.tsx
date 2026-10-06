"use client"

import Image from "next/image"
import { useId, useRef, useState } from "react"

// The prepared captures already contain the visible tabs and content.
// Reuse the wireframe's hit areas instead of drawing duplicate labels over them.
export default function RegularsWidget({ labels, alts, label, rulesLabel, rules }: {
  labels: [string, string]
  alts: [string, string]
  label: string
  rulesLabel: string
  rules: { title: string; qualify: string; holder: string; usual: string }
}) {
  const [selected, setSelected] = useState(0)
  const [showRules, setShowRules] = useState(false)
  const id = useId()
  const infoButton = useRef<HTMLButtonElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  const images = ["regulars.png", "usual-order.png"]
  function select(index: number, focus = false) {
    setSelected(index)
    setShowRules(false)
    if (focus) buttons.current[index]?.focus()
  }

  return (
    <div data-beat style={{ "--beat": 2 } as React.CSSProperties} className="relative mx-auto aspect-[1086/942] w-full max-w-[26rem]" aria-label={label}
      onKeyDown={event => {
        if (event.key === "Escape" && showRules) {
          setShowRules(false)
          infoButton.current?.focus()
        }
      }}>
      {images.map((image, index) => (
        <div key={image} id={`${id}-panel-${index}`} role="tabpanel" aria-labelledby={`${id}-tab-${index}`} hidden={selected !== index} aria-hidden={showRules || undefined} className="absolute inset-0">
          <Image src={`/mockup-assets/${image}`} alt={alts[index]} width={1086} height={942} sizes="(min-width: 768px) 468px, 90vw" className="block h-auto w-full" loading="eager" />
        </div>
      ))}
      {showRules ? <span aria-hidden="true" className="pointer-events-none absolute left-[4%] top-[4%] z-10 h-[19%] w-[77%] bg-brand-card" /> : null}
      <div role="tablist" aria-label={label}>
        {labels.map((text, index) => (
          <button key={text} ref={node => { buttons.current[index] = node }} id={`${id}-tab-${index}`} type="button" role="tab" aria-selected={!showRules && selected === index} aria-controls={`${id}-panel-${index}`} tabIndex={selected === index ? 0 : -1}
            className={`absolute top-[5.4%] z-10 h-[15.3%] min-h-11 w-[36.5%] rounded-[18px] text-[clamp(0.75rem,3.8vw,1rem)] font-bold text-brand-muted hover:bg-brand-orange/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-ink ${showRules ? "bg-brand-card" : "bg-transparent"}`}
            style={{ left: index === 0 ? "4.7%" : "43.4%" }}
            onClick={() => select(index)}
            onKeyDown={event => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
              event.preventDefault()
              select(event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - selected, true)
            }}>
            <span className={showRules ? "" : "sr-only"}>{text}</span>
          </button>
        ))}
      </div>
      <button ref={infoButton} type="button" aria-label={rulesLabel} aria-expanded={showRules} aria-controls={`${id}-rules`} onClick={() => setShowRules(!showRules)} className={`absolute left-[88.6%] top-[13%] z-10 h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full hover:bg-brand-orange/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-ink ${showRules ? "bg-brand-orange/15" : ""}`} />
      <div id={`${id}-rules`} role="region" tabIndex={0} aria-labelledby={`${id}-rules-title`} hidden={!showRules} className="absolute inset-x-[4.7%] bottom-[5%] top-[26%] z-10 overflow-y-auto bg-brand-card px-1 pb-2 text-brand-ink">
        <h3 id={`${id}-rules-title`} className="mb-3 text-xl font-bold leading-tight">{rules.title}</h3>
        <div className="space-y-3 text-[clamp(0.875rem,3.6vw,1rem)] leading-[1.45] text-brand-muted">
          <p>{rules.qualify}</p>
          <p>{rules.holder}</p>
          <p>{rules.usual}</p>
        </div>
      </div>
    </div>
  )
}
