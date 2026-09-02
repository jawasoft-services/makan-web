import en from "@/messages/en.json"
import id from "@/messages/id.json"
import { createDecisionSocialImage } from "../_social-image"
import { getEatStandings } from "@/lib/eat-standings"

export const alt = "Eat or Yeet standings"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// The card names the leaders, so a share of the standings is a share of the
// restaurants on it. Messages are read from the locale files: image routes
// have no request locale context.
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = (locale === "id" ? id : en).Standings
  const standings = await getEatStandings()
  const short = (name: string) => (name.length > 26 ? `${name.slice(0, 25).trimEnd()}…` : name)
  const top = standings.rows.slice(0, 3).map((r, i) => `${i + 1}. ${short(r.name)}${r.where ? `, ${r.where.city}` : ""}`)
  const sub = top.length ? `${t.eyebrow} · ${top.join(" · ")}` : t.metaDescription
  // The game's name is the searchable phrase; the leaders are the share.
  return createDecisionSocialImage("Eat or Yeet", sub)
}
