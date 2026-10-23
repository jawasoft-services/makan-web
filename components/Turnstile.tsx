'use client'

import Script from 'next/script'
import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render(container: HTMLElement, options: Record<string, unknown>): string
      reset(widgetId?: string): void
      remove(widgetId: string): void
    }
  }
}

/** Set in Vercel for production; empty locally, which renders nothing. */
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ''

/** After a failed submit: tokens are single-use, so mint a fresh one. */
export function resetTurnstile() {
  window.turnstile?.reset()
}

/**
 * Cloudflare Turnstile for the contact and partner forms. `interaction-only`
 * keeps the page calm: nothing is drawn unless Cloudflare needs the visitor
 * to tick a box. The token reaches the form through `onToken` and is posted
 * as `turnstileToken`; the API route verifies it (lib/turnstile.ts).
 */
export default function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const callback = useRef(onToken)
  useEffect(() => {
    callback.current = onToken
  }, [onToken])

  const render = () => {
    if (widget.current || !container.current || !window.turnstile) return
    widget.current = window.turnstile.render(container.current, {
      sitekey: TURNSTILE_SITE_KEY,
      appearance: 'interaction-only',
      callback: (token: string) => callback.current(token),
      'expired-callback': () => callback.current(''),
      'error-callback': () => callback.current(''),
    })
  }

  useEffect(() => {
    // The script may already be on the page from an earlier navigation.
    render()
    const id = widget.current
    return () => {
      if (id) window.turnstile?.remove(id)
      widget.current = null
    }
  }, [])

  if (!TURNSTILE_SITE_KEY) return null
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" strategy="afterInteractive" onLoad={render} />
      <div ref={container} />
    </>
  )
}
