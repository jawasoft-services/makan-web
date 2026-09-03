import en from "@/messages/en.json"
import id from "@/messages/id.json"
import { createDecisionSocialImage, createSocialImage } from "./_social-image"
import { DECISION_HOME } from "@/lib/decision-home"

export const alt = "Makan"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// The decision home shares its own card; until the gate flips, the mark.
// Messages are read straight from the locale files: image routes have no
// request locale context, so next-intl would fall back to English.
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  if (!DECISION_HOME) return createSocialImage()
  const { locale } = await params
  const meta = (locale === "id" ? id : en).Decision.Metadata
  return createDecisionSocialImage(meta.title.replace(/^Makan\s*—\s*/, ""), meta.ogSub)
}
