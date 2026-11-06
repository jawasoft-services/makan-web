import StoreLink from "@/components/home/StoreLink"
import type { Metadata } from "next"
import Image from "next/image"
import { getVenue } from "@/lib/venues"
import Footer from "@/components/Footer"
import styles from "@/components/standings/public-pages.module.css"

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
    : "Makan is a personal food diary you can share publicly or with friends. Free on the App Store."

  return {
    title,
    description,
    alternates: { canonical: `https://www.makanofficial.com/r/${place}` },
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
    ? `You're at ${venue.name}. Makan is a personal food diary — snap what you're eating, choose Public or Friends Only and keep the meal.`
    : "Makan is a personal food diary — snap what you're eating, choose Public or Friends Only and keep the meal."

  return (
    <div className={styles.page}>
      <main
        id="main-content"
        className={styles.handoff}
      >
        <Image src="/redesign/food-noodles.svg" alt="" width={150} height={140} className={styles.handoffArt} priority />

        {venue && (
          <p className={styles.tag}>
            {venue.name} · {venue.city}
          </p>
        )}

        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-brand-ink sm:text-4xl">
          {heading}
        </h1>

        <p className="mb-9 max-w-sm text-base font-medium leading-relaxed text-brand-muted">
          {subcopy}
        </p>

        <div className={styles.handoffActions}>
        <StoreLink
          location="restaurant-qr"
          className={styles.primary}
        >
          Download on the App Store
        </StoreLink>
        </div>

        <a
          href={APP_SCHEME_URL}
          className={`${styles.textLink} mt-5`}
        >
          Already have Makan? Open the app
        </a>

      </main>
      <Footer />
    </div>
  )
}
