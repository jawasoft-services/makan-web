import RatingCarousel from './RatingCarousel'
import PlayfulArrow from '@/components/PlayfulArrow'
import Image from 'next/image'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import Footer from '@/components/Footer'
import SiteSchema from '@/components/SiteSchema'
import HomepageAnalytics from '@/components/HomepageAnalytics'
import HashScroll from '@/components/HashScroll'
import Reveal from '@/components/motion/Reveal'
import FaqSchema from '@/components/FaqSchema'
import { getDecisionFaqs } from '@/lib/faq'
import { getMealCount, getRecentPublicMeals, type PublicMeal } from '@/lib/makan-stats'
import { getAppStoreRating } from '@/lib/app-store'
import { localizePath } from '@/i18n/paths'
import { APP_STORE_URL } from '@/lib/links'
import { HomeHero, ReviewsRail } from './RedesignMotion'
import RedesignRegulars from './RedesignRegulars'
import DownloadScene from './DownloadScene'
import MaitredShowcase from './MaitredShowcase'
import StandingsPreview from './StandingsPreview'

const gallery: PublicMeal[] = [
  {src:'/redesign/prawns.jpg', caption:'Harissa prawns', locationName:'Kendal Street Kitchen', username:'ridorichard', alt:'Harissa prawns at Kendal Street Kitchen', mealType:''},
  {src:'/redesign/sushi.jpg', caption:'Sushi', locationName:'NOBU Singapore', username:'Valesca', alt:'Sushi at NOBU Singapore', mealType:''},
  {src:'/redesign/dining.jpg', caption:'Carbonara & mushroom risotto', locationName:'Kendal Street Kitchen', username:'ridorichard', alt:'Carbonara and mushroom risotto at Kendal Street Kitchen', mealType:''},
  {src:'/redesign/fish-sando.jpg', caption:'Fish Sando', locationName:'Fire Street Food', username:'Roo Baby Donovan', alt:'Fish Sando at Fire Street Food', mealType:''},
  {src:'/redesign/tiramisu.jpg', caption:'Tiramisu', locationName:'Kendal Street Kitchen', username:'ridorichard', alt:'Tiramisu at Kendal Street Kitchen', mealType:''},
  {src:'/redesign/roast.jpg', caption:'ROS BEEEEF', locationName:'Heaney & Mill', username:'Ridorichard', alt:'Roast beef at Heaney & Mill', mealType:''},
]
const reviews = [
  ['Makan is the foodies friend.', 'Jonty Frost', '26 Jun'],
  ['I love seeing what my friends are eating and cooking.', 'MimiPopps', '27 Jun'],
  ['A must for any food lover…', 'Woohooouk2009', '3 Oct'],
]
const arrow = <PlayfulArrow />

