'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function PartnerForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [restaurant, setRestaurant] = useState('')
  const [city, setCity] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  function clearError() {
    if (errorMsg) setErrorMsg('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (!name.trim()) {
      setErrorMsg('We need your name to get started.')
      return
    }
    if (!EMAIL_RE.test(email.trim())) {
      setErrorMsg("That email doesn't look right — double check?")
      return
    }
    if (!restaurant.trim()) {
      setErrorMsg("What's the name of your restaurant?")
      return
    }

    setStatus('loading')

    // Honeypot: read the hidden 'website' field — bots auto-fill it.
    const honeypot = String(
      new FormData(e.currentTarget as HTMLFormElement).get('website') ?? '',
    )

    try {
      const res = await fetch('/api/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          restaurant: restaurant.trim(),
          city: city.trim(),
          message: message.trim(),
          website: honeypot,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong.')
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong. Try again?',
      )
    }
  }

  return (
    <div className="w-full max-w-sm">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          <motion.div
            key="success"
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-orange/15">
              <svg className="h-7 w-7 text-brand-orange-ink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="mt-5 text-2xl font-bold text-brand-ink sm:text-3xl">
              We&apos;ll be in touch.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-brand-muted sm:text-base">
              Our team will reach out to talk about
              <br />
              how Makan can work for your restaurant.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block text-sm font-medium text-brand-orange-ink hover:underline"
            >
              &larr; Back to home
            </Link>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {/* Logo + heading */}
            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Image
                  src="/makan-logo.png"
                  alt="makan"
                  width={600}
                  height={120}
                  className="mx-auto h-auto w-[140px] sm:w-[160px]"
                  priority
                />
              </motion.div>

              <motion.h1
                className="mt-6 text-xl font-bold text-brand-ink sm:text-2xl"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Claim your restaurant on Makan
              </motion.h1>

              <motion.p
                className="mt-2 text-sm leading-relaxed text-brand-muted"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                Get your restaurant in front of diners who remember where
                they ate. Tell us about your venue.
              </motion.p>
            </div>

            {/* Form */}
            <motion.form
              onSubmit={handleSubmit}
              className="mt-8 space-y-3"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div>
                <label htmlFor="name" className="block text-xs font-medium text-brand-muted mb-1.5 ml-1">
                  Your name
                </label>
                <input
                  id="name"
                  type="text"
                  placeholder="Who are we speaking with?"
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearError() }}
                  className="w-full rounded-xl border border-brand-line bg-brand-card px-4 py-3 text-sm text-brand-ink placeholder:text-brand-muted outline-none transition-colors focus:border-brand-orange/60 focus:bg-brand-card"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-medium text-brand-muted mb-1.5 ml-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@restaurant.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError() }}
                  className="w-full rounded-xl border border-brand-line bg-brand-card px-4 py-3 text-sm text-brand-ink placeholder:text-brand-muted outline-none transition-colors focus:border-brand-orange/60 focus:bg-brand-card"
                />
              </div>

              <div>
                <label htmlFor="restaurant" className="block text-xs font-medium text-brand-muted mb-1.5 ml-1">
                  Restaurant name
                </label>
                <input
                  id="restaurant"
                  type="text"
                  placeholder="What's your restaurant called?"
                  value={restaurant}
                  onChange={(e) => { setRestaurant(e.target.value); clearError() }}
                  className="w-full rounded-xl border border-brand-line bg-brand-card px-4 py-3 text-sm text-brand-ink placeholder:text-brand-muted outline-none transition-colors focus:border-brand-orange/60 focus:bg-brand-card"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-xs font-medium text-brand-muted mb-1.5 ml-1">
                  City <span className="text-brand-muted">(optional)</span>
                </label>
                <input
                  id="city"
                  type="text"
                  placeholder="Where are you based?"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); clearError() }}
                  className="w-full rounded-xl border border-brand-line bg-brand-card px-4 py-3 text-sm text-brand-ink placeholder:text-brand-muted outline-none transition-colors focus:border-brand-orange/60 focus:bg-brand-card"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-xs font-medium text-brand-muted mb-1.5 ml-1">
                  Anything else? <span className="text-brand-muted">(optional)</span>
                </label>
                <textarea
                  id="message"
                  rows={3}
                  placeholder="Tell us what you're looking for..."
                  value={message}
                  onChange={(e) => { setMessage(e.target.value); clearError() }}
                  className="w-full rounded-xl border border-brand-line bg-brand-card px-4 py-3 text-sm text-brand-ink placeholder:text-brand-muted outline-none transition-colors focus:border-brand-orange/60 focus:bg-brand-card resize-none"
                />
              </div>

              {/* Honeypot — hidden from real users; naive bots auto-fill it. */}
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                style={{ position: 'absolute', left: '-9999px', width: 0, height: 0, opacity: 0 }}
              />

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full rounded-xl bg-brand-orange py-3 text-sm font-semibold text-brand-night transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === 'loading' ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Let's talk"
                  )}
                </button>
              </div>

              <AnimatePresence>
                {errorMsg && (
                  <motion.p
                    className="text-center text-xs text-red-400"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {errorMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.form>

            <p className="mt-6 text-center text-[11px] text-brand-muted">
              By submitting you agree to our{' '}
              <Link href="/tos" className="underline hover:text-brand-muted">
                Terms
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="underline hover:text-brand-muted">
                Privacy Policy
              </Link>
              .
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
