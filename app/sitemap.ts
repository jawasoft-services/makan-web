import type { MetadataRoute } from "next"
import { getAllReviews } from "@/lib/reviews"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.makanofficial.com"
  const reviews = getAllReviews()
  const blogLastMod = reviews[0] ? new Date(reviews[0].dateModified) : new Date()

  return [
    { url: base, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, lastModified: blogLastMod, changeFrequency: "weekly", priority: 0.8 },
    ...reviews.map((r) => ({
      url: `${base}/blog/${r.slug}`,
      lastModified: new Date(r.dateModified),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${base}/story`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/manifesto`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/tos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]
}
