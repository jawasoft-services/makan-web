import PlayfulArrow from '@/components/PlayfulArrow'
import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import Image from 'next/image'
import Link from 'next/link'
import Footer from '@/components/Footer'
import SiteSchema from '@/components/SiteSchema'
import RedesignRegulars from '@/components/home/RedesignRegulars'
import { createPageMetadata, SITE_URL } from '@/lib/site-metadata'
import PartnerForm from './PartnerForm'
import FindRestaurant from './FindRestaurant'
import './partner.css'

export const revalidate = 3600
export async function generateMetadata({ params }: {params: Promise<{locale: string}>}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({locale, namespace:'Partner'})
  return createPageMetadata({title:t('metaTitle'), description:t('metaDescription'), path:locale === 'id' ? '/id/partner' : '/partner', locale, image:SITE_URL + (locale === 'id' ? '/id' : '') + '/partner/opengraph-image'})
}
const arrow = <PlayfulArrow />
export default async function PartnerPage({ params }: {params: Promise<{locale: string}>}) {
  const {locale} = await params
  setRequestLocale(locale)
  const t = await getTranslations('PartnerRedesign')
  const existing = await getTranslations('Partner')
  const benefits = t.raw('benefits') as [string,string][]
  const faqs = t.raw('faqs') as [string,string][]
  return <><main id="main-content" className="redesign-page partner-page"><SiteSchema locale={locale}/>
    <section className="partner-hero" id="top" aria-labelledby="partner-title">
      <div className="partner-hero-copy"><h1 id="partner-title">{t('hero')}</h1><p className="partner-hero-intro">{t('intro')}</p><div className="partner-actions"><a className="button orange text-white" href="#enquire">{t('enquire')}{arrow}</a><a className="partner-text-link" href="#partner-maitred">{t('how')}</a></div><p className="partner-hero-offer">{t('offer')}</p></div>
      <figure className="partner-hero-photo"><Image src="/redesign/prawns.jpg" width={2048} height={2048} alt={t('hero_alt')} priority/><figcaption>{t('hero_caption')}</figcaption></figure>
    </section>
    <section className="partner-proof partner-section" id="partner-maitred" aria-labelledby="partner-proof-title"><div className="partner-proof-art"><RedesignRegulars locale={locale}/></div><div className="partner-copy"><h2 id="partner-proof-title">{t('proof_title')}</h2><p className="partner-lead">{t('proof_intro')}</p><p>{t('proof_body')}</p><p className="partner-proof-end">{t('proof_end')}</p></div></section>
    <section className="partner-benefits partner-section" aria-labelledby="partner-benefits-title"><div className="partner-copy"><h2 id="partner-benefits-title">{t('benefit_title')}</h2><ul className="partner-benefit-list">{benefits.map(([head,body]) => <li key={head}><h3>{head}</h3><p>{body}</p></li>)}</ul></div><figure className="partner-phone"><Image src="/redesign/feed-seafood-risotto.webp" width={1066} height={2198} alt={t('feed_alt')}/></figure></section>
    <section className="partner-story partner-section" aria-labelledby="partner-story-title"><div className="partner-story-copy"><h2 id="partner-story-title">{t('story_title')}</h2><p>{t('story_body')}</p><Link className="partner-text-link" href="/blog/kendal-street-kitchen">{t('story_link')}{arrow}</Link></div><div className="partner-story-photos">{['dining','dessert'].map((key,i) => <figure key={key}><div className="partner-story-image"><Image src={`/redesign/${i ? 'tiramisu' : 'dining'}.jpg`} width={2048} height={2048} alt={t(key+'_alt')}/><span className="partner-place">Kendal Street Kitchen</span></div><figcaption>{t(key+'_caption')}</figcaption></figure>)}</div></section>
    <section className="partner-offer partner-section" aria-labelledby="partner-offer-title"><h2 id="partner-offer-title">{t('offer_title')}</h2><div><p className="partner-lead">{t('offer_body')}</p><p>{t('offer_note')}</p><a className="button ink" href="#enquire">{t('enquire')}{arrow}</a></div></section>
    <section className="partner-faq partner-section" aria-labelledby="partner-faq-title"><h2 id="partner-faq-title">{t('faq_title')}</h2><div className="partner-questions">{faqs.map(([q,a]) => <details className="partner-question" key={q}><summary>{q}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></summary><p>{a}</p></details>)}</div></section>
    <section className="partner-section partner-search" id="find" aria-labelledby="find-title"><div><h2 id="find-title">{existing('findTitle')}</h2><p>{existing('findBody')}</p></div><FindRestaurant/></section>
    <section className="partner-enquiry" id="enquire" aria-labelledby="partner-enquiry-title"><div className="partner-enquiry-inner"><div className="partner-enquiry-copy"><h2 id="partner-enquiry-title">{t('form_title')}</h2><p>{t('form_intro')}</p></div><div className="partner-form-wrap"><PartnerForm/></div></div></section>
  </main><Footer/></>
}
