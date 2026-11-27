import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import AgrHome from "@/components/agr/AgrHome"
import { getAgrHomeData } from "@/lib/agr-home-data"
import Hero from "@/components/Hero"
import MemoryThesis from "@/components/MemoryThesis"
import HowItWorks from "@/components/HowItWorks"
import EatOrYeet from "@/components/EatOrYeet"
import ForYou from "@/components/ForYou"
import AppShowcase from "@/components/AppShowcase"
import LatestOnMakan from "@/components/LatestOnMakan"
import WhyMakan from "@/components/WhyMakan"
import FAQ from "@/components/FAQ"
import FaqSchema from "@/components/FaqSchema"
import FinalCTA from "@/components/FinalCTA"
import Footer from "@/components/Footer"
import SiteSchema from "@/components/SiteSchema"
import HomepageAnalytics from "@/components/HomepageAnalytics"
import HashScroll from "@/components/HashScroll"
import { getFaqs } from "@/lib/faq"
import { getMealCount, getRecentPublicMeals } from "@/lib/makan-stats"
import { createPageMetadata } from "@/lib/site-metadata"

// Deploy-time gate: DecisionHome ships on the real route only once this is
// set. Off, `/` keeps the legacy composition below and its own metadata.
import { DECISION_HOME } from "@/lib/decision-home"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: DECISION_HOME ? "Decision.Metadata" : "Metadata.home" })
  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    path: locale === "id" ? "/id" : "/",
    locale,
  })
}

// Rendered per request so Maître d' data respects its 5-minute expiry (lib/maitred).
// Every reader behind the home is cached (lib/agr-home-data), so a visit costs no
// Firestore read beyond the hourly refreshes.
export const dynamic = 'force-dynamic'

// The homepage answers the five questions a new visitor brings with them:
// is this for me → can it help → how → what do I get → why Makan.
export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  if (DECISION_HOME) {
    return (
      <>
        <SiteSchema locale={locale} />
        <HomepageAnalytics />
        <HashScroll />
        <AgrHome data={await getAgrHomeData(locale)} />
      </>
    )
  }
  const faqs = getFaqs(locale)
  // Fetch each live homepage data source once, then share it between proof and
  // conversion sections. Firestore failures still fall back independently.
  const [mealCount, liveMeals] = await Promise.all([
    getMealCount(),
    getRecentPublicMeals(),
  ])

  return (
    <main id="main-content">
      <SiteSchema locale={locale} />
      <HomepageAnalytics />
      <HashScroll />
      <Hero />
      <MemoryThesis />
      <HowItWorks />
      <EatOrYeet />
      <ForYou />
      <AppShowcase />
      <LatestOnMakan liveMeals={liveMeals} />
      <WhyMakan mealCount={mealCount} />
      <FaqSchema items={faqs} />
      <FAQ items={faqs} />
      <FinalCTA mealCount={mealCount} />
      <Footer />
    </main>
  )
}
