import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { ViewTransitions } from "next-view-transitions"
import Navbar from "@/components/Navbar"
import SmoothScroll from "@/components/motion/SmoothScroll"
import "lenis/dist/lenis.css"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FF9932",
}

export const metadata: Metadata = {
  // Resolve every relative OG/twitter image + canonical against the www host so
  // crawlers hit a 200 directly. Without this, Next falls back to the apex
  // origin, which 308-redirects to www — and social unfurlers (Twitterbot,
  // iMessage, Slack, WhatsApp, LinkedIn) don't follow redirects on image tags,
  // so the card renders with no image.
  metadataBase: new URL("https://www.makanofficial.com"),
  title: "Makan — Remember every meal",
  description:
    "A food journal where your friends' real meals replace algorithms and influencers.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ViewTransitions>
      <html lang="en" className={jakarta.variable}>
        <body className="font-sans antialiased">
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-brand-orange focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Skip to content
          </a>
          <Navbar />
          {children}
          <SmoothScroll />
          {process.env.VERCEL ? <Analytics /> : null}
        </body>
      </html>
    </ViewTransitions>
  )
}
