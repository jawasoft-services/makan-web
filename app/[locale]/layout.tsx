import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { NextIntlClientProvider, hasLocale } from "next-intl"
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server"
import { notFound } from "next/navigation"
import SafeAnalytics from "@/components/SafeAnalytics"
import SiteHeader from "@/components/site/SiteHeader"
import SiteFooter from "@/components/site/SiteFooter"
import SiteMotion from "@/components/site/SiteMotion"
import { fraunces } from "@/components/site/fonts"
import { routing } from "@/i18n/routing"
import "../globals.css"
import "../redesign.css"
import "@/components/site/site.css"

const jakarta = localFont({
  src: [
    { path: "../../public/fonts/PlusJakartaSans-Latin-Variable.woff2", weight: "400 800", style: "normal" },
    { path: "../../public/fonts/PlusJakartaSans-Latin-Italic-Variable.woff2", weight: "400 800", style: "italic" },
  ],
  variable: "--font-jakarta",
  display: "swap",
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

  const messages = await getMessages()
  // The Decision namespace is deploy-gated (spec §2): its copy must not reach
  // the client payload of live pages. Server components read it via
  // getTranslations, which does not need the client provider.
  // RM20616 A12 U3 — the Share v2 pages read SharePages on the server only, so their copy stays out of
  // every page's client payload too (with the switch off, live pages carry exactly what they carried).
  // RM20773: the home page renders Agr on the server and hands its runtime only Agr.runtime (data.t).
  const clientMessages = Object.fromEntries(
    Object.entries(messages).filter(([namespace]) => namespace !== "Decision" && namespace !== "SharePages" && namespace !== "Agr"),
  )

  return (
      <html lang={locale} className={`${jakarta.variable} ${fraunces.variable}`} data-scroll-behavior="smooth">
        <body className="redesign-site font-sans antialiased">
          <NextIntlClientProvider messages={clientMessages}>
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-brand-orange focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
            >
              {t("skipToContent")}
            </a>
            {/* RM20773: the approved site shell on every page (components/site). It runs on native scroll:
                the magnetic scroll stops would fight a smooth-scroll library. */}
            <SiteHeader />
            {children}
            <SiteFooter />
            <SiteMotion />
            <SafeAnalytics />
          </NextIntlClientProvider>
        </body>
      </html>
  )
}
