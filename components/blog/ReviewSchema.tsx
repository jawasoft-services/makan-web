import type { Review } from "@/lib/reviews/types"

const BASE = "https://www.makanofficial.com"

export function ReviewSchema({ review }: { review: Review }) {
  const url = `${BASE}/blog/${review.slug}`
  const r = review.restaurant
  const photos = review.meals.filter((m) => m.photo).map((m) => `${BASE}${m.photo}`)
  const images = photos.length ? photos : [`${BASE}/makan-logo.png`]

  const graph = [
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: review.h1,
      description: review.metaDescription,
      datePublished: review.datePublished,
      dateModified: review.dateModified,
      inLanguage: "en-GB",
      url,
      mainEntityOfPage: { "@id": url },
      image: images,
      author: { "@id": `${BASE}/#devon` },
      publisher: { "@id": `${BASE}/#makan` },
    },
    {
      "@type": "Review",
      "@id": `${url}#review`,
      url,
      datePublished: review.datePublished,
      author: { "@id": `${BASE}/#devon` },
      itemReviewed: { "@id": `${url}#restaurant` },
    },
    {
      "@type": "Restaurant",
      "@id": `${url}#restaurant`,
      name: r.name,
      servesCuisine: r.cuisine,
      priceRange: r.priceRange,
      telephone: r.telephone,
      url: r.url,
      sameAs: r.sameAs,
      address: {
        "@type": "PostalAddress",
        streetAddress: r.street,
        addressLocality: r.locality,
        addressRegion: r.region,
        postalCode: r.postalCode,
        addressCountry: r.country,
      },
      ...(r.geo
        ? { geo: { "@type": "GeoCoordinates", latitude: r.geo.lat, longitude: r.geo.lng } }
        : {}),
    },
    {
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: review.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: BASE },
        { "@type": "ListItem", position: 2, name: "Blog", item: `${BASE}/blog` },
        { "@type": "ListItem", position: 3, name: r.name, item: url },
      ],
    },
    {
      "@type": "Person",
      "@id": `${BASE}/#devon`,
      name: review.author.name,
      jobTitle: review.author.role,
      url: review.author.url,
    },
    {
      "@type": "Organization",
      "@id": `${BASE}/#makan`,
      name: "Makan",
      url: BASE,
      logo: `${BASE}/makan-logo.png`,
      sameAs: ["https://twitter.com/app_makan"],
    },
  ]

  const jsonLd = { "@context": "https://schema.org", "@graph": graph }
  // All content is author-controlled (no user input), but escape "<" so a stray
  // "</script>" can never break out of the tag — the standard safe JSON-LD pattern.
  const safeJson = JSON.stringify(jsonLd).replace(/</g, "\\u003c")

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson }} />
}
