'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'
import { Link } from 'next-view-transitions'
import { Drawer } from 'vaul'
import { track } from '@vercel/analytics'
import { APP_STORE_URL } from '@/lib/links'
import { localizePath } from '@/i18n/paths'
import { stripLocalePrefix } from '@/i18n/availability'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const lastY = useRef(0)
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('Nav')
  const isHome = stripLocalePrefix(pathname) === '/'
  const isInvite = stripLocalePrefix(pathname).startsWith('/invite/')
  const homeHref = localizePath(locale, '/')
  const navLinks = [
    { label: t('howItWorks'), href: '#how-it-works' },
    { label: t('features'), href: '#features' },
    { label: t('faq'), href: '#faq' },
    { label: t('restaurants'), href: localizePath(locale, '/partner') },
  ]

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 40)
      // Hide when scrolling down past the fold; reveal on any upward scroll.
      setHidden(y > 160 && y > lastY.current)
      lastY.current = y
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Invite links are a focused handoff into the app. The marketing navigation
  // adds competing exits and a second App Store CTA, so the invite owns its page.
  if (isInvite) return null

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 text-white transition-all duration-500 ${
        hidden && !drawerOpen ? '-translate-y-full' : 'translate-y-0'
      } ${
        scrolled || drawerOpen
          ? 'bg-brand-orange/95 backdrop-blur-md shadow-sm shadow-black/10'
          : 'bg-brand-orange'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 py-4 sm:py-5">
        <Link
          href={homeHref}
          className="flex items-center gap-2"
          onClick={(e) => {
            if (isHome) {
              e.preventDefault()
              if (window.__lenis) window.__lenis.scrollTo(0)
              else window.scrollTo({ top: 0, behavior: 'smooth' })
            }
            setDrawerOpen(false)
          }}
        >
          <Image
            src="/makan-icon-white.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <Image
            src="/makan-logo-white.svg"
            alt="Makan"
            width={104}
            height={24}
            className="h-6 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            // Route links (start with "/") use the view-transition Link; hash
            // links use <a> and resolve to /#hash when not on the homepage.
            if (link.href.startsWith('/')) {
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-white/90 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              )
            }
            return (
              <a
                key={link.href}
                href={isHome ? link.href : `${homeHref === '/' ? '' : homeHref}/${link.href}`}
                className="text-sm font-medium text-white/90 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            )
          })}
          <LanguageSwitcher />
          <Link
            href={APP_STORE_URL}
            onClick={() => track('App Store CTA Clicked', { location: 'navigation', locale })}
            className="flex h-11 items-center rounded-full bg-white px-5 text-sm font-semibold text-brand-orange transition-shadow hover:shadow-lg hover:shadow-black/10"
          >
            {t('getApp')}
          </Link>
        </div>

        {/* Mobile: CTA + drawer */}
        <div className="flex items-center gap-3 lg:hidden">
          <Link
            href={APP_STORE_URL}
            onClick={() => track('App Store CTA Clicked', { location: 'navigation', locale })}
            className="flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-brand-orange"
          >
            {t('getAppShort')}
          </Link>
          <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <Drawer.Trigger asChild>
              <button
                aria-label={drawerOpen ? t('closeMenu') : t('openMenu')}
                aria-expanded={drawerOpen}
                aria-controls="mobile-navigation"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-white"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <line x1="3" y1="6" x2="17" y2="6" />
                  <line x1="3" y1="10" x2="17" y2="10" />
                  <line x1="3" y1="14" x2="17" y2="14" />
                </svg>
              </button>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-[60] bg-black/40" />
              <Drawer.Content
                id="mobile-navigation"
                aria-describedby={undefined}
                className="fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl bg-brand-orange px-6 pb-10 pt-3"
              >
                <Drawer.Title className="sr-only">{t('menu')}</Drawer.Title>
                <div className="relative mb-3 h-11">
                  <div aria-hidden className="absolute left-1/2 top-1 -translate-x-1/2 h-1.5 w-10 rounded-full bg-white/50" />
                  <Drawer.Close asChild>
                    <button
                      type="button"
                      aria-label={t('closeMenu')}
                      className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center rounded-full text-white hover:bg-white/15"
                    >
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                        <line x1="5" y1="5" x2="15" y2="15" />
                        <line x1="15" y1="5" x2="5" y2="15" />
                      </svg>
                    </button>
                  </Drawer.Close>
                </div>
                <div className="flex flex-col">
                  {navLinks.map((link) => {
                    const linkClassName =
                      'rounded-xl px-3 py-3.5 text-lg font-semibold text-white/90 transition-colors hover:bg-white/15 hover:text-white'
                    if (link.href.startsWith('/')) {
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setDrawerOpen(false)}
                          className={linkClassName}
                        >
                          {link.label}
                        </Link>
                      )
                    }
                    return (
                      <a
                        key={link.href}
                        href={isHome ? link.href : `${homeHref === '/' ? '' : homeHref}/${link.href}`}
                        onClick={() => setDrawerOpen(false)}
                        className={linkClassName}
                      >
                        {link.label}
                      </a>
                    )
                  })}
                  <div className="mt-4">
                    <LanguageSwitcher compact />
                  </div>
                  <Link
                    href={APP_STORE_URL}
                    onClick={() => {
                      track('App Store CTA Clicked', { location: 'navigation-menu', locale })
                      setDrawerOpen(false)
                    }}
                    className="mt-4 rounded-full bg-white px-5 py-3.5 text-center text-base font-semibold text-brand-orange"
                  >
                    {t('getApp')}
                  </Link>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </div>
      </div>
    </nav>
  )
}
