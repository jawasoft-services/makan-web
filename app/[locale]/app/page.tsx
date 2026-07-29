import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import AppLanding from "./AppLanding"
import { createPageMetadata } from "@/lib/site-metadata"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "AppPage" })
  return createPageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: locale === "id" ? "/id/app" : "/app",
    locale,
  })
}

export default function AppPage() {
  return <AppLanding />
}
