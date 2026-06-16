import type { Metadata } from "next"
import Link from "next/link"
import Footer from "@/components/Footer"
import { getAllReviews } from "@/lib/reviews"

export const metadata: Metadata = {
  title: "The Makan blog — first-hand London restaurant reviews",
  description:
    "First-hand restaurant reviews from the founder of Makan — what we ate, what it cost, and what to order.",
  alternates: { canonical: "https://www.makanofficial.com/blog" },
}

export default function BlogIndexPage() {
  const reviews = getAllReviews()

  return (
    <div className="min-h-screen bg-brand-bg">
      <main id="main-content" className="mx-auto max-w-2xl px-5 pt-28 pb-16 sm:px-8">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-brand-orange">The Makan blog</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Where we&apos;ve been eating</h1>
        <p className="mt-4 text-lg text-brand-muted">
          First-hand reviews of the restaurants we log on Makan — the food, the real bill, and what to order.
        </p>

        <ul className="mt-10 space-y-4">
          {reviews.map((r) => (
            <li key={r.slug}>
              <Link
                href={`/blog/${r.slug}`}
                className="group block rounded-2xl border border-brand-border bg-brand-surface p-5 transition-colors hover:border-brand-orange/50"
              >
                <p className="text-xs uppercase tracking-wide text-brand-dim">
                  {new Date(r.datePublished).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <h2 className="mt-1 text-xl font-bold text-white transition-colors group-hover:text-brand-orange">
                  {r.restaurant.name}
                </h2>
                <p className="mt-1.5 text-sm text-brand-muted">{r.dek}</p>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </div>
  )
}
