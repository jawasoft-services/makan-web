import { APP_STORE_URL } from "@/lib/links"
import { BOILERPLATE_LONG, COMPANY, FOUNDER, SOCIALS } from "@/lib/press"
import { SITE_URL } from "@/lib/site-metadata"

/** Homepage entity graph: connects the site, company, founder and iOS app. */
export default function SiteSchema() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Makan",
        legalName: COMPANY.legalName,
        url: SITE_URL,
        logo: `${SITE_URL}/makan-icon.svg`,
        foundingDate: COMPANY.foundingYear,
        description: BOILERPLATE_LONG,
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
        description: "A food journal where your friends' real meals replace algorithms and influencers.",
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en",
      },
      {
        "@type": "MobileApplication",
        "@id": `${SITE_URL}/#app`,
        name: "Makan",
        description: "A social food journal for remembering every meal with friends.",
        applicationCategory: "LifestyleApplication",
        operatingSystem: "iOS",
        url: `${SITE_URL}/app`,
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
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  )
}
