import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { COMPANY } from '@/lib/press'
import FooterFx from './FooterFx'
import LocaleLink from './LocaleLink'
import { siteHref } from './routes'

const INSTAGRAM = 'https://www.instagram.com/makanappofficial/'
const SOCIAL: [string, string][] = [['Instagram', INSTAGRAM], ['TikTok', 'https://www.tiktok.com/@makan.app'], ['X', 'https://x.com/app_makan']]

/**
 * The site footer after Locomotive's, from the approved prototype's kit.js: ruled link columns, then the
 * address as a rebus (words and small pictograms in one big serif line), then the company line. The
 * pictograms are flat SVGs; FooterFx swaps them for small three.js objects when the footer comes near.
 */
export default function SiteFooter() {
  const locale = useLocale()
  const t = useTranslations('Redesign')
  const site = useTranslations('Site')
  const makan: [string, string][] = [['Maître d’', '/maitre-d'], [t('app'), '/app'], [t('places'), '/places'], [t('story'), '/story'], [t('blog'), '/blog'], [t('partner'), '/partner'], [t('standings'), '/standings']]
  const help: [string, string][] = [[t('help'), '/support'], [t('contact'), '/contact'], [t('press'), '/press'], [t('privacy'), '/privacy-policy'], [t('terms'), '/tos'], [t('deleteaccount'), '/account-deletion'], [t('deletedata'), '/data-deletion']]
  const item = ([label, path]: [string, string]) => <li key={path}><Link className="sf-link" href={siteHref(locale, path)}>{label}</Link></li>
  return <footer className="sitefoot" aria-label="Makan">
    <nav className="sf-menu" aria-label={site('footer')}>
      <div className="sf-group wide"><p className="sf-label">Makan</p><ul>{makan.map(item)}</ul></div>
      <div className="sf-group"><p className="sf-label">{t('help')}</p><ul>{help.map(item)}</ul></div>
      <div className="sf-group"><p className="sf-label">{site('social')}</p><ul>
        {SOCIAL.map(([label, href]) => <li key={label}><a className="sf-link" href={href} target="_blank" rel="noopener">{label}</a></li>)}
        <li><LocaleLink className="sf-link" /></li>
      </ul></div>
    </nav>
    <div className="sf-coords">
      <a href="https://www.google.com/maps/place/Jakarta" target="_blank" rel="noopener">
        {/* .sf-nw keeps each pictogram with its words when the line wraps on a phone (phone audit, 28 Nov 2026) */}
        <span className="sf-nw"><span className="g3" data-g="app" style={{ width: '0.8em' }} aria-hidden="true"><Image src="/makan-icon.svg" alt="" width={64} height={64} /></span>
        {site('madeWithLove')}</span>
        <span className="gc" aria-hidden="true"><i>⇠</i><b>6.2088 S</b><i>⇢</i><i>⇢</i><b>106.8456 E</b><i>⇠</i></span>
        <span className="sr"> </span><span className="sf-nw">{site('inJakarta')}
        <span className="g3" data-g="crown" style={{ width: '1.0em' }} aria-hidden="true"><Image src="/redesign/maitred-crown.svg" alt="" width={68} height={52} /></span></span>
      </a><br />
      <span className="sf-l2"><span className="sf-nw">{site('indonesia')}
        <span className="g3" data-g="flag-id" style={{ width: '1.15em' }} aria-hidden="true"><svg viewBox="0 0 30 20"><rect width="30" height="10" fill="#CE1126" /><rect y="10" width="30" height="10" fill="#fff" /><rect x=".5" y=".5" width="29" height="19" fill="none" stroke="rgba(17,24,28,.25)" /></svg></span>
        <svg className="gl" viewBox="0 0 70 70" style={{ width: '.95em' }} aria-hidden="true"><rect x="4" y="6" width="62" height="58" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" /><text x="35" y="44" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor">ID</text></svg>
        <svg className="gl" viewBox="0 0 70 70" style={{ width: '.95em' }} aria-hidden="true"><circle cx="35" cy="35" r="30" fill="none" stroke="currentColor" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" /><text x="35" y="43" textAnchor="middle" fontSize="20" fontWeight="700" fill="currentColor">EN</text></svg></span>
        <wbr /><span className="sr">{site('languages')}</span><span className="sf-nw">{site('viaLondon')}
        <span className="g3" data-g="flag-uk" style={{ width: '1.5em' }} aria-hidden="true"><svg viewBox="0 0 60 30"><clipPath id="ukS"><path d="M0,0 v30 h60 v-30 z" /></clipPath><clipPath id="ukT"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath><g clipPath="url(#ukS)"><path d="M0,0 v30 h60 v-30 z" fill="#012169" /><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" /><path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#ukT)" stroke="#C8102E" strokeWidth="4" /><path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" /><path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" /></g></svg></span></span>
        <span className="sf-nw">EC2A 4NE</span></span><br />
      <Link href={siteHref(locale, '/app')}><span className="sf-nw">{t('app')}{' '}
        <span className="g3" data-g="apple" style={{ width: '0.62em' }} aria-hidden="true"><svg viewBox="0 0 24 24"><path fill="#11181C" d="M16.4 12.6c0-2.4 2-3.5 2.1-3.6-1.1-1.7-2.9-1.9-3.5-1.9-1.5-.2-2.9.9-3.7.9s-1.9-.9-3.2-.8c-1.6 0-3.1 1-4 2.4-1.7 3-.4 7.4 1.2 9.8.8 1.2 1.8 2.5 3 2.4 1.2 0 1.7-.8 3.1-.8s1.9.8 3.2.8c1.3 0 2.1-1.2 2.9-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.4-.9-2.4-4zM14.1 5.4c.7-.8 1.1-1.9 1-3-1 0-2.1.7-2.8 1.5-.6.7-1.2 1.8-1 2.9 1.1.1 2.1-.6 2.8-1.4z" /></svg></span>
        <span className="g3" data-g="play" style={{ width: '0.66em' }} aria-hidden="true"><svg viewBox="0 0 94 100"><path d="M0 0 L0 100 L56 50Z" fill="#00A0FF" /><path d="M0 0 L56 50 L74 33Z" fill="#00F076" /><path d="M0 100 L74 67 L56 50Z" fill="#FF3A44" /><path d="M74 33 L94 50 L74 67 L56 50Z" fill="#FFD500" /></svg></span></span>
        <span className="sr">{site('freeOnPhones')}</span></Link>{' '}
      <a href={INSTAGRAM} target="_blank" rel="noopener"><span className="sf-nw">Instagram
        <span className="g3" data-g="insta" style={{ width: '0.74em' }} aria-hidden="true"><svg viewBox="0 0 100 100"><defs><radialGradient id="igG" cx="30%" cy="105%" r="130%"><stop offset="0" stopColor="#FEDA75" /><stop offset=".25" stopColor="#FA7E1E" /><stop offset=".5" stopColor="#D62976" /><stop offset=".75" stopColor="#962FBF" /><stop offset="1" stopColor="#4F5BD5" /></radialGradient></defs><path fill="url(#igG)" fillRule="evenodd" d="M30 0h40a30 30 0 0 1 30 30v40a30 30 0 0 1-30 30H30A30 30 0 0 1 0 70V30A30 30 0 0 1 30 0Zm0 9a21 21 0 0 0-21 21v40a21 21 0 0 0 21 21h40a21 21 0 0 0 21-21V30A21 21 0 0 0 70 9H30Zm20 17.5a23.5 23.5 0 1 1 0 47 23.5 23.5 0 0 1 0-47Zm0 8.5a15 15 0 1 0 0 30 15 15 0 0 0 0-30Zm26.5-17a6 6 0 1 1 0 12 6 6 0 0 1 0-12Z" /></svg></span></span>
        <span className="sr"> @</span>makanappofficial</a>
    </div>
    <div className="sf-base">
      <p><span lang="en">{COMPANY.legalName} is a company registered in England and Wales, company no. {COMPANY.registration}. Registered office: 86–90 Paul Street, London EC2A 4NE, United Kingdom.</span> {t('rights')}</p>
      <p className="sf-copy">©{new Date().getFullYear()}</p>
    </div>
    <FooterFx />
  </footer>
}
