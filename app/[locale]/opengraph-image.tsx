import { getTranslations } from "next-intl/server"
import { createDecisionSocialImage, createSocialImage } from "./_social-image"

export const alt = "Makan"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

// The decision home shares its own card; until the gate flips, the mark.
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  if (process.env.DECISION_HOME !== "1") return createSocialImage()
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Decision.Metadata" })
  return createDecisionSocialImage(t("title").replace(/^Makan\s*—\s*/, ""), t("ogSub"))
}
