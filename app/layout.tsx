import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Navbar from "@/components/Navbar"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
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
    "Track your meals, keep streaks alive, and discover what your friends are eating.",
  alternates: {
    canonical: "https://www.makanofficial.com",
  },
  openGraph: {
    title: "Makan — Share What You Eat",
    description:
      "Track your meals, keep streaks alive, and discover what your friends are eating.",
    url: "https://www.makanofficial.com",
    siteName: "Makan",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Makan — Share What You Eat",
    description:
      "Track your meals, keep streaks alive, and discover what your friends are eating.",
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
        <Navbar />
        {children}
        <Analytics />
      </body>
    </html>
  )
}
