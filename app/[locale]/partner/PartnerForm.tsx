'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { localizePath } from '@/i18n/paths'
import { FIELD_MAX } from '@/lib/api-validation'
import Turnstile, { TURNSTILE_SITE_KEY, resetTurnstile } from '@/components/Turnstile'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const fields = ['name', 'email', 'restaurant', 'city'] as const
type Field = typeof fields[number]

export default function PartnerForm() {
  const t = useTranslations('Partner')
  const redesign = useTranslations('PartnerRedesign')
  const locale = useLocale()
  const [values, setValues] = useState({ name: '', email: '', restaurant: '', city: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [invalidField, setInvalidField] = useState<Field | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
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
    // Turnstile mints the token a moment after load; a submit before then
    // only asks for another go rather than sending an unverifiable request.
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setErrorMsg(t('tryAgain'))
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
          turnstileToken,
        }),
      })
      if (!response.ok) throw new Error(t('tryAgain'))
      setStatus('success')
    } catch {
      setStatus('error')
      setErrorMsg(t('tryAgain'))
      // Tokens are single-use: the next attempt needs a fresh one.
      setTurnstileToken('')
      resetTurnstile()
    }
  }

  // RM20773: the approved prototype's enquiry form (partner.html #enquire): unboxed fields, one orange button.
  if (status === 'success') return (
    <div role="status" className="pt-sent">
      <h4 ref={successRef} tabIndex={-1}>{t('successTitle')}</h4>
      <p>{t('successBody')}</p>
      <Link className="tlink" href={localizePath(locale, '/')}>{t('back')} →</Link>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} method="dialog" noValidate aria-busy={status === 'loading'}>
      <p className="small" style={{ margin: '0 0 20px' }}>{redesign('required_note')}</p>
      {fields.map(field => (
        <div className="field" key={field}>
          <label htmlFor={'partner-' + field}>{redesign('labels.' + field)}</label>
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
          />
          {invalidField === field && <p id="partner-field-error" role="alert" className="form-error">{errorMsg}</p>}
        </div>
      ))}
      <div className="field">
        <label htmlFor="partner-message">{redesign('labels.message')}</label>
        <textarea id="partner-message" name="message" maxLength={FIELD_MAX.message} value={values.message} disabled={status === 'loading'} onChange={event => updateField('message', event.target.value)} />
      </div>
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="honeypot" />
      <Turnstile onToken={setTurnstileToken} />
      <button className="btn or" type="submit" disabled={status === 'loading'}>{status === 'loading' ? t('sending') : t('send')}</button>
      {errorMsg && !invalidField && <p role="alert" className="form-error">{errorMsg}</p>}
      <p className="small legal" style={{ marginTop: 16 }}>{t('agreement')} <Link href="/tos">{t('terms')}</Link> {t('and')} <Link href={localizePath(locale, '/privacy-policy')}>{t('privacy')}</Link>.</p>
    </form>
  )
}
