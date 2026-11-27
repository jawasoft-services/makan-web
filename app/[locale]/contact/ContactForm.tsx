'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import { localizePath } from '@/i18n/paths'
import Turnstile, { TURNSTILE_SITE_KEY, resetTurnstile } from '@/components/Turnstile'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ContactForm() {
  const t = useTranslations('Contact')
  const support = useTranslations('Support')
  const site = useTranslations('Site')
  const locale = useLocale()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [invalidField, setInvalidField] = useState<'name' | 'email' | null>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const feedbackRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (status === 'success') feedbackRef.current?.focus()
    else if (errorMsg) {
      if (invalidField === 'name') nameRef.current?.focus()
      else if (invalidField === 'email') emailRef.current?.focus()
      else feedbackRef.current?.focus()
    }
  }, [status, errorMsg, invalidField])

  function clearError() {
    setErrorMsg('')
    setInvalidField(null)
    if (status === 'error') setStatus('idle')
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (status === 'loading') return
    setErrorMsg('')
    setInvalidField(null)
    if (!name.trim()) {
      setInvalidField('name'); setErrorMsg(t('nameError')); return
    }
    if (!EMAIL_RE.test(email.trim())) {
      setInvalidField('email'); setErrorMsg(t('emailError')); return
    }
    if (TURNSTILE_SITE_KEY && !turnstileToken) {
      setErrorMsg(t('tryAgain')); return
    }
    setStatus('loading')
    const honeypot = String(new FormData(e.currentTarget).get('website') ?? '')
    try {
      const res = await fetch('/api/contact', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), website: honeypot, turnstileToken }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || t('genericError'))
      }
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : t('tryAgain'))
      // Failed requests keep their input; single-use bot tokens must be renewed.
      setTurnstileToken('')
      resetTurnstile()
    }
  }

  // RM20773: the approved prototype's contact page (strategy/website-direction-2026-11-25/site/contact.html).
  return <>
    <section className="ch tight doc-hero" aria-label={t('title')}>
      <div className="wrap">
        <h1 className="big md" data-rise="">{t('title')}</h1>
        <p className="lede" data-rise="" style={{ '--d': '.12s' } as React.CSSProperties}>{t('body')}</p>
      </div>
    </section>
    <section className="ch doc-ch" aria-label={site('inFull', { title: t('title') })}>
      <div className="doc">
        <div className="doc-side"><h2 className="ct-help">{support('title')}</h2><Link className="tlink" href={localizePath(locale, '/support')}>{support('eyebrow')} →</Link></div>
        <div className="doc-body">
          {status === 'success' ? <div className="ct-done" ref={feedbackRef} tabIndex={-1} role="status">
            <h2>{t('successTitle')}</h2><p>{t('successBody')}</p><Link className="tlink" href={localizePath(locale, '/')}>{t('back')} →</Link>
          </div> : <>
            {/* JSON submission requires the handler; a native fallback must not put personal fields in a URL. */}
            <form className="ct-form" onSubmit={handleSubmit} method="dialog" noValidate aria-busy={status === 'loading'} aria-label={t('title')}>
              <div className="field"><label htmlFor="contact-name">{t('name')}</label>
                <input ref={nameRef} id="contact-name" name="name" type="text" autoComplete="name" required maxLength={100} value={name} placeholder={t('namePlaceholder')}
                  onChange={e => { setName(e.target.value); clearError() }}
                  aria-invalid={invalidField === 'name' || undefined} aria-describedby={invalidField === 'name' ? 'contact-feedback' : undefined} />
              </div>
              <div className="field"><label htmlFor="contact-email">{t('email')}</label>
                <input ref={emailRef} id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email}
                  onChange={e => { setEmail(e.target.value); clearError() }}
                  aria-invalid={invalidField === 'email' || undefined} aria-describedby={invalidField === 'email' ? 'contact-feedback' : undefined} />
              </div>
              <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="honeypot" />
              <Turnstile onToken={setTurnstileToken} />
              <button type="submit" disabled={status === 'loading'} className="btn or">{status === 'loading' ? t('sending') : t('send')}</button>
              {errorMsg ? <div id="contact-feedback" ref={feedbackRef} tabIndex={-1} role="alert" className="form-error">{errorMsg}</div> : null}
            </form>
            <p className="small ct-legal">{t('agreement')} <Link href="/tos">{t('terms')}</Link> {t('and')} <Link href={localizePath(locale, '/privacy-policy')}>{t('privacy')}</Link>.</p>
          </>}
        </div>
      </div>
    </section>
  </>
}
