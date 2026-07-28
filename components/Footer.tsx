import { Link } from 'next-view-transitions'
import Image from 'next/image'
import { APP_STORE_URL } from '@/lib/links'

const appLinks = [
  { label: 'Get the app', href: APP_STORE_URL },
  { label: 'Story', href: '/story' },
  { label: 'Reviews', href: '/blog' },
  { label: 'For restaurants', href: '/partner' },
  { label: 'Support', href: '/support' },
  { label: 'Contact', href: '/contact' },
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms', href: '/tos' },
]

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/makanappofficial/' },
  { label: 'X', href: 'https://x.com/app_makan' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@makan.app' },
]

export default function Footer() {
  return (
    <footer className="inverse-ground bg-brand-espresso px-5 sm:px-8 pt-12 pb-8">
      <div className="mx-auto max-w-7xl">
        {/* Top section — logo + link columns */}
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          {/* Logo + download */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex min-h-11 items-center gap-2">
              <Image
                src="/makan-icon-white.svg"
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg"
              />
              <Image
                src="/makan-logo-white.svg"
                alt="Makan"
                width={86}
                height={20}
                className="h-5 w-auto"
              />
            </Link>
            <Link
              href={APP_STORE_URL}
              className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg border border-white/20 px-3.5 py-2 text-xs font-medium text-brand-espresso-muted transition-colors hover:border-brand-orange/60 hover:text-white"
            >
              Download on the App Store
            </Link>
          </div>

          {/* Link columns */}
          <div className="flex gap-16 sm:gap-20">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-brand-espresso-muted/70 mb-3">
                App
              </p>
              <ul className="space-y-0.5">
                {appLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-flex min-h-11 items-center text-sm text-brand-espresso-muted transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-brand-espresso-muted/70 mb-3">
                Follow
              </p>
              <ul className="space-y-0.5">
                {socialLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center text-sm text-brand-espresso-muted transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-white/10 pt-8 text-brand-espresso-muted">
          {/* Made with love — centered */}
          <a
            href="https://www.google.com/maps/place/The+Hoxton+Mix/@51.5256479,-0.0885239"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto flex min-h-11 w-fit items-center gap-2.5 text-sm transition-colors hover:text-white"
          >
            Made with love in
            <Image
              src="/london-map.png"
              alt="London map"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-cover"
            />
            London
          </a>

          {/* Copyright */}
          <p className="mt-5 text-center text-[11px]">
            &copy; {new Date().getFullYear()} Makan App Ltd. All rights reserved.
          </p>

          {/* Statutory trading disclosure (Companies Act 2006 / 2015 Names &
              Trading Disclosures Regs, reg. 25). Company number verified against
              the Companies House public register. */}
          <p className="mt-2 text-center text-[11px] leading-relaxed">
            MAKAN APP LTD is a company registered in England and Wales, company
            no. 16736412. Registered office: 86–90 Paul Street, London EC2A 4NE,
            United Kingdom.
          </p>
        </div>
      </div>
    </footer>
  )
}
