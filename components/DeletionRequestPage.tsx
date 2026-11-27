import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import DocPage, { slugId } from '@/components/site/DocPage'
import { localizePath } from '@/i18n/paths'
import { SUPPORT_EMAIL } from '@/lib/support'

type DeletionNamespace = 'AccountDeletion' | 'DataDeletion'
interface DeletionRequestPageProps { locale: string; namespace: DeletionNamespace; otherPath: '/account-deletion' | '/data-deletion' }

/** The support address inside a sentence becomes a link to it, as the prototype draws it; the words are unchanged. */
function withEmail(text: string) {
  const at = text.indexOf(SUPPORT_EMAIL)
  return at < 0 ? text : <>{text.slice(0, at)}<a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>{text.slice(at + SUPPORT_EMAIL.length)}</>
}

/** RM20773: the approved prototype's deletion pages (account-deletion.html, data-deletion.html); the wording is unchanged. */
export default async function DeletionRequestPage({ locale, namespace, otherPath }: DeletionRequestPageProps) {
  const t = await getTranslations({ locale, namespace })
  const requestHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t('emailSubject'))}`
  const heads = (['requestTitle', 'stepsTitle', 'deletedTitle', 'retainedTitle', 'retentionTitle', 'optionalTitle', 'otherTitle'] as const).map(key => t(key))
  const toc = heads.map(label => ({ id: slugId(label), label }))
  return <main id="main-content" className="sx">
    <DocPage title={t('title')} lede={t('intro')} toc={toc}>
      <h2 id={toc[0].id}>{t('requestTitle')}</h2>
      <p>{t('requestBody')}</p>
      <a className="btn or" href={requestHref}>{t('cta')}</a>
      <p className="note">{t('noSecrets')}</p>
      <h2 id={toc[1].id}>{t('stepsTitle')}</h2>
      <ol className="doc-steps">{([1, 2, 3, 4] as const).map(step => <li key={step}><b>{t(`step${step}Title`)}</b>{withEmail(t(`step${step}Body`))}</li>)}</ol>
      <h2 id={toc[2].id}>{t('deletedTitle')}</h2>
      <ul>{([1, 2, 3, 4, 5] as const).map(item => <li key={item}>{t(`deletedItem${item}`)}</li>)}</ul>
      <h2 id={toc[3].id}>{t('retainedTitle')}</h2>
      <ul>{([1, 2, 3, 4] as const).map(item => <li key={item}>{t(`retainedItem${item}`)}</li>)}</ul>
      <h2 id={toc[4].id}>{t('retentionTitle')}</h2>
      <p>{t('retentionBody')}</p>
      <h2 id={toc[5].id}>{t('optionalTitle')}</h2>
      <p>{t('optionalBody')}</p>
      <h2 id={toc[6].id}>{t('otherTitle')}</h2>
      <p>{t('otherBody')}</p>
      <Link className="tlink" href={localizePath(locale, otherPath)}>{t('otherLink')} →</Link>
      <ul className="doc-links" aria-label={t('relatedLinksLabel')}>
        <li><Link href={localizePath(locale, '/privacy-policy')}>{t('privacyLink')}</Link></li>
        <li><Link href={localizePath(locale, '/')}>{t('backHome')}</Link></li>
      </ul>
    </DocPage>
  </main>
}
