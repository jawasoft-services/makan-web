'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { track } from '@/lib/website-analytics'
import { otherLocaleHref } from './routes'
import { LANG_COOKIE, LANG_COOKIE_MAX_AGE } from '@/i18n/routing'

/**
 * "EN / ID": the same page in the other language where it exists in Bahasa (i18n/availability.ts),
 * otherwise that language's home. Remembers the choice the way LanguageSwitcher does.
 */
export default function LocaleLink({ className }: { className?: string }) {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('Global')
  const { href, target } = otherLocaleHref(locale, pathname)
  const text = locale === 'id' ? 'ID / EN' : 'EN / ID'
  return <a className={className} href={href} hrefLang={target} lang={target}
    aria-label={`${text} — ${t('language')}: ${target === 'id' ? t('indonesian') : t('english')}`}
    onClick={() => {
      document.cookie = `${LANG_COOKIE}=${target}; path=/; max-age=${LANG_COOKIE_MAX_AGE}; samesite=lax`   // the only place a language is remembered: an explicit pick
      track('Language Changed', { from: locale, to: target })
    }}>{text}</a>
}
