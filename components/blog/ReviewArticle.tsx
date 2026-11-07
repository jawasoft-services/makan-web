import PlayfulArrow from '@/components/PlayfulArrow'
import StoreLink from "@/components/home/StoreLink"
import Link from "next/link"
import type { ReactNode } from "react"
import type { Block, Review } from "@/lib/reviews/types"
import StaticPicture from "@/components/StaticPicture"
import { MealGallery } from "./MealGallery"
import styles from "@/components/story/editorial.module.css"

// Minimal inline renderer: supports [text](url) links and **bold** inside body strings.
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1] !== undefined && m[2] !== undefined) {
      out.push(
        <Link
          key={key++}
          href={m[2]}
          className="text-brand-ink font-semibold"
        >
          {m[1]}
        </Link>,
      )
    } else if (m[3] !== undefined) {
      out.push(
        <strong key={key++} className="font-semibold text-brand-ink">
          {m[3]}
        </strong>,
      )
    }
    last = re.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

function QuickFacts({ review }: { review: Review }) {
  return <dl className={styles.facts}>{review.quickFacts.map(fact => <div key={fact.label} className={styles.fact}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}</dl>
}

function BillTable({ review }: { review: Review }) {
  const { bill } = review
  return (
    <div className={styles.bill}>
      <p className={styles.kicker}>The receipt</p>
      <table>
        <caption>Itemised bill for {bill.covers} at {review.restaurant.name} · <time dateTime={review.visitDate}>{new Date(review.visitDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</time></caption>
        <tbody>
          {bill.lines.map(line => <tr key={line.item}><th scope="row">{line.item}</th><td>{line.price}</td></tr>)}
          <tr><th scope="row">Subtotal</th><td>{bill.subtotal}</td></tr>
          <tr><th scope="row">{bill.serviceLabel}</th><td>{bill.service}</td></tr>
        </tbody>
        <tfoot><tr><th scope="row">Total</th><td>{bill.total}</td></tr></tfoot>
      </table>
      <p>{bill.covers} covers · {bill.perHead} per person · prices from this visit</p>
    </div>
  )
}

function Faq({ review }: { review: Review }) {
  return (
    <section className={styles.faq} aria-labelledby="review-faq">
      <h2 id="review-faq">{review.restaurant.name}: quick questions</h2>
      {review.faq.map(faq => <details name="review-faq" key={faq.q}><summary className="playful-disclosure">{faq.q}<PlayfulArrow direction="down" /></summary><p>{faq.a}</p></details>)}
    </section>
  )
}

function Cta() {
  return (
    <section className={styles.cta}>
      <h2>Remember your own meals</h2>
      <p>Makan is a food journal for the meals that matter — free on iPhone and Android.</p>
      <StoreLink location="review" className={styles.button}>Download on the App Store</StoreLink>
    </section>
  )
}

function BlockView({ block, review, index }: { block: Block; review: Review; index: number }) {
  switch (block.kind) {
    case "lead": return <p className={styles.lead}>{renderInline(block.text)}</p>
    case "p": return <p>{renderInline(block.text)}</p>
    case "h2": return <h2 id={`section-${index}`}>{block.text}</h2>
    case "ul": return <ul>{block.items.map((item, i) => <li key={i}>{renderInline(item)}</li>)}</ul>
    case "note": return <p className={styles.note}>{renderInline(block.text)}</p>
    case "quickFacts": return <QuickFacts review={review} />
    case "bill": return <BillTable review={review} />
    case "meals": return <MealGallery meals={review.meals} venue={review.restaurant.name} credit={review.slug === 'kendal-street-kitchen' ? '@ridorichard' : undefined} />
    case "faq": return <Faq review={review} />
    case "cta": return <Cta />
  }
}

export function ReviewArticle({ review }: { review: Review }) {
  const photo = review.meals.find(meal => meal.photo)
  const formatDate = (value: string) => new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  return (
    <main id="main-content" className={styles.page} lang="en">
      <header className={`${styles.hero} ${styles.articleHero}`}>
        <Link className={styles.back} href="/blog"><PlayfulArrow direction="left" /> Food stories</Link>
        <p className={styles.kicker}>{review.restaurant.locality} · First-hand review</p>
        <h1>{review.h1}</h1>
        <p className={styles.dek}>{review.dek}</p>
        <p className={styles.byline}>By <Link href={review.author.url}>{review.author.name}</Link>, {review.author.role}<span>Published <time dateTime={review.datePublished}>{formatDate(review.datePublished)}</time> · Visited <time dateTime={review.visitDate}>{formatDate(review.visitDate)}</time></span></p>
      </header>
      {photo?.photo ? (
        <figure className={`${styles.widePhoto} ${styles.articlePhoto}`}>
          <StaticPicture basePath={photo.photo.replace('/blog/', '/static-images/v1/blog/').replace(/\.[^.]+$/, '')} widths={[480, 900, 1400]} alt={photo.alt} width={2048} height={2048} sizes="(min-width: 1300px) 1200px, 90vw" />
          <figcaption>{photo.caption} · {review.restaurant.name}{review.slug === 'kendal-street-kitchen' ? ' · @ridorichard' : ''}</figcaption>
        </figure>
      ) : null}
      <div className={styles.readingLayout}>
        <aside className={styles.toc}>
          <p>In this review</p>
          <nav aria-label="Review sections">{review.blocks.map((block, i) => block.kind === 'h2' ? <a key={i} href={`#section-${i}`}>{block.text}</a> : null)}</nav>
          {review.slug === 'kendal-street-kitchen' ? <Link className={styles.textLink} href="/places/kendal-street-kitchen-f7d46b">Kendal Street Kitchen on Makan <PlayfulArrow /></Link> : null}
        </aside>
        <article className={`${styles.prose} ${styles.reviewProse}`}>
          {review.blocks.map((block, index) => <BlockView key={index} block={block} review={review} index={index} />)}
        </article>
      </div>
    </main>
  )
}
