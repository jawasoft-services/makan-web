import PlayfulArrow from '@/components/PlayfulArrow'
import Image from 'next/image'
import StaticPicture from '@/components/StaticPicture'
import Link from 'next/link'
import { Fraunces } from 'next/font/google'
import { getTranslations } from 'next-intl/server'
import Footer from '@/components/Footer'
import SiteSchema from '@/components/SiteSchema'
import HomepageAnalytics from '@/components/HomepageAnalytics'
import HashScroll from '@/components/HashScroll'
import FaqSchema from '@/components/FaqSchema'
import { getDecisionFaqs } from '@/lib/faq'
import { getMealCount } from '@/lib/makan-stats'
import { getDishWall } from '@/lib/dish-wall-data'
import { getAppStoreRating } from '@/lib/app-store'
import { localizePath } from '@/i18n/paths'
import { thumbUrl } from '@/lib/thumb'
import type { WallMeal } from '@/lib/dish-wall'
import RedesignRegulars from './RedesignRegulars'
import MaitredShowcase from './MaitredShowcase'
import StandingsPreview from './StandingsPreview'
import StoreLink from './StoreLink'
import DishWall, { type WallCard } from './DishWall'
import ChapterStage from './ChapterStage'
import './dish-home.css'

// Display type for the headlines; Plus Jakarta Sans stays the text face.
const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-fraunces', display: 'swap' })

// Shown when the live wall cannot be read: photos already public on this site, cropped to the
// photo (scripts/build-dish-wall-fallback.mjs). Credits as on the old homepage gallery.
const BUNDLED = '/static-images/v1/dish-wall'
const bundledPreviews: WallMeal[] = [
  { id: 'prawns', src: `${BUNDLED}/preview-prawns.webp`, dish: 'Harissa prawns', venue: 'Kendal Street Kitchen', mealType: '', handle: 'ridorichard' },
  { id: 'sushi', src: `${BUNDLED}/preview-sushi.webp`, dish: 'Sushi', venue: 'NOBU Singapore', mealType: '', handle: 'Valesca' },
  { id: 'fish-sando', src: `${BUNDLED}/preview-fish-sando.webp`, dish: 'Fish Sando', venue: 'Fire Street Food', mealType: '', handle: 'Roo Baby Donovan' },
  { id: 'roast', src: `${BUNDLED}/preview-roast.webp`, dish: 'ROS BEEEEF', venue: 'Heaney & Mill', mealType: '', handle: 'Ridorichard' },
  { id: 'dining', src: `${BUNDLED}/preview-dining.webp`, dish: 'Carbonara & mushroom risotto', venue: 'Kendal Street Kitchen', mealType: '', handle: 'ridorichard' },
]
const bundledTiles = Array.from({ length: 14 }, (_, i) => `${BUNDLED}/tile-${String(i + 1).padStart(2, '0')}.webp`)

const arrow = <PlayfulArrow />
const CHAPTER_IDS = ['features', 'memory', 'eat-or-yeet', 'regulars']
const SCREENS = ['feed-seafood-risotto', 'diary-iphone', 'eat-or-yeet-iphone']

