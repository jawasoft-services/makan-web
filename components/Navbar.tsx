'use client'

import PlayfulArrow from '@/components/PlayfulArrow'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Drawer } from 'vaul'
import { track } from '@vercel/analytics'
import { localizePath } from '@/i18n/paths'
import { stripLocalePrefix } from '@/i18n/availability'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const lastY = useRef(0)
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('Redesign')
  const nav = useTranslations('Nav')
  const bare = stripLocalePrefix(pathname)
  const isHome = bare === '/'
  const darkHero = isHome || bare === '/manifesto'
  const partner = bare === '/partner'
  const home = localizePath(locale, '/')
  const primary = partner ? '#enquire' : isHome || bare === '/maitre-d' ? '#download' : localizePath(locale, '/app')
  const primaryLabel = partner ? (locale === 'id' ? 'Hubungi Makan' : 'Talk to Makan') : t('app')
  const secondary = partner ? home : localizePath(locale, '/partner')
  const secondaryLabel = partner ? (locale === 'id' ? 'Untuk pencinta makanan' : 'For diners') : t('partner')
  const hash = (id: string) => isHome ? id : `${home}${id}`
  const navigate = () => setOpen(false)
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      setHidden(y > 160 && y > lastY.current)
      lastY.current = y
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  // Keep secret-bearing group invitations focused on their own app handoff.
  if (bare.startsWith('/invite/')) return null
  const arrow = <PlayfulArrow />
  return <header className={`site-header ready ${scrolled || !darkHero ? 'scrolled' : ''} ${hidden && !open ? 'out-of-view' : ''}`}>
    <Link className="brand" href={home} aria-label={locale === 'id' ? 'Beranda Makan' : 'Makan home'}><Image className="logo-light" src="/redesign/logo.svg" alt="Makan" width={168} height={40} priority /><Image className="logo-dark" src="/redesign/logo-orange.svg" alt="" width={168} height={40} /></Link>
    <nav className="desktop-nav" aria-label={nav('menu')}><a className="nav-plain" href={hash('#features')}>{t('theapp')}</a><Link className="nav-plain" href={localizePath(locale, '/maitre-d')} aria-current={bare === '/maitre-d' ? 'page' : undefined}>Maître d’</Link><a className="button orange text-white" href={primary} onClick={() => track('Store CTA Clicked', { location: 'navigation', locale })}>{primaryLabel}{arrow}</a><Link className="button outline" href={secondary}>{secondaryLabel}</Link><LanguageSwitcher compact /></nav>
    <div className="mobile-menu-trigger"><Drawer.Root open={open} onOpenChange={setOpen} direction="right">
      <Drawer.Trigger asChild><button aria-label={nav('openMenu')} aria-expanded={open} aria-controls="mobile-navigation" className="menu-toggle"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" /></svg></button></Drawer.Trigger>
      <Drawer.Portal><Drawer.Overlay className="fixed inset-0 z-[60] bg-black/40" /><Drawer.Content id="mobile-navigation" aria-describedby={undefined} className="redesign-menu inverse-ground">
        <Drawer.Title className="sr-only">{nav('menu')}</Drawer.Title>
        <div className="menu-heading"><Link href={home} onClick={navigate}><Image src="/redesign/logo.svg" alt="Makan" width={140} height={34} /></Link><Drawer.Close asChild><button className="menu-toggle" aria-label={nav('closeMenu')}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19" /></svg></button></Drawer.Close></div>
        <div className="menu-art"><Image src="/redesign/food-noodles.svg" alt="" width={230} height={250} /><Image className="menu-crown" src="/redesign/maitred-crown.svg" alt="" width={74} height={66} /></div>
        <nav className="menu-links" aria-label={nav('menu')}><a className="button orange text-white" href={primary} onClick={navigate}>{primaryLabel}</a><Link className="button outline" href={secondary} onClick={navigate}>{secondaryLabel}</Link><Link className="menu-feature" href={localizePath(locale, '/maitre-d')} onClick={navigate}>Maître d’ {arrow}</Link><Link className="menu-feature" href={localizePath(locale, '/standings')} onClick={navigate}>{t('standings')}</Link></nav>
        <div className="menu-bottom"><div className="menu-social"><a href="https://www.instagram.com/makanappofficial/">Instagram</a><a href="https://www.tiktok.com/@makan.app">TikTok</a></div><LanguageSwitcher compact /></div>
      </Drawer.Content></Drawer.Portal>
    </Drawer.Root></div>
    <noscript><style>{`.mobile-menu-trigger{display:none!important}.site-header{position:static;flex-wrap:wrap}.site-header:not(.scrolled){background:#30271f}.site-header noscript{flex-basis:100%}.nojs-navigation{flex-wrap:wrap}`}</style><nav className="nojs-navigation"><a href={localizePath(locale, "/maitre-d")}>Maître d’</a><a href={localizePath(locale, "/app")}>{t("app")}</a><a href={secondary}>{secondaryLabel}</a></nav></noscript>
  </header>
}
