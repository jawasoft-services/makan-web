import { getAllReviews } from "@/lib/reviews"
import { APP_STORE_URL } from "@/lib/links"
import { BOILERPLATE_SHORT } from "@/lib/press"

export const dynamic = "force-static"

// Serves /llms.txt — a curated, machine-legible index for AI crawlers.
// Auto-updates from the reviews registry, so new posts appear without edits.
export function GET() {
  const base = "https://www.makanofficial.com"
  const reviews = getAllReviews()

  const lines = [
    "# Makan",
    "",
    process.env.DECISION_HOME === "1"
      ? "> The app you open when you don't know what to order. Take a photo of what you eat; Makan works out what you like and what people keep ordering where you are. Free on iPhone and at makanofficial.com."
      : "> A social food journal — remember every meal. Free on the iOS App Store and at makanofficial.com.",
    "",
    "## Restaurant reviews",
    ...reviews.map((r) => `- [${r.restaurant.name} review](${base}/blog/${r.slug}): ${r.metaDescription}`),
    "",
    "## About",
    `- [The Makan story](${base}/story): ${BOILERPLATE_SHORT}`,
    "",
    "## Product",
    `- [Get Makan](${APP_STORE_URL}): Download Makan free on the App Store.`,
    `- [Manifesto](${base}/manifesto): Why Makan exists.`,
    `- [Eat or Yeet standings](${base}/standings): Restaurants ranked by Eats, the picks of diners who ate there.`,
    `- [For restaurants](${base}/partner): Free for restaurants; your name on every saved meal, an Eat every time a diner picks your dish.`,
    "",
    "## Support",
    `- [Support](${base}/support): Contact Makan support, delete your account, report a meal, or make a privacy request.`,
    "",
    "## Author",
    "- Devon Makepeace — founder of Makan.",
    "",
  ]

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
