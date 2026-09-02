import en from "@/messages/en.json"
import id from "@/messages/id.json"
import { createDecisionSocialImage } from "../../_social-image"
import { getCityStanding } from "@/lib/eat-standings"

export const alt = "Eat or Yeet standings"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ locale: string; city: string }> }) {
  const { locale, city: slug } = await params
  const t = (locale === "id" ? id : en).Standings
  const found = await getCityStanding(slug)
  const short = (name: string) => (name.length > 26 ? `${name.slice(0, 25).trimEnd()}…` : name)
  const top = found ? found.city.rows.slice(0, 3).map((r, i) => `${i + 1}. ${short(r.name)}`) : []
  const title = found ? found.city.city : t.eyebrow
  const sub = top.length ? `${t.eyebrow} · ${top.join(" · ")}` : t.metaDescription
  return createDecisionSocialImage(title, sub, title.length > 14 ? 80 : 108)
}
