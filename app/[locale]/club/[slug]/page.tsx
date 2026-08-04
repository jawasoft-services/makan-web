import type { Metadata } from "next"
import Image from "next/image"
import { notFound } from "next/navigation"
import Footer from "@/components/Footer"
import { APP_STORE_URL } from "@/lib/links"

export const dynamic = "force-dynamic"

const CLUB_SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/

interface PageProps {
  params: Promise<{ slug: string }>
}

function normalizeSlug(value: string): string | null {
  let decoded: string
  try {
    decoded = decodeURIComponent(value).trim().toLowerCase()
  } catch {
    return null
  }
  return CLUB_SLUG.test(decoded) ? decoded : null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const slug = normalizeSlug((await params).slug)
  if (!slug) return { title: "Restaurant Club · Makan", robots: { index: false, follow: false } }
  return {
    title: "Open this Restaurant Club · Makan",
    description: "Continue to this restaurant's private Makan Club. Joining is always optional in the app.",
    alternates: { canonical: `https://www.makanofficial.com/club/${slug}` },
    robots: { index: false, follow: true },
  }
}

export default async function RestaurantClubLanding({ params }: PageProps) {
  const slug = normalizeSlug((await params).slug)
  if (!slug) notFound()

  const appLink = `makanapp://club/${encodeURIComponent(slug)}`

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-28 text-center"
      >
        <Image
          src="/makan-icon.svg"
          alt=""
          width={64}
          height={64}
          className="mb-7 h-16 w-16"
          priority
        />
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">
          Makan Restaurant Clubs
        </p>
        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-brand-ink sm:text-4xl">
          Continue to this private Club.
        </h1>
        <p className="mb-9 max-w-md text-base font-medium leading-relaxed text-brand-muted">
          Makan will verify the permanent venue route in the app. Opening or scanning it never joins you, records a visit, or promises a reward. You choose whether to join.
        </p>
        <a
          href={appLink}
          className="inline-flex h-14 items-center justify-center rounded-full bg-brand-orange px-9 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-brand-orange/25 active:scale-[0.98]"
        >
          Open this Club in Makan
        </a>
        <a
          href={APP_STORE_URL}
          className="mt-5 text-sm font-medium text-brand-muted underline-offset-4 transition-colors hover:text-brand-ink hover:underline"
        >
          Get Makan on the App Store
        </a>
        <p className="mt-8 max-w-sm text-xs leading-relaxed text-brand-muted">
          If Makan is not installed, keep this page available. Fresh-install venue restoration is shown only when the install handoff has been verified on your device.
        </p>
      </main>
      <Footer />
    </div>
  )
}
