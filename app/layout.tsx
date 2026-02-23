import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import Navbar from "@/components/Navbar"
import "./globals.css"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: "Makan — Share What You Eat",
  description:
    "Track your meals, keep streaks alive, and discover what your friends are eating.",
  openGraph: {
    title: "Makan — Share What You Eat",
    description:
      "Track your meals, keep streaks alive, and discover what your friends are eating.",
    url: "https://www.makanofficial.com",
    siteName: "Makan",
    type: "website",
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
      </body>
    </html>
  )
}
