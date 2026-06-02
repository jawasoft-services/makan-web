import Hero from "@/components/Hero"
import MemoryTest from "@/components/MemoryTest"
import Manifesto from "@/components/Manifesto"
import FeatureTabs from "@/components/FeatureTabs"
import Refusals from "@/components/Refusals"
import LatestOnMakanSection from "@/components/LatestOnMakanSection"
import FounderStory from "@/components/FounderStory"
import B2BTeaser from "@/components/B2BTeaser"
import FinalCTA from "@/components/FinalCTA"
import Footer from "@/components/Footer"

// Regenerate the static homepage once per hour — keeps the live meal count
// fresh enough to feel "alive" between visits, with trivial Firestore cost
// (~24 aggregation reads/day regardless of traffic).
export const revalidate = 3600

// The homepage is a single emotional argument that ends in a download.
// Eight movements: hook (loss) → ache → turn (relief) → how it feels →
// what we refuse → proof → origin → convert. Loss-framing lives only in the
// hero/ache (cold acquisition); everything downstream is gain-coded.
export default function Home() {
  return (
    <main id="main-content">
      <Hero />
      <MemoryTest />
      <Manifesto />
      <FeatureTabs />
      <Refusals />
      <LatestOnMakanSection />
      <FounderStory />
      <B2BTeaser />
      <FinalCTA />
      <Footer />
    </main>
  )
}
