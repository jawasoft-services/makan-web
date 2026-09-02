import Hero from "@/components/home/Hero"
import HeroDiptych from "@/components/home/HeroDiptych"
import EatOrYeetScene from "@/components/home/EatOrYeetScene"
import SeeTheApp from "@/components/home/SeeTheApp"
import FirstDayScene from "@/components/home/FirstDayScene"
import ForRestaurants from "@/components/home/ForRestaurants"
import FinalAsk from "@/components/home/FinalAsk"
import LatestOnMakan from "@/components/LatestOnMakan"
import FAQ from "@/components/FAQ"
import FaqSchema from "@/components/FaqSchema"
import Footer from "@/components/Footer"
import SiteSchema from "@/components/SiteSchema"
import HomepageAnalytics from "@/components/HomepageAnalytics"
import { getDecisionFaqs } from "@/lib/faq"
import { getMealCount, getPlaceStats, getRecentPublicMeals } from "@/lib/makan-stats"
import { getAppStoreRating } from "@/lib/app-store"

/** The decision-first homepage, in page order. Used by `/` (gated) and by
 *  `/dev-preview` (always). */
export default async function DecisionHome({ locale }: { locale: string }) {
  const faqs = getDecisionFaqs(locale)
  const [mealCount, liveMeals, rating, placeStats] = await Promise.all([
    getMealCount(),
    getRecentPublicMeals(),
    getAppStoreRating(),
    getPlaceStats(),
  ])
  return (
    <main id="main-content" className="overflow-x-clip pt-20">
      <SiteSchema locale={locale} />
      <HomepageAnalytics />
      <Hero mealCount={mealCount} rating={rating} />
      <HeroDiptych />
      <EatOrYeetScene />
      <SeeTheApp />
      <FirstDayScene />
      <div className="relative z-0 md:armed:-mt-[100vh]">
        <div className="md:armed:sticky md:armed:top-0 md:armed:flex md:armed:min-h-screen md:armed:flex-col md:armed:justify-center">
          <LatestOnMakan mealCount={mealCount} liveMeals={liveMeals} />
        </div>
        <div aria-hidden className="hidden md:armed:block md:armed:h-screen" />
      </div>
      <ForRestaurants stats={placeStats} />
      <FaqSchema items={faqs} />
      <FAQ items={faqs} />
      <FinalAsk />
      <Footer />
    </main>
  )
}
