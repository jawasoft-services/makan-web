'use client'

import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/lib/links'
import { track } from '@/lib/website-analytics'

/** The prototype's store pair: an orange App Store button with the page's own words, then the Google Play badge. */
export default function StoreButtons({ location, children }: { location: string; children: React.ReactNode }) {
  const locale = useLocale()
  const t = useTranslations('Global')
  return <>
    <a className="btn or" href={APP_STORE_URL} target="_blank" rel="noopener" onClick={() => track('App Store CTA Clicked', { location, locale })}>{children}</a>
    <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener" onClick={() => track('Google Play CTA Clicked', { location, locale })}><Image src="/redesign/google-play.png" alt={t('downloadGooglePlay')} width={145} height={56} /></a>
  </>
}
