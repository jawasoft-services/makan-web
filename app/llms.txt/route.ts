import { getAllReviews } from "@/lib/reviews"
import { APP_STORE_URL } from "@/lib/links"
import { BOILERPLATE_SHORT } from "@/lib/press"
import english from '@/messages/en.json'

export const dynamic = "force-static"

// Serves /llms.txt — a curated, machine-legible index for AI crawlers.
// Auto-updates from the reviews registry, so new posts appear without edits.
export function GET() {
  const base = "https://www.makanofficial.com"
  const reviews = getAllReviews()

  const lines = [
    "# Makan",
    "",
    `> ${english.Redesign.intro}`,
    "",
    "## Restaurant reviews",
    ...reviews.map((r) => `- [${r.restaurant.name} review](${base}/blog/${r.slug}): ${r.metaDescription}`),
    "",
    "## About",
    `- [The Makan story](${base}/story): ${BOILERPLATE_SHORT}`,
    "",
    "## Product",
    `- [Get Makan](${APP_STORE_URL}): Download Makan free on the App Store.`,
    `- [Explore restaurants](${base}/places): Find the places behind meals shared on Makan.`,
    `- [Manifesto](${base}/manifesto): Why Makan exists.`,
    `- [Eat or Yeet standings](${base}/standings): Restaurants ranked by Eat rate: how often diners who ate there pick them.`,
    `- [For restaurants](${base}/partner): ${english.Redesign.restaurantbody}`,
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
