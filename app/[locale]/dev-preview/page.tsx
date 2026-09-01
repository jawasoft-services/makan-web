import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import HeroDiptych from "@/components/home/HeroDiptych"
import EvidenceLadder from "@/components/home/EvidenceLadder"

/**
 * Dev-only harness for the deploy-gated decision-first components.
 * Tasks 7 and 8 mount their sections here as they land.
 */
export default async function DevPreview({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  if (process.env.NODE_ENV === "production") notFound()
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <main className="pt-20">
      <HeroDiptych />
      <EvidenceLadder />
    </main>
  )
}
