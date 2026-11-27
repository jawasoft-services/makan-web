'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { normalize } from '@/lib/claim-search'
import { localizePath } from '@/i18n/paths'
import type { PlaceIndexEntry } from '@/lib/aggregates/types'

/** A–Z by the name's first letter once accents are folded away; anything else (a digit, another script) goes under "#". */
function letterOf(name: string): string {
  const first = normalize(name).charAt(0).toUpperCase()
  return /^[A-Z]$/.test(first) ? first : '#'
}

/**
 * The restaurant directory, as the approved prototype draws it (RM20773, places.html): one search box on
 * top, then a grey band per letter over unboxed rows (name, city), in three columns on wide screens.
 * Search matches every word against name and city, accents folded, on the rows already on the page.
 */
export default function RestaurantDirectory({ entries, locale }: {
  entries: Pick<PlaceIndexEntry, 'placeId' | 'slug' | 'name' | 'city'>[]
  locale: string
}) {
  const t = useTranslations('PlaceDirectory')
  const [query, setQuery] = useState('')
  const searchId = useId()
  const words = normalize(query).split(' ').filter(Boolean)
  const shown = entries.filter(entry => {
    const text = normalize(`${entry.name} ${entry.city ?? ''}`)
    return words.every(word => text.includes(word))
  })
  const groups: { letter: string; rows: typeof shown }[] = []
  for (const entry of shown) {
    const letter = letterOf(entry.name)
    const group = groups.find(g => g.letter === letter)
    if (group) group.rows.push(entry)
    else groups.push({ letter, rows: [entry] })
  }
  return <>
    <div className="pl-search" data-stop="top">
      <label htmlFor={searchId}>{t('search')}</label>
      <input id={searchId} type="search" maxLength={120} value={query} onChange={event => setQuery(event.target.value)} placeholder={t('placeholder')} autoComplete="off" />
      <p className="small" role="status" aria-live="polite">{t('results', { count: shown.length })}</p>
    </div>
    <div className="dir">{groups.map(group => <div className="dir-g" key={group.letter}>
      <p className="band">{group.letter}</p>
      <ul className="rows">{group.rows.map(entry => <li key={entry.placeId}>
        <Link href={localizePath(locale, `/places/${entry.slug}`)} prefetch={false}><strong>{entry.name}</strong><span>{entry.city ?? ''}</span></Link>
      </li>)}</ul>
    </div>)}</div>
    {shown.length === 0 ? <div className="pl-empty"><p>{t('empty')}</p><button type="button" className="btn line" onClick={() => setQuery('')}>{t('clear')}</button></div> : null}
  </>
}
