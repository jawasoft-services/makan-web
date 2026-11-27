import type { Metadata } from "next"
import Link from "next/link"
import StaticPicture from "@/components/StaticPicture"
import DocPage, { slugId } from "@/components/site/DocPage"
import { siteHref } from "@/components/site/routes"
import { getAllReviews } from "@/lib/reviews"
import { createPageMetadata } from "@/lib/site-metadata"

export const metadata: Metadata = createPageMetadata({
  title: "The Makan blog — first-hand London restaurant reviews",
  description: "First-hand restaurant reviews from the founder of Makan — what we ate, what it cost, and what to order.",
  path: "/blog",
})

const STORY = "It started with a shared story."
const NEXT = "Start with your next meal."

/** RM20773: the approved prototype's blog index (strategy/website-direction-2026-11-25/site/blog.html). English only, as before. */
export default function BlogIndexPage() {
  const reviews = getAllReviews()
  const toc = [...reviews.map(review => ({ id: review.slug, label: review.restaurant.name })), { id: slugId(STORY), label: STORY }, { id: slugId(NEXT), label: NEXT }]
  return (
    <main id="main-content" className="sx" lang="en">
      <DocPage title="Stories from the table." lede="What we ate, what it cost, and what’s worth ordering." toc={toc}>
        {reviews.map((review) => {
          const photo = review.meals.find(meal => meal.photo)
          return <article className="post" key={review.slug}>
            <p className="post-meta">{review.restaurant.locality} · <time dateTime={review.datePublished}>{new Date(review.datePublished).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time></p>
            <h2 id={review.slug}><Link href={`/blog/${review.slug}`}>{review.restaurant.name}</Link></h2>
            {photo?.photo ? <Link className="post-ph" href={`/blog/${review.slug}`} tabIndex={-1} aria-hidden data-stop="">
              <StaticPicture className="ph" basePath={photo.photo.replace('/blog/', '/static-images/v1/blog/').replace(/\.[^.]+$/, '')} widths={[480, 900, 1400]} alt="" width={2048} height={2048} sizes="(min-width: 821px) 560px, 90vw" loading="lazy" />
            </Link> : null}
            <p>{review.dek}</p>
            <Link className="tlink" href={`/blog/${review.slug}`}>Read the story →</Link>
            {review.slug === 'kendal-street-kitchen' ? <p className="small">@ridorichard</p> : null}
          </article>
        })}
        <article className="post post-cta">
          <p className="post-meta">From Makan’s founder</p>
          <h2 id={slugId(STORY)}>{STORY}</h2>
          <Link className="btn line" href={siteHref('en', '/story')}>Our story →</Link>
        </article>
        <article className="post post-cta">
          <h2 id={slugId(NEXT)}>{NEXT}</h2>
          <Link className="btn or" href={siteHref('en', '/app')}>Get Makan →</Link>
        </article>
      </DocPage>
    </main>
  )
}
