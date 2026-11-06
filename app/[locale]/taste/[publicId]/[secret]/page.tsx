import { WEBSITE_FIXTURES, fixtureTaste } from '@/lib/website-fixtures'
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getTranslations } from "next-intl/server"
import StoreLink from "@/components/home/StoreLink"
import Footer from "@/components/Footer"
import styles from "@/components/standings/public-pages.module.css"
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
  if (WEBSITE_FIXTURES && /^\/redesign\/[a-z0-9-]+\.(jpg|png|webp)$/.test(url)) return true
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
  if (WEBSITE_FIXTURES) return fixtureTaste(publicId, secret)
  try {
    const db = getDb()
    return db ? await loadTasteInvitePreview(db, publicId, secret) : { ...GONE, state: "unavailable" }
  } catch {
    // The credential is intentionally left out of logs.
    console.error("Taste invite preview failed")
    return { ...GONE, state: "unavailable" }
  }
}

const primaryClass = styles.primary
const secondaryClass = styles.secondary

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
        <Image src="/redesign/food-noodles.svg" alt="" width={150} height={140} className={styles.handoffArt} />
        <h1 className="text-3xl font-extrabold tracking-tight text-brand-ink">{t(`gone.${result.state}.title`)}</h1>
        <p className="max-w-sm text-base leading-relaxed text-brand-muted">{t(`gone.${result.state}.body`)}</p>
        <div className={styles.handoffActions}><Link href="/" className={primaryClass}>{t("goToMakan")}</Link></div>
      </Shell>
    )
  }

  const name = result.hostDisplayName
  return (
    <Shell>
      <div className={`${styles.hostAvatar} flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-brand-orange/25 bg-white text-2xl font-extrabold text-brand-ink`}>
        {canRenderRemoteImage(result.hostAvatarUrl) ? (
          <Image src={result.hostAvatarUrl} alt="" width={96} height={96} className="h-full w-full object-cover" priority />
        ) : initialsFor(name)}
      </div>
      <h1 className="max-w-md text-3xl font-extrabold leading-tight tracking-tight text-brand-ink sm:text-4xl">
        {t("title", { name })}
      </h1>

      <section aria-labelledby="top-three" className={styles.tasteTop}>
        <h2 id="top-three" className="text-xs font-bold uppercase tracking-[0.2em] text-brand-muted">{t("topThree", { name })}</h2>
        {result.meals.length === 0 ? (
          <p className="mt-3 text-base leading-relaxed text-brand-muted">{t("noMeals", { name })}</p>
        ) : (
          <ol className={styles.tastePhotos}>
            {result.meals.map((meal, index) => (
              <li key={meal.mealId}>
                <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-orange/10">
                  {canRenderRemoteImage(meal.imageURL) ? (
                    <Image src={meal.imageURL} alt="" fill sizes="(min-width: 738px) 222px, 30vw" className="object-cover" />
                  ) : null}
                  <span className="absolute bottom-1.5 left-1.5 rounded-full bg-brand-ink px-2 text-xs font-bold text-white">{index + 1}</span>
                </div>
                <p className="text-brand-ink">{meal.caption}</p>
                {meal.locationName ? <p className="text-brand-muted">{meal.locationName}</p> : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      <p className="max-w-md text-base leading-relaxed text-brand-muted">{t("explainer", { name })}</p>
      <div className={styles.handoffActions}>
      <StoreLink
        location="taste-invite"
        className={primaryClass}
      >
        {t("getApp")}
      </StoreLink>
      <a href={`makanapp://taste/${publicId}/${secret}`} className={secondaryClass}>{t("haveApp")}</a>
      </div>
      <p className={styles.handoffNote}>{t("installNote")}</p>
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.page}>
      <main id="main-content" className={styles.handoff}>{children}</main>
      <Footer />
    </div>
  )
}
