import { getLocale, getTranslations } from "next-intl/server"
import Image from "next/image"
import Link from "next/link"
import Reveal from "@/components/motion/Reveal"
import { localizePath } from "@/i18n/paths"
import { getMaitredVenues, type MaitredVenue } from "@/lib/maitred"
import { getPlacePhoto } from "@/lib/place-photo"

/**
 * Every restaurant with a current Maître d'. Restaurants whose Maître d'
 * left a note are cards that answer "what should I order here?": the venue
 * first, the dish second. The rest are one plain list, so every holder is
 * shown and nobody gets an empty tile. Renders nothing until someone holds
 * a seat (or when the list cannot be read).
 */
export default async function MaitredShowcase() {
  const venues = await getMaitredVenues()
  if (!venues?.length) return null
  const t = await getTranslations("Decision.Maitred")
  const tp = await getTranslations("Places")
  const locale = await getLocale()
  const picks = venues.filter((v) => v.notes.always)
  const others = venues.filter((v) => !v.notes.always)
  // The Google photo (month-cached, credited) only where no public meal has one.
  const googlePhotos = await Promise.all(picks.map((v) => (v.photo ? null : getPlacePhoto(v.placeId))))

  return (
    <section id="maitred" className="scroll-mt-[86px] w-full bg-brand-cream px-5 py-20 md:px-10 md:py-28">
      <Reveal className="mx-auto max-w-5xl">
        <p data-beat className="text-[0.82rem] font-semibold uppercase tracking-[0.16em] text-brand-orange">
          {t("eyebrow")}
        </p>
        <h2
          data-beat
          style={{ "--beat": 1 } as React.CSSProperties}
          className="mt-4 max-w-[18ch] text-balance text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.02em] text-brand-ink"
        >
          {t("title")}
        </h2>
        <p data-beat style={{ "--beat": 2 } as React.CSSProperties} className="mt-6 max-w-[50ch] text-[1.125rem] leading-[1.55] text-brand-ink">
          {t("body", { count: venues.length })}
        </p>

        <ul data-beat style={{ "--beat": 3 } as React.CSSProperties} className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {picks.map((v, i) => (
            <li key={v.placeId} className="flex">
              <PickCard venue={v} locale={locale} google={googlePhotos[i]} credit={(author) => tp("photoCredit", { author })} byline={t("byline", { name: v.holderName })} label={t("whatToOrder")} />
            </li>
          ))}
          {others.length ? (
            <li className="flex flex-col rounded-2xl border border-brand-line bg-brand-card px-5 pb-2 pt-5">
              <h3 className="text-[1.0625rem] font-bold leading-[1.3] text-brand-ink">{t("othersTitle")}</h3>
              <p className="mt-1 text-[0.9375rem] leading-[1.4] text-brand-muted">{t("othersSub")}</p>
              <ul className="mt-2">
                {others.map((v) => (
                  <li key={v.placeId} className="border-t border-brand-line">
                    <Link
                      href={localizePath(locale, `/places/${v.slug}`)}
                      className="flex min-h-[60px] items-center gap-3 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink"
                    >
                      <Avatar venue={v} className="h-9 w-9" />
                      <span className="min-w-0">
                        <span className="block text-base font-semibold leading-[1.3] text-brand-ink">{v.name}</span>
                        <span className="block text-sm leading-[1.3] text-brand-muted">
                          {v.where ? `${v.where.city} · ` : ""}
                          {v.holderName}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          ) : null}
        </ul>

        <a
          href={localizePath(locale, "/#faq")}
          className="mt-8 inline-flex min-h-14 items-center rounded-full border-2 border-brand-ink px-7 text-base font-bold text-brand-ink transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink active:translate-y-0"
        >
          {t("cta")}
        </a>
      </Reveal>
    </section>
  )
}

function PickCard({
  venue,
  locale,
  google,
  credit,
  byline,
  label,
}: {
  venue: MaitredVenue
  locale: string
  google: { uri: string; author: string } | null
  credit: (author: string) => string
  byline: string
  label: string
}) {
  const src = venue.photo ?? google?.uri ?? null
  return (
    <Link
      href={localizePath(locale, `/places/${venue.slug}`)}
      className="group flex w-full gap-3.5 rounded-2xl border border-brand-line bg-brand-card p-3 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ink sm:flex-col sm:gap-0 sm:overflow-hidden sm:p-0"
    >
      <span className="relative block h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-brand-cream sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none">
        {src ? (
          <Image src={src} alt="" fill sizes="(min-width: 1024px) 330px, (min-width: 640px) 45vw, 96px" className="object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
        ) : null}
        {/* Google requires the photographer's credit beside a Places photo. */}
        {!venue.photo && google ? (
          <span className="absolute bottom-1.5 right-1.5 hidden rounded-full bg-brand-ink/60 px-2 py-0.5 text-[0.62rem] text-white/90 sm:block">{credit(google.author || "Google Maps")}</span>
        ) : null}
      </span>
      <span className="flex min-w-0 flex-1 flex-col sm:px-5 sm:pb-6 sm:pt-[18px]">
        <span className="text-[1.1875rem] font-bold leading-[1.2] tracking-[-0.01em] text-brand-ink sm:text-[1.625rem] sm:leading-[1.15] sm:tracking-[-0.015em]">{venue.name}</span>
        {venue.where ? (
          <span className="mt-0.5 text-[0.8125rem] leading-[1.3] text-brand-muted sm:mt-1 sm:text-sm">
            {venue.where.city}, {venue.where.country}
          </span>
        ) : null}
        <span className="mt-4 hidden text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-brand-orange sm:block">{label}</span>
        <span className="mt-2 text-base font-semibold leading-[1.3] text-brand-ink sm:mt-1 sm:text-[1.1875rem]">{venue.notes.always}</span>
        <span className="mt-2 flex items-center gap-2 text-sm leading-[1.35] text-brand-ink sm:mt-4 sm:gap-2.5 sm:text-[0.9375rem]">
          <Avatar venue={venue} className="h-7 w-7 sm:h-9 sm:w-9" />
          <span>{byline}</span>
        </span>
      </span>
    </Link>
  )
}

/** The holder's profile photo, or their initial on cream when they have none. */
function Avatar({ venue, className }: { venue: MaitredVenue; className: string }) {
  const box = `relative shrink-0 overflow-hidden rounded-full bg-brand-line ${className}`
  return venue.holderPhoto ? (
    <span className={box}>
      <Image src={venue.holderPhoto} alt="" fill sizes="36px" className="object-cover" />
    </span>
  ) : (
    <span aria-hidden className={`${box} flex items-center justify-center text-sm font-bold text-brand-muted`}>
      {venue.holderName.slice(0, 1).toUpperCase()}
    </span>
  )
}
