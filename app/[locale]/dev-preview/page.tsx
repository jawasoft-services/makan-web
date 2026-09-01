import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import PaperSheet from "@/components/paper/PaperSheet"
import HeroDiptych from "@/components/home/HeroDiptych"

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
    <main>
      <HeroDiptych />
      <PaperSheet fold className="min-h-[50vh]">
        <p className="p-10 text-brand-muted">paper harness</p>
      </PaperSheet>
    </main>
  )
}
