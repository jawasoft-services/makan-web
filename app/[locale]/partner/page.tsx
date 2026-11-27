import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import SiteSchema from '@/components/SiteSchema'
import { em } from '@/components/site/text'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import { getMaitredDirectory } from '@/lib/maitred'
import { localizePath } from '@/i18n/paths'
import PartnerForm from './PartnerForm'
import FindRestaurant from './FindRestaurant'
import { localPhoto } from '@/lib/local-photo'

export const revalidate = 3600
export async function generateMetadata({ params }: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({locale, namespace:'Partner'})
  return createPageMetadata({title:t('metaTitle'), description:t('metaDescription'), path:locale === 'id' ? '/id/partner' : '/partner', locale, image:SITE_URL + (locale === 'id' ? '/id' : '') + '/partner/opengraph-image'})
}

type Tool = { id: string; label: string; title: string; body: string; points: string[]; action: string; href: string }
const d = (s: string) => ({ '--d': s } as React.CSSProperties)

/** RM20773: the approved prototype's page for restaurants (strategy/website-direction-2026-11-25/site/partner.html). */
export default async function PartnerPage({ params }: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale)
  const [t, existing, widget, places] = await Promise.all([getTranslations('PartnerRedesign'), getTranslations('Partner'), getTranslations('Redesign.widget'), getTranslations('Places')])
  const faqs = t.raw('faqs') as [string,string][]
  const tools = t.raw('tools') as Tool[]
  const benefits = t.raw('benefits') as [string,string][]
  const gettingStarted = t.raw('getting_started') as [string,string][]
  // A live Maître d’ with a published usual order. Public web rule (Devon, RM20711): shown as "A regular", never by name.
  const maitred = await getMaitredDirectory()
  const usual = maitred.venues.find(venue => venue.notes.always) ?? null
  const regular = places('maitredRegular')
  const where = usual ? [usual.name, usual.where ? [usual.where.city, usual.where.country].filter(Boolean).join(', ') : ''].filter(Boolean).join(' · ') : ''
  return <main id="main-content" className="sx"><SiteSchema locale={locale}/>

    <section className="ch pt-hero" id="top" aria-label={t('hero')}>
      <div className="wrap split">
        <div>
          <h1 className="big xl" data-rise="">{t.rich('heroRich', { em })}</h1>
          <p className="lede" data-rise="" style={d('.12s')}>{t('intro')}</p>
          <div className="btns" data-rise="" style={d('.2s')}><a className="btn or" href="#enquire">{t('enquire')}</a><a className="btn line" href="#owner-tools">{t('explore_tools')}</a></div>
          <p className="offer" data-rise="" style={d('.26s')}>{t('offer')}</p>
        </div>
        <figure data-pop="" style={d('.2s')}>
          <Image className="ph" src={localPhoto('/redesign/prawns.jpg', 520)} width={1280} height={1280} alt={t('hero_alt')} priority />
          <figcaption>{t('hero_caption')}</figcaption>
        </figure>
      </div>
      <nav className="wrap pt-jump" aria-label={t('navigation_label')} data-rise="" style={d('.3s')}><a href="#owner-tools">{t('explore_tools')}</a><a href="#partner-maitred">{t('how')}</a><a href="#getting-started">{t('getting_started_title')}</a><a href="#find">{existing('findTitle')}</a></nav>
    </section>

    <section className="ch white pt-tools" id="owner-tools" aria-label={t('tools_title')}>
      <div className="wrap split">
        <div className="sticky"><h2 className="big" data-rise="">{t.rich('tools_titleRich', { em })}</h2></div>
        <div aria-label={t('tools_label')} role="group">
          {tools.map(tool => <article className="tool" key={tool.id} data-read="">
            <p className="band">{tool.label}</p>
            <h3>{tool.title}</h3>
            <p>{tool.body}</p>
            <ul>{tool.points.map(point => <li key={point}>{point}</li>)}</ul>
            <a className="tlink" href={tool.href}>{tool.action} →</a>
          </article>)}
        </div>
      </div>
    </section>

    <section className="ch dark pt-reg" id="partner-maitred" aria-label={t('proof_title')}>
      <div className="wrap split">
        <div>
          <h2 className="big" data-rise="">{t.rich('proof_titleRich', { em })}</h2>
          <p className="lede" data-rise="" style={d('.1s')}>{t('proof_intro')}</p>
          <p className="body" data-rise="" style={d('.16s')}>{t('proof_body')}</p>
          <p className="end" data-rise="" style={d('.22s')}>{t('proof_end')}</p>
        </div>
        <div>
          {usual ? <div data-stop="">
            <div className="mdcard" data-pop="" style={d('.15s')}><span className="mdcap">{places('maitredOrderEyebrow')}</span><span className="mddish">{usual.notes.always}</span><div className="mdrow"><span className="mdav"><svg className="crown" viewBox="0 0 35 27" width="18" height="14" aria-hidden="true"><path d="M4 7 L11 12 L17 3 L23 12 L31 6 L28 21 Q17 24 7 21 Z" fill="#FF9932" stroke="#FF9932" strokeWidth="2" strokeLinejoin="round"/></svg><i aria-hidden="true">{regular.charAt(0)}</i></span><span className="mdwho"><b>{regular}</b><span>Maître d’</span></span></div></div>
            {where ? <p className="where" data-rise="" style={d('.3s')}>{where}</p> : null}
          </div> : null}
          <div className="rules" data-rise="" style={d('.1s')}><h3>{widget('rulesTitle')}</h3><ul>
            <li>{widget('rulesQualify')}</li>
            <li>{widget('rulesHolder')}</li>
            <li>{widget('rulesUsual')}</li>
          </ul></div>
        </div>
      </div>
      <div className="wrap split more">
        <h2 className="big md" data-rise="">{t('benefit_title')}</h2>
        <ul className="steps">{benefits.map(([head, body]) => <li key={head} data-read=""><b>{head}</b>{body}</li>)}</ul>
      </div>
    </section>

    <section className="ch pt-meal" aria-label={t('story_title')}>
      <div className="wrap">
        <h2 className="big" data-rise="">{t.rich('story_titleRich', { em })}</h2>
        <div className="grid2" data-stop="">
          <figure className="meal" data-pop="" style={{ margin: 0 }}><Image className="ph" src={localPhoto('/redesign/dining.jpg', 600)} width={1280} height={1280} alt={t('dining_alt')} loading="lazy" /><figcaption>{t('dining_caption')}</figcaption></figure>
          <figure className="meal" data-pop="" style={{ margin: 0, '--d': '.12s' } as React.CSSProperties}><Image className="ph" src={localPhoto('/redesign/tiramisu.jpg', 600)} width={1280} height={1280} alt={t('dessert_alt')} loading="lazy" /><figcaption>{t('dessert_caption')}</figcaption></figure>
        </div>
        <p className="body" data-rise="">{t('story_body')}</p>
        <Link className="tlink" href={localizePath(locale, '/blog/kendal-street-kitchen')} data-rise="">{t('story_link')} →</Link>
        <div className="split place" id="getting-started">
          <h2 className="big" data-rise="">{t.rich('getting_started_titleRich', { em })}</h2>
          <div>
            <ul className="steps">{gettingStarted.map(([head, body]) => <li key={head} data-read=""><b>{head}</b>{body}</li>)}</ul>
            <div className="btns"><a className="btn ink" href="#find">{existing('findTitle')}</a></div>
          </div>
        </div>
      </div>
    </section>

    <section className="ch peach pt-talk" aria-label={t('offer_title')}>
      <div className="wrap">
        <h2 className="big xl" data-rise="" data-stop="">{t.rich('offer_titleRich', { em })}</h2>
        <p className="lede" data-rise="" style={{ '--d': '.1s', maxWidth: '44ch' } as React.CSSProperties}>{t('offer_body')}</p>
        <p className="small note" data-rise="" style={d('.16s')}>{t('offer_note')}</p>
        <div className="btns" data-rise="" style={d('.2s')}><a className="btn or" href="#enquire">{t('enquire')}</a></div>

        <div className="split faqwrap">
          <h2 className="big md" data-rise="">{t('faq_title')}</h2>
          <div className="faq">{faqs.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}</summary><p>{a}</p></details>)}</div>
        </div>

        <div className="grid2 forms">
          <div id="find">
            <h3 data-rise="">{existing('findTitle')}</h3>
            <p data-rise="">{existing('findBody')}</p>
            <FindRestaurant />
          </div>
          <div id="enquire">
            <h3 data-rise="">{t('form_title')}</h3>
            <p data-rise="">{t('form_intro')}</p>
            <div className="start" data-rise=""><h4>{existing('title')}</h4><p>{existing('body')}</p></div>
            <PartnerForm />
          </div>
        </div>
      </div>
    </section>
  </main>
}
