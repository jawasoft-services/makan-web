import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { getClaimVenue, type ClaimVenue } from "@/lib/claim-link"
import { getPlacePhoto } from "@/lib/place-photo"
import { localizePath } from "@/i18n/paths"
import GetAppLink from "./GetAppLink"
import Footer from "@/components/Footer"
import styles from "@/components/standings/public-pages.module.css"

/*
 * RM20363 — where a claim link or QR lands when the Makan app isn't installed
 * (E2). With the app installed, iOS opens /claim/<token> in the app instead
 * (apple-app-site-association). The link only picks the venue; claiming and
 * every check happen in the app.
 */
export const revalidate = 300
export const dynamicParams = true

interface Props {
  params: Promise<{ locale: string; token: string }>
}

const primary = styles.primary
const secondary = styles.secondary
const textLink = styles.textLink

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, token } = await params
  const venue = await getClaimVenue(token)
  const t = await getTranslations({ locale, namespace: "Claim" })
  return {
    title: venue ? (venue.claimed ? t("claimedTitle", { name: venue.name }) : t("metaTitle", { name: venue.name })) : t("metaTitleUnknown"),
    // Utility pages for owners: keep them out of search.
    robots: { index: false, follow: false },
  }
}

function disputeHref(venue: ClaimVenue, subject: string, body: string) {
  return `mailto:support@makanofficial.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${body}\n\nPlace ID: ${venue.placeId}`)}`
}

export default async function ClaimPage({ params }: Props) {
  const { locale, token } = await params
  setRequestLocale(locale)
  const t = await getTranslations("Claim")
  const venue = await getClaimVenue(token)
  const photo = venue ? await getPlacePhoto(venue.placeId) : null

  return (
    <div className={styles.page}>
      {/* The site header (with the Makan wordmark) sits above; pt-24 clears it. */}
      <main id="main-content" className={styles.handoff}>
        <Image src="/redesign/maitred-crown.svg" alt="" width={150} height={140} className={styles.handoffArt} />
        {venue ? (
          <>
            <h1 className="text-[1.875rem] font-extrabold leading-tight tracking-tight text-brand-ink">
              {venue.claimed ? t("claimedTitle", { name: venue.name }) : t("title", { name: venue.name })}
            </h1>
            <p className="mt-2 text-[1.0625rem] leading-relaxed text-brand-muted">
              {venue.claimed ? t("claimedBody") : t("body")}
            </p>

            <section aria-label={venue.name} className={styles.handoffVenue}>
              {photo ? (
                <div className="relative h-40 w-full">
                  <Image src={photo.uri} alt={venue.name} fill sizes="(max-width: 448px) 100vw, 448px" className="object-cover" />
                  {/* Google requires the photographer's credit beside a Places photo. */}
                  <p className="absolute bottom-2 right-3 rounded-full bg-brand-ink/60 px-2.5 py-1 text-[0.68rem] text-white/90">
                    {photo.authorUri ? (
                      <a href={photo.authorUri} rel="noopener" target="_blank" className="font-semibold">{t("photoCredit", { author: photo.author || "Google Maps" })}</a>
                    ) : t("photoCredit", { author: photo.author || "Google Maps" })}
                  </p>
                </div>
              ) : null}
              <div className="p-4">
                <p className="text-[1.375rem] font-bold leading-snug text-brand-ink">{venue.name}</p>
                {venue.area ? <p className="mt-1 text-[0.9375rem] text-brand-muted">{venue.area}</p> : null}
                <p className="mt-1 text-[0.9375rem] text-brand-muted">{t("meals", { count: venue.mealCount })}</p>
              </div>
            </section>

            {venue.claimed ? null : <p className="mt-5 text-[0.9375rem] leading-relaxed text-brand-muted">{t(venue.appLink ? "howItWorks" : "howItWorksFind")}</p>}

            <div className={styles.handoffActions}>
              {venue.claimed ? (
                <>
                  <a href={disputeHref(venue, t("disputeSubject", { name: venue.name }), t("disputeBody"))} className={primary}>{t("tellUs")}</a>
                  <GetAppLink className={textLink}>{t("getApp")}</GetAppLink>
                </>
              ) : (
                <>
                  <GetAppLink className={primary}>{t("getApp")}</GetAppLink>
                  {/* A universal link tapped on its own website stays in the browser, so this uses the app's scheme. */}
                  {venue.appLink ? <a href={`makanapp://claim/${venue.token}`} className={secondary}>{t("haveApp")}</a> : null}
                </>
              )}
            </div>
          </>
        ) : (
          <>
            <h1 className="text-[1.875rem] font-extrabold leading-tight tracking-tight text-brand-ink">{t("notFoundTitle")}</h1>
            <p className="mt-2 text-[1.0625rem] leading-relaxed text-brand-muted">{t("notFoundBody")}</p>
            <div className={styles.handoffActions}>
              <Link href={localizePath(locale, "/partner")} className={primary}>{t("tellUsAboutPlace")}</Link>
              <GetAppLink className={textLink}>{t("getApp")}</GetAppLink>
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  )
}
