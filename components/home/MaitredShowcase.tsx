import { getLocale, getTranslations } from "next-intl/server"
import Image from "next/image"
import Link from "next/link"
import Reveal from "@/components/motion/Reveal"
import { localizePath } from "@/i18n/paths"
import { getMaitredDirectory, type MaitredVenue } from "@/lib/maitred"
import { getPlacePhoto } from "@/lib/place-photo"
import { getVerifiedMenuPrice } from "@/lib/verified-menu-price"
import { thumbUrl } from "@/lib/thumb"
import { localPhoto } from "@/lib/local-photo"
import { getHiddenPlaceIds } from "@/lib/web-listing"

// All eligible holders, without inferring vacancy from a missing or filtered entry.
export default async function MaitredShowcase({ dedicated = false }: { dedicated?: boolean }) {
  const directory = await getMaitredDirectory()
  const venues = directory.venues
  if (!dedicated && !venues.length) return null
  const page = await getTranslations("MaitredPage")
  const t = await getTranslations("Decision.Maitred")
  const tp = await getTranslations("Places")
  const locale = await getLocale()
  const picks = venues.filter((v) => v.notes.always)
  const others = venues.filter((v) => !v.notes.always)
  const single = dedicated && picks.length === 1 && !others.length
  // The Google photo (month-cached, credited) only where no public meal has one.
  const googlePhotos = await Promise.all(picks.map((v) => (v.photo ? null : getPlacePhoto(v.placeId))))
  // RM20616 dish pages U2: a venue taken down stays listed as it is; its name is plain text, not a link to its page.
  const hidden = await getHiddenPlaceIds()
  const othersRow = "flex min-h-[60px] items-center gap-3 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink"

  return (
    <section id="maitred" className="scroll-mt-[86px] w-full bg-brand-cream px-5 py-20 md:px-10 md:py-28">
      <Reveal className="mx-auto max-w-5xl">
        <p data-beat className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-brand-muted">
          {t("eyebrow")}
        </p>
        <h2
          data-beat
          style={{ "--beat": 1 } as React.CSSProperties}
          className="mt-4 max-w-[18ch] text-balance text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.02em] text-brand-ink"
        >
          {dedicated ? page("proofTitle") : t("title")}
        </h2>
        {(!dedicated || !venues.length) ? <p data-beat style={{ "--beat": 2 } as React.CSSProperties} className="mt-6 max-w-[50ch] text-[1.125rem] leading-[1.55] text-brand-ink">
          {venues.length ? t("body", { count: venues.length }) : page(directory.status === "disabled" ? "proofDisabled" : directory.status === "unavailable" ? "proofUnavailable" : "proofEmpty")}
        </p> : null}

        <ul data-beat style={{ "--beat": 3 } as React.CSSProperties} className={`mt-10 grid grid-cols-1 gap-3 sm:gap-4 ${single ? "" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          {picks.map((v, i) => (
            <li key={v.placeId} className="flex">
              <PickCard venue={v} linked={!hidden.has(v.placeId)} locale={locale} google={googlePhotos[i]} credit={(author) => tp("photoCredit", { author })} byline={t("byline", { name: v.holderName })} label={t("whatToOrder")} menuPriceLabel={(price) => tp("menuPriceLabel", { price })} wide={single} />
            </li>
          ))}
          {others.length ? (
            <li className="flex flex-col rounded-2xl border border-brand-line bg-brand-card px-5 pb-2 pt-5">
              <h3 className="text-[1.0625rem] font-bold leading-[1.3] text-brand-ink">{t("othersTitle")}</h3>
              <p className="mt-1 text-[0.9375rem] leading-[1.4] text-brand-muted">{t("othersSub")}</p>
              <ul className="mt-2">
                {others.map((v) => {
                  const row = <>
                      <Avatar venue={v} className="h-9 w-9" />
                      <span className="min-w-0">
                        <span className="block text-base font-semibold leading-[1.3] text-brand-ink">{v.name}</span>
                        <span className="block text-sm leading-[1.3] text-brand-muted">
                          {v.where ? `${v.where.city} · ` : ""}
                          {v.holderName}
                        </span>
                      </span>
                  </>
                  return <li key={v.placeId} className="border-t border-brand-line">
                    {hidden.has(v.placeId) ? <div className={othersRow}>{row}</div> : <Link
                      href={localizePath(locale, `/places/${v.slug}`)}
                      className={othersRow}
                    >
                      {row}
                    </Link>}
                  </li>
                })}
              </ul>
            </li>
          ) : null}
        </ul>

        {!dedicated ? <a
          href={localizePath(locale, "/maitre-d")}
          className="mt-8 inline-flex min-h-14 items-center rounded-full border-2 border-brand-ink px-7 text-base font-bold text-brand-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
        >
          {t("cta")}
        </a> : null}
      </Reveal>
    </section>
  )
}

function PickCard({
  venue,
  linked,
  locale,
  google,
  credit,
  byline,
  label,
  menuPriceLabel,
  wide,
}: {
  venue: MaitredVenue
  /** False for a venue taken down (RM20616 dish pages U2): its name is plain text and the card is not a link. */
  linked: boolean
  locale: string
  google: { uri: string; author: string } | null
  credit: (author: string) => string
  byline: string
  label: string
  menuPriceLabel: (price: string) => string
  wide: boolean
}) {
  // Meal photos go through the resize route: the originals are phone photos up to 2048px wide.
  const src = venue.photo ? thumbUrl(localPhoto(venue.photo, 330), 720) : google?.uri ?? null
  const menuPrice = getVerifiedMenuPrice(venue.slug, venue.notes.always)
  return (
    <div
      className={`group relative flex w-full gap-3.5 rounded-2xl border border-brand-line bg-brand-card p-3 sm:gap-0 sm:overflow-hidden sm:p-0 ${wide ? "sm:flex-row" : "sm:flex-col"}`}
    >
      {src ? <span className={`relative block h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-cream sm:h-auto sm:rounded-none ${wide ? "sm:aspect-square sm:w-[42%]" : "sm:aspect-[4/3] sm:w-full"}`}>
        {src ? (
          <Image src={src} alt="" fill sizes="(min-width: 1024px) 330px, (min-width: 640px) 45vw, 96px" className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : null}
        {/* Google requires the photographer's credit beside a Places photo. On phones the photo is a
            96px square, so the credit sits in the text column instead (below); the overlay is for
            the wider photo from `sm` up. */}
        {!venue.photo && google ? (
          <span className="absolute left-1.5 right-1.5 top-1.5 hidden rounded-md bg-brand-ink/80 px-2 py-1 text-[0.68rem] leading-tight text-white sm:block">{credit(google.author || "Google Maps")}</span>
        ) : null}
      </span> : null}
      <span className={`flex min-w-0 flex-1 flex-col sm:px-5 sm:pb-6 sm:pt-[18px] ${wide ? "sm:justify-center sm:px-10 sm:py-10" : ""}`}>
        {linked ? <Link href={localizePath(locale, `/places/${venue.slug}`)} className="text-[1.1875rem] font-bold leading-[1.2] tracking-[-0.01em] text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink sm:text-[1.625rem] sm:leading-[1.15] sm:tracking-[-0.015em]">
          {venue.name}<span aria-hidden="true" className="absolute inset-0 rounded-2xl" />
        </Link> : <span className="text-[1.1875rem] font-bold leading-[1.2] tracking-[-0.01em] text-brand-ink sm:text-[1.625rem] sm:leading-[1.15] sm:tracking-[-0.015em]">{venue.name}</span>}
        {venue.where ? (
          <span className="mt-0.5 text-[0.8125rem] leading-[1.3] text-brand-muted sm:mt-1 sm:text-sm">
            {venue.where.city}, {venue.where.country}
          </span>
        ) : null}
        <span className="mt-4 hidden text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-brand-orange sm:block">{label}</span>
        <span className="mt-2 text-base font-semibold leading-[1.3] text-brand-ink sm:mt-1 sm:text-[1.1875rem]">{venue.notes.always}</span>
        {menuPrice ? <a href={menuPrice.menuUrl} className="relative z-10 mt-1 inline-flex min-h-11 w-fit items-center text-sm font-semibold leading-[1.4] text-brand-ink focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink">{menuPriceLabel(menuPrice.price)}</a> : null}
        <span className="mt-2 flex items-center gap-2 text-sm leading-[1.35] text-brand-ink sm:mt-4 sm:gap-2.5 sm:text-[0.9375rem]">
          <Avatar venue={venue} className="h-7 w-7 sm:h-9 sm:w-9" />
          <span>{byline}</span>
        </span>
        {!venue.photo && google ? (
          <span className="mt-2 text-xs leading-[1.35] text-brand-muted sm:hidden">{credit(google.author || "Google Maps")}</span>
        ) : null}
      </span>
    </div>
  )
}

/** The holder's profile photo, or their initial on cream when they have none. */
function Avatar({ venue, className }: { venue: MaitredVenue; className: string }) {
  const box = `relative shrink-0 overflow-hidden rounded-full bg-brand-line ${className}`
  return venue.holderPhoto ? (
    <span className={box}>
      <Image src={thumbUrl(venue.holderPhoto, 240)} alt="" fill sizes="36px" className="object-cover" />
    </span>
  ) : (
    <span aria-hidden className={`${box} flex items-center justify-center text-sm font-bold text-brand-muted`}>
      {venue.holderName.slice(0, 1).toUpperCase()}
    </span>
  )
}
