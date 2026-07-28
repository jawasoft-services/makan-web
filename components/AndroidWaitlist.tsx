'use client'

import { useState } from 'react'
import { track } from '@vercel/analytics'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function AndroidWaitlist() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmedEmail = email.trim()

    if (!EMAIL_RE.test(trimmedEmail)) {
      setStatus('error')
      setMessage('Enter a valid email address.')
      return
    }

    setStatus('loading')
    setMessage('')
    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'android-waitlist',
          email: trimmedEmail,
          website: String(formData.get('website') ?? ''),
        }),
      })

      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error || 'Something went wrong.')
      }

      setStatus('success')
      setMessage("You're on the Android list. We'll email you once when it's ready.")
      track('Android Waitlist Joined')
      setEmail('')
    } catch (error) {
      setStatus('error')
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Try again?')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-4 max-w-md" aria-label="Android launch notification">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="android-waitlist-email" className="sr-only">
          Email address for the Android launch notification
        </label>
        <input
          id="android-waitlist-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (status === 'error') {
              setStatus('idle')
              setMessage('')
            }
          }}
          placeholder="you@example.com"
          className="h-12 min-w-0 flex-1 rounded-full border border-white/40 bg-white px-5 text-sm text-brand-ink outline-none placeholder:text-brand-muted focus-visible:ring-2 focus-visible:ring-brand-espresso focus-visible:ring-offset-2 focus-visible:ring-offset-brand-orange"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="h-12 rounded-full bg-brand-espresso px-6 text-sm font-semibold text-white transition-all hover:bg-brand-night disabled:cursor-wait disabled:opacity-70"
        >
          {status === 'loading' ? 'Joining…' : 'Notify me'}
        </button>
      </div>

      {/* Honeypot — hidden from people; naive form bots tend to fill it. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="hidden"
        aria-hidden="true"
      />

      <p
        className={`mt-3 min-h-5 text-sm text-brand-muted ${status === 'error' ? 'font-semibold text-brand-orange' : ''}`}
        role={status === 'error' ? 'alert' : 'status'}
        aria-live="polite"
      >
        {message}
      </p>
    </form>
  )
}
