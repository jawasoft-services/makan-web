import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import StoreLink from "@/components/home/StoreLink"
import { getDb } from "@/lib/firebase-admin"
import { PUBLIC_ID_PATTERN, SECRET_PATTERN, loadTasteInvitePreview, type TasteInvitePreview } from "@/lib/taste-invite"

// RM20320 — where a taste-match link lands without the app: the sharer's public top 3 and two
// buttons. It shows only what the sharer already made public, sets nothing, and asks for nothing.
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  referrer: "no-referrer",
}

const canRenderRemoteImage = (url: string): boolean => {
  try {
    return new URL(url).hostname === "firebasestorage.googleapis.com"
  } catch {
    return false
  }
}

const initialsFor = (name: string): string =>
  name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]?.toUpperCase()).join("") || "M"

const GONE: TasteInvitePreview = { state: "invalid", hostDisplayName: "", hostAvatarUrl: "", meals: [] }

async function preview(publicId: string, secret: string): Promise<TasteInvitePreview> {
  try {
    const db = getDb()
    return db ? await loadTasteInvitePreview(db, publicId, secret) : { ...GONE, state: "unavailable" }
  } catch {
    // The credential is intentionally left out of logs.
    console.error("Taste invite preview failed")
    return { ...GONE, state: "unavailable" }
  }
}

const primaryClass = "inline-flex min-h-14 w-full max-w-sm items-center justify-center rounded-full bg-brand-orange px-8 text-base font-bold text-white transition-transform hover:-translate-y-0.5 active:translate-y-0"
const secondaryClass = "inline-flex min-h-14 w-full max-w-sm items-center justify-center rounded-full border border-brand-ink/15 bg-white px-8 text-base font-bold text-brand-ink transition-transform hover:-translate-y-0.5 active:translate-y-0"

export default async function TastePage({
  params,
}: {
  params: Promise<{ locale: string; publicId: string; secret: string }>
}) {
  const { locale, publicId, secret } = await params
  if (!PUBLIC_ID_PATTERN.test(publicId) || !SECRET_PATTERN.test(secret)) notFound()
  const t = await getTranslations({ locale, namespace: "TasteInvite" })
  const result = await preview(publicId, secret)

  if (result.state !== "active") {
    return (
      <Shell>
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-ink">{t(`gone.${result.state}.title`)}</h1>
        <p className="max-w-sm text-base leading-relaxed text-brand-muted">{t(`gone.${result.state}.body`)}</p>
        <Link href="/" className={primaryClass}>{t("goToMakan")}</Link>
      </Shell>
    )
  }

  const name = result.hostDisplayName
  return (
    <Shell>
      <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-brand-orange/25 bg-white text-2xl font-extrabold text-brand-ink">
        {canRenderRemoteImage(result.hostAvatarUrl) ? (
          <Image src={result.hostAvatarUrl} alt="" width={96} height={96} className="h-full w-full object-cover" priority />
        ) : initialsFor(name)}
      </div>
      <h1 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-brand-ink sm:text-4xl">
        {t("title", { name })}
      </h1>

      <section aria-labelledby="top-three" className="w-full max-w-md">
        <h2 id="top-three" className="text-xs font-bold uppercase tracking-[0.2em] text-brand-muted">{t("topThree", { name })}</h2>
        {result.meals.length === 0 ? (
          <p className="mt-3 text-base leading-relaxed text-brand-muted">{t("noMeals", { name })}</p>
        ) : (
          <ol className="mt-3 grid grid-cols-3 gap-2 text-left">
            {result.meals.map((meal, index) => (
              <li key={meal.mealId}>
                <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-orange/10">
                  {canRenderRemoteImage(meal.imageURL) ? (
                    <Image src={meal.imageURL} alt="" fill sizes="(min-width: 640px) 140px, 30vw" className="object-cover" />
                  ) : null}
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-brand-ink px-2 text-xs font-bold text-white">{index + 1}</span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm font-bold leading-snug text-brand-ink">{meal.caption}</p>
                {meal.locationName ? <p className="line-clamp-1 text-xs text-brand-muted">{meal.locationName}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="max-w-md text-base leading-relaxed text-brand-muted">{t("explainer", { name })}</p>
      <StoreLink
        location="taste-invite"
        className={primaryClass}
      >
        {t("getApp")}
      </StoreLink>
      <a href={`makanapp://taste/${publicId}/${secret}`} className={secondaryClass}>{t("haveApp")}</a>
      <p className="max-w-sm text-sm leading-relaxed text-brand-muted">{t("installNote")}</p>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main id="main-content" className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-brand-cream px-6 py-14 text-center">
      <Image src="/makan-logo-orange.svg" alt="Makan" width={160} height={38} className="mb-3 h-auto w-36" priority />
      {children}
    </main>
  )
}
