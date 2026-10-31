import type { Metadata } from "next"
import Image from "next/image"
import { getTranslations, setRequestLocale } from "next-intl/server"
import { getLinkedPlace } from "@/lib/place-link"
import PlaceLinkActions from "./PlaceLinkActions"

/*
 * RM20333 — the web page behind a Makan restaurant or dish link (what a friend gets from "Send to
 * WhatsApp"). With the app installed the link opens the app instead (AASA / assetlinks); without it
 * this page shows the public restaurant or dish, and "Get Makan" carries the link through install.
 * Public projection data only; see lib/place-link.ts.
 */
export interface PlaceLinkProps {
  params: Promise<{ locale: string; placeId: string; dishId?: string }>
}

const primary = "inline-flex min-h-14 w-full items-center justify-center rounded-2xl bg-brand-orange px-6 py-3 text-center text-lg font-bold leading-snug text-white transition-transform active:scale-[0.98]"
const secondary = "inline-flex min-h-14 w-full items-center justify-center rounded-2xl border-[1.5px] border-brand-ink px-6 py-3 text-center text-lg font-bold leading-snug text-brand-ink transition-transform active:scale-[0.98]"

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
    <div className="flex min-h-screen flex-col bg-brand-cream">
      {/* The site header (with the Makan wordmark) sits above; pt-24 clears it. */}
      <main id="main-content" className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-8 pt-24">
        {place && heading ? (
          <>
            {place.imageUrl ? (
              <div className="relative h-56 w-full overflow-hidden rounded-2xl bg-brand-card">
                <Image src={place.imageUrl} alt={t("photoAlt", { name: heading })} fill priority sizes="(max-width: 448px) 100vw, 448px" className="object-cover" />
              </div>
            ) : null}
            <p className="mt-5 inline-flex w-fit rounded-lg bg-brand-card px-2.5 py-1 text-[0.8125rem] font-bold text-brand-muted">
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
            <h1 className="text-[1.875rem] font-extrabold leading-tight tracking-tight text-brand-ink">{t("unknownTitle")}</h1>
            <p className="mt-2 text-[1.0625rem] leading-relaxed text-brand-muted">{t("unknownBody")}</p>
          </>
        )}
        <div className="mt-auto flex flex-col gap-3 pt-10">
          <PlaceLinkActions link={link} appPath={appPath} openLabel={t("open")} getLabel={t("get")} className={{ primary, secondary }} />
          <p className="px-2 text-center text-[0.8125rem] text-brand-muted">{t("afterInstall")}</p>
        </div>
      </main>
    </div>
  )
}
