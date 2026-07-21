import type { Metadata } from "next"
import { headers } from "next/headers"
import { normalizePilotLocale } from "@/lib/pilot-locale"
import { getVenue } from "@/lib/venues"
import VenueLanding from "./VenueLanding"

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
  const acceptLanguage = (await headers()).get("accept-language")

  return <VenueLanding initialLocale={normalizePilotLocale(acceptLanguage)} venue={venue} />
}
