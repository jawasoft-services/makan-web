import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import Hero from "@/components/home/Hero"
import HeroDiptych from "@/components/home/HeroDiptych"
import EatOrYeetScene from "@/components/home/EatOrYeetScene"
import FirstDayScene from "@/components/home/FirstDayScene"
import WontDo from "@/components/home/WontDo"
import FinalAsk from "@/components/home/FinalAsk"
import LatestOnMakan from "@/components/LatestOnMakan"
import FAQ from "@/components/FAQ"
import FaqSchema from "@/components/FaqSchema"
import Footer from "@/components/Footer"
import { getDecisionFaqs } from "@/lib/faq"
import { getMealCount, getRecentPublicMeals } from "@/lib/makan-stats"

/**
 * Dev-only harness for the deploy-gated decision-first homepage, mounted in
 * page order: the ask → the menu that gets answered → the proof, full width → your first day → what
 * Makan won't do → live proof → a short FAQ → the closing ask → footer.
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
      <FirstDayScene />
      <WontDo />
      <LatestOnMakan mealCount={mealCount} liveMeals={liveMeals} />
      <FaqSchema items={faqs} />
      <FAQ items={faqs} />
      <FinalAsk />
      <Footer />
    </main>
  )
}
