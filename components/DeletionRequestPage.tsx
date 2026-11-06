import PlayfulArrow from '@/components/PlayfulArrow'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import Footer from '@/components/Footer'
import { localizePath } from '@/i18n/paths'
import { SUPPORT_EMAIL } from '@/lib/support'
import styles from './utility.module.css'

type DeletionNamespace = 'AccountDeletion' | 'DataDeletion'
interface DeletionRequestPageProps { locale: string; namespace: DeletionNamespace; otherPath: '/account-deletion' | '/data-deletion' }

export default async function DeletionRequestPage({ locale, namespace, otherPath }: DeletionRequestPageProps) {
  const t = await getTranslations({ locale, namespace })
  const requestHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('emailSubject'))}`
  return <div className="min-h-screen bg-brand-cream">
    <main id="main-content" className={`${styles.page} ${styles.deletionPage}`}>
      <header className={styles.heading}><p className={styles.eyebrow}>{t('eyebrow')}</p><h1>{t('title')}</h1><p className={styles.intro}>{t('intro')}</p></header>
      <section className={styles.request} aria-labelledby="request-heading">
        <h2 id="request-heading">{t('requestTitle')}</h2><p>{t('requestBody')}</p>
        <a href={requestHref} className={styles.primary}>{t('cta')}</a><p className={styles.noSecrets}>{t('noSecrets')}</p>
      </section>
      <section className={styles.steps}><h2>{t('stepsTitle')}</h2><ol>
        {([1,2,3,4] as const).map(step => <li key={step}><span className={styles.stepNumber} aria-hidden>{step}</span><div><h3>{t(`step${step}Title`)}</h3><p>{t(`step${step}Body`)}</p></div></li>)}
      </ol></section>
      <div className={styles.deletionLists}>
        <section><h2>{t('deletedTitle')}</h2><ul>{([1,2,3,4,5] as const).map(item => <li key={item}>{t(`deletedItem${item}`)}</li>)}</ul></section>
        <section><h2>{t('retainedTitle')}</h2><ul>{([1,2,3,4] as const).map(item => <li key={item}>{t(`retainedItem${item}`)}</li>)}</ul></section>
      </div>
      <section className={styles.retention}><h2>{t('retentionTitle')}</h2><p>{t('retentionBody')}</p></section>
      <section className={styles.optional}><h2>{t('optionalTitle')}</h2><p>{t('optionalBody')}</p></section>
      <aside className={styles.other}><h2>{t('otherTitle')}</h2><p>{t('otherBody')}</p><Link href={localizePath(locale, otherPath)}>{t('otherLink')} <PlayfulArrow /></Link></aside>
      <nav className={styles.linkRow} aria-label={t('relatedLinksLabel')}><Link href={localizePath(locale, '/privacy-policy')}>{t('privacyLink')}</Link><Link href={localizePath(locale, '/')}>{t('backHome')}</Link></nav>
    </main><Footer />
  </div>
}
