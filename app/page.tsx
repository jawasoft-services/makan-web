import Hero from "@/components/Hero"
import BrandStory from "@/components/BrandStory"
import Features from "@/components/Features"
import LatestOnMakan from "@/components/LatestOnMakan"
import FAQ from "@/components/FAQ"
import DownloadCTA from "@/components/DownloadCTA"
import Footer from "@/components/Footer"

export default function Home() {
  return (
    <main>
      <Hero />
      <Features />
      <LatestOnMakan />
      <BrandStory />
      <FAQ />
      <DownloadCTA />
      <Footer />
    </main>
  )
}
