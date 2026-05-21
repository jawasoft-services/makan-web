import Hero from "@/components/Hero"
import Manifesto from "@/components/Manifesto"
import FeatureTabs from "@/components/FeatureTabs"
import LatestOnMakanSection from "@/components/LatestOnMakanSection"
import BrandPillars from "@/components/BrandPillars"
import FAQ from "@/components/FAQ"
import B2BTeaser from "@/components/B2BTeaser"
import FinalCTA from "@/components/FinalCTA"
import Footer from "@/components/Footer"

// Regenerate the static homepage once per hour — keeps the live meal count
// fresh enough to feel "alive" between visits, with trivial Firestore cost
// (~24 aggregation reads/day regardless of traffic).
export const revalidate = 3600

export default function Home() {
  return (
    <main id="main-content">
      <Hero />
      <Manifesto />
      <FeatureTabs />
      <LatestOnMakanSection />
      <BrandPillars />
      <FAQ />
      <B2BTeaser />
      <FinalCTA />
      <Footer />
    </main>
  )
}
