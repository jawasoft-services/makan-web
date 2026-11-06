import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/links"

/*
 * RM20333 — carrying a Makan link through install. The app's first-open handoff reads the Play Store
 * referrer (`l=<encoded Makan link>`) on Android, and offers Apple's Paste button on iPhone for a link
 * copied just before the App Store opens. Used by the restaurant/dish page and the table-invite page.
 */

/** The Play Store listing that hands `link` to the installed app as its install referrer. */
export function playUrlWithLink(link: string): string {
  return `${GOOGLE_PLAY_URL}&referrer=${encodeURIComponent(`l=${encodeURIComponent(link)}`)}`
}

/** The phone the visitor is on, from its user agent. */
export function phoneKind(): "android" | "ios" | "other" {
  const ua = navigator.userAgent
  return /android/i.test(ua) ? "android" : /iphone|ipad|ipod/i.test(ua) ? "ios" : "other"
}

/** Sends the visitor to the store of their phone with `link` riding along; false when this is not a phone. */
export async function goToStoreWithLink(link: string): Promise<boolean> {
  const kind = phoneKind()
  if (kind === "other") return false
  if (kind === "android") {
    window.location.href = playUrlWithLink(link)
    return true
  }
  try { await navigator.clipboard.writeText(link) } catch { /* the store opens either way */ }
  window.location.href = APP_STORE_URL
  return true
}
