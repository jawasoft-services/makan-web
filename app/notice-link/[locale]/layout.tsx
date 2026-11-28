import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { hasLocale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"

/*
 * RM20616 O1 — the notice-link page's own document, as the account-email action page has (app/auth-action): the
 * site's locale layout adds the header, smooth scrolling and Google's analytics tag, and a page whose address holds a
 * code loads no third-party script and nothing it does not draw. Served only through the proxy's rewrite of /d/{code}
 * and /id/d/{code} (lib/notice-link-proxy.ts).
 */

const jakarta = localFont({
  src: [{ path: "../../../public/fonts/PlusJakartaSans-Latin-Variable.woff2", weight: "400 800", style: "normal" }],
  variable: "--font-jakarta",
  display: "swap",
})

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#FF9932",
  colorScheme: "light",
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}
  // The tab title reuses the site's own title, as the action page does: no new words.
  const t = await getTranslations({ locale, namespace: "Metadata.site" })
  return {
    metadataBase: new URL("https://www.makanofficial.com"),
    title: t("title"),
    robots: { index: false, follow: false, nocache: true },
    // The address holds the code: no referrer to anyone, including the function the page calls.
    referrer: "no-referrer",
    formatDetection: { telephone: false, email: false, address: false },
  }
}

export default async function NoticeLinkLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  return (
    <html lang={locale} className={jakarta.variable}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
