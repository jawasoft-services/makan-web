import type { Metadata } from "next"

export const SITE_URL = "https://www.makanofficial.com"

interface PageMetadataOptions {
  title: string
  description: string
  path?: string
  type?: "website" | "article"
  locale?: string
  /** Share image; defaults to the locale's home card. A segment's own
   *  opengraph-image file takes precedence over this. */
  image?: string
}

/**
 * Build complete, page-specific metadata from one canonical origin.
 * Keeping canonicals and social URLs together prevents child routes from
 * inheriting the homepage URL from the root layout.
 */
export function createPageMetadata({
  title,
  description,
  path = "",
  type = "website",
  locale,
  image,
}: PageMetadataOptions): Metadata {
  const url = `${SITE_URL}${path}`
  // English lives unprefixed in production, so the card URL must too:
  // crawlers that don't follow redirects would otherwise see nothing.
  const shareImage = image ?? (locale === "id" ? `${SITE_URL}/id/opengraph-image` : `${SITE_URL}/opengraph-image`)
  const images = [{ url: shareImage, width: 1200, height: 630, alt: title }]
  const englishPath = path.replace(/^\/id(?=\/|$)/, "") || "/"
  const indonesianPath =
    englishPath === "/" ? "/id" : `/id${englishPath}`

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    alternates: {
      canonical: url,
      ...(locale
        ? {
            languages: {
              en: `${SITE_URL}${englishPath}`,
              id: `${SITE_URL}${indonesianPath}`,
              "x-default": `${SITE_URL}${englishPath}`,
            },
          }
        : {}),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Makan",
      type,
      images,
      ...(locale
        ? {
            locale: locale === "id" ? "id_ID" : "en_GB",
            alternateLocale: locale === "id" ? ["en_GB"] : ["id_ID"],
          }
        : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@app_makan",
      images: [shareImage],
    },
  }
}
