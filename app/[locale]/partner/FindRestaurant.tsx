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
    if (trimmed.length < 2) { setResults(null); setFailed(false); return }
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

  return (
    <div>
      <label htmlFor="find-restaurant" className="block text-sm font-bold text-brand-ink">{t('findLabel')}</label>
      <input
        id="find-restaurant"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('findPlaceholder')}
        autoComplete="off"
        maxLength={60}
        className="mt-2 min-h-12 w-full rounded-xl border border-brand-line bg-white px-4 text-base text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink"
      />
      <div aria-live="polite" className="mt-3">
        {failed ? <p className="text-sm text-brand-muted">{t('findError')}</p> : null}
        {results && results.length === 0 ? <p className="text-sm text-brand-muted">{t('findNone')}</p> : null}
        {results && results.length > 0 ? (
          <ul className="divide-y divide-brand-line overflow-hidden rounded-xl border border-brand-line bg-white">
            {results.map((result) => (
              <li key={result.path}>
                <Link href={localizePath(locale, result.path)} className="flex min-h-14 flex-col justify-center px-4 py-2 hover:bg-brand-card focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-ink">
                  <span className="text-base font-bold text-brand-ink">{result.name}</span>
                  {result.area ? <span className="text-sm text-brand-muted">{result.area}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <p className="mt-4 text-sm text-brand-muted">
        {t('findCant')}{' '}
        <a href="#enquire" className="inline-flex min-h-11 items-center font-semibold text-brand-ink underline underline-offset-4">{t('findCantCta')}</a>
      </p>
    </div>
  )
}
