import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import SiteSchema from '@/components/SiteSchema'
import DocPage, { slugId } from '@/components/site/DocPage'
import { founderStory } from '@/components/story/founder-story'
import { localizePath } from '@/i18n/paths'
import { getMealCount } from '@/lib/makan-stats'
import { createPageMetadata } from '@/lib/site-metadata'

export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const s = founderStory[locale === 'id' ? 'id' : 'en']
  return createPageMetadata({ title: s.meta.title, description: s.meta.description, path: locale === 'id' ? '/id/story' : '/story', type: 'article', locale })
}

/**
 * RM20773 (Devon, 27 Nov 2026: "lets make a founder story"): the founder story, in the rebuilt site's document
 * layout (the blog's family): the headline and dek, the chapters with a contents list, then the app link.
 * The copy is components/story/founder-story.ts. The meal count is live (the cached reader the retired page used); without it, only that sentence is left out.
 */
export default async function StoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const s = founderStory[locale === 'id' ? 'id' : 'en']
  const [t, count] = await Promise.all([getTranslations('Redesign'), getMealCount().catch(() => null)])
  const meals = count === null ? null : count.toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB')
  const toc = s.chapters.map(c => ({ id: slugId(c.h), label: c.h }))
  return (
    <main id="main-content" className="sx">
      <SiteSchema locale={locale} />
      <DocPage title={s.title} lede={<>{s.dek}<span className="story-by">{s.byline}</span></>} toc={toc}>
        {s.chapters.map(c => <section key={c.h}>
          <h2 id={slugId(c.h)}>{c.h}</h2>
          {c.p.map(p => meals === null ? p.replace(/\s*[^.]*\{mealCount\}[^.]*\./, '').trim() : p.replace('{mealCount}', meals)).filter(Boolean).map(p => <p key={p}>{p}</p>)}
        </section>)}
        <p><Link className="btn or" href={localizePath(locale, '/app')}>{t('app')} →</Link></p>
      </DocPage>
    </main>
  )
}
