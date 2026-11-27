/**
 * RM20773 (Devon, 27 Nov 2026: "Get the Makan app needs to redirect to the highest converting CTA"):
 * /app is where every "Get the Makan app" link, the claim page button and the home page QR code point.
 * A phone goes straight to its own store, one step from installing; anything else lands on the home
 * page's store badges and QR code (/#get), as before.
 *
 * The App Hosting CDN forwards every request with the user agent "Google", so the server cannot tell
 * devices apart. This route returns an empty page whose one same-origin script (public/app-redirect.js,
 * allowed by script-src 'self') reads the device in the browser and redirects. Without JavaScript, the
 * meta refresh goes to /#get. The page is the same for everyone, so the CDN may cache it.
 */
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/links"

export const dynamic = "force-static"
export function generateStaticParams() { return [{ locale: "en" }, { locale: "id" }] }

export async function GET(_request: Request, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const fallback = locale === "id" ? "/id#get" : "/#get"
  const html = `<!doctype html><html lang="${locale === "id" ? "id" : "en"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>Makan</title><link rel="preconnect" href="${new URL(APP_STORE_URL).origin}"><link rel="preconnect" href="${new URL(GOOGLE_PLAY_URL).origin}"><script src="/app-redirect.js" data-ios="${APP_STORE_URL}" data-android="${GOOGLE_PLAY_URL}" data-fallback="${fallback}"></script><noscript><meta http-equiv="refresh" content="0;url=${fallback}"></noscript></head><body style="background:#FFF7EE"></body></html>`
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=86400" } })
}
