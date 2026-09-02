import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import Hero from "@/components/home/Hero"
import HeroDiptych from "@/components/home/HeroDiptych"
import EatOrYeetScene from "@/components/home/EatOrYeetScene"
import SeeTheApp from "@/components/home/SeeTheApp"
import FirstDayScene from "@/components/home/FirstDayScene"
import WontDo from "@/components/home/WontDo"
import FinalAsk from "@/components/home/FinalAsk"
import ForRestaurants from "@/components/home/ForRestaurants"
import LatestOnMakan from "@/components/LatestOnMakan"
import FAQ from "@/components/FAQ"
import FaqSchema from "@/components/FaqSchema"
import Footer from "@/components/Footer"
import { getDecisionFaqs } from "@/lib/faq"
import { getMealCount, getRecentPublicMeals } from "@/lib/makan-stats"

/**
 * Dev-only harness for the deploy-gated decision-first homepage, mounted in
 * page order: the ask → the menu that gets answered → the proof, full width → your first day → what
 * Makan won't do → live proof → the Maitre'D for restaurants → a short FAQ → the closing ask → footer.
 */
export default async function DevPreview({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  if (process.env.NODE_ENV === "production") notFound()
  const { locale } = await params
  setRequestLocale(locale)
  const faqs = getDecisionFaqs(locale)
  const [mealCount, liveMeals] = await Promise.all([getMealCount(), getRecentPublicMeals()])
  return (
    <main id="main-content" className="pt-20">
      <Hero />
      <HeroDiptych />
      <EatOrYeetScene />
      <SeeTheApp />
      <FirstDayScene />
      {/* Curtain: these two sections already sit under the last spread and
          are revealed as it lifts away. The block is pulled up one viewport
          behind the pinned spread, pinned itself while the spread scrolls
          off, then released; the spacer gives the pin its travel. Only once
          scenes are armed — in flow, nothing is ever covered. */}
      <div className="relative z-0 md:armed:-mt-[100vh]">
        <div className="md:armed:sticky md:armed:top-0">
          <WontDo />
          <LatestOnMakan mealCount={mealCount} liveMeals={liveMeals} />
        </div>
        <div aria-hidden className="hidden md:armed:block md:armed:h-screen" />
      </div>
      <ForRestaurants />
      <FaqSchema items={faqs} />
      <FAQ items={faqs} />
      <FinalAsk />
      <Footer />
    </main>
  )
}