export default async function DecisionHome({ locale }: { locale: string }) {
  const t = await getTranslations('Redesign')
  const how = await getTranslations('Home.How')
  const landing = await getTranslations('Decision.Landing')
  const [mealCount, live, rating] = await Promise.all([getMealCount(), getDishWall(), getAppStoreRating()])
  const number = (n: number, digits = 0) => n.toLocaleString(locale === 'id' ? 'id-ID' : 'en-GB', { minimumFractionDigits: digits, maximumFractionDigits: digits })
  const count = mealCount === null ? null : Math.floor(mealCount / 100) * 100
  const heads = t.raw('heads') as string[]
  const bodies = t.raw('body') as string[]
  const chapters = t.raw('chapters') as string[]
  const benefits = t.raw('restaurantbenefits') as [string, string][]
  const faqs = getDecisionFaqs(locale)
  const alts = locale === 'id' ? ['Makanan publik: seafood risotto di Kendal Street Kitchen', 'Diari September dengan Teriyaki chicken di The Cashew Tree', 'Perbandingan Eat or Yeet: Chicken don dan Kinross golf club sarnie'] : ['Public seafood risotto meal at Kendal Street Kitchen', 'September diary with Teriyaki chicken at The Cashew Tree', 'Eat or Yeet comparison: Chicken don and Kinross golf club sarnie']

  const card = (m: WallMeal): WallCard => ({
    id: m.id,
    src: thumbUrl(m.src, 480),
    dish: m.dish,
    meta: m.mealType ? `${how(m.mealType as 'lunch')} · ${m.venue}` : m.venue,
    handle: m.handle.replace(/^@/, ''),
    alt: `${m.dish}, ${m.venue}`,
  })
  const previews = (live?.previews ?? bundledPreviews).map(card)
  const tiles = live ? live.wall.map((m) => thumbUrl(m.src, 240)) : bundledTiles
  const screen = (i: number) => <StaticPicture basePath={`/static-images/v1/redesign/${SCREENS[i]}`} widths={[400, 600, 800, 1066]} width={1066} height={2198} sizes="(min-width: 821px) 340px, 78vw" loading="lazy" alt={alts[i]} />

  return <main id="main-content" className={`redesign-page dish-home ${fraunces.variable}`}>
    <SiteSchema locale={locale} /><HomepageAnalytics /><HashScroll />
    <DishWall
      label={t('sourcelabel')}
      tiles={tiles}
      previews={previews}
      intro={<><h1>{t('title')}</h1><p>{t('intro')}</p><div className="dish-actions"><a className="dish-pill orange" href="#download">{t('app')}</a><Link className="dish-pill ghost" href={localizePath(locale, '/partner')}>{t('partner')}</Link></div></>}
      total={count === null ? null : <p><strong>{number(count)}+</strong> {t('meallabel')}</p>}
    />

    <section className="dish-chapters" id="how-it-works">
      <div className="dish-chapters-text">
        {CHAPTER_IDS.map((id, i) => <article key={id} id={id} className="dish-chapter" data-chapter={i} aria-labelledby={`h-${id}`}>
          <p className="dish-chapter-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</p>
          <p className="dish-chapter-label">{chapters[i]}</p>
          <h2 id={`h-${id}`}>{heads[i]}</h2>
          <p className="dish-chapter-body">{bodies[i]}</p>
          {i === 3 ? <Link className="dish-pill ghost" href={localizePath(locale, '/maitre-d')}>{locale === 'id' ? 'Jadi Maître d’' : 'Become a Maître d’'}{arrow}</Link> : null}
          <div className="dish-chapter-inline">{i < 3 ? screen(i) : <RedesignRegulars locale={locale} />}</div>
        </article>)}
      </div>
      <ChapterStage>{[0, 1, 2].map(screen)}<RedesignRegulars locale={locale} /></ChapterStage>
    </section>

    <div className="dish-light">
      <section className="restaurants" id="restaurants" aria-labelledby="restaurant-title"><figure className="restaurant-photo"><Image src="/redesign/prawns.jpg" width={2048} height={2048} alt="Harissa prawns at Kendal Street Kitchen" /><figcaption className="venue-tag">Kendal Street Kitchen</figcaption></figure><div className="restaurant-copy"><p className="restaurant-label">{t('restaurant')}</p><h2 id="restaurant-title">{t('restaurantheadline')}</h2><p className="restaurant-intro">{t('restaurantbody')}</p><ul className="restaurant-benefits">{benefits.map(([head, body]) => <li key={head}><h3>{head}</h3><p>{body}</p></li>)}</ul><Link className="button ink" href={localizePath(locale, '/partner')}>{t('partner')}{arrow}</Link></div></section>
      <MaitredShowcase /><StandingsPreview />
      <section className="home-faq" id="faq"><h2>{locale === 'id' ? 'Masih penasaran?' : 'Still curious?'}</h2><div>{faqs.map(item => <details name="home-faq" key={item.q}><summary>{item.q}<span aria-hidden="true">+</span></summary><p>{item.a}</p></details>)}</div></section><FaqSchema items={faqs} />
    </div>

    <section className="dish-finale" id="download" aria-labelledby="download-title">
      <h2 id="download-title">{t('end')}</h2>
      <div className="dish-finale-row">
        <div className="dish-finale-store">
          <div className="stores"><StoreLink location="home-final" size="compact"><Image src="/redesign/app-store.svg" alt={locale === 'id' ? 'Unduh di App Store' : 'Download on the App Store'} width={164} height={54} /></StoreLink></div>
          {rating ? <p>{landing('trustRating', { rating: number(rating.rating, 1) })}</p> : null}
        </div>
        <a className="dish-finale-qr" href={localizePath(locale, '/app')}><Image src="/redesign/app-qr.svg" alt={locale === 'id' ? 'Kode QR untuk mengunduh Makan' : 'Makan app download QR code'} width={112} height={112} /><span>{t('scan')}</span></a>
      </div>
    </section>
    <Footer />
  </main>
}
