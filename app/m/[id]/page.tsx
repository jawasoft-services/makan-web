import { redirect } from "next/navigation"
import { Metadata } from "next"
import Image from "next/image"
import Footer from "@/components/Footer"
import { getPublicMeal, mealTitle } from "@/lib/meal"

/*
 * Short canonical meal link — makanofficial.com/m/<id>. This is the URL the
 * app's share card (RM18746) encodes as a QR and the universal link opens on a
 * meal. For installed users the universal link opens the app on the meal detail;
 * this web page is the fallback for everyone else.
 *
 * Privacy: routes through getPublicMeal — a friends-only / private meal never
 * renders here (it redirects home), same fail-closed gate as /meal/<id>.
 */
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const meal = await getPublicMeal(id)
  if (!meal) return {}

  const title = mealTitle(meal)
  const description = meal.caption || "Shared on Makan"
  const image = meal.shareCardUrl || meal.imageURL
  const url = `https://www.makanofficial.com/m/${id}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
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

export default async function ShortMealPage({ params }: PageProps) {
  const { id } = await params
  const meal = await getPublicMeal(id)

  // Privacy gate is centralized in getPublicMeal (null for non-public).
  if (!meal) redirect("/")

  const imageUrl = meal.shareCardUrl || meal.imageURL
  if (!imageUrl) redirect("/")

  return (
    <div className="min-h-screen bg-brand-cream">
      <main className="flex min-h-screen items-center justify-center px-6 pt-20 pb-12">
        <div className="w-full max-w-sm">
          <Image
            src={imageUrl}
            alt={mealTitle(meal)}
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
