/* eslint-disable @next/next/no-img-element -- meal photos are app thumbnails or /api/thumb resizes, sized by CSS */
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import SiteSchema from '@/components/SiteSchema'
import { em } from '@/components/site/text'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import { getEatStandings } from '@/lib/eat-standings'
import { getMaitredDirectory } from '@/lib/maitred'
import { getPlaceDirectory } from '@/lib/place-directory'
import { getHiddenPlaceIds } from '@/lib/web-listing'
import { getAllReviews } from '@/lib/reviews'
import { thumbUrl } from '@/lib/thumb'
import { localizePath } from '@/i18n/paths'
import PartnerForm from './PartnerForm'
import FindRestaurant from './FindRestaurant'
import { localPhoto } from '@/lib/local-photo'
import './owners.css'

export const revalidate = 3600
export async function generateMetadata({ params }: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({locale, namespace:'Partner'})
  return createPageMetadata({title:t('metaTitle'), description:t('metaDescription'), path:locale === 'id' ? '/id/partner' : '/partner', locale, image:SITE_URL + (locale === 'id' ? '/id' : '') + '/partner/opengraph-image'})
}

type Tool = { id: string; label: string; eyebrow: string; title: string; body: string; points: string[] }
const lastSentence = (s: string) => s.split(/(?<=\.)\s+/).pop() ?? s

/**
 * RM20773 (Devon, 27 Nov 2026: "Yes, prepare to ship"): the page for restaurant owners, in the order the
 * partner research and the London owner roleplay found works (side-session-notes/…/RM20773-partner-page-
 * research.md, RM20773-london-owner-roleplay.md): find your own restaurant first; the money-and-rank facts
 * out of the small print; one real restaurant shown with its photos and city rank (never a small count);
 * live Maître d’ usual orders; the city with the most ranked restaurants (London today) and Devon's own
 * reviews; the steps; the FAQ; the same two actions. Every line is an approved string; all data is live,
 * from the same cached readers as the rest of the site (no Places calls, no writes).
 */