export default async function DecisionHome({ locale }: { locale: string }) {
  const t = await getTranslations('Redesign')
  const [mealCount, liveMeals, rating] = await Promise.all([getMealCount(), getRecentPublicMeals(), getAppStoreRating()])
  const meals = liveMeals.length >= 6 ? liveMeals : [...liveMeals, ...gallery].slice(0, 8)
  const midpoint = Math.ceil(meals.length / 2)
  const count = mealCount === null ? null : Math.floor(mealCount / 100) * 100
  const total = count === null ? null : `${count.toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB')}+`
  const heads = t.raw('heads') as string[]
  const bodies = t.raw('body') as string[]
  const benefits = t.raw('restaurantbenefits') as [string, string][]
  const faqs = getDecisionFaqs(locale)
  const images = ['feed-seafood-risotto.webp', 'diary-iphone.png', 'eat-or-yeet-iphone.png']
  const alts = locale === 'id' ? ['Makanan publik: seafood risotto di Kendal Street Kitchen', 'Diari September dengan Teriyaki chicken di The Cashew Tree', 'Perbandingan Eat or Yeet: Chicken don dan Kinross golf club sarnie'] : ['Public seafood risotto meal at Kendal Street Kitchen', 'September diary with Teriyaki chicken at The Cashew Tree', 'Eat or Yeet comparison: Chicken don and Kinross golf club sarnie']
  return <main id="main-content" className="redesign-page">
    <SiteSchema locale={locale} /><HomepageAnalytics /><HashScroll />
    <HomeHero pauseLabel={locale === 'id' ? 'Jeda foto' : 'Pause photos'} resumeLabel={locale === 'id' ? 'Lanjutkan foto' : 'Resume photos'}>
      <Image className="hero-photo" src="/redesign/dining.jpg" alt={locale === 'id' ? 'Pasta, risotto jamur, dan kentang goreng truffle di Kendal Street Kitchen' : 'Pasta, mushroom risotto and truffle fries at Kendal Street Kitchen'} width={2048} height={2048} priority />
      <Image className="hero-photo hero-photo-extra" src="/redesign/prawns.jpg" alt="" width={2048} height={2048} />
      <Image className="hero-photo hero-photo-extra hero-photo-third" src="/redesign/tiramisu.jpg" alt="" width={2048} height={2048} />
      <div className="hero-content"><div className="hero-copy"><h1>{t('title')}</h1><p>{t('intro')}</p></div><div className="hero-actions"><a className="button orange text-white" href="#download">{t('app')}{arrow}</a><Link className="button outline" href={localizePath(locale, '/partner')}>{t('partner')}</Link></div></div>
    </HomeHero>
    {rating ? <RatingCarousel rating={rating.rating} locale={locale} /> : null}
    <div id="how-it-works">
      {['features', 'memory', 'eat-or-yeet', 'regulars'].map((id, i) => <section key={id} id={id} className={`benefit ${i % 2 ? 'reverse' : ''}`} aria-labelledby={`h-${id}`}><Reveal className="benefit-inner">
        {i < 3 ? <div className={`phone-scene scene-${['feed', 'diary', 'choice'][i]}`}><a className="art art-phone" href={`/redesign/${images[i]}`} target="_blank" rel="noopener" aria-label={`${t('view')}: ${alts[i]}`}><Image src={`/redesign/${images[i]}`} width={1066} height={2198} alt={alts[i]} /></a>{i === 0 ? <figure className="scene-meal"><Image src="/redesign/dining.jpg" width={2048} height={2048} alt="Kendal Street Kitchen" /><figcaption>Kendal Street Kitchen</figcaption></figure> : null}<div className="scene-art"><Image src={`/redesign/${['food-fork.svg', 'food-noodles.svg', 'food-plate.svg'][i]}`} alt="" width={240} height={320} /></div></div> : <RedesignRegulars locale={locale} />}
        <div className="benefit-copy"><h2 id={`h-${id}`}>{heads[i]}</h2><p>{bodies[i]}</p>{i === 3 ? <Link className="button outline" href={localizePath(locale, "/maitre-d")}>{locale === "id" ? "Jadi Maître d’" : "Become a Maître d’"}{arrow}</Link> : null}</div>
      </Reveal></section>)}
    </div>
    <section className="gallery" aria-label={t('sourcelabel')}>
      {[meals.slice(0, midpoint), meals.slice(midpoint)].map((rail, n) => <div key={n} className={`gallery-rail rail-${n}`} tabIndex={0} role="region" aria-label={`${locale === 'id' ? 'Foto makanan' : 'Meal photos'} ${n + 1}`}>{rail.map((meal, i) => <figure className="gallery-item" key={`${meal.src}-${i}`}><div className={`gallery-photo ${['sushi.jpg','fish-sando.jpg','roast.jpg'].some(f => meal.src.endsWith(f)) ? 'share-photo' : ''}`}><Image src={meal.src} alt={meal.alt} width={960} height={960} />{meal.locationName ? <span className="venue-tag">{meal.locationName}</span> : null}</div><figcaption>{meal.caption}{meal.username ? ` · @${meal.username.replace(/^@/, '')}` : ''}</figcaption></figure>)}</div>)}
      {total !== null ? <Reveal className="gallery-foot"><p className="meal-total"><strong className="bubble-number"><span className="count-readable">{total}</span><span className="bubble-glyphs" aria-hidden="true">{Array.from(total).map((char, i) => <span key={i} className={`bubble-digit ${',.'.includes(char) ? 'bubble-punctuation' : ''}`} style={{'--delay': `${i * 65}ms`, '--tilt': `${[-4,2,-3,3,-2,4][i % 6]}deg`} as React.CSSProperties}>{char}</span>)}</span></strong><span>{t('meallabel')}</span></p></Reveal> : null}
    </section>
    <section className="reviews" aria-labelledby="reviews-title"><div className="reviews-heading"><h2 id="reviews-title">{locale === 'id' ? 'Dari orang yang memakai Makan.' : 'From people who use Makan.'}</h2><a href={APP_STORE_URL}>{locale === 'id' ? 'Baca di App Store' : 'Read on the App Store'}{arrow}</a></div><ReviewsRail label={locale === 'id' ? 'Ulasan pengguna Makan' : 'Makan user reviews'} pauseLabel={locale === 'id' ? 'Jeda ulasan' : 'Pause reviews'} resumeLabel={locale === 'id' ? 'Lanjutkan ulasan' : 'Resume reviews'}>{reviews.map(([quote, name, date]) => <figure className="review-card" key={name}><span className="review-mark" aria-hidden="true">“</span><blockquote lang="en">{quote}</blockquote><figcaption><strong>{name}</strong><span lang="en">App Store · {date}</span></figcaption></figure>)}</ReviewsRail></section>
    <section className="restaurants" id="restaurants" aria-labelledby="restaurant-title"><figure className="restaurant-photo"><Image src="/redesign/prawns.jpg" width={2048} height={2048} alt="Harissa prawns at Kendal Street Kitchen" /><figcaption className="venue-tag">Kendal Street Kitchen</figcaption></figure><div className="restaurant-copy"><p className="restaurant-label">{t('restaurant')}</p><h2 id="restaurant-title">{t('restaurantheadline')}</h2><p className="restaurant-intro">{t('restaurantbody')}</p><ul className="restaurant-benefits">{benefits.map(([head, body]) => <li key={head}><h3>{head}</h3><p>{body}</p></li>)}</ul><Link className="button ink" href={localizePath(locale, '/partner')}>{t('partner')}{arrow}</Link></div></section>
    <MaitredShowcase /><StandingsPreview />
    <section className="home-faq" id="faq"><h2>{locale === 'id' ? 'Masih penasaran?' : 'Still curious?'}</h2><div>{faqs.map(item => <details name="home-faq" key={item.q}><summary>{item.q}<span aria-hidden="true">+</span></summary><p>{item.a}</p></details>)}</div></section><FaqSchema items={faqs} />
    <DownloadScene /><Footer />
  </main>
}
