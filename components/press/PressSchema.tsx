// Server component: JSON-LD for /press. It points at the Organization and founder records that
// components/story/StorySchema.tsx and components/SiteSchema.tsx already define by @id, instead of repeating them.
import { COFOUNDERS, FOUNDER, LAUNCH } from "@/lib/press"
import { safeJsonLd } from "@/lib/safe-json-ld"
import { pressCopy } from "./press-copy"

const BASE = "https://www.makanofficial.com"

export default function PressSchema({ locale = "en" }: { locale?: string }) {
  const isIndonesian = locale === "id"
  const copy = pressCopy[isIndonesian ? "id" : "en"]
  const url = `${BASE}${isIndonesian ? "/id" : ""}/press`
  const organization = { "@id": `${BASE}/#organization` }
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: isIndonesian ? "Media — Makan" : "Press — Makan",
        description: copy.intro,
        inLanguage: locale,
        datePublished: LAUNCH.date,
        about: organization,
        mainEntity: organization,
      },
      { "@type": "Person", "@id": `${BASE}/#founder`, name: FOUNDER.name, jobTitle: FOUNDER.role, worksFor: organization },
      ...COFOUNDERS.map((person) => ({
        "@type": "Person",
        name: person.name,
        jobTitle: "Co-founder",
        homeLocation: { "@type": "Place", name: person.city },
        worksFor: organization,
      })),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: BASE },
          { "@type": "ListItem", position: 2, name: isIndonesian ? "Media" : "Press", item: url },
        ],
      },
    ],
  }
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(graph) }} />
}
