import "server-only"
import { APP_STORE_URL } from "@/lib/links"

/** The public App Store listing's rating on one storefront. Null when the
 *  storefront has no ratings yet, or the lookup fails — the page must never
 *  break on this. Revalidated daily; the number moves slowly. */
export async function getAppStoreRating(country = "gb"): Promise<{ rating: number; count: number } | null> {
  const id = APP_STORE_URL.match(/id(\d+)/)?.[1]
  if (!id) return null
  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${id}&country=${country}`, { next: { revalidate: 86400 } })
    if (!res.ok) return null
    const data = (await res.json()) as { results?: Array<{ averageUserRating?: number; userRatingCount?: number }> }
    const r = data.results?.[0]
    if (!r || !r.userRatingCount || !r.averageUserRating) return null
    return { rating: Math.round(r.averageUserRating * 10) / 10, count: r.userRatingCount }
  } catch {
    return null
  }
}
