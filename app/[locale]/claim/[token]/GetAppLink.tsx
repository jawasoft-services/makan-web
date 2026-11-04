"use client"

import { track } from "@vercel/analytics"
import Link from "next/link"
import { APP_STORE_URL, GOOGLE_PLAY_URL } from "@/lib/links"

/** One store button: the phone's own store on tap, the /app chooser everywhere else. */
export default function GetAppLink({ className, children }: { className: string; children: React.ReactNode }) {
  const open = (event: React.MouseEvent<HTMLAnchorElement>) => {
    track("Claim Link Get App Clicked")
    const ua = navigator.userAgent
    const store = /android/i.test(ua) ? GOOGLE_PLAY_URL : /iphone|ipad|ipod/i.test(ua) ? APP_STORE_URL : null
    if (!store) return
    event.preventDefault()
    window.location.href = store
  }
  return <Link href="/app" className={className} onClick={open}>{children}</Link>
}
