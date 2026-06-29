// Server component: emits FAQPage JSON-LD from the shared FAQ data so search
// engines and AI assistants can extract the Q&As. Mirrors StorySchema/ReviewSchema.
import { FAQS } from "@/lib/faq"

export default function FaqSchema() {
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
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
