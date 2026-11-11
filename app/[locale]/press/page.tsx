import type { Metadata } from "next"
import { setRequestLocale } from "next-intl/server"
import Footer from "@/components/Footer"
import PressPage from "@/components/press/PressPage"
import PressSchema from "@/components/press/PressSchema"
import { getMealCount } from "@/lib/makan-stats"
import { createPageMetadata } from "@/lib/site-metadata"

// Regenerate hourly so the live meal count stays fresh (same cadence as /story and the homepage).
export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const isIndonesian = locale === "id"
  return createPageMetadata({
    title: isIndonesian ? "Media — Makan" : "Press — Makan",
    description: isIndonesian
      ? "Fakta, profil pendiri, kutipan, dan materi unduhan untuk menulis tentang Makan, aplikasi gratis untuk memutuskan mau pesan apa."
      : "Facts, founder bios, quotes and downloads for writing about Makan, the free app for deciding what to order.",
    path: isIndonesian ? "/id/press" : "/press",
    locale,
  })
}

export default async function PressRoute({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const mealCount = await getMealCount()

  return (
    <div className="min-h-screen bg-brand-cream">
      <PressSchema locale={locale} />
      <PressPage locale={locale} mealCount={mealCount} />
      <Footer />
    </div>
  )
}
