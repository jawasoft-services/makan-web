import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import AgrHome from "@/components/agr/AgrHome"
import { getAgrHomeData } from "@/lib/agr-home-data"

/**
 * Dev-only harness for the home page (RM20773), used by `npm run audit:home`.
 */
export default async function DevPreview({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  if (process.env.NODE_ENV === "production") notFound()
  const { locale } = await params
  setRequestLocale(locale)
  return <AgrHome data={await getAgrHomeData(locale)} />
}
