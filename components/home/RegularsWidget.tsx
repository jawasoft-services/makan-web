"use client"

import { useId, useRef, useState } from "react"
import { MaitredCardContent } from "@/components/maitred/MaitredIllustration"

// Shared native-style content keeps both tabs populated and the card height stable.
export default function RegularsWidget({ locale, labels, label, rulesLabel, rules, initialTab = 1 }: {
  initialTab?: number
  locale: string
  labels: [string, string]
  label: string
  rulesLabel: string
  rules: { title: string; qualify: string; holder: string; usual: string }
}) {
  const [selected, setSelected] = useState(initialTab)
  const [showRules, setShowRules] = useState(false)
  const id = useId()
  const infoButton = useRef<HTMLButtonElement>(null)
  const buttons = useRef<(HTMLButtonElement | null)[]>([])
  function select(index: number, focus = false) {
    setSelected(index)
    setShowRules(false)
    if (focus) buttons.current[index]?.focus()
  }

  return (
    <div data-beat style={{ "--beat": 2 } as React.CSSProperties} className="relative mx-auto flex w-full max-w-[34rem] flex-col gap-4 rounded-2xl border border-brand-line bg-white p-4 text-brand-ink" aria-label={label}
      onKeyDown={event => {
        if (event.key === "Escape" && showRules) {
          setShowRules(false)
          infoButton.current?.focus()
        }
      }}>
      <div className="flex min-w-0 items-center gap-2">
      <div role="tablist" aria-label={label} className="flex min-w-0 flex-1 gap-2">
        {labels.map((text, index) => (
          <button key={text} ref={node => { buttons.current[index] = node }} id={`${id}-tab-${index}`} type="button" role="tab" aria-selected={selected === index} aria-controls={`${id}-panel-${index}`} tabIndex={selected === index ? 0 : -1}
            className={`flex min-h-11 min-w-0 flex-1 items-center justify-center rounded-xl px-1 py-2 text-center text-[clamp(0.8125rem,3.3vw,1rem)] font-bold leading-tight text-brand-muted hover:bg-brand-orange/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-ink ${!showRules && selected === index ? "bg-brand-orange/15" : "bg-transparent"}`}
            onClick={() => select(index)}
            onKeyDown={event => {
              if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return
              event.preventDefault()
              select(event.key === "Home" ? 0 : event.key === "End" ? 1 : 1 - selected, true)
            }}>
            <span>{text}</span>
          </button>
        ))}
      </div>
      <button ref={infoButton} type="button" aria-label={rulesLabel} aria-expanded={showRules} aria-controls={`${id}-rules`} onClick={() => setShowRules(!showRules)} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-brand-ink hover:bg-brand-orange/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-ink ${showRules ? "bg-brand-orange/15" : ""}`}>
        <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v6M12 7h.01" />
        </svg>
      </button>
      </div>
      <div className="relative min-w-0">
      {(["regulars", "order"] as const).map((tab, index) => (
        <div key={tab} id={`${id}-panel-${index}`} role="tabpanel" tabIndex={0} aria-labelledby={`${id}-tab-${index}`} hidden={selected !== index} aria-hidden={showRules || undefined} className={showRules ? "invisible" : ""}>
          <MaitredCardContent locale={locale} stage="order" tab={tab} />
        </div>
      ))}
      <div id={`${id}-rules`} role="region" tabIndex={0} aria-labelledby={`${id}-rules-title`} hidden={!showRules} className="absolute inset-0 overflow-y-auto bg-white px-1 pb-2 text-brand-ink">
        <h3 id={`${id}-rules-title`} className="mb-3 text-xl font-bold leading-tight">{rules.title}</h3>
        <div className="space-y-3 text-[clamp(0.875rem,3.6vw,1rem)] leading-[1.45] text-brand-muted">
          <p>{rules.qualify}</p>
          <p>{rules.holder}</p>
          <p>{rules.usual}</p>
        </div>
      </div>
      </div>
    </div>
  )
}
