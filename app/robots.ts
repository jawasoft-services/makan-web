import type { MetadataRoute } from "next"

// Everything is open, and the AI search crawlers are named on purpose: a
// citation in an AI answer needs the bot to have read the page.
const AI_CRAWLERS = ["GPTBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "anthropic-ai", "Google-Extended", "Bingbot"]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: "/" })),
    ],
    sitemap: "https://www.makanofficial.com/sitemap.xml",
  }
}
