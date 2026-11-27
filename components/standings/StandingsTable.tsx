'use client'

/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { localizePath } from '@/i18n/paths'
import type { StandingRow } from '@/lib/eat-standings'
import { filterStandings } from './filter-standings'

type Labels = { find?: string; shownOne?: string; shownOther?: string; colRank?: string; restaurant?: string; rate?: string; since?: string; eats?: string; yeets?: string; none?: string; clear?: string }

const SPARKS = [-150, -110, -70, -30, 10, 50, 110, 160]

/**
 * The Eat or Yeet board, 1:1 with the approved prototype's standings board (RM20773): rank, a round meal
 * photo (or the name's first letter), the restaurant linked to its page with where it is, the Eat rate as
 * a number and an orange bar, Eats and Yeets, and when it joined Makan. Rows land as they come into view,
 * the Eat rate counts up, and #1 slams in with sparks. "Find a restaurant" filters the rows already on the
 * page; nothing is sent anywhere. `variant="leader"` draws just the rows (the current leader on its own).
 */
export default function StandingsTable({
  rows,
  locale,
  labels,
  caption,
  photos = {},
  showWhere = true,
  variant = 'board',
  unlinked = [],
}: {
  rows: StandingRow[]
  locale: string
  labels: Labels
  caption: string
  photos?: Record<string, string>
  showWhere?: boolean
  variant?: 'board' | 'leader'
  /** RM20616 dish pages U2: venues taken down (lib/web-listing.ts). Their row stays as it is; the name is plain text, not a link. */
  unlinked?: readonly string[]
}) {
  const [query, setQuery] = useState('')
  const searchId = useId()
  const list = useRef<HTMLOListElement>(null)
  // Safari uses Sep where Node uses Sept; keep hydration and month boundaries stable.
  const monthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { month: 'short', year: 'numeric', timeZone: 'UTC' })
  const percent = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-GB', { style: 'percent', maximumFractionDigits: 0 })
  const filtered = filterStandings(rows, query)
  const visible = new Set(filtered.map(({ row }) => row.placeId))
  const shown = (filtered.length === 1 ? labels.shownOne : labels.shownOther)?.replace(/\d[\d.,]*/, String(filtered.length)) ?? String(filtered.length)

  // Rows land with their bar as they come into view; the Eat rate counts up from 0.
  useEffect(() => {
    const items = [...(list.current?.querySelectorAll<HTMLLIElement>('li') ?? [])]
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    const count = (el: HTMLElement | null) => {
      if (!el) return
      const n = Number(el.dataset.n), final = el.dataset.text ?? `${n}%`
      if (reduce) { el.textContent = final; return }
      const t0 = performance.now()
      const f = () => { const k = Math.min(1, (performance.now() - t0) / 750); el.textContent = k < 1 ? `${Math.round(n * (1 - Math.pow(1 - k, 3)))}%` : final; if (k < 1) requestAnimationFrame(f) }
      f()
    }
    const land = (li: HTMLLIElement, d: number) => {
      if (li.classList.contains('on')) return
      li.style.setProperty('--d', `${d}s`)
      li.classList.add('on')
      const pc = li.querySelector<HTMLElement>('.pc')
      if (pc && !reduce) pc.textContent = '0%'
      window.setTimeout(() => count(pc), d * 1000)
    }
    if (reduce || !('IntersectionObserver' in window)) { items.forEach(li => land(li, 0)); return }
    const io = new IntersectionObserver(es => {
      let n = 0
      es.forEach(e => { if (e.isIntersecting) { land(e.target as HTMLLIElement, Math.min(n++, 8) * 0.07); io.unobserve(e.target) } })
    }, { rootMargin: '0px 0px -10% 0px' })
    items.forEach(li => io.observe(li))
    return () => io.disconnect()
  }, [])
  // A row a search brings back lands at once.
  useEffect(() => {
    if (!query) return
    list.current?.querySelectorAll<HTMLLIElement>('li:not([hidden]):not(.on)').forEach(li => { li.style.setProperty('--d', '0s'); li.classList.add('on') })
  }, [query])

  const board = <ol className="board" ref={list} aria-label={caption}>
    {rows.map((row, index) => {
      // Rows arrive in rank order, so the position is the rank on this board (a city page ranks its own pool).
      const first = index === 0
      const where = row.where ? [row.where.city, row.where.country].filter(Boolean).join(' · ') : ''
      return <li key={row.placeId} className={first ? 'first' : undefined} hidden={!visible.has(row.placeId) || undefined} style={{ '--w': row.eatRate } as React.CSSProperties}>
        <span className="rk">{index + 1}</span>
        <span className="th" aria-hidden="true">{photos[row.placeId] ? <img src={photos[row.placeId]} alt="" loading="lazy" /> : row.name.charAt(0).toUpperCase()}</span>
        <span className="nm"><b>{unlinked.includes(row.placeId) ? row.name : <Link href={localizePath(locale, `/places/${row.slug}`)} prefetch={false}>{row.name}</Link>}</b>{showWhere && where ? <small>{where}</small> : null}</span>
        <span className="rt">
          <b className="pc" data-n={Math.round(row.eatRate * 100)} data-text={percent.format(row.eatRate)}>{percent.format(row.eatRate)}</b>
          <i className="bar" aria-hidden="true"><i /></i>
          <small>{row.eats} {labels.eats} · {row.yeets} {labels.yeets}</small>
        </span>
        <span className="since">{row.since ? monthYear.format(new Date(row.since)).replace(/\bSept\b/, 'Sep') : '—'}</span>
        {first ? <span className="bsparks" aria-hidden="true">{SPARKS.map((a, i) => <i key={a} style={{ '--a': `${a}deg`, '--sd': `${60 + (i % 3) * 14}px` } as React.CSSProperties} />)}</span> : null}
      </li>
    })}
  </ol>

  if (variant === 'leader') return board
  return <>
    <form className="find" role="search" onSubmit={event => event.preventDefault()} data-rise="" style={{ '--d': '.1s' } as React.CSSProperties}>
      <div className="field"><label htmlFor={searchId}>{labels.find}</label><input id={searchId} type="search" autoComplete="off" maxLength={120} value={query} onChange={event => setQuery(event.target.value)} /></div>
      <p className="shown" aria-live="polite">{shown}</p>
    </form>
    <div className="band colhead" aria-hidden="true" data-stop="top"><span>{labels.colRank}</span><span></span><span>{labels.restaurant}</span><span>{labels.rate}</span><span>{labels.since}</span></div>
    {board}
    {filtered.length === 0 ? <div className="none"><p>{labels.none}</p><button type="button" className="btn line" onClick={() => setQuery('')}>{labels.clear}</button></div> : null}
  </>
}
