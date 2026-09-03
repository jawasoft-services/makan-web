import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import AppLanding from "./AppLanding"
import { createPageMetadata } from "@/lib/site-metadata"
import SiteSchema from "@/components/SiteSchema"
import { DECISION_HOME } from "@/lib/decision-home"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "AppPage" })
  return createPageMetadata({
    title: t("metaTitle"),
    // The store page says what the home page says once the gate is on.
    description:
      DECISION_HOME
        ? (await getTranslations({ locale, namespace: "Decision.Metadata" }))("description")
        : t("metaDescription"),
    path: locale === "id" ? "/id/app" : "/app",
    locale,
  })
}

export default async function AppPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return (
    <>
      <SiteSchema locale={locale} />
      <AppLanding />
    </>
  )
}
