'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { localizePath } from '@/i18n/paths'
import { FIELD_MAX } from '@/lib/api-validation'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const fields = ['name', 'email', 'restaurant', 'city'] as const
type Field = typeof fields[number]

export default function PartnerForm() {
  const t = useTranslations('Partner')
  const locale = useLocale()
  const [values, setValues] = useState({ name: '', email: '', restaurant: '', city: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [invalidField, setInvalidField] = useState<Field | null>(null)
  const successRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (status === 'success') successRef.current?.focus()
  }, [status])

  function updateField(field: keyof typeof values, value: string) {
    setValues(previous => ({ ...previous, [field]: value }))
    if (invalidField === field || invalidField === null) {
      setErrorMsg('')
      setInvalidField(null)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMsg('')
    setInvalidField(null)
    const invalid = fields.find(field => !values[field].trim() || (field === 'email' && !EMAIL_RE.test(values.email.trim())))
    if (invalid) {
      setInvalidField(invalid)
      setErrorMsg(t(invalid + 'Error'))
      event.currentTarget.querySelector<HTMLInputElement>('#partner-' + invalid)?.focus()
      return
    }
    setStatus('loading')
    const website = String(new FormData(event.currentTarget).get('website') ?? '')
    try {
      const response = await fetch('/api/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          restaurant: values.restaurant.trim(),
          city: values.city.trim(),
          message: values.message.trim(),
          website,
        }),
      })
      if (!response.ok) throw new Error(t('tryAgain'))
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg(t('tryAgain'))
    }
  }

  if (status === 'success') return (
    <div role="status" className="py-6">
      <svg aria-hidden="true" className="h-10 w-10 text-brand-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 4 4L19 6" /></svg>
      <h3 ref={successRef} tabIndex={-1} className="mt-5 text-2xl font-bold text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink">{t('successTitle')}</h3>
      <p className="mt-3 text-base leading-relaxed text-brand-muted">{t('successBody')}</p>
      <Link href={localizePath(locale, '/')} className="mt-6 inline-flex min-h-11 items-center font-semibold text-brand-ink underline decoration-brand-orange underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink">{t('back')}</Link>
    </div>
  )

  return (
    <div className="w-full">
      <h3 className="text-2xl font-bold tracking-tight text-brand-ink">{t('title')}</h3>
      <p className="mt-3 text-base leading-relaxed text-brand-muted">{t('body')}</p>
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4" aria-busy={status === 'loading'}>
        {fields.map(field => (
          <div key={field}>
            <label htmlFor={'partner-' + field} className="mb-2 block text-sm font-semibold text-brand-ink">{t(field)}</label>
            <input
              id={'partner-' + field}
              name={field}
              type={field === 'email' ? 'email' : 'text'}
              required
              autoComplete={field === 'name' ? 'name' : field === 'email' ? 'email' : field === 'city' ? 'address-level2' : 'organization'}
              maxLength={FIELD_MAX[field]}
              value={values[field]}
              disabled={status === 'loading'}
              onChange={event => updateField(field, event.target.value)}
              aria-invalid={invalidField === field}
              aria-describedby={invalidField === field ? 'partner-field-error' : undefined}
              className="min-h-12 w-full rounded-xl border border-brand-muted bg-brand-card px-4 py-3 text-base text-brand-ink caret-brand-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink disabled:opacity-60"
            />
            {invalidField === field && <p id="partner-field-error" role="alert" className="mt-2 text-sm font-semibold leading-relaxed text-brand-ink">{errorMsg}</p>}
          </div>
        ))}
        <div>
          <label htmlFor="partner-message" className="mb-2 block text-sm font-semibold text-brand-ink">{t('anythingElse')} <span className="font-normal text-brand-muted">{t('optional')}</span></label>
          <textarea id="partner-message" name="message" rows={3} maxLength={FIELD_MAX.message} value={values.message} disabled={status === 'loading'} onChange={event => updateField('message', event.target.value)} className="w-full resize-y rounded-xl border border-brand-muted bg-brand-card px-4 py-3 text-base text-brand-ink caret-brand-ink transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink disabled:opacity-60" />
        </div>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, opacity: 0 }} />
        <button type="submit" disabled={status === 'loading'} className="min-h-14 w-full cursor-pointer rounded-xl bg-brand-orange px-4 py-3 text-base font-bold text-white transition-colors hover:bg-brand-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink disabled:cursor-wait disabled:opacity-60">{status === 'loading' ? t('sending') : t('send')}</button>
        {errorMsg && !invalidField && <p role="alert" className="text-sm font-semibold leading-relaxed text-brand-ink">{errorMsg}</p>}
      </form>
      <p className="mt-5 text-sm leading-relaxed text-brand-muted">{t('agreement')}{' '}<Link href="/tos" className="inline-block py-2 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink">{t('terms')}</Link>{' '}{t('and')}{' '}<Link href="/privacy-policy" className="inline-block py-2 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-ink">{t('privacy')}</Link>.</p>
    </div>
  )
}
