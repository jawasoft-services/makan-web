'use client'

import PlayfulArrow from '@/components/PlayfulArrow'
import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { localizePath } from '@/i18n/paths'
import Turnstile, { TURNSTILE_SITE_KEY, resetTurnstile } from '@/components/Turnstile'
import styles from '@/components/utility.module.css'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ContactForm() {
  const t = useTranslations('Contact')
  const support = useTranslations('Support')
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

  return <div className={styles.contactLayout}>
    <div>
      <header className={styles.heading}><Image className="brand-wordmark" src="/redesign/logo-orange.svg" alt="Makan" width={132} height={31} /><h1>{t('title')}</h1><p className={styles.intro}>{t('body')}</p></header>
      <Image className={styles.contactArt} src="/redesign/food-plate.svg" width={170} height={155} alt="" aria-hidden />
      <div className={styles.contactHelp}><h2>{support('title')}</h2><Link href={localizePath(locale, '/support')}>{support('eyebrow')} <PlayfulArrow /></Link></div>
    </div>
    <div className={styles.formWrap}>
      {status === 'success' ? <div className={styles.success} ref={feedbackRef} tabIndex={-1} role="status">
        <svg viewBox="0 0 24 24" aria-hidden><path d="m5 12 4 4 10-10" /></svg>
        <h2>{t('successTitle')}</h2><p>{t('successBody')}</p><Link href={localizePath(locale, '/')}>{t('back')} <PlayfulArrow /></Link>
      </div> : <>
        {/* JSON submission requires the handler; a native fallback must not put personal fields in a URL. */}
        <form onSubmit={handleSubmit} method="dialog" noValidate aria-busy={status === 'loading'}>
          <div className={styles.field}><label htmlFor="contact-name">{t('name')}</label>
            <input ref={nameRef} id="contact-name" name="name" type="text" autoComplete="name" required maxLength={100} value={name}
              onChange={e => { setName(e.target.value); clearError() }}
              aria-invalid={invalidField === 'name' || undefined} aria-describedby={invalidField === 'name' ? 'contact-feedback' : undefined} />
          </div>
          <div className={styles.field}><label htmlFor="contact-email">{t('email')}</label>
            <input ref={emailRef} id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254} value={email}
              onChange={e => { setEmail(e.target.value); clearError() }}
              aria-invalid={invalidField === 'email' || undefined} aria-describedby={invalidField === 'email' ? 'contact-feedback' : undefined} />
          </div>
          <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className={styles.honeypot} />
          <Turnstile onToken={setTurnstileToken} />
          <button type="submit" disabled={status === 'loading'} className={`${styles.primary} ${styles.submit}`}>{status === 'loading' ? t('sending') : t('send')}</button>
          {errorMsg ? <div id="contact-feedback" ref={feedbackRef} tabIndex={-1} role="alert" className={styles.formError}>{errorMsg}</div> : null}
        </form>
        <p className={styles.formLegal}>{t('agreement')} <Link href="/tos">{t('terms')}</Link> {t('and')} <Link href={localizePath(locale, '/privacy-policy')}>{t('privacy')}</Link>.</p>
      </>}
    </div>
  </div>
}
