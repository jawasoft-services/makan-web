// Server component: emits one JSON-LD @graph so AI/search treat /story as the
// canonical entity record for Makan. Mirrors components/blog/ReviewSchema.tsx.
import { BOILERPLATE_LONG, COMPANY, FOUNDER, LAUNCH, PRESS_EMAIL, SOCIALS } from "@/lib/press"

const BASE = "https://www.makanofficial.com"

export default function StorySchema({ locale = "en" }: { locale?: string }) {
  const isIndonesian = locale === "id"
  const storyUrl = `${BASE}${isIndonesian ? "/id" : ""}/story`
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BASE}/#organization`,
        name: "Makan",
        legalName: COMPANY.legalName,
        url: BASE,
        logo: `${BASE}/makan-icon.svg`,
        foundingDate: COMPANY.foundingYear,
        description: BOILERPLATE_LONG,
        sameAs: [SOCIALS.instagram, SOCIALS.x, SOCIALS.tiktok],
        founder: { "@id": `${BASE}/#founder` },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "press",
          email: PRESS_EMAIL,
        },
      },
      {
        "@type": "Person",
        "@id": `${BASE}/#founder`,
        name: FOUNDER.name,
        jobTitle: FOUNDER.role,
        worksFor: { "@id": `${BASE}/#organization` },
      },
      {
        "@type": "AboutPage",
        "@id": `${storyUrl}#webpage`,
        url: storyUrl,
        name: isIndonesian ? "Cerita Makan" : "The Makan story",
        description: isIndonesian
          ? "Cerita tentang bagaimana shared story saat COVID tumbuh menjadi Makan, jurnal makanan sosial."
          : BOILERPLATE_LONG,
        inLanguage: locale,
        datePublished: LAUNCH.date,
        mainEntity: { "@id": `${BASE}/#organization` },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE },
          {
            "@type": "ListItem",
            position: 2,
            name: isIndonesian ? "Cerita Makan" : "Story",
            item: storyUrl,
          },
        ],
      },
    ],
  }

  return (
    <script
      type="application/ld+json"
      // Escape < to prevent the JSON from terminating the script element.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, "\\u003c") }}
    />
  )
}
