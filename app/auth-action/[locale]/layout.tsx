import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { hasLocale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { notFound } from "next/navigation"
import { routing } from "@/i18n/routing"

/*
 * RM20616 A10 unit 10 (R1) — the account-email action page's own document. It is a separate root layout on
 * purpose: the site's locale layout adds the header, smooth scrolling and Google's analytics tag, and a page
 * that holds a password-reset code loads no third-party script and nothing it does not draw. Served only
 * through the proxy's rewrite of /auth/action and /id/auth/action (lib/auth-action-proxy.ts).
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
  // The tab title reuses the site's own title (Devon, 24 Nov 2026): no new words.
  const t = await getTranslations({ locale, namespace: "Metadata.site" })
  return {
    metadataBase: new URL("https://www.makanofficial.com"),
    title: t("title"),
    robots: { index: false, follow: false, nocache: true },
    // No referrer to any other site; same-origin keeps the form posts working with JavaScript off (lib/auth-action.ts).
    referrer: "same-origin",
    formatDetection: { telephone: false, email: false, address: false },
  }
}

export default async function AuthActionLayout({
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
