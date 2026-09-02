import en from "@/messages/en.json"
import id from "@/messages/id.json"
import { createDecisionSocialImage } from "../_social-image"

export const alt = "Makan for restaurants"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = (locale === "id" ? id : en).Partner
  return createDecisionSocialImage(t.heroEyebrow, t.eatsTitle)
}
