import type { ReactNode } from 'react'
import { useTranslations } from 'next-intl'

export interface TocItem { id: string; label: string }

/**
 * The document-page family of the approved prototype (support, contact, blog, the policies and the deletion
 * pages): a short hero with the page's own title, then a contents list beside the text. SiteMotion marks the
 * contents entry for the section being read. `side` replaces the contents list (the contact page's help link).
 */
export default function DocPage({ title, lede, toc, side, children, bodyLang }: { title: string; lede?: ReactNode; toc?: TocItem[]; side?: ReactNode; children: ReactNode; bodyLang?: string }) {
  const site = useTranslations('Site')
  return <>
    <section className="ch tight doc-hero" aria-label={title}>
      <div className="wrap">
        <h1 className="big md" data-rise="">{title}</h1>
        {lede ? <p className="lede" data-rise="" style={{ '--d': '.12s' } as React.CSSProperties}>{lede}</p> : null}
      </div>
    </section>
    <section className="ch doc-ch" aria-label={site('inFull', { title })}>
      <div className="doc">
        {side ?? (toc?.length ? <nav className="doc-toc" aria-label={site('onThisPage')}><ol>{toc.map(item => <li key={item.id}><a href={`#${item.id}`}>{item.label}</a></li>)}</ol></nav> : <div />)}
        <div className="doc-body" lang={bodyLang}>{children}</div>
      </div>
    </section>
  </>
}

/** An id from a heading, the way the prototype builds them: lower case, words joined by hyphens. */
export function slugId(text: string): string {
  return text.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[’']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
