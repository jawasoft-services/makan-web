import type { Metadata } from "next"
import Hero from "@/components/Hero"
import MemoryTest from "@/components/MemoryTest"
import Manifesto from "@/components/Manifesto"
import AppShowcase from "@/components/AppShowcase"
import LatestOnMakan from "@/components/LatestOnMakan"
import FounderStory from "@/components/FounderStory"
import B2BTeaser from "@/components/B2BTeaser"
import FAQ from "@/components/FAQ"
import FaqSchema from "@/components/FaqSchema"
import FinalCTA from "@/components/FinalCTA"
import Footer from "@/components/Footer"
import SiteSchema from "@/components/SiteSchema"
import { FAQS } from "@/lib/faq"
import { getMealCount, getRecentPublicMeals } from "@/lib/makan-stats"
import { createPageMetadata } from "@/lib/site-metadata"

const DESCRIPTION =
  "A food journal where your friends' real meals replace algorithms and influencers."

export const metadata: Metadata = createPageMetadata({
  title: "Makan — Remember every meal",
  description: DESCRIPTION,
})

// Regenerate the static homepage once per hour — keeps the live meal count
// fresh enough to feel "alive" between visits, with trivial Firestore cost
// (~24 aggregation reads/day regardless of traffic).
export const revalidate = 3600

// The homepage is a single emotional argument that ends in a download.
// Eight movements: hook (loss) → ache → turn (relief) → how it feels →
// what we refuse → proof → origin → convert. Loss-framing lives only in the
// hero/ache (cold acquisition); everything downstream is gain-coded.
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
      <Hero mealCount={mealCount} />
      <MemoryTest />
      <Manifesto />
      <AppShowcase />
      <LatestOnMakan mealCount={mealCount} liveMeals={liveMeals} />
      <FounderStory />
      <B2BTeaser />
      <FaqSchema items={FAQS} />
      <FAQ />
      <FinalCTA mealCount={mealCount} />
      <Footer />
    </main>
  )
}
