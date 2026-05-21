import Hero from "@/components/Hero"
import Manifesto from "@/components/Manifesto"
import FeatureTabs from "@/components/FeatureTabs"
import LatestOnMakanSection from "@/components/LatestOnMakanSection"
import BrandPillars from "@/components/BrandPillars"
import FAQ from "@/components/FAQ"
import B2BTeaser from "@/components/B2BTeaser"
import FinalCTA from "@/components/FinalCTA"
import Footer from "@/components/Footer"

// Regenerate the static homepage once per day — refreshes the live stats
// without hammering Firestore on every visit.
export const revalidate = 86400

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
