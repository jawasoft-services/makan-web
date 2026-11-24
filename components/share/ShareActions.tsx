"use client"

import { goToStoreWithLink, phoneKind } from "@/lib/carry-link"
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/links"

/*
 * RM20616 A12 U3 — the one button of a Share v2 page.
 *
 * "Open in Makan" opens the app when it is installed and becomes the store button when it is not
 * (board X2). A universal link tapped on its own website stays in the browser, so Android uses an
 * intent pinned to the app with the store as its fallback, and iPhone tries the app's own scheme
 * and goes to the App Store if the page is still in front a moment later. "Get Makan the app" goes
 * to the visitor's store. Both carry the page's own address through install, as the restaurant-link
 * and table-invite pages already do (RM20333): nothing but that public address travels.
 */
const ANDROID_PACKAGE = "com.makanofficial.makanapp"
const STILL_HERE_MS = 1500

interface Props {
  /** The page's own public address (what the app opens). */
  link: string
  /** Where the button goes without JavaScript, and on a computer: the site's own app page. */
  appPage: string
  label: string
  className: string
}

export function OpenInMakanButton({ link, appPage, label, className, appPath }: Props & { /** The same page as an app-scheme path, e.g. places/<slug>. */ appPath: string }) {
  const open = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const phone = phoneKind()
    if (phone === "other") return
    event.preventDefault()
    if (phone === "android") {
      const { host, pathname } = new URL(link)
      window.location.href = `intent://${host}${pathname}#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${encodeURIComponent(GOOGLE_PLAY_URL)};end`
      return
    }
    window.location.href = `makanapp://${appPath}`
    window.setTimeout(() => { if (!document.hidden) void goToStoreWithLink(link) }, STILL_HERE_MS)
  }
  return <a href={appPage} onClick={open} className={className}>{label}</a>
}

/** `link` is left out on the gone page: there is nothing to carry, so the button only opens the store. */
export function GetMakanButton({ link, appPage, label, className }: Omit<Props, "link"> & { link?: string }) {
  const get = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const phone = phoneKind()
    if (phone === "other") return
    event.preventDefault()
    if (link) void goToStoreWithLink(link)
    else window.location.href = phone === "android" ? GOOGLE_PLAY_URL : APP_STORE_URL
  }
  return <a href={appPage} onClick={get} className={className}>{label}</a>
}
