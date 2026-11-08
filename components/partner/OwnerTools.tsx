'use client'

import { useRef, useState } from 'react'
import PlayfulArrow from '@/components/PlayfulArrow'
import MaitredNativeMockup from '@/components/maitred/MaitredNativeMockup'
import OwnerNativeMockup from './OwnerNativeMockup'

export type OwnerTool = { id: 'discover' | 'restaurant' | 'dashboard'; label: string; eyebrow: string; title: string; body: string; points: string[]; action: string; href: string }

export default function OwnerTools({ locale, title, label, caption, tools }: { locale: string; title: string; label: string; caption: string; tools: OwnerTool[] }) {
  const [selected, setSelected] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const tool = tools[selected]
  return <section className="partner-tools" id="owner-tools" aria-labelledby="owner-tools-title">
    <div className="partner-tools-inner">
      <h2 id="owner-tools-title">{title}</h2>
      <div role="tablist" aria-label={label} className="partner-tool-tabs" onKeyDown={event => {
        const next = event.key === 'ArrowRight' ? (selected + 1) % tools.length : event.key === 'ArrowLeft' ? (selected + tools.length - 1) % tools.length : event.key === 'Home' ? 0 : event.key === 'End' ? tools.length - 1 : null
        if (next === null) return
        event.preventDefault(); setSelected(next); tabs.current[next]?.focus()
      }}>{tools.map((entry, index) => <button key={entry.id} ref={node => { tabs.current[index] = node }} type="button" role="tab" id={`owner-tab-${entry.id}`} aria-controls="owner-tool-panel" aria-selected={selected === index} tabIndex={selected === index ? 0 : -1} onClick={() => setSelected(index)}><span aria-hidden="true">0{index + 1}</span>{entry.label}</button>)}</div>
      <div key={tool.id} role="tabpanel" id="owner-tool-panel" aria-labelledby={`owner-tab-${tool.id}`} tabIndex={0} className="partner-tool-panel" data-owner-screen={tool.id}>
        <div className="partner-tool-copy"><p className="partner-eyebrow">{tool.eyebrow}</p><h3>{tool.title}</h3><p className="partner-tool-intro">{tool.body}</p><ul>{tool.points.map(point => <li key={point}>{point}</li>)}</ul><a href={tool.href} className="button outline">{tool.action}<PlayfulArrow /></a></div>
        <figure className="partner-tool-figure"><figcaption>{caption}</figcaption><div className="partner-tool-phone">{tool.id === 'restaurant' ? <MaitredNativeMockup locale={locale} state="order" /> : <OwnerNativeMockup locale={locale} screen={tool.id} />}</div></figure>
      </div>
    </div>
  </section>
}
