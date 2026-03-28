import { redirect } from "next/navigation"
import { Metadata } from "next"
import { getDb } from "@/lib/firebase-admin"
import Image from "next/image"
import Footer from "@/components/Footer"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
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
}

async function getMeal(id: string): Promise<MealData | null> {
  try {
    const db = getDb()
    if (!db) return null
    const doc = await db.collection("meals").doc(id).get()
    if (!doc.exists) return null
    return { id: doc.id, ...doc.data() } as MealData
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
  const { id } = await params
  const meal = await getMeal(id)

  if (!meal || meal.isPublic === false) {
    redirect("/")
  }

  const imageUrl = meal.shareCardUrl || meal.imageURL
  const title = meal.username
    ? `@${meal.username}'s ${meal.mealType || "Meal"}`
    : `A ${meal.mealType || "Meal"} on Makan`

  if (!imageUrl) redirect("/")

  return (
    <div className="min-h-screen bg-brand-bg">
      <main className="flex min-h-screen items-center justify-center px-6 pt-20 pb-12">
        <div className="w-full max-w-sm">
          <Image
            src={imageUrl}
            alt={title}
            width={1080}
            height={1920}
            className="w-full h-auto rounded-2xl shadow-2xl shadow-black/40"
          />
        </div>
      </main>
      <Footer />
    </div>
  )
}
