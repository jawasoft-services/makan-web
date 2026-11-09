import type { MetadataRoute } from "next"
import { getAllReviews } from "@/lib/reviews"
import { getEatStandings } from "@/lib/eat-standings"
import { getPlaceIndex } from "@/lib/place-directory"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://www.makanofficial.com"
  const [standings, places] = await Promise.all([getEatStandings(), getPlaceIndex()])
  const matchupIds = new Set(standings.all.filter((r) => r.matchups > 0).map((r) => r.placeId))
  const reviews = getAllReviews()
  const blogLastMod = reviews.length ? new Date(Math.max(...reviews.map(review => new Date(review.dateModified).getTime()))) : undefined

  const localized = (
    path: string,
    changeFrequency: "weekly" | "monthly" | "yearly",
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
    // Unknown modification dates stay absent instead of becoming the build time.
    return [
      { url: enUrl, changeFrequency, priority, alternates },
      { url: idUrl, changeFrequency, priority, alternates },
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
    ...localized("/maitre-d", "weekly", 0.8),
    ...localized("/partner", "monthly", 0.8),
    ...localized("/places", "weekly", 0.8),
    ...localized("/standings", "weekly", 0.8),
    ...standings.cities.flatMap((c) => localized(`/standings/${c.slug}`, "weekly", 0.7)),
    // Only the pages worth a result: two or more public meals, or any matchup.
    ...places.filter((p) => p.indexable || matchupIds.has(p.placeId)).flatMap((p) => localized(`/places/${p.slug}`, "weekly", 0.6)),
    ...localized("/contact", "monthly", 0.8),
    ...localized("/support", "monthly", 0.7),
    ...localized("/manifesto", "monthly", 0.6),
    ...localized("/app", "monthly", 0.8),
    ...localized("/privacy-policy", "yearly", 0.3),
    { url: `${base}/tos`, changeFrequency: "yearly", priority: 0.3 },
  ]
}
