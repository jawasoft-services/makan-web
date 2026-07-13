import type { Metadata } from "next"
import Image from "next/image"
import { APP_STORE_URL } from "@/lib/links"
import Footer from "@/components/Footer"

/*
 * Reserved universal-link path — makanofficial.com/u/<username>. The AASA claims
 * /u/*, so once the app ships associatedDomains (RM18722 app side) this link
 * OPENS THE APP on that person's profile for installed users.
 *
 * On the open web we render a privacy-safe generic landing that reads NO profile
 * data — a name, avatar, or meal is never surfaced here. A richer per-user
 * preview (that reads public identity) lands with a profile-share feature under
 * its own PII review; this page only reserves the path and gets people the app.
 */
export const dynamic = "force-dynamic"

// The app's only URL scheme (app.json → "scheme": "makanapp"). Best-effort
// "open the app" for people who already have Makan.
const APP_SCHEME_URL = "makanapp://"

export function generateMetadata(): Metadata {
  return {
    title: "Get Makan",
    description:
      "Makan is a private food diary you share with friends. Free on the App Store.",
    // Utility landing for a shared link — keep it out of search.
    robots: { index: false, follow: true },
  }
}

export default function ProfileRedirectPage() {
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

        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-brand-ink sm:text-4xl">
          See their meals on Makan.
        </h1>

        <p className="mb-9 max-w-sm text-base font-medium leading-relaxed text-brand-muted">
          Makan is a private food diary you share with friends — get the app to
          find them and remember every meal, free.
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
