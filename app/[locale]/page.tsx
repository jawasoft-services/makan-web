import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import Hero from "@/components/Hero"
import MemoryThesis from "@/components/MemoryThesis"
import HowItWorks from "@/components/HowItWorks"
import EatOrYeet from "@/components/EatOrYeet"
import ForYou from "@/components/ForYou"
import AppShowcase from "@/components/AppShowcase"
import LatestOnMakan from "@/components/LatestOnMakan"
import WhyMakan from "@/components/WhyMakan"
import FAQ from "@/components/FAQ"
import FaqSchema from "@/components/FaqSchema"
import FinalCTA from "@/components/FinalCTA"
import Footer from "@/components/Footer"
import SiteSchema from "@/components/SiteSchema"
import HomepageAnalytics from "@/components/HomepageAnalytics"
import { getFaqs } from "@/lib/faq"
import { getMealCount, getRecentPublicMeals } from "@/lib/makan-stats"
import { createPageMetadata } from "@/lib/site-metadata"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Metadata.home" })
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: locale === "id" ? "/id" : "/",
    locale,
  })
}

// Regenerate the static homepage once per hour — keeps the live meal count
// fresh enough to feel "alive" between visits, with trivial Firestore cost
// (~24 aggregation reads/day regardless of traffic).
export const revalidate = 3600

// The homepage answers the five questions a new visitor brings with them:
// is this for me → can it help → how → what do I get → why Makan.
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const faqs = getFaqs(locale)
  // Fetch each live homepage data source once, then share it between proof and
  // conversion sections. Firestore failures still fall back independently.
  const [mealCount, liveMeals] = await Promise.all([
    getMealCount(),
    getRecentPublicMeals(),
  ])

  return (
    <main id="main-content">
      <SiteSchema locale={locale} />
      <HomepageAnalytics />
      <Hero />
      <MemoryThesis />
      <HowItWorks />
      <EatOrYeet />
      <ForYou />
      <AppShowcase />
      <LatestOnMakan mealCount={mealCount} liveMeals={liveMeals} />
      <WhyMakan mealCount={mealCount} />
      <FaqSchema items={faqs} />
      <FAQ items={faqs} />
      <FinalCTA mealCount={mealCount} />
      <Footer />
    </main>
  )
}
