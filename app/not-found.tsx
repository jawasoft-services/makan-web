import Link from "next/link"
import Image from "next/image"

export default function NotFound() {
  return (
    <main id="main-content" className="flex min-h-screen flex-col items-center justify-center bg-brand-cream px-5 sm:px-8 text-center">
      <Image
        src="/makan-icon.svg"
        alt="Makan"
        width={64}
        height={64}
        className="mb-8 rounded-2xl"
      />
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-brand-orange">
        404
      </p>
      <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-brand-ink lg:text-5xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-sm text-base sm:text-lg text-brand-muted">
        Looks like this page wandered off. Let&apos;s get you back to the good stuff.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-brand-orange px-7 py-3 text-base font-semibold text-white shadow-lg shadow-brand-orange/25 transition-transform hover:scale-[1.03]"
      >
        Back to Makan
      </Link>
    </main>
  )
}
