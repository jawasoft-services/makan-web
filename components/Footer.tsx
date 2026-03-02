import Link from 'next/link'
import Image from 'next/image'

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
)

const GooglePlayIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
    <path d="M3.18 23.76c.35.2.74.24 1.1.12l11.34-11.35L12 9l-8.82 14.76zM20.5 10.56l-2.6-1.5-3.35 3.35 3.35 3.35 2.62-1.51c.74-.43.74-1.26-.02-1.69zM2.01 1.54C1.77 1.8 1.63 2.2 1.63 2.7v18.6c0 .5.14.89.39 1.15L12 12 2.01 1.54zM15.62 3.94L4.28.06c-.36-.13-.75-.09-1.1.1L12 9l3.62-5.06z" />
  </svg>
)

export default function Footer() {
  return (
    <footer className="border-t border-brand-cyan/10 bg-brand-bg px-5 sm:px-8 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">

        {/* Main grid: icon+downloads | App links | Follow links */}
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-[auto_1fr_1fr] sm:gap-12 lg:gap-20">

          {/* App icon + download buttons */}
          <div className="flex flex-col gap-6">
            <Image
              src="/makan-icon.svg"
              alt="Makan"
              width={64}
              height={64}
              className="rounded-2xl"
            />
            <div className="flex flex-col gap-2.5">
              <a
                href="https://testflight.apple.com/join/mJvRBHkW"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 rounded-full border border-brand-cyan/20 px-4 py-2.5 text-sm text-brand-text transition-colors hover:border-brand-orange hover:text-brand-orange"
              >
                <AppleIcon />
                <span>App Store</span>
              </a>
              <span
                title="Coming soon"
                className="flex cursor-not-allowed items-center gap-2.5 rounded-full border border-brand-cyan/10 px-4 py-2.5 text-sm text-brand-cyan/30"
              >
                <GooglePlayIcon />
                <span>Google Play</span>
              </span>
            </div>
          </div>

          {/* App links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-cyan/40">
              App
            </p>
            <ul className="mt-5 flex flex-col gap-3.5">
              {[
                { label: 'Request a Seat', href: '/contact' },
                { label: 'Privacy Policy', href: '/privacy-policy' },
                { label: 'Terms', href: '/tos' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-brand-cyan transition-colors hover:text-brand-text"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Follow links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brand-cyan/40">
              Follow
            </p>
            <ul className="mt-5 flex flex-col gap-3.5">
              {[
                { label: 'Instagram', href: 'https://www.instagram.com/makanappofficial/' },
                { label: 'X', href: 'https://x.com/app_makan' },
              ].map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-cyan transition-colors hover:text-brand-text"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom: Made with love */}
        <div className="mt-10 sm:mt-16 border-t border-brand-cyan/10 pt-6 sm:pt-8 text-center">
          <p className="inline-flex items-center gap-2.5 text-sm text-brand-cyan/50">
            Made with love in{' '}
            <a
              href="https://www.google.com/maps/place/The+Hoxton+Mix/@51.5256479,-0.0885239"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-brand-text"
            >
              <Image
                src="/london-map.png"
                alt="London"
                width={48}
                height={48}
                className="rounded-lg opacity-80"
              />
              London
            </a>
          </p>
          <p className="mt-2 text-xs text-brand-cyan/30">
            &copy; {new Date().getFullYear()} Makan App Ltd. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  )
}
