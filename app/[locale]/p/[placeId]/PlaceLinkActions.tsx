"use client"

import Link from "next/link"
import { track } from "@vercel/analytics"
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/links"

const ANDROID_PACKAGE = "com.makanofficial.makanapp"

interface Props {
  /** The canonical https link to this restaurant or dish (what the app opens). */
  link: string
  /** The same destination as an app-scheme path, e.g. p/<placeId>/<dishId>. */
  appPath: string
  openLabel: string
  getLabel: string
  className: { primary: string; secondary: string }
}

const platform = () => {
  const ua = navigator.userAgent
  return /android/i.test(ua) ? "android" : /iphone|ipad|ipod/i.test(ua) ? "ios" : "other"
}

/**
 * "Open in Makan" and "Get Makan". A universal link tapped on its own website stays in the browser, so
 * Open uses an Android intent (package-pinned, falling back to the store) and the app scheme on iPhone.
 * Get Makan carries the link through install: on Android in the Play referrer, on iPhone on the clipboard
 * for the app's first-open Paste button.
 */
export default function PlaceLinkActions({ link, appPath, openLabel, getLabel, className }: Props) {
  const open = (event: React.MouseEvent<HTMLAnchorElement>) => {
    track("Place Link Open Clicked")
    if (platform() !== "android") return
    event.preventDefault()
    const { host, pathname } = new URL(link)
    const fallback = encodeURIComponent(GOOGLE_PLAY_URL)
    window.location.href = `intent://${host}${pathname}#Intent;scheme=https;package=${ANDROID_PACKAGE};S.browser_fallback_url=${fallback};end`
  }

  const get = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    track("Place Link Get App Clicked")
    const kind = platform()
    if (kind === "other") return
    event.preventDefault()
    if (kind === "android") {
      window.location.href = `${GOOGLE_PLAY_URL}&referrer=${encodeURIComponent(`l=${encodeURIComponent(link)}`)}`
      return
    }
    try { await navigator.clipboard.writeText(link) } catch { /* the store opens either way */ }
    window.location.href = APP_STORE_URL
  }

  return (
    <>
      <a href={`makanapp://${appPath}`} onClick={open} className={className.primary}>{openLabel}</a>
      <Link href="/app" onClick={get} className={className.secondary}>{getLabel}</Link>
    </>
  )
}
