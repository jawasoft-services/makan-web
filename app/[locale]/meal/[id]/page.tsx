import { WEBSITE_FIXTURES, fixtureMeal } from '@/lib/website-fixtures'
import { redirect } from "next/navigation"
import { Metadata } from "next"
import { cache } from "react"
import { getDb } from "@/lib/firebase-admin"
import Image from "next/image"
import Footer from "@/components/Footer"
import StoreLink from "@/components/home/StoreLink"
import styles from "@/components/standings/public-pages.module.css"
import Link from "next/link"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { getDirectoryPlaceById } from "@/lib/place-directory"
import { localizePath } from "@/i18n/paths"
import { isPublicMeal } from "@/lib/public-meal"

// Visibility can change after a link is shared. Check it on every request;
// React's request cache shares the one meal read between metadata and the page.
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string; locale: string }>
}

interface MealData {
  id: string
  mealType?: string
  caption?: string
  imageURL?: string
  shareCardUrl?: string
  locationName?: string
  userID?: string
  uid?: string
  userName?: string
  username?: string
  isPublic?: boolean | null
  placeProviderId?: string
}

const getMeal = cache(async (id: string): Promise<MealData | null> => {
  try {
    const db = WEBSITE_FIXTURES ? null : getDb()
    let meal: MealData | null
    if (WEBSITE_FIXTURES) {
      meal = fixtureMeal(id)
    } else {
      if (!db) return null
      const doc = await db.collection("meals").doc(id).get()
      if (!doc.exists) return null
      meal = { id: doc.id, ...doc.data() } as MealData
    }
    if (!meal) return null
    // Match the public meal gate used by taste invites. A public flag can remain
    // on a draft, deleted or moderated record; none may reach the page or metadata.
    if (!isPublicMeal(meal)) return null
    const chosenHandle = (value: unknown): string => {
      const handle = typeof value === "string" ? value.trim() : ""
      return handle && !/^user_/i.test(handle) ? handle : ""
    }
    let username = ""
    const uid = meal.userID || meal.uid
    if (db && typeof uid === "string" && uid.trim()) {
      try {
        const [profile] = await db.getAll(db.collection("users").doc(uid.trim()), { fieldMask: ["username"] })
        username = chosenHandle(profile.data()?.username)
      } catch {
        // The optional byline must not hide a verified public meal on failure.
        console.error("meal: author handle unavailable; using the saved handle.")
      }
    }
    return { ...meal, username: username || chosenHandle(meal.userName) || chosenHandle(meal.username) }
  } catch {
    return null
  }
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const meal = await getMeal(id)
  if (!meal) return {}

  const title = meal.username
    ? `@${meal.username}'s ${meal.mealType || "Meal"}`
    : `A ${meal.mealType || "Meal"} on Makan`
  const description = meal.caption || "Shared on Makan"
  const image = meal.shareCardUrl || meal.imageURL

  return {
    title,
    description,
    alternates: { canonical: `https://www.makanofficial.com/meal/${id}` },
    openGraph: {
      title,
      description,
      url: `https://www.makanofficial.com/meal/${id}`,
      images: image ? [{ url: image, width: 1080, height: 1920 }] : [],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  }
}

export default async function MealPage({ params }: PageProps) {
  const { id, locale } = await params
  setRequestLocale(locale)
  const meal = await getMeal(id)

  // Privacy gate is centralized in getMeal (returns null for non-public).
  if (!meal) {
    redirect("/")
  }

  const imageUrl = meal.shareCardUrl || meal.imageURL
  const title = meal.username
    ? `@${meal.username}'s ${meal.mealType || "Meal"}`
    : `A ${meal.mealType || "Meal"} on Makan`

  if (!imageUrl) redirect("/")

  // The way back into the site: the restaurant this meal was saved at. One
  // aggregate document, not the directory: this route is hit by every shared
  // meal link.
  const t = await getTranslations("Meal")
  const place = meal.placeProviderId ? await getDirectoryPlaceById(meal.placeProviderId) : null

  return (
    <div className={styles.page}>
      <main id="main-content" className={`${styles.wrap} ${styles.mealDetail}`}>
        {/* Preserve the complete share card and its original aspect ratio. */}
        <figure className={styles.mealImage}>
          <Image src={imageUrl} alt={title} width={384} height={683} sizes="(max-width: 424px) calc(100vw - 40px), 384px" priority />
        </figure>
        <div className={styles.mealCopy}>
          <Image className="brand-wordmark" src="/redesign/logo-orange.svg" alt="Makan" width={132} height={31} />
          <h1>{title}</h1>
          {meal.caption ? <p>{meal.caption}</p> : null}
          {place ? (
            <p>
              {t("savedAt")}{" "}
              <Link href={localizePath(locale ?? "en", `/places/${place.slug}`)} className={styles.mealVenue}>{place.name}</Link>
              <small>{t("openPlace", { name: place.name })}</small>
            </p>
          ) : meal.locationName ? <p>{t("savedAt")} {meal.locationName}</p> : null}
          <Link href={localizePath(locale, '/standings')} className={styles.textLink}>{t('standings')}</Link>
          <div><StoreLink location="meal" className={styles.primary}>{locale === 'id' ? 'Dapatkan Makan' : 'Get Makan'}</StoreLink></div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
