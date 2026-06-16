import { getAllReviews } from "@/lib/reviews"

export const dynamic = "force-static"

// Serves /llms.txt — a curated, machine-legible index for AI crawlers.
// Auto-updates from the reviews registry, so new posts appear without edits.
export function GET() {
  const base = "https://www.makanofficial.com"
  const reviews = getAllReviews()

  const lines = [
    "# Makan",
    "",
    "> A social food journal — remember every meal. iOS app (in beta) and makanofficial.com.",
    "",
    "## Restaurant reviews",
    ...reviews.map((r) => `- [${r.restaurant.name} review](${base}/blog/${r.slug}): ${r.metaDescription}`),
    "",
    "## Product",
    `- [Get Makan](${base}/app): Download the Makan app (TestFlight beta).`,
    `- [Manifesto](${base}/manifesto): Why Makan exists.`,
    "",
    "## Author",
    "- Devon Makepeace — founder of Makan.",
    "",
  ]

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
