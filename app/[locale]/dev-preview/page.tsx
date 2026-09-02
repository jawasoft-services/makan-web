import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import DecisionHome from "@/components/home/DecisionHome"

/**
 * Dev-only harness for the deploy-gated decision-first homepage.
 */
export default async function DevPreview({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  if (process.env.NODE_ENV === "production") notFound()
  const { locale } = await params
  setRequestLocale(locale)
  return <DecisionHome locale={locale} />
}
