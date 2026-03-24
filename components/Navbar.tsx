'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 sm:px-8 py-4 sm:py-5 transition-all duration-500 ${
        scrolled
          ? 'bg-brand-bg/90 backdrop-blur-md py-3 shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <Link href="/" className="flex items-center gap-2.5">
        <Image
          src="/makan-icon.svg"
          alt=""
          width={32}
          height={32}
          className="rounded-lg"
        />
        <Image
          src="/makan-wordmark.svg"
          alt="Makan"
          width={97}
          height={24}
          className="h-6 w-auto"
        />
      </Link>
      <Link
        href="/contact"
        className={`text-sm font-medium transition-all duration-300 ${
          scrolled
            ? 'rounded-full bg-brand-orange px-4 sm:px-5 py-2 text-white'
            : 'text-brand-cyan hover:text-brand-text'
        }`}
      >
        Request a Seat
      </Link>
    </nav>
  )
}
