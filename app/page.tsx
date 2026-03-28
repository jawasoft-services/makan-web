import Hero from "@/components/Hero"
import Manifesto from "@/components/Manifesto"
import FeatureTabs from "@/components/FeatureTabs"
import LatestOnMakan from "@/components/LatestOnMakan"
import BrandPillars from "@/components/BrandPillars"
import FAQ from "@/components/FAQ"
import B2BTeaser from "@/components/B2BTeaser"
import FinalCTA from "@/components/FinalCTA"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <main id="main-content">
      <Hero />
      <Manifesto />
      <FeatureTabs />
      <LatestOnMakan />
      <BrandPillars />
      <FAQ />
      <B2BTeaser />
      <FinalCTA />
      <Footer />
    </main>
  )
}
