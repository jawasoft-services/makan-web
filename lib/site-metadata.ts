import type { Metadata } from "next"

export const SITE_URL = "https://www.makanofficial.com"

interface PageMetadataOptions {
  title: string
  description: string
  path?: string
  type?: "website" | "article"
  locale?: string
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
}: PageMetadataOptions): Metadata {
  const url = `${SITE_URL}${path}`
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
    },
  }
}
