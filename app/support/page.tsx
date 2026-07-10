import type { Metadata } from "next"
import Link from "next/link"
import Footer from "@/components/Footer"
import FaqSchema from "@/components/FaqSchema"
import { SUPPORT_EMAIL, SUPPORT_FAQS } from "@/lib/support"
import { COMPANY } from "@/lib/press"

// The App Store Connect "Support URL" points here. Apple's field text requires the
// page to "lead to actual contact information (legal address, email address …) so
// that users can reach you regarding app issues, general feedback, and feature
// enhancement requests", and reviewers open it on mobile Safari.
//
// So: this page is a pure server component with NO client JavaScript. The email
// address and the company block are static text, and the FAQ uses native
// <details> rather than a stateful accordion. There is no render path where the
// contact method disappears. Keep it that way — do not add 'use client' here.

const DESCRIPTION =
  "Get help with Makan — contact support, delete your account, report a problem, or make a privacy request."

export const metadata: Metadata = {
  title: "Support — Makan",
  description: DESCRIPTION,
  alternates: { canonical: "https://www.makanofficial.com/support" },
  openGraph: {
    title: "Support — Makan",
    description: DESCRIPTION,
    url: "https://www.makanofficial.com/support",
    siteName: "Makan",
    type: "article",
  },
  twitter: {
    card: "summary_large_image",
    title: "Support — Makan",
    description: DESCRIPTION,
    site: "@app_makan",
  },
}

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <FaqSchema items={SUPPORT_FAQS} />
      <main
        id="main-content"
        className="mx-auto max-w-2xl px-5 sm:px-8 pt-24 sm:pt-32 pb-16 sm:pb-24"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
          Support
        </p>
        <h1
          className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-ink"
          style={{ letterSpacing: "-0.02em" }}
        >
          How can we help?
        </h1>
        <p className="mt-6 text-[15px] sm:text-base leading-[1.75] text-brand-muted">
          Something broken, a question about your account, or an idea for what Makan
          should do next — write to us and a person will read it.
        </p>

        {/* Contact — the section Apple's field text is asking for. Static, no JS. */}
        <div className="mt-10 rounded-2xl border border-brand-line bg-brand-card p-6">
          <h2 className="text-lg font-semibold text-brand-ink">Email us</h2>
          <p className="mt-3">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-lg font-semibold text-brand-orange hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="mt-3 text-[15px] leading-[1.75] text-brand-muted">
            We aim to reply the same day.
          </p>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            It helps if you tell us what happened, which iPhone you have, the version
            of iOS you&apos;re on, and the Makan version shown in Settings.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-brand-muted">
            Press or partnership enquiries?{" "}
            <Link href="/contact" className="text-brand-orange hover:underline">
              Get in touch here
            </Link>
            .
          </p>
        </div>

        {/* Common questions — native <details>, so every answer is in the HTML. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">
            Common questions
          </h2>
          <div className="mt-6">
            {SUPPORT_FAQS.map((f) => (
              <details key={f.q} className="group border-b border-brand-line py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] font-semibold text-brand-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-xl leading-none text-brand-orange transition-transform duration-200 group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[15px] leading-[1.75] text-brand-muted">
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Your data */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">Your data</h2>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            You can delete your account at any time from within the app. To request
            access to your data, correct it, or ask for a portable copy, email{" "}
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-brand-orange hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            <Link href="/privacy-policy" className="text-brand-orange hover:underline">
              Privacy Policy
            </Link>
            {" · "}
            <Link href="/tos" className="text-brand-orange hover:underline">
              Terms of Service
            </Link>
          </p>
        </section>

        {/* Statutory trading disclosure — same wording as components/Footer.tsx
            (Companies Act 2006 / 2015 Names & Trading Disclosures Regs, reg. 25). */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">Who we are</h2>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {COMPANY.legalName} is a company registered in England and Wales, company
            no. {COMPANY.registration}. Registered office: 86–90 Paul Street, London
            EC2A 4NE, United Kingdom.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  )
}
