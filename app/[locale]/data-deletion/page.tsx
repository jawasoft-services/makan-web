import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import DeletionRequestPage from "@/components/DeletionRequestPage"
import { createPageMetadata } from "@/lib/site-metadata"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "DataDeletion" })

  return createPageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: locale === "id" ? "/id/data-deletion" : "/data-deletion",
    type: "article",
    locale,
  })
}

export default async function DataDeletionPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <DeletionRequestPage
      locale={locale}
      namespace="DataDeletion"
      otherPath="/account-deletion"
    />
  )
}
