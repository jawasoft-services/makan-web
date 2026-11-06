import PlayfulArrow from '@/components/PlayfulArrow'
import Image from 'next/image'
import Link from 'next/link'
import StoreLink from '@/components/home/StoreLink'
import StaticPicture from '@/components/StaticPicture'
import { localizePath } from '@/i18n/paths'
import { BOILERPLATE_LONG, PRESS_EMAIL } from '@/lib/press'
import EditorialCta from './EditorialCta'
import { storyCopy } from './story-copy'
import styles from './editorial.module.css'

export default function StoryArticle({ locale, mealCount }: { locale: string; mealCount: number }) {
  const isId = locale === 'id'
  const copy = storyCopy[isId ? 'id' : 'en']
  const count = mealCount.toLocaleString(isId ? 'id-ID' : 'en-GB')
  return (
    <main id="main-content" className={styles.page}>
      <header className={`${styles.hero} ${styles.storyHero}`}>
        <div>
          <p className={styles.kicker}>{copy[0][1]}</p>
          <h1>{copy[1][1]}</h1>
          <p className={styles.dek}>{copy[2][1]}</p>
          <p className={styles.byline}>Devon Makepeace · {isId ? 'Pendiri Makan' : 'Founder, Makan'}</p>
        </div>
        <Image className={styles.storyArt} src="/redesign/food-plate.svg" alt="" width={230} height={230} aria-hidden />
      </header>
      <figure className={styles.widePhoto}>
        <StaticPicture basePath="/static-images/v1/blog/kendal-street-kitchen/carbonara-risotto" widths={[480, 900, 1400]} width={2048} height={2048} sizes="(min-width: 1300px) 1200px, 90vw" alt={isId ? 'Carbonara, risotto jamur, dan kentang goreng truffle di Kendal Street Kitchen' : 'Carbonara, mushroom risotto and truffle fries at Kendal Street Kitchen'} />
        <figcaption><Link href="/blog/kendal-street-kitchen">Kendal Street Kitchen · @ridorichard <PlayfulArrow /></Link></figcaption>
      </figure>
      <div className={styles.readingLayout}>
        <aside className={styles.toc}>
          <p>{isId ? 'Di halaman ini' : 'In this story'}</p>
          <nav aria-label={isId ? 'Bab cerita' : 'Story chapters'}>
            {copy.map(([tag, text], i) => tag === 'h2' ? <a key={i} href={`#chapter-${i}`}>{text}</a> : null)}
          </nav>
          <Link className={styles.textLink} href={localizePath(locale, '/manifesto')}>{isId ? 'Baca manifesto kami' : 'Read our manifesto'} <PlayfulArrow /></Link>
        </aside>
        <article className={styles.prose}>
          {copy.slice(3).map(([tag, text], i) => tag === 'h2'
            ? <h2 key={i} id={`chapter-${i + 3}`}>{text}</h2>
            : <p key={i}>{text.replace('{mealCount}', count)}</p>)}
          <StoreLink location="story" className={styles.button}>{isId ? 'Mulai dari makanan berikutnya' : 'Start with your next meal'}</StoreLink>
          <section className={styles.press} aria-labelledby="press-title">
            <h2 id="press-title">{isId ? 'Untuk media' : 'For press'}</h2>
            <p>{isId ? 'Makan adalah aplikasi yang kamu buka saat bingung mau pesan apa. Didirikan Devon Makepeace dan tumbuh dari shared story teman-temannya selama pandemi, Makan membantumu menyimpan makanan, lalu membandingkan dua makananmu dan memilih mana yang ingin kamu pesan lagi lebih dulu. Saat berhadapan dengan menu, Makan mulai dari pengalamanmu sendiri, lalu orang-orang yang kamu pilih untuk dipercaya. Makan diluncurkan di Apple App Store pada Juni 2026.' : BOILERPLATE_LONG}</p>
            <a className={styles.textLink} href={`mailto:${PRESS_EMAIL}`}>{PRESS_EMAIL} <PlayfulArrow /></a>
          </section>
        </article>
      </div>
      <EditorialCta locale={locale} />
    </main>
  )
}
