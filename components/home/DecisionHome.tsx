import Hero from "@/components/home/Hero"
import EatOrYeetScene from "@/components/home/EatOrYeetScene"
import SeeTheApp from "@/components/home/SeeTheApp"
import StandingsPreview from "@/components/home/StandingsPreview"
import FinalAsk from "@/components/home/FinalAsk"
import LatestOnMakan from "@/components/LatestOnMakan"
import FAQ from "@/components/FAQ"
import FaqSchema from "@/components/FaqSchema"
import Footer from "@/components/Footer"
import SiteSchema from "@/components/SiteSchema"
import HomepageAnalytics from "@/components/HomepageAnalytics"
import HashScroll from "@/components/HashScroll"
import { getDecisionFaqs } from "@/lib/faq"
import { getMealCount, getRecentPublicMeals } from "@/lib/makan-stats"
import { getAppStoreRating } from "@/lib/app-store"

/** The decision-first homepage, in page order. Used by `/` (gated) and by
 *  `/dev-preview` (always). */
export default async function DecisionHome({ locale }: { locale: string }) {
  const faqs = getDecisionFaqs(locale)
  const [mealCount, liveMeals, rating] = await Promise.all([
    getMealCount(),
    getRecentPublicMeals(),
    getAppStoreRating(),
  ])
  return (
    <main id="main-content" className="overflow-x-clip pt-20">
      <SiteSchema locale={locale} />
      <HomepageAnalytics />
      <HashScroll />
      <Hero mealCount={mealCount} rating={rating} />
      <EatOrYeetScene />
      <SeeTheApp />
      <LatestOnMakan liveMeals={liveMeals} />
      <StandingsPreview />
      <FaqSchema items={faqs} />
      <FAQ items={faqs} />
      <FinalAsk />
      <Footer />
    </main>
  )
}
