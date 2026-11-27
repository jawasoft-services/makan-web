'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { localizePath } from '@/i18n/paths'

interface Result { name: string; area: string; path: string }

/** RM20364 (E3) — search for your restaurant, then go to its claim page. "Can't find it?" keeps the enquiry form. */
export default function FindRestaurant() {
  const t = useTranslations('Partner')
  const locale = useLocale()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[] | null>(null)
  const [failed, setFailed] = useState(false)
  const latest = useRef(0)

  useEffect(() => {
    const trimmed = query.trim()
    const request = ++latest.current
    if (trimmed.length < 2) return
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/claim-search?q=${encodeURIComponent(trimmed)}`)
        if (!response.ok) throw new Error('search failed')
        const body = (await response.json()) as { results: Result[] }
        if (request === latest.current) { setResults(body.results); setFailed(false) }
      } catch {
        if (request === latest.current) { setResults(null); setFailed(true) }
      }
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  // RM20773: the approved prototype's search (partner.html #find): one field, unboxed results.
  return (
    <form role="search" onSubmit={event => event.preventDefault()}>
      <div className="field">
        <label htmlFor="find-restaurant">{t('findLabel')}</label>
        <input
          id="find-restaurant"
          type="search"
          value={query}
          onChange={(event) => {
            const value = event.target.value
            latest.current += 1
            setQuery(value)
            if (value.trim().length < 2) { setResults(null); setFailed(false) }
          }}
          placeholder={t('findPlaceholder')}
          autoComplete="off"
          maxLength={60}
        />
      </div>
      <div aria-live="polite">
        {failed ? <p className="small">{t('findError')}</p> : null}
        {results && results.length === 0 ? <p className="small">{t('findNone')}</p> : null}
        {results && results.length > 0 ? (
          <ul className="pt-find-results">
            {results.map((result) => (
              <li key={result.path}>
                <Link href={localizePath(locale, result.path)}><b>{result.name}</b>{result.area ? <span>{result.area}</span> : null}</Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p className="cant">{t('findCant')} <a href="#enquire">{t('findCantCta')}</a></p>
    </form>
  )
}
