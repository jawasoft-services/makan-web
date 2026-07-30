import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { localizePath } from "@/i18n/paths"
import { getVenue } from "@/lib/venues"
import VenueLanding from "./VenueLanding"

/*
 * Venue-QR landing page for the open Canggu launch. The printed slug is stable;
 * the page shows the exact venue as context and hands off honestly to the
 * currently available store. It does not promise that a venue survives install.
 */
export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ locale: string; place: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, place } = await params
  const venue = getVenue(place)
  const t = await getTranslations({ locale, namespace: "VenueLanding" })
  const title = venue ? t("metaVenueTitle", { venue: venue.name }) : t("metaTitle")
  const description = venue
    ? t("metaVenueDescription", { venue: venue.name })
    : t("metaDescription")
  const path = localizePath(locale, `/r/${place}`)

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.makanofficial.com${path}`,
      languages: {
        en: `https://www.makanofficial.com/r/${place}`,
        id: `https://www.makanofficial.com/id/r/${place}`,
      },
    },
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: `https://www.makanofficial.com${path}`,
      type: "website",
      locale: locale === "id" ? "id_ID" : "en_GB",
      alternateLocale: locale === "id" ? ["en_GB"] : ["id_ID"],
    },
    twitter: { card: "summary", title, description },
  }
}

export default async function VenueRedirectPage({ params }: PageProps) {
  const { place } = await params
  return <VenueLanding venue={getVenue(place)} />
}
