import type { Metadata } from "next"
import Image from "next/image"
import { APP_STORE_URL } from "@/lib/links"
import Footer from "@/components/Footer"

/*
 * Reserved universal-link path — makanofficial.com/invite/<token>. The AASA
 * claims /invite/*, so an invite link opens the app for installed users.
 *
 * The real per-token preview (name-only for a friends-only meal, never the
 * photo/caption) is built by RM18718 (invite-carries-meal), which also mints
 * the `invites/<token>` docs. Until that ships there is nothing to resolve, so
 * this page reads NO token data and shows a privacy-safe generic invite landing
 * that just gets the invitee onto Makan. Never render meal content here.
 */
export const dynamic = "force-dynamic"

const APP_SCHEME_URL = "makanapp://"

export function generateMetadata(): Metadata {
  return {
    title: "You're invited to Makan",
    description:
      "A friend invited you to Makan — a private food diary you share with friends. Free on the App Store.",
    robots: { index: false, follow: true },
  }
}

export default function InviteRedirectPage() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <main
        id="main-content"
        className="flex flex-1 flex-col items-center justify-center px-6 pb-16 pt-28 text-center"
      >
        <Image
          src="/makan-icon.svg"
          alt=""
          width={64}
          height={64}
          className="mb-7 h-16 w-16"
          priority
        />
        <Image
          src="/makan-wordmark.svg"
          alt="Makan"
          width={200}
          height={49}
          className="mb-9 h-auto w-[190px]"
          priority
        />

        <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-brand-orange">
          You&rsquo;re invited
        </p>

        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-brand-ink sm:text-4xl">
          A friend wants to eat with you.
        </h1>

        <p className="mb-9 max-w-sm text-base font-medium leading-relaxed text-brand-muted">
          Makan is a private food diary you share with friends. Get the app and
          you&rsquo;ll land connected — remember every meal, free.
        </p>

        <a
          href={APP_STORE_URL}
          className="inline-flex h-14 items-center justify-center rounded-full bg-brand-orange px-9 text-base font-semibold text-white transition-all hover:shadow-lg hover:shadow-brand-orange/25 active:scale-[0.98]"
        >
          Download on the App Store
        </a>

        <a
          href={APP_SCHEME_URL}
          className="mt-5 text-sm font-medium text-brand-muted underline-offset-4 transition-colors hover:text-brand-ink hover:underline"
        >
          Already have Makan? Open the app
        </a>

        <p className="mt-8 text-xs text-brand-muted">
          Free on iPhone. Android is coming next.
        </p>
      </main>
      <Footer />
    </div>
  )
}