export default async function PartnerPage({ params }: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale)
  const [t, existing, widget, places, standingsT, footer, standings, directory, maitred, hidden] = await Promise.all([
    getTranslations('PartnerRedesign'), getTranslations('Partner'), getTranslations('Redesign.widget'), getTranslations('Places'),
    getTranslations('Standings'), getTranslations('Footer'), getEatStandings(), getPlaceDirectory(), getMaitredDirectory(), getHiddenPlaceIds(),
  ])
  const faqs = t.raw('faqs') as [string,string][]
  const tools = t.raw('tools') as Tool[]
  const steps = t.raw('getting_started') as [string,string][]
  const regular = places('maitredRegular')

  // Devon, 27 Nov 2026 ("EN London, ID Jakarta"): each language features the city its owners are in; if that city
  // has no ranked page yet, the city with the most ranked restaurants. In it, the best-ranked place with three photos.
  const home = locale === 'id' ? 'jakarta' : 'london'
  const city = standings.cities.find(c => c.slug === home || c.city.toLowerCase() === home)
    ?? [...standings.cities].sort((a, b) => b.rows.length - a.rows.length)[0] ?? null
  const byId = new Map(directory.map(p => [p.placeId, p]))
  // RM20616 dish pages U2: a venue taken down is never the featured card (its page is gone); the ranks stay real.
  const cardRank = city ? city.rows.findIndex(r => !hidden.has(r.placeId) && (byId.get(r.placeId)?.meals.length ?? 0) >= 3) : -1
  const card = city && cardRank >= 0 ? byId.get(city.rows[cardRank].placeId) ?? null : null
  // Public web rule (Devon, RM20711): a Maître d’ is "A regular", never a name.
  // The featured city's Maître d’ usual orders first, then others, three at most.
  const inCity = (v: { where: { city: string } | null }) => Boolean(city && v.where?.city.toLowerCase() === city.city.toLowerCase())
  // RM20616 dish pages U2: nor is one of the featured usual orders.
  const published = maitred.venues.filter(v => v.notes.always && !hidden.has(v.placeId))
  const usuals = [...published.filter(inCity), ...published.filter(v => !inCity(v))].slice(0, 3)
  const reviews = getAllReviews()
  const src = (m: { thumb: string; src: string }) => m.thumb || thumbUrl(m.src, 480)
  const whereOf = (w: { city: string; country: string } | null) => w ? [w.city, w.country].filter(Boolean).join(', ') : ''

  return <main id="main-content" className="sx"><SiteSchema locale={locale}/>

    <section className="ch pd-hero" id="top" aria-label={t('hero')}>
      <div className="wrap split">
        <div>
          <h1 className="big xl" data-rise="">{t.rich('heroRich', { em })}</h1>
          <p className="lede" data-rise="">{t('intro')}</p>
          <div className="pd-find" id="find" data-rise=""><FindRestaurant /></div>
          <div className="btns"><a className="btn line" href="#enquire">{t('enquire')}</a></div>
        </div>
        <figure data-pop="">
          <Image className="ph" src={localPhoto('/redesign/prawns.jpg', 520)} width={1280} height={1280} alt={t('hero_alt')} priority />
          <figcaption>{t('hero_caption')}</figcaption>
        </figure>
      </div>
      <div className="wrap pd-facts"><p>{t('offer')}</p><p>{lastSentence(faqs[0][1])}</p><p>{standingsT('how4')}</p></div>
    </section>

    {card && city ? <section className="ch white" id="owner-tools" aria-label={tools[1].label}>
      <div className="wrap pd-panel">
        <div><p className="band">{tools[1].eyebrow}</p><h2 className="big md">{tools[1].title}</h2><p>{tools[1].body}</p><ul>{tools[1].points.map(p => <li key={p}>{p}</li>)}</ul></div>
        <Link className="pd-shot" href={localizePath(locale, `/places/${card.slug}`)}>
          <div className="pd-meals">{card.meals.slice(0, 3).map(m => <figure key={m.id}><img src={src(m)} alt={m.caption ? `${m.caption}, ${card.name}` : card.name} width={480} height={480} loading="lazy" decoding="async" /></figure>)}</div>
          <div className="pd-venue"><div><b>{card.name}</b><span>{whereOf(card.where)}</span></div><div className="pd-rank">{places.rich('rankCityRich', { rank: cardRank + 1, city: city.city, em })}</div></div>
        </Link>
      </div>
    </section> : null}

    <section className="ch dark" id="partner-maitred" aria-label={t('proof_title')}>
      <div className="wrap split">
        <div>
          <h2 className="big" data-rise="">{t.rich('proof_titleRich', { em })}</h2>
          <p className="lede" data-rise="">{t('proof_intro')}</p>
          <p className="body" data-rise="">{t('proof_body')}</p>
          <p className="end" data-rise="">{t('proof_end')}</p>
        </div>
        <div>
          {usuals.map(v => <div className="pd-mditem" key={v.placeId} data-pop="">
            <div className="mdcard"><span className="mdcap">{places('maitredOrderEyebrow')}</span><span className="mddish">{v.notes.always}</span><div className="mdrow"><span className="mdav"><svg className="crown" viewBox="0 0 35 27" width="18" height="14" aria-hidden="true"><path d="M4 7 L11 12 L17 3 L23 12 L31 6 L28 21 Q17 24 7 21 Z" fill="#FF9932" stroke="#FF9932" strokeWidth="2" strokeLinejoin="round"/></svg><i aria-hidden="true">{regular.charAt(0)}</i></span><span className="mdwho"><b>{regular}</b><span>Maître d’ · {v.name}{v.where?.city ? `, ${v.where.city}` : ''}</span></span></div></div>
          </div>)}
          <div className="rules" data-rise=""><h3>{widget('rulesTitle')}</h3><ul>
            <li>{widget('rulesQualify')}</li>
            <li>{widget('rulesHolder')}</li>
            <li>{widget('rulesUsual')}</li>
          </ul></div>
        </div>
      </div>
    </section>

    {city ? <section className="ch peach" aria-label={standingsT('cityBoardLabel', { city: city.city })}>
      <div className="wrap split">
        <div>
          <h2 className="big" data-rise="">{standingsT.rich('cityTitleRich', { city: city.city, em })}</h2>
          <ol className="pd-ranked">{city.rows.map((r, i) => <li key={r.placeId}><span className="pd-n">{i + 1}</span>{hidden.has(r.placeId) ? r.name : <Link href={localizePath(locale, `/places/${r.slug}`)}>{r.name}</Link>}</li>)}</ol>
        </div>
        {reviews.length ? <div><h3 className="pd-h3">{footer('reviews')}</h3><ul className="pd-reviews">{reviews.map(r => <li key={r.slug}><Link href={localizePath(locale, `/blog/${r.slug}`)}>{r.title} →</Link></li>)}</ul></div> : null}
      </div>
    </section> : null}

    <section className="ch white" id="getting-started" aria-label={t('getting_started_title')}>
      <div className="wrap split">
        <h2 className="big" data-rise="">{t.rich('getting_started_titleRich', { em })}</h2>
        <div>
          {/* Step 1 now reads the approved findBody line: the search sits at the top of the page, not below. */}
          <ul className="steps pd-steps">{steps.map(([head, body], i) => <li key={head} data-read=""><b>{head}</b>{i === 0 ? existing('findBody') : body}</li>)}</ul>
          <div className="btns"><a className="btn ink" href="#find">{existing('findTitle')}</a></div>
        </div>
      </div>
    </section>

    <section className="ch peach pt-talk" aria-label={t('offer_title')}>
      <div className="wrap">
        <div className="split faqwrap">
          <h2 className="big md" data-rise="">{t('faq_title')}</h2>
          <div className="faq">{faqs.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </div>
        <h2 className="big xl" data-rise="" style={{ marginTop: '14vh' }}>{t.rich('offer_titleRich', { em })}</h2>
        <p className="lede" data-rise="" style={{ maxWidth: '44ch' }}>{t('offer_body')}</p>
        <div className="grid2 forms pd-close-forms">
          <div><h3>{existing('findTitle')}</h3><p>{existing('findBody')}</p><div className="btns"><a className="btn ink" href="#find">{existing('findTitle')}</a></div></div>
          <div id="enquire"><h3>{t('form_title')}</h3><p>{t('form_intro')}</p><PartnerForm /></div>
        </div>
      </div>
    </section>
  </main>
}
