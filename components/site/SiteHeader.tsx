'use client'

import { useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { APP_STORE_URL, GOOGLE_PLAY_URL } from '@/lib/links'
import { track } from '@/lib/website-analytics'
import LocaleLink from './LocaleLink'
import { currentSection, siteHref } from './routes'

const ARROW = <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12L12 4M5 4h7v7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>

/**
 * Header B (after A24) and the full-screen menu, from the approved prototype's kit.js: the logo, a small
 * centred nav with a dot under the current section, "Get Makan" in orange, and on narrow screens a
 * button that opens the menu as a circle growing from the button. SiteMotion turns the header cream
 * over dark chapters and moves it aside at the footer.
 */
export default function SiteHeader() {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('Redesign')
  const nav = useTranslations('Nav')
  const site = useTranslations('Site')
  const global = useTranslations('Global')
  const sheet = useRef<HTMLDivElement>(null)
  const from = useRef<HTMLButtonElement | null>(null)
  const timer = useRef<number | undefined>(undefined)
  const on = currentSection(pathname)
  const home = siteHref(locale, '/')
  const links: [string, string, 'app' | 'maitre-d' | 'partner'][] = [
    [t('theapp'), home, 'app'],
    ['Maître d’', siteHref(locale, '/maitre-d'), 'maitre-d'],
    [t('partner'), siteHref(locale, '/partner'), 'partner'],
  ]

  const close = useCallback((returnFocus = true) => {
    const el = sheet.current
    if (!el || !el.classList.contains('open')) return
    el.classList.remove('open')
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => { if (!el.classList.contains('open')) el.hidden = true }, reduce ? 0 : 700)
    if (returnFocus) from.current?.focus()
  }, [])

  const open = (button: HTMLButtonElement) => {
    const el = sheet.current
    if (!el) return
    const r = button.getBoundingClientRect()
    el.style.setProperty('--mx', `${r.left + r.width / 2}px`)
    el.style.setProperty('--my', `${r.top + r.height / 2}px`)
    from.current = button
    window.clearTimeout(timer.current)
    el.hidden = false
    void el.offsetWidth
    el.classList.add('open')
    window.setTimeout(() => el.querySelector<HTMLButtonElement>('.hx-close')?.focus(), 50)
  }

  // Escape closes; Tab stays inside the open menu.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = sheet.current
      if (!el?.classList.contains('open')) return
      if (event.key === 'Escape') { close(); return }
      if (event.key !== 'Tab') return
      const items = [...el.querySelectorAll<HTMLElement>('a[href],button')]
      const first = items[0], last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [close])

  // A new page closes the menu without stealing focus back to the button.
  useEffect(() => { close(false) }, [pathname, close])
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const store = (name: 'App Store CTA Clicked' | 'Google Play CTA Clicked') => () => track(name, { location: 'menu', locale })

  return <>
    <header className="hx">
      <Link className="hx-logo" href={home} aria-label={site('home')}><Image className="lo" src="/redesign/logo-orange.svg" alt="Makan" width={168} height={40} priority /><Image className="lw" src="/redesign/logo.svg" alt="" width={168} height={40} /></Link>
      <nav className="hx-nav" aria-label={site('sections')}>
        {links.map(([label, href, key]) => <Link key={key} href={href} className={on === key ? 'on' : undefined} aria-current={on === key ? 'page' : undefined}>{label}</Link>)}
      </nav>
      <Link className="hx-get" href={siteHref(locale, '/app')}>{t('app')}{ARROW}</Link>
      <button className="hx-burger" type="button" aria-label={nav('openMenu')} aria-controls="hxsheet" aria-haspopup="dialog" onClick={event => open(event.currentTarget)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h18M3 12h18M3 17h18" /></svg></button>
    </header>
    <div ref={sheet} className="hx-sheet" id="hxsheet" hidden role="dialog" aria-modal="true" aria-label={nav('menu')}>
      <div className="hx-sheet-top">
        <Link className="hx-logo" href={home} aria-label={site('home')} onClick={() => close(false)}><Image src="/redesign/logo-orange.svg" alt="Makan" width={168} height={40} /></Link>
        <button className="hx-close" type="button" aria-label={nav('closeMenu')} onClick={() => close()}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
      </div>
      <nav className="hx-big" aria-label={nav('menu')}>
        {links.map(([label, href, key]) => <Link key={key} href={href} onClick={() => close(false)}>{label}</Link>)}
        <Link href={siteHref(locale, '/app')} onClick={() => close(false)}>{t('app')}</Link>
      </nav>
      <div className="hx-sheet-foot">
        <div className="hx-stores">
          <a href={APP_STORE_URL} target="_blank" rel="noopener" onClick={store('App Store CTA Clicked')}><Image src="/redesign/app-store.svg" alt={global('downloadAppStore')} width={132} height={44} /></a>
          <a href={GOOGLE_PLAY_URL} target="_blank" rel="noopener" onClick={store('Google Play CTA Clicked')}><Image src="/redesign/google-play.png" alt={global('downloadGooglePlay')} width={114} height={44} /></a>
        </div>
        <LocaleLink className="hx-langlink" />
      </div>
    </div>
  </>
}
