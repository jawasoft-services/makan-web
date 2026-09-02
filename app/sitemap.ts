import type { MetadataRoute } from "next"
import { getAllReviews } from "@/lib/reviews"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.makanofficial.com"
  const reviews = getAllReviews()
  const blogLastMod = reviews[0] ? new Date(reviews[0].dateModified) : new Date()

  const localized = (
    path: string,
    changeFrequency: "weekly" | "monthly",
    priority: number,
  ) => {
    const enUrl = `${base}${path}`
    const idUrl = `${base}/id${path}`
    const alternates = {
      languages: {
        en: enUrl,
        id: idUrl,
        "x-default": enUrl,
      },
    }
    return [
      { url: enUrl, lastModified: new Date(), changeFrequency, priority, alternates },
      { url: idUrl, lastModified: new Date(), changeFrequency, priority, alternates },
    ]
  }

  return [
    ...localized("", "weekly", 1),
    { url: `${base}/blog`, lastModified: blogLastMod, changeFrequency: "weekly", priority: 0.8 },
    ...reviews.map((r) => ({
      url: `${base}/blog/${r.slug}`,
      lastModified: new Date(r.dateModified),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...localized("/story", "monthly", 0.9),
    ...localized("/partner", "monthly", 0.8),
    ...localized("/standings", "weekly", 0.8),
    ...localized("/contact", "monthly", 0.8),
    ...localized("/support", "monthly", 0.7),
    ...localized("/manifesto", "monthly", 0.6),
    ...localized("/app", "monthly", 0.8),
    { url: `${base}/privacy-policy`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/tos`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]
}
