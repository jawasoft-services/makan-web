'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const navLinks = [
  { label: 'Story', href: '#story' },
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
  { label: 'For Restaurants', href: '#for-restaurants' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled || mobileOpen
          ? 'bg-brand-bg/90 backdrop-blur-md shadow-sm shadow-black/20'
          : 'bg-gradient-to-b from-brand-bg/70 to-transparent backdrop-blur-[2px]'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 py-4 sm:py-5">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={(e) => {
            if (pathname === '/') {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
            setMobileOpen(false)
          }}
        >
          <Image
            src="/makan-icon.svg"
            alt=""
            width={32}
            height={32}
            className="h-8 w-8"
          />
          <Image
            src="/makan-wordmark.svg"
            alt="Makan"
            width={97}
            height={24}
            className="h-6 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={pathname === '/' ? link.href : `/${link.href}`}
              className="text-sm text-brand-muted transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/contact"
            className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-brand-bg transition-shadow hover:shadow-lg hover:shadow-brand-orange/25"
          >
            Save My Seat
          </Link>
        </div>

        {/* Mobile: CTA + hamburger */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/contact"
            className="rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-brand-bg"
          >
            Save My Seat
          </Link>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {mobileOpen ? (
                <>
                  <line x1="4" y1="4" x2="16" y2="16" />
                  <line x1="16" y1="4" x2="4" y2="16" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="17" y2="6" />
                  <line x1="3" y1="10" x2="17" y2="10" />
                  <line x1="3" y1="14" x2="17" y2="14" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      <div
        className={`md:hidden overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          mobileOpen ? 'max-h-60' : 'max-h-0'
        }`}
      >
        <div className="flex flex-col gap-1 px-5 pb-6 pt-2">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={pathname === '/' ? link.href : `/${link.href}`}
              onClick={() => setMobileOpen(false)}
              className="rounded-lg px-3 py-3 text-sm text-brand-muted transition-colors hover:bg-brand-surface hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  )
}
