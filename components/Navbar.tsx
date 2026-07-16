'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Link } from 'next-view-transitions'
import { Drawer } from 'vaul'
import { APP_STORE_URL } from '@/lib/links'

const navLinks = [
  { label: 'Manifesto', href: '/manifesto' },
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
  { label: 'For Restaurants', href: '#for-restaurants' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const lastY = useRef(0)
  const pathname = usePathname()

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

  // Close the drawer on route change
  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        hidden && !drawerOpen ? '-translate-y-full' : 'translate-y-0'
      } ${
        scrolled || drawerOpen
          ? 'bg-brand-orange/95 backdrop-blur-md shadow-sm shadow-black/10'
          : 'bg-brand-orange'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 py-4 sm:py-5">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={(e) => {
            if (pathname === '/') {
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
        <div className="hidden md:flex items-center gap-8">
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
                href={pathname === '/' ? link.href : `/${link.href}`}
                className="text-sm font-medium text-white/90 transition-colors hover:text-white"
              >
                {link.label}
              </a>
            )
          })}
          <Link
            href={APP_STORE_URL}
            className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-brand-orange transition-shadow hover:shadow-lg hover:shadow-black/10"
          >
            Get the app
          </Link>
        </div>

        {/* Mobile: CTA + drawer */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href={APP_STORE_URL}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-brand-orange"
          >
            Get the app
          </Link>
          <Drawer.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
            <Drawer.Trigger asChild>
              <button
                aria-label="Open menu"
                className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
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
                aria-describedby={undefined}
                className="fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl bg-brand-orange px-6 pb-10 pt-3"
              >
                <Drawer.Title className="sr-only">Menu</Drawer.Title>
                <div aria-hidden className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-white/40" />
                <div className="flex flex-col">
                  {navLinks.map((link) => {
                    const linkClassName =
                      'rounded-xl px-3 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-white/15'
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
                        href={pathname === '/' ? link.href : `/${link.href}`}
                        onClick={() => setDrawerOpen(false)}
                        className={linkClassName}
                      >
                        {link.label}
                      </a>
                    )
                  })}
                  <Link
                    href={APP_STORE_URL}
                    onClick={() => setDrawerOpen(false)}
                    className="mt-4 rounded-full bg-white px-5 py-3.5 text-center text-base font-semibold text-brand-orange"
                  >
                    Get the app
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
