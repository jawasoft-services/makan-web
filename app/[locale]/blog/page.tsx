import PlayfulArrow from '@/components/PlayfulArrow'
import type { Metadata } from "next"
import Link from "next/link"
import Footer from "@/components/Footer"
import StaticPicture from "@/components/StaticPicture"
import EditorialCta from "@/components/story/EditorialCta"
import { getAllReviews } from "@/lib/reviews"
import { createPageMetadata } from "@/lib/site-metadata"
import styles from "@/components/story/editorial.module.css"

export const metadata: Metadata = createPageMetadata({
  title: "The Makan blog — first-hand London restaurant reviews",
  description: "First-hand restaurant reviews from the founder of Makan — what we ate, what it cost, and what to order.",
  path: "/blog",
})

export default function BlogIndexPage() {
  const reviews = getAllReviews()
  return (
    <>
      <main id="main-content" className={styles.page} lang="en">
        <header className={`${styles.hero} ${styles.blogHero}`}>
          <p className={styles.kicker}>Food stories</p>
          <h1>Stories from the table.</h1>
          <p className={styles.dek}>What we ate, what it cost, and what’s worth ordering.</p>
        </header>
        <section className={styles.blogList} aria-label="Restaurant reviews">
          {reviews.map((review) => {
            const photo = review.meals.find(meal => meal.photo)
            return (
            <article className={styles.featureStory} key={review.slug}>
              {photo?.photo ? <Link className={styles.featurePhoto} href={`/blog/${review.slug}`} tabIndex={-1} aria-hidden>
                <StaticPicture basePath={photo.photo.replace('/blog/', '/static-images/v1/blog/').replace(/\.[^.]+$/, '')} widths={[480, 900, 1400]} alt="" width={2048} height={2048} sizes="(min-width: 701px) 48vw, 90vw" />
              </Link> : null}
              <div className={styles.featureCopy}>
                <p className={styles.kicker}>{review.restaurant.locality} · <time dateTime={review.datePublished}>{new Date(review.datePublished).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time></p>
                <h2><Link href={`/blog/${review.slug}`}>{review.restaurant.name}</Link></h2>
                <p>{review.dek}</p>
                <Link className={styles.textLink} href={`/blog/${review.slug}`}>Read the story <PlayfulArrow /></Link>
                {review.slug === 'kendal-street-kitchen' ? <p className={styles.credit}>@ridorichard</p> : null}
              </div>
            </article>
          )})}
        </section>
        <section className={styles.aboutStrip}>
          <div><p className={styles.kicker}>From Makan’s founder</p><h2>It started with a shared story.</h2></div>
          <Link className={styles.button} href="/story">Our story <PlayfulArrow /></Link>
        </section>
        <EditorialCta />
      </main>
      <Footer />
    </>
  )
}
