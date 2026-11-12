import type { Metadata } from "next"
import Image from "next/image"
import { getTranslations, setRequestLocale } from "next-intl/server"
import StoreLink from "@/components/home/StoreLink"
import Footer from "@/components/Footer"
import styles from "@/components/standings/public-pages.module.css"

/*
 * RM20356 — the "Continue" link in Makan's verification email lands here
 * (https://www.makanofficial.com/verified). With the app installed, iOS opens it
 * in Makan (apple-app-site-association) and the Verify screen carries on by
 * itself. This page is for everyone else: a browser, a computer, or a phone
 * without the app. Verification already happened on Firebase's page; nothing
 * here reads or writes anything.
 */

interface Props {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Verified" })
  return {
    title: t("metaTitle"),
    // A step in sign-up, not a page to find.
    robots: { index: false, follow: false },
    referrer: "no-referrer",
  }
}

export default async function VerifiedPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("Verified")
  const g = await getTranslations("Global")

  return (
    <div className={styles.page}>
      <main id="main-content" className={styles.handoff}>
        <Image src="/redesign/food-plate.svg" alt="" width={150} height={140} className={styles.handoffArt} />
        <h1 className="text-brand-ink">{t("title")}</h1>
        <p className="text-brand-muted">{t("body")}</p>
        <div className={styles.handoffActions}>
          {/* A universal link tapped on its own website stays in the browser, so this uses the app's scheme. */}
          <a href="makanapp://verified" className={styles.primary}>{t("open")}</a>
        </div>
        <p className={styles.handoffNote}>{t("otherDevice")}</p>
        <div className={styles.handoffActions}>
          <StoreLink location="email-verified" className={styles.secondary} size="compact">
            {g("downloadAppStore")}
          </StoreLink>
        </div>
      </main>
      <Footer />
    </div>
  )
}
