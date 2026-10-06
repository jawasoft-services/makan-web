import { Link } from 'next-view-transitions'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { localizePath } from '@/i18n/paths'
import StoreLink from '@/components/home/StoreLink'

const socialLinks = [
  { label: 'Instagram', href: 'https://www.instagram.com/makanappofficial/' },
  { label: 'X', href: 'https://x.com/app_makan' },
  { label: 'TikTok', href: 'https://www.tiktok.com/@makan.app' },
]

export default function Footer() {
  const locale = useLocale()
  const t = useTranslations('Footer')
  const global = useTranslations('Global')
  const appLinks = [
    { label: t('getApp'), href: localizePath(locale, '/app') },
    { label: t('story'), href: localizePath(locale, '/story') },
    { label: t('reviews'), href: '/blog' },
    { label: t('restaurants'), href: localizePath(locale, '/partner') },
    { label: t('standings'), href: localizePath(locale, '/standings') },
    { label: t('support'), href: localizePath(locale, '/support') },
    { label: t('contact'), href: localizePath(locale, '/contact') },
    { label: t('deleteAccount'), href: localizePath(locale, '/account-deletion') },
    { label: t('deleteData'), href: localizePath(locale, '/data-deletion') },
    { label: t('privacy'), href: '/privacy-policy' },
    { label: t('terms'), href: '/tos' },
  ]

  return (
    // Compact footer (after Beli, Family and Linear): links flow into columns and
    // the legal lines share one band, instead of one tall column and a stacked bar.
    <footer className="inverse-ground bg-brand-espresso px-5 sm:px-8 pt-10 pb-6">
      <div className="mx-auto max-w-7xl">
        {/* Top section — logo + link columns */}
        <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
          {/* Logo + download */}
          <div className="flex flex-col gap-4">
            <Link href={localizePath(locale, '/')} className="flex min-h-11 items-center gap-2">
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
            <StoreLink location="footer" size="compact" className="inline-flex min-h-11 w-fit items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current">
              <Image
                src="/app-store-badge.svg"
                alt={global('downloadAppStore')}
                width={120}
                height={40}
                className="h-[clamp(2rem,10.8vw,2.25rem)] w-auto sm:h-10"
              />
            </StoreLink>
          </div>

          {/* Link columns */}
          <div className="flex flex-col gap-6 sm:flex-row sm:gap-16">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand-espresso-muted/70 mb-3">
                {t('app')}
              </p>
              <ul className="grid grid-flow-col grid-rows-6 gap-x-8 lg:grid-rows-4 lg:gap-x-12">
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
              <p className="text-xs font-medium uppercase tracking-[0.15em] text-brand-espresso-muted/70 mb-3">
                {t('follow')}
              </p>
              <ul className="flex gap-6 sm:block">
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
        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 text-brand-espresso-muted lg:flex-row-reverse lg:items-center lg:justify-between lg:gap-10">
          {/* Made with love — right on desktop, first on mobile */}
          <a
            href="https://www.google.com/maps/place/The+Hoxton+Mix/@51.5256479,-0.0885239"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 w-fit shrink-0 items-center gap-2.5 text-sm transition-colors hover:text-white"
          >
            {t('madeWithLove')}
            <Image
              src="/london-map.png"
              alt={t('londonMap')}
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg object-cover"
            />
            London
          </a>

          <div className="text-xs leading-relaxed">
            {/* Copyright */}
            <p>
              &copy; {new Date().getFullYear()} Makan App Ltd. {t('rights')}
            </p>

            {/* Statutory trading disclosure (Companies Act 2006 / 2015 Names &
                Trading Disclosures Regs, reg. 25). Company number verified against
                the Companies House public register. */}
            <p className="mt-1">
              MAKAN APP LTD is a company registered in England and Wales, company
              no. 16736412. Registered office: 86–90 Paul Street, London EC2A 4NE,
              United Kingdom.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
