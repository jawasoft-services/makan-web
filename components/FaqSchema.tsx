// Server component: emits FAQPage JSON-LD from a set of Q&As so search engines
// and AI assistants can extract them. Mirrors StorySchema/ReviewSchema.
// Items arrive as a prop so the homepage FAQ (lib/faq.ts) and the support FAQ
// (lib/support.ts) each emit their own FAQPage on their own URL.

interface QandA {
  q: string
  a: string
}

export default function FaqSchema({ items }: { items: readonly QandA[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  }

  return (
    <script
      type="application/ld+json"
      // Escape < to prevent the JSON from terminating the script element.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  )
}
