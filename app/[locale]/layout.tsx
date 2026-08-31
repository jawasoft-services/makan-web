import type { Metadata, Viewport } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import SafeAnalytics from "@/components/SafeAnalytics"
import { ViewTransitions } from "next-view-transitions"
import Navbar from "@/components/Navbar"
import SmoothScroll from "@/components/motion/SmoothScroll"
import { routing } from "@/i18n/routing"
import "lenis/dist/lenis.css"
import "../globals.css"

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

const BASE_METADATA: Metadata = {
  // Resolve every relative OG/twitter image + canonical against the www host so
  // crawlers hit a 200 directly. Without this, Next falls back to the apex
  // origin, which 308-redirects to www — and social unfurlers (Twitterbot,
  // iMessage, Slack, WhatsApp, LinkedIn) don't follow redirects on image tags,
  // so the card renders with no image.
  metadataBase: new URL("https://www.makanofficial.com"),
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return BASE_METADATA

  const t = await getTranslations({ locale, namespace: "Metadata.site" })

  return {
    ...BASE_METADATA,
    title: t("title"),
    description: t("description"),
  }
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ locale: string }>
}>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  setRequestLocale(locale)
  const t = await getTranslations("Global")

  return (
    <ViewTransitions>
      <html lang={locale} className={jakarta.variable}>
        <body className="font-sans antialiased">
          <NextIntlClientProvider>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-brand-orange focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
            >
              {t("skipToContent")}
            </a>
            <Navbar />
            {children}
            <SmoothScroll />
            {process.env.VERCEL ? <SafeAnalytics /> : null}
          </NextIntlClientProvider>
        </body>
      </html>
    </ViewTransitions>
  )
}
