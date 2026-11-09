'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import PlayfulArrow from '@/components/PlayfulArrow'
import { normalize } from '@/lib/claim-search'
import { localizePath } from '@/i18n/paths'
import type { PlaceIndexEntry } from '@/lib/aggregates/types'
import styles from '@/components/standings/public-pages.module.css'

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
  return <>
    <div className={styles.directorySearch}>
      <label htmlFor={searchId}>{t('search')}</label>
      <input id={searchId} type="search" maxLength={120} value={query} onChange={event => setQuery(event.target.value)} placeholder={t('placeholder')} />
    </div>
    <p className="sr-only" role="status" aria-live="polite">{t('results', { count: shown.length })}</p>
    <ul className={styles.directoryList}>{shown.map(entry => <li key={entry.placeId}>
      <Link href={localizePath(locale, `/places/${entry.slug}`)} prefetch={false}>
        <span><strong>{entry.name}</strong>{entry.city ? <span>{entry.city}</span> : null}</span><PlayfulArrow />
      </Link>
    </li>)}</ul>
    {shown.length === 0 ? <div className={styles.tableNoResults}><p>{t('empty')}</p><button type="button" className={styles.textLink} onClick={() => setQuery('')}>{t('clear')}</button></div> : null}
  </>
}
