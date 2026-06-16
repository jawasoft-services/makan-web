import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Footer from "@/components/Footer"
import { ReviewArticle } from "@/components/blog/ReviewArticle"
import { ReviewSchema } from "@/components/blog/ReviewSchema"
import { getAllReviews, getReview } from "@/lib/reviews"

interface PageProps {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return getAllReviews().map((r) => ({ slug: r.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const review = getReview(slug)
  if (!review) return {}
  const url = `https://www.makanofficial.com/blog/${review.slug}`
  return {
    title: review.title,
    description: review.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: review.title,
      description: review.metaDescription,
      url,
      siteName: "Makan",
      type: "article",
      publishedTime: review.datePublished,
      modifiedTime: review.dateModified,
      authors: [review.author.name],
    },
    twitter: {
      card: "summary_large_image",
      title: review.title,
      description: review.metaDescription,
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const review = getReview(slug)
  if (!review) notFound()

  return (
    <div className="min-h-screen bg-brand-bg">
      <ReviewSchema review={review} />
      <ReviewArticle review={review} />
      <Footer />
    </div>
  )
}
