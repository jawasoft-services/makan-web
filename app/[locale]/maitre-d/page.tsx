import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/Footer'
import PlayfulArrow from '@/components/PlayfulArrow'
import SiteSchema from '@/components/SiteSchema'
import MaitredShowcase from '@/components/home/MaitredShowcase'
import StoreLink from '@/components/home/StoreLink'
import MaitredDemo, { type MaitredDemoCopy } from '@/components/maitred/MaitredDemo'
import MaitredNativeMockup from '@/components/maitred/MaitredNativeMockup'
import { localizePath } from '@/i18n/paths'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'MaitredPage' })
  return createPageMetadata({ title: t('metaTitle'), description: t('metaDescription'), path: localizePath(locale, '/maitre-d'), locale, image: `${SITE_URL}${localizePath(locale, '/maitre-d/opengraph-image')}` })
}

export default async function MaitredPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations('MaitredPage')
  const global = await getTranslations('Global')
  const demo = t.raw('demo') as MaitredDemoCopy
  const faqs = t.raw('faqs') as { question: string; answer: string }[]

  return <>
    <main id="main-content" className={`redesign-page ${styles.page}`}>
      <SiteSchema locale={locale} />
      <section className={styles.hero} id="top" aria-labelledby="maitred-title">
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>Maître d’</p>
          <h1 id="maitred-title">{t('heroStart')} <span>{t('heroEnd')}</span></h1>
          <p className={styles.intro}>{t('heroBody')}</p>
          <div className={styles.heroActions}>
            <a href="#download" className="button orange text-white">{t('getApp')}<PlayfulArrow /></a>
            <a href="#how-it-is-earned" className={styles.textLink}>{t('seeHow')}<PlayfulArrow direction="down" /></a>
          </div>
        </div>
        <figure className={styles.heroScene}>
          <span className={styles.demoLabel}>{demo.label}</span>
          <div className={styles.heroPhone}>
            <div className={styles.phoneIsland} aria-hidden="true" />
            <MaitredNativeMockup locale={locale} state="order" priority />
            <div className={styles.phoneIndicator} aria-hidden="true" />
          </div>
          <Image className={styles.heroCrown} src="/redesign/maitred-crown.svg" alt="" width={240} height={180} aria-hidden="true" />
          <Image className={styles.heroFork} src="/redesign/food-fork.svg" alt="" width={240} height={320} aria-hidden="true" />
          <figcaption>Kendal Street Kitchen · @ridorichard</figcaption>
        </figure>
      </section>

      <section id="how-it-is-earned" className={styles.earning} aria-labelledby="earning-title">
        <div className={styles.sectionInner}>
          <div className={styles.earningHeading}><h2 id="earning-title">{t('earningTitle')}</h2><p>{t('definition')}</p></div>
          <MaitredDemo copy={demo} locale={locale} />
          <a href="#maitred-counting-rules" className={styles.rulesLink}>{t('countingLink')}<PlayfulArrow direction="down" /></a>
        </div>
      </section>

      {/* The shared directory owns public eligibility and complete holder coverage.
          The illustrative demo is never substituted as live proof. */}
      <div id="meet-the-regulars" className={styles.proof} data-maitred-public-proof>
        <MaitredShowcase dedicated />
      </div>

      <section id="questions" className={styles.questions} aria-labelledby="questions-title">
        <div className={styles.questionHeading}><h2 id="questions-title">{t('faqTitle')}</h2></div>
        <div className={styles.faqList}>{faqs.map(({ question, answer }, index) => <details name="maitred-faq" open={index === 0} className={styles.question} key={question} id={`maitred-question-${index + 1}`}>
          <summary>{question}<PlayfulArrow direction="down" /></summary><p id={index === 0 ? 'maitred-counting-rules' : undefined}>{answer}</p>
        </details>)}</div>
      </section>

      <section id="download" className={styles.download} aria-labelledby="download-title">
        <Image className={styles.downloadCrown} src="/redesign/maitred-crown.svg" alt="" width={160} height={120} aria-hidden="true" />
        <h2 id="download-title">{t('downloadStart')} <span>{t('downloadEnd')}</span></h2>
        <div className={styles.stores}><StoreLink location="maitre-d" className={styles.storeLink}><Image src="/redesign/app-store.svg" alt={global('downloadAppStore')} width={164} height={55} /></StoreLink></div>
        <Link className={styles.qr} href={localizePath(locale, '/app')}><Image src="/redesign/app-qr.svg" alt={t('qrAlt')} width={106} height={106} /><span>{t('qrText')}</span></Link>
        <Link className={styles.partnerLink} href={localizePath(locale, '/partner')}>{t('partnerLink')}<PlayfulArrow /></Link>
      </section>
    </main>
    <Footer />
  </>
}
