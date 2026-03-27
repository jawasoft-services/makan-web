'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

const navLinks = [
  { label: 'Story', href: '#story' },
  { label: 'Features', href: '#features' },
  { label: 'FAQ', href: '#faq' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-brand-bg/90 backdrop-blur-md shadow-sm shadow-black/20'
          : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 py-4 sm:py-5">
        <Link href="/" className="text-base font-bold text-white">
          makan
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-brand-muted transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/contact"
            className="rounded-full bg-brand-orange px-5 py-2 text-sm font-semibold text-brand-bg transition-shadow hover:shadow-lg hover:shadow-brand-orange/25"
          >
            Request a Seat
          </Link>
        </div>

        <Link
          href="/contact"
          className="md:hidden rounded-full bg-brand-orange px-4 py-2 text-sm font-semibold text-brand-bg"
        >
          Request a Seat
        </Link>
      </div>
    </nav>
  )
}
