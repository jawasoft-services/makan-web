import Image from 'next/image'
import Link from 'next/link'
import styles from '@/components/share/share-pages.module.css'

export type DishRow = { name: string; photo: { mealId: string; src: string } | null }

/**
 * RM20616 dish pages U3 — "What to order here" and "Dishes rated here" on the Share v2 restaurant page, shown only with
 * DISH_PAGES on. Boards dp-answer-a, dp-maitred-a and dp-thin-a (Devon, 27 Nov 2026: "A, soft orange tint"): the
 * app's own answer surface (accentTint #FFE9D4, text #1F1A14), sizes from components/restaurant/DishMaitredCard.tsx.
 * Rows have no lines between them and are 64 pt tall (his 19 Nov list rule).
 *
 * Names only, as the app's server wrote them and never translated. Nobody is named: the Maître d' is the page's own
 * "A regular" line. No rank, count, price or star. A row's photo is a meal the page already shows in "What people
 * ate" (the same file, Devon's "Let it repeat"), linking to that meal's own page.
 */
export default function DishSection({ answer, thin, rows, prefix, labels }: {
  answer: { name: string; maitred: boolean } | null
  /** No answer yet, with meals on the page: the not-enough line. */
  thin: boolean
  rows: DishRow[]
  /** '' for English, '/id' for Bahasa. */
  prefix: string
  labels: { whatToOrder: string; maitredLine: string; notEnough: string; dishesRatedHere: string; mealAlt: string }
}) {
  if (!answer && !thin) return null
  return <>
    <section className={styles.answer} aria-labelledby="what-to-order">
      <h2 id="what-to-order" className={styles.answerLabel}>{labels.whatToOrder}</h2>
      {answer ? <p className={styles.answerDish}>{answer.name}</p> : <p className={styles.answerThin}>{labels.notEnough}</p>}
      {answer?.maitred && labels.maitredLine ? <p className={styles.answerBy}>
        <svg className={styles.answerCrown} viewBox="0 0 35 27" width="18" height="14" aria-hidden="true"><path d="M4 7 L11 12 L17 3 L23 12 L31 6 L28 21 Q17 24 7 21 Z" fill="#FF9932" stroke="#FF9932" strokeWidth="2" strokeLinejoin="round" /></svg>
        {labels.maitredLine}
      </p> : null}
    </section>
    {answer && rows.length ? <section aria-labelledby="dishes-rated-here">
      <h2 id="dishes-rated-here" className={styles.heading}>{labels.dishesRatedHere}</h2>
      <ul className={styles.dishes}>
        {rows.map((row) => <li key={row.name} className={styles.dishRow}>
          <span className={styles.dishName}>{row.name}</span>
          {row.photo ? <Link href={`${prefix}/meal/${row.photo.mealId}`} prefetch={false} className={styles.dishPhoto}>
            <Image src={row.photo.src} alt={labels.mealAlt} width={56} height={56} loading="lazy" />
          </Link> : null}
        </li>)}
      </ul>
    </section> : null}
  </>
}
