'use client'

import { useId, useState } from 'react'
import Link from 'next/link'
import { localizePath } from '@/i18n/paths'
import type { StandingRow } from '@/lib/eat-standings'
import { filterStandings } from './filter-standings'
import styles from './public-pages.module.css'

/**
 * The standings as a table: rank, restaurant (linked to its page), where,
 * Eat rate (the ranking column), Eats, Yeets, on Makan since. Wide, so it scrolls inside its own
 * box; the page never scrolls sideways. `showWhere` is off on a city page,
 * where every row is in the same place.
 */
export default function StandingsTable({
  rows,
  locale,
  labels,
  showWhere = true,
  caption,
  hasMap = false,
}: {
  rows: StandingRow[]
  locale: string
  labels: { rank: string; restaurant: string; where: string; eats: string; yeets: string; rate: string; since: string }
  showWhere?: boolean
  caption: string
  hasMap?: boolean
}) {
  const [query, setQuery] = useState('')
  const searchId = useId()
  const filtered = filterStandings(rows, query)
  const id = locale === 'id'
  const monthYear = new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-GB', { month: 'short', year: 'numeric' })
  const percent = new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-GB', { style: 'percent', maximumFractionDigits: 0 })
  const th = ''
  return (
    <div>
      <div className={styles.tableToolbar}>
        <label htmlFor={searchId}>{id ? 'Cari restoran' : 'Find a restaurant'}</label>
        <input id={searchId} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={id ? 'Nama atau kota' : 'Name or city'} />
        {hasMap ? <a href="#map" className={styles.textLink}>{id ? 'Lihat peta' : 'View map'}</a> : null}
      </div>
      <p className="sr-only" role="status" aria-live="polite">{id ? `${filtered.length} restoran ditampilkan` : `${filtered.length} ${filtered.length === 1 ? 'restaurant' : 'restaurants'} shown`}</p>
      <div className={styles.tableScroll} tabIndex={0} role="region" aria-label={caption}>
      <table className={styles.table}>
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-brand-line text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
            <th scope="col" className={th}>{labels.rank}</th>
            <th scope="col" className={th}>{labels.restaurant}</th>
            {showWhere ? <th scope="col" className={th}>{labels.where}</th> : null}
            <th scope="col" className={`${th} text-right`}>{labels.rate}</th>
            <th scope="col" className={`${th} text-right`}>{labels.eats}</th>
            <th scope="col" className={`${th} text-right`}>{labels.yeets}</th>
            <th scope="col" className={`${th} text-right`}>{labels.since}</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(({ row, rank }) => (
            <tr key={row.placeId} className="border-b border-brand-line last:border-b-0">
              <td className="tabular-nums">{rank}</td>
              <th scope="row" className="px-4 py-4 text-base font-semibold text-brand-ink sm:px-5">
                <Link
                  href={localizePath(locale, `/places/${row.slug}`)}
                  className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink font-semibold"
                >
                  {row.name}
                </Link>
              </th>
              {showWhere ? (
                <td className="px-4 py-4 text-base leading-[1.35] text-brand-ink sm:px-5">
                  {row.where ? (
                    <>
                      <span className="block">{row.where.city}</span>
                      <span className="block text-sm text-brand-muted">{row.where.country}</span>
                    </>
                  ) : (
                    <span className="text-brand-muted">—</span>
                  )}
                </td>
              ) : null}
              <td className={`${styles.number} ${styles.rate}`}>{percent.format(row.eatRate)}</td>
              <td className="px-4 py-4 text-right text-base tabular-nums text-brand-ink sm:px-5">{row.eats}</td>
              <td className="px-4 py-4 text-right text-base tabular-nums text-brand-muted sm:px-5">{row.yeets}</td>
              <td className="px-4 py-4 text-right text-base tabular-nums text-brand-muted sm:px-5">
                {row.since ? monthYear.format(new Date(row.since)) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      {filtered.length === 0 ? <div className={styles.tableNoResults}>
        <p>{id ? 'Tidak ada restoran yang cocok.' : 'No restaurants match that search.'}</p>
        <button type="button" className={styles.textLink} onClick={() => setQuery('')}>{id ? 'Hapus pencarian' : 'Clear search'}</button>
      </div> : null}
    </div>
  )
}
