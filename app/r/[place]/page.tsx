import type { Metadata } from "next"
import Image from "next/image"
import { APP_STORE_URL } from "@/lib/links"
import { getVenue } from "@/lib/venues"
import Footer from "@/components/Footer"

/*
 * Venue-QR landing page — the Phase-1 destination of the printed venue QR
 * ( makanofficial.com/r/<slug> ). See lib/venues.ts for the dynamic-QR contract:
 * the slug is a STABLE printed token; this page is its swappable behavior.
 *
 * Phase 1 (now): show the venue as context + hand off to the App Store, with a
 * best-effort "open the app" for people who already have Makan. The venue tag is
 * NOT carried through install (documented pilot limitation), so the copy must not
 * promise auto-tagging — it just gets the right people onto Makan.
 *
 * Phase 2 (RM18722): once AASA / universal links land, this same route becomes a
 * universal link that opens the composer pre-tagged to the venue's googlePlaceId.
 */

// SSR each request: reads the (sync) registry, no per-request data. Keeping it
// dynamic lets Phase 2 swap the behavior and lets an added venue go live on
// deploy, matching the /meal/[id] sibling.
export const dynamic = "force-dynamic"

// The app's only URL scheme (app.json → "scheme": "makanapp"). A bare
// makanapp:// opens the app to its home if installed; nothing custom is routed
// yet — deferred deep-linking is Phase 2 / RM18722.
const APP_SCHEME_URL = "makanapp://"

interface PageProps {
  params: Promise<{ place: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { place } = await params
  const venue = getVenue(place)

  const title = venue ? `Log your meal at ${venue.name} · Makan` : "Get Makan"
  const description = venue
    ? `You're at ${venue.name}. Get Makan free and remember every meal.`
    : "Makan is a private food diary you share with friends. Free on the App Store."

  return {
    title,
    description,
    // Utility landing pages for QR scanners — keep them out of search.
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: `https://www.makanofficial.com/r/${place}`,
      type: "website",
    },
    twitter: { card: "summary", title, description },
  }
}

export default async function VenueRedirectPage({ params }: PageProps) {
  const { place } = await params
  const venue = getVenue(place)

  const heading = venue ? "Remember this meal." : "Remember every meal."
  const subcopy = venue
    ? `You're at ${venue.name}. Makan is a private food diary you share with friends — snap what you're eating and keep every meal, free.`
    : "Makan is a private food diary you share with friends — snap what you're eating and keep every meal, free."

  return (
    <div className="flex min-h-screen flex-col bg-brand-bg">
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
        <Image
          src="/makan-wordmark.svg"
          alt="Makan"
          width={200}
          height={49}
          className="mb-9 h-auto w-[190px]"
          priority
        />

        {venue && (
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">
            {venue.name} · {venue.city}
          </p>
        )}

        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {heading}
        </h1>

        <p className="mb-9 max-w-sm text-base font-medium leading-relaxed text-brand-muted">
          {subcopy}
        </p>

        <a
          href={APP_STORE_URL}
          className="inline-flex h-14 items-center justify-center rounded-full bg-brand-orange px-9 text-base font-semibold text-brand-bg transition-all hover:shadow-lg hover:shadow-brand-orange/25 active:scale-[0.98]"
        >
          Download on the App Store
        </a>

        <a
          href={APP_SCHEME_URL}
          className="mt-5 text-sm font-medium text-brand-muted underline-offset-4 transition-colors hover:text-white hover:underline"
        >
          Already have Makan? Open the app
        </a>

        <p className="mt-8 text-xs text-brand-dim">
          Free on iPhone. Android is coming next.
        </p>
      </main>
      <Footer />
    </div>
  )
}
