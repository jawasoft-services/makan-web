import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import Footer from "@/components/Footer"
import StorySchema from "@/components/story/StorySchema"
import { getMealCount } from "@/lib/makan-stats"
import { BOILERPLATE_SHORT } from "@/lib/press"
import { createPageMetadata } from "@/lib/site-metadata"
import StoryArticle from "@/components/story/StoryArticle"

// Regenerate hourly so the live meal count stays fresh (same cadence as the homepage).
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isIndonesian = locale === "id"
  return createPageMetadata({
    title: isIndonesian
      ? "Cerita Makan: kenapa Makan dibuat"
      : "The Makan story: how and why Makan was built",
    description: isIndonesian
      ? "Dari shared story saat COVID menjadi cara memutuskan mau pesan apa. Ini cerita bagaimana dan kenapa Makan dibuat."
      : BOILERPLATE_SHORT,
    path: isIndonesian ? "/id/story" : "/story",
    type: "article",
    locale,
  })
}

export default async function StoryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const mealCount = await getMealCount()
  return (
    <>
      <StorySchema locale={locale} />
      <StoryArticle locale={locale} mealCount={mealCount} />
      <Footer />
    </>
  )
}
