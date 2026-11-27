import type { NextRequest } from "next/server"
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/links"

/**
 * RM20773 (Devon, 27 Nov 2026: "Get the Makan app needs to redirect to the highest converting CTA"):
 * /app is where every "Get the Makan app" link, the claim page button and the home page QR code point.
 * A phone goes straight to its own store, one step from installing; anything else lands on the home
 * page's store badges and QR code (/#get), as before. Never cached: the answer depends on the device.
 */
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const ua = request.headers.get("user-agent") ?? ""
  const store = /android/i.test(ua) ? GOOGLE_PLAY_URL : /iphone|ipad|ipod/i.test(ua) ? APP_STORE_URL : null
  return new Response(null, {
    status: 307,
    headers: { Location: store ?? (locale === "id" ? "/id#get" : "/#get"), "Cache-Control": "private, no-store", Vary: "User-Agent" },
  })
}
