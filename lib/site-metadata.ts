import type { Metadata } from "next"

export const SITE_URL = "https://www.makanofficial.com"

interface PageMetadataOptions {
  title: string
  description: string
  path?: string
  type?: "website" | "article"
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
}: PageMetadataOptions): Metadata {
  const url = `${SITE_URL}${path}`

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Makan",
      type,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      site: "@app_makan",
    },
  }
}
