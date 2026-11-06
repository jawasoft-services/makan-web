import { WEBSITE_FIXTURES, fixtureMeal } from '@/lib/website-fixtures'
import { redirect } from "next/navigation"
import { Metadata } from "next"
import { getDb } from "@/lib/firebase-admin"
import Image from "next/image"
import Footer from "@/components/Footer"
import StoreLink from "@/components/home/StoreLink"
import styles from "@/components/standings/public-pages.module.css"
import Link from "next/link"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { getDirectoryPlaceById } from "@/lib/place-directory"
import { localizePath } from "@/i18n/paths"

// A public meal rarely changes once shared, so each page is cached for an
// hour: one Firestore read per meal per hour, not one per visitor. Nothing is
// prebuilt (ids are only known when a link is shared), but a dynamic segment
// is cacheable only when it declares generateStaticParams, even an empty one.
export const revalidate = 3600
export const dynamicParams = true
export function generateStaticParams() {
  return []
}

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
  username?: string
  isPublic?: boolean | null
  placeProviderId?: string
}

async function getMeal(id: string): Promise<MealData | null> {
  try {
    let meal: MealData | null
    if (WEBSITE_FIXTURES) {
      meal = fixtureMeal(id)
    } else {
      const db = getDb()
      if (!db) return null
      const doc = await db.collection("meals").doc(id).get()
      if (!doc.exists) return null
      meal = { id: doc.id, ...doc.data() } as MealData
    }
    if (!meal) return null
    // Fail closed: only return meals explicitly marked public.
    // Any missing/null/false isPublic is treated as private and yields null,
    // so both generateMetadata and the page inherit the same gate.
    if (meal.isPublic !== true) return null
    return meal
  } catch {
    return null
  }
}

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
