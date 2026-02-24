'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMsg('')

    if (!name.trim()) {
      setErrorMsg('Please enter your name.')
      return
    }
    if (!EMAIL_RE.test(email.trim())) {
      setErrorMsg('Please enter a valid email.')
      return
    }

    setStatus('loading')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong.')
      }

      setStatus('success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      )
    }
  }

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {status === 'success' ? (
          /* ── Success state ── */
          <motion.div
            key="success"
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-orange/10">
              <svg className="h-8 w-8 text-brand-orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-brand-text lg:text-4xl">
              You&apos;re on the list.
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-brand-cyan">
              We&apos;ll reach out when a seat opens up.
            </p>
            <Link
              href="/"
              className="mt-8 inline-block text-sm font-medium text-brand-orange hover:underline"
            >
              &larr; Back to home
            </Link>
          </motion.div>
        ) : (
          /* ── Form state ── */
          <motion.div
            key="form"
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <motion.p
              className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Early access
            </motion.p>

            <motion.h1
              className="mt-4 text-3xl font-bold text-brand-text lg:text-4xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              Request a{' '}
              <span className="italic text-brand-orange">Seat</span>
            </motion.h1>

            <motion.p
              className="mx-auto mt-3 max-w-sm text-[15px] leading-relaxed text-brand-cyan"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              We open seats slowly and intentionally. Leave your details
              and we&apos;ll be in touch.
            </motion.p>

            <motion.form
              onSubmit={handleSubmit}
              className="mt-10 space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (errorMsg) setErrorMsg('')
                }}
                className="w-full rounded-xl border border-brand-cyan/20 bg-white px-5 py-3.5 text-base text-brand-text placeholder:text-brand-cyan/40 outline-none transition-colors focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20"
              />

              <input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errorMsg) setErrorMsg('')
                }}
                className="w-full rounded-xl border border-brand-cyan/20 bg-white px-5 py-3.5 text-base text-brand-text placeholder:text-brand-cyan/40 outline-none transition-colors focus:border-brand-orange focus:ring-1 focus:ring-brand-orange/20"
              />

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full rounded-full bg-brand-orange px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand-orange/25 transition-transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {status === 'loading' ? 'Sending...' : 'Request a Seat'}
              </button>

              <AnimatePresence>
                {errorMsg && (
                  <motion.p
                    className="text-sm text-red-500"
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
