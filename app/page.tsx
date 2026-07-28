import type { Metadata } from "next"
import Hero from "@/components/Hero"
import MemoryThesis from "@/components/MemoryThesis"
import HowItWorks from "@/components/HowItWorks"
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
import { FAQS } from "@/lib/faq"
import { getMealCount, getRecentPublicMeals } from "@/lib/makan-stats"
import { createPageMetadata } from "@/lib/site-metadata"

const DESCRIPTION =
  "Makan is the food diary you keep with friends. Save what you ate, where you ate it and who was there — free on iPhone."

export const metadata: Metadata = createPageMetadata({
  title: "Makan — Remember every meal",
  description: DESCRIPTION,
})

// Regenerate the static homepage once per hour — keeps the live meal count
// fresh enough to feel "alive" between visits, with trivial Firestore cost
// (~24 aggregation reads/day regardless of traffic).
export const revalidate = 3600

// The homepage answers the five questions a new visitor brings with them:
// is this for me → can it help → how → what do I get → why Makan.
export default async function Home() {
  // Fetch each live homepage data source once, then share it between proof and
  // conversion sections. Firestore failures still fall back independently.
  const [mealCount, liveMeals] = await Promise.all([
    getMealCount(),
    getRecentPublicMeals(),
  ])

  return (
    <main id="main-content">
      <SiteSchema />
      <HomepageAnalytics />
      <Hero />
      <MemoryThesis />
      <HowItWorks />
      <ForYou />
      <AppShowcase />
      <LatestOnMakan mealCount={mealCount} liveMeals={liveMeals} />
      <WhyMakan mealCount={mealCount} />
      <FaqSchema items={FAQS} />
      <FAQ />
      <FinalCTA mealCount={mealCount} />
      <Footer />
    </main>
  )
}
