import { redirect } from "next/navigation"
import { Metadata } from "next"
import { getDb } from "@/lib/firebase-admin"
import Image from "next/image"
import Footer from "@/components/Footer"
import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { getDirectoryPlaceById } from "@/lib/place-directory"
import { localizePath } from "@/i18n/paths"

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
  username?: string
  isPublic?: boolean | null
  placeProviderId?: string
}

async function getMeal(id: string): Promise<MealData | null> {
  try {
    const db = getDb()
    if (!db) return null
    const doc = await db.collection("meals").doc(id).get()
    if (!doc.exists) return null
    const meal = { id: doc.id, ...doc.data() } as MealData
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
  // aggregate document, not the directory: this route is force-dynamic and
  // is hit by every shared meal link.
  const t = await getTranslations("Meal")
  const place = meal.placeProviderId ? await getDirectoryPlaceById(meal.placeProviderId) : null

  return (
    <div className="min-h-screen bg-brand-cream">
      <main id="main-content" className="flex min-h-screen items-center justify-center px-6 pt-20 pb-12">
        <div className="w-full max-w-sm">
          {/*
            Declared at the size the card actually renders (the wrapper caps at
            max-w-sm = 384px), not at the source's 1080x1920. Every public meal
            id mints its own cache entries here and they never stop accruing, so
            the pair wants to be as cheap as possible: 384/828 instead of
            1080/1920. Ratio is unchanged (384/683 == 1080/1920), so this is
            byte savings with no layout shift.
          */}
          <Image
            src={imageUrl}
            alt={title}
            width={384}
            height={683}
            className="w-full h-auto rounded-2xl shadow-2xl shadow-black/40"
          />
          {place ? (
            <p className="mt-6 text-center text-base leading-[1.6] text-brand-muted">
              {t("savedAt")}{" "}
              <Link
                href={localizePath(locale ?? "en", `/places/${place.slug}`)}
                className="font-semibold text-brand-ink underline decoration-brand-orange decoration-2 underline-offset-4"
              >
                {place.name}
              </Link>
              <span className="mt-1 block text-sm">{t("openPlace", { name: place.name })}</span>
            </p>
          ) : meal.locationName ? (
            <p className="mt-6 text-center text-base text-brand-muted">{t("savedAt")} {meal.locationName}</p>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
  )
}
