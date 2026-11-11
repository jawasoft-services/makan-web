import Link from 'next/link'
import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { localizePath } from '@/i18n/paths'
import LanguageSwitcher from './LanguageSwitcher'

export default function Footer() {
  const locale = useLocale()
  const t = useTranslations('Redesign')
  const primary = [['app', 'app'], ['places', 'places'], ['story', 'story'], ['blog', 'blog'], ['partner', 'partner'], ['standings', 'standings']] as const
  const help = [['support', 'help'], ['contact', 'contact'], ['press', 'press'], ['privacy-policy', 'privacy'], ['tos', 'terms'], ['account-deletion', 'deleteaccount'], ['data-deletion', 'deletedata']] as const
  return <footer className="redesign-footer inverse-ground">
    <div className="footer-top">
      <Link className="footer-brand" href={localizePath(locale, '/')} aria-label={locale === 'id' ? 'Beranda Makan' : 'Makan home'}><Image src="/redesign/logo.svg" alt="Makan" width={168} height={40} /></Link>
      <nav aria-label="Makan"><Link href={localizePath(locale, "/maitre-d")}>Maître d’</Link>{primary.map(([path, key]) => <Link key={path} href={localizePath(locale, '/' + path)}>{t(key)}</Link>)}</nav>
      <nav aria-label={t('help')}>{help.map(([path, key]) => <Link key={path} href={path === 'privacy-policy' ? localizePath(locale, '/privacy-policy') : localizePath(locale, '/' + path)}>{t(key)}</Link>)}</nav>
      <nav aria-label={locale === 'id' ? 'Media sosial' : 'Social'}><a href="https://www.instagram.com/makanappofficial/">Instagram</a><a href="https://www.tiktok.com/@makan.app">TikTok</a><a href="https://x.com/app_makan">X</a><LanguageSwitcher compact /></nav>
    </div>
    <div className="footer-bottom"><p>© {new Date().getFullYear()} Makan App Ltd. {t('rights')}</p><p lang="en">MAKAN APP LTD is a company registered in England and Wales, company no. 16736412. Registered office: 86–90 Paul Street, London EC2A 4NE, United Kingdom.</p></div>
  </footer>
}
