import { APP_STORE_URL } from "@/lib/links"
import { COMPANY, FOUNDER, SOCIALS } from "@/lib/press"
import english from '@/messages/en.json'
import indonesian from '@/messages/id.json'
import { safeJsonLd } from "@/lib/safe-json-ld"
import { SITE_URL } from "@/lib/site-metadata"

/** Homepage entity graph: connects the site, company, founder and iOS app. */
export default function SiteSchema({ locale = "en" }: { locale?: string }) {
  const isIndonesian = locale === "id"
  const localizedUrl = isIndonesian ? `${SITE_URL}/id` : SITE_URL
  const description = (isIndonesian ? indonesian : english).Redesign.intro
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Makan",
        legalName: COMPANY.legalName,
        url: localizedUrl,
        logo: `${SITE_URL}/makan-icon.svg`,
        foundingDate: COMPANY.foundingYear,
        description,
        founder: { "@id": `${SITE_URL}/#founder` },
        sameAs: [SOCIALS.instagram, SOCIALS.x, SOCIALS.tiktok],
      },
      {
        "@type": "Person",
        "@id": `${SITE_URL}/#founder`,
        name: FOUNDER.name,
        jobTitle: FOUNDER.role,
        worksFor: { "@id": `${SITE_URL}/#organization` },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Makan",
        description,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: locale,
      },
      {
        "@type": "MobileApplication",
        "@id": `${SITE_URL}/#app`,
        name: "Makan",
        description,
        applicationCategory: "LifestyleApplication",
        operatingSystem: "iOS",
        url: `${localizedUrl}/app`,
        downloadUrl: APP_STORE_URL,
        installUrl: APP_STORE_URL,
        image: `${SITE_URL}/makan-icon.svg`,
        author: { "@id": `${SITE_URL}/#organization` },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(graph) }}
    />
  )
}
