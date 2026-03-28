import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Navbar from "@/components/Navbar"
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
}

export const metadata: Metadata = {
  title: "Makan — Share What You Eat",
  description:
    "A food journal where your friends' real meals replace algorithms and influencers.",
  alternates: {
    canonical: "https://www.makanofficial.com",
  },
  openGraph: {
    title: "Makan — Share What You Eat",
    description:
      "A food journal where your friends' real meals replace algorithms and influencers.",
    url: "https://www.makanofficial.com",
    siteName: "Makan",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Makan — Share What You Eat",
    description:
      "A food journal where your friends' real meals replace algorithms and influencers.",
    site: "@app_makan",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-brand-orange focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-brand-bg"
        >
          Skip to content
        </a>
        <Navbar />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
