import type { Metadata } from 'next'
import NotFound from './not-found'

export const metadata: Metadata = { title: 'Page not found | Makan', robots: { index: false, follow: false } }

// Unmatched routes bypass the locale layout, so they need their own document.
export default function GlobalNotFound() {
  return <html lang="en"><body><NotFound global /></body></html>
}
