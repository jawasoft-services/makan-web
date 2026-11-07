import { redactAnalyticsUrl } from './analytics-url'

export const MEASUREMENT_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? ''

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
    makanAnalyticsInitialized?: boolean
    [key: `ga-disable-${string}`]: boolean | undefined
  }
}

const events = new Set([
  'page_view', 'Store CTA Clicked', 'App Store CTA Clicked', 'Google Play CTA Clicked',
  'Homepage Section Viewed', 'Language Changed', 'Android Waitlist Joined',
  'Maitre d Demo Step Selected', 'Place Link Open Clicked', 'Place Link Get App Clicked',
  'Claim Link Get App Clicked', 'Table Invite Open App Clicked',
])
const fields = new Set(['location', 'locale', 'section', 'from', 'to', 'step', 'invite_state'])

export function analyticsAllowed(): boolean {
  if (typeof window === 'undefined' || !/^G-[A-Z0-9]+$/.test(MEASUREMENT_ID)
    || process.env.NEXT_PUBLIC_MAKAN_WEBSITE_FIXTURES === '1') return false
  if (window.navigator.doNotTrack === '1' || (window.navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return false
  return !/^\/(?:id\/)?(?:invite|taste|claim|u|m|p)(?:\/|$)/.test(window.location.pathname)
}

export function startWebsiteAnalytics(): boolean {
  if (typeof window !== 'undefined') window[`ga-disable-${MEASUREMENT_ID}`] = !analyticsAllowed()
  if (!analyticsAllowed()) return false
  if (window.makanAnalyticsInitialized) return true
  window.dataLayer ??= []
  // The Google tag queue expects Arguments objects, not GTM array commands.
  // eslint-disable-next-line prefer-rest-params
  window.gtag ??= function () { window.dataLayer!.push(arguments) }
  window.gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied',
  })
  window.gtag('set', 'ads_data_redaction', true)
  window.gtag('set', 'url_passthrough', false)
  window.gtag('js', new Date())
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
    page_location: redactAnalyticsUrl(window.location.href), page_referrer: '', page_title: 'Makan',
  })
  window.makanAnalyticsInitialized = true
  return true
}

export function track(name: string, properties: Record<string, string | number | boolean | null> = {}): void {
  if (!events.has(name) || !analyticsAllowed() || !window.gtag) return
  const safe = Object.fromEntries(Object.entries(properties).filter(([key, value]) => fields.has(key)
    && (typeof value === 'number' && Number.isFinite(value)
      || typeof value === 'string' && /^[a-zA-Z0-9_# /-]{1,64}$/.test(value))))
  window.gtag('event', name.toLowerCase().replace(/[^a-z0-9_]+/g, '_'), {
    ...safe, send_to: MEASUREMENT_ID, page_location: redactAnalyticsUrl(window.location.href),
    page_referrer: '', page_title: 'Makan',
  })
}
