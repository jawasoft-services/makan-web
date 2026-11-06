import type { Metadata } from "next"
import Image from "next/image"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { getLinkedPlace } from "@/lib/place-link"
import PlaceLinkActions from "./PlaceLinkActions"
import Footer from "@/components/Footer"
import styles from "@/components/standings/public-pages.module.css"

/*
 * RM20333 — the web page behind a Makan restaurant or dish link (what a friend gets from "Send to
 * WhatsApp"). With the app installed the link opens the app instead (AASA / assetlinks); without it
 * this page shows the public restaurant or dish, and "Get Makan" carries the link through install.
 * Public projection data only; see lib/place-link.ts.
 */
export interface PlaceLinkProps {
  params: Promise<{ locale: string; placeId: string; dishId?: string }>
}

const primary = styles.primary
const secondary = styles.secondary

const canonicalLink = (placeId: string, dishId?: string) =>
  `https://www.makanofficial.com/p/${placeId}${dishId ? `/${dishId}` : ""}`

export async function placeLinkMetadata({ params }: PlaceLinkProps): Promise<Metadata> {
  const { locale, placeId, dishId } = await params
  const place = await getLinkedPlace(placeId, dishId)
  const t = await getTranslations({ locale, namespace: "PlaceLink" })
  if (!place) return { title: t("metaTitleUnknown"), robots: { index: false, follow: false } }
  const title = place.dish ? t("metaTitleDish", { dish: place.dish.name, place: place.name }) : t("metaTitlePlace", { place: place.name })
  const description = place.dish ? t("descDish", { place: place.name }) : t("descPlace", { count: place.publicMealCount })
  return {
    title,
    description,
    // Utility pages that friends open from a message; the public /places/ pages are the indexed ones.
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      url: canonicalLink(placeId, dishId),
      type: "website",
      images: place.imageUrl ? [{ url: place.imageUrl }] : [],
    },
    twitter: { card: place.imageUrl ? "summary_large_image" : "summary", title, description, images: place.imageUrl ? [place.imageUrl] : [] },
  }
}

export default async function PlaceLinkPage({ params }: PlaceLinkProps) {
  const { locale, placeId, dishId } = await params
  setRequestLocale(locale)
  const t = await getTranslations("PlaceLink")
  const place = await getLinkedPlace(placeId, dishId)
  const link = canonicalLink(placeId, dishId)
  const appPath = `p/${placeId}${dishId ? `/${dishId}` : ""}`
  const heading = place?.dish?.name ?? place?.name
  const dishMeals = place?.dish?.publicMealCount ?? 0

  return (
    <div className={styles.page}>
      {/* The site header (with the Makan wordmark) sits above; pt-24 clears it. */}
      <main id="main-content" className={styles.handoff}>
        {place && heading ? (
          <>
            {place.imageUrl ? (
              <div className={styles.handoffPhoto}>
                <Image src={place.imageUrl} alt={t("photoAlt", { name: heading })} fill priority sizes="(max-width: 738px) calc(100vw - 48px), 690px" className="object-cover" />
              </div>
            ) : null}
            <p className={styles.tag}>
              {place.dish ? t("tagDish") : t("tagPlace")}
            </p>
            <h1 className="mt-2 text-[1.875rem] font-extrabold leading-tight tracking-tight text-brand-ink">{heading}</h1>
            {place.dish ? <p className="mt-1 text-[1.0625rem] text-brand-muted">{place.name}</p> : null}
            <p className="mt-3 text-[0.9375rem] leading-relaxed text-brand-muted">
              {place.dish
                ? (dishMeals > 0 ? t("dishMeals", { count: dishMeals }) : "")
                : t("meals", { count: place.publicMealCount })}
            </p>
          </>
        ) : (
          <>
            <Image src="/redesign/food-plate.svg" alt="" width={150} height={140} className={styles.handoffArt} />
            <h1 className="text-[1.875rem] font-extrabold leading-tight tracking-tight text-brand-ink">{t("unknownTitle")}</h1>
            <p className="mt-2 text-[1.0625rem] leading-relaxed text-brand-muted">{t("unknownBody")}</p>
          </>
        )}
        <div className={styles.handoffActions}>
          <PlaceLinkActions link={link} appPath={appPath} openLabel={t("open")} getLabel={t("get")} className={{ primary, secondary }} />
        </div>
        <p className={styles.handoffNote}>{t("afterInstall")}</p>
      </main>
      <Footer />
    </div>
  )
}
