import en from "@/messages/en.json"
import id from "@/messages/id.json"
import { createDecisionSocialImage } from "../../_social-image"
import { getPlaceStanding } from "@/lib/eat-standings"

export const alt = "On Makan"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// The card an owner posts: the name, the rank, the Eats.
export default async function Image({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  const t = (locale === "id" ? id : en).Places
  const found = await getPlaceStanding(slug)
  if (!found) return createDecisionSocialImage("Makan", t.somewhere, 108)
  const { row, standings } = found
  const city = row.where ? standings.cities.find((c) => c.city === row.where?.city) : undefined
  const fill = (s: string, v: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""))
  const line =
    row.cityRank !== null && city
      ? fill(t.rankCity, { rank: row.cityRank, city: city.city })
      : row.rank !== null
        ? fill(t.rankGlobal, { rank: row.rank })
        : fill(t.cardUnranked, { matchups: row.matchups })
  const eats = row.rank !== null ? ` · ${row.eats} ${t.eats}` : ""
  // The city rides in the rank line when there is one; otherwise it is the only place cue.
  const where = row.where && !(row.cityRank !== null && city) ? ` · ${row.where.city}` : ""
  const size = row.name.length > 24 ? 64 : row.name.length > 14 ? 84 : 108
  return createDecisionSocialImage(row.name, `${line}${eats}${where}`, size)
}
