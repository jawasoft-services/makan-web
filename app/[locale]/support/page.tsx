import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import Link from "next/link"
import Footer from "@/components/Footer"
import FaqSchema from "@/components/FaqSchema"
import { SUPPORT_EMAIL, SUPPORT_FAQS, SUPPORT_FAQS_ID } from "@/lib/support"
import { COMPANY } from "@/lib/press"
import { createPageMetadata } from "@/lib/site-metadata"
import { localizePath } from "@/i18n/paths"

// The App Store Connect "Support URL" points here. Apple's field text requires the
// page to "lead to actual contact information (legal address, email address …) so
// that users can reach you regarding app issues, general feedback, and feature
// enhancement requests", and reviewers open it on mobile Safari.
//
// So: this page is a pure server component with NO client JavaScript. The email
// address and the company block are static text, and the FAQ uses native
// <details> rather than a stateful accordion. There is no render path where the
// contact method disappears. Keep it that way — do not add 'use client' here.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "Support" })
  return createPageMetadata({
    title: t("metaTitle"),
    description: t("metaDescription"),
    path: locale === "id" ? "/id/support" : "/support",
    type: "article",
    locale,
  })
}

export default async function SupportPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const t = await getTranslations("Support")
  const faqs = locale === "id" ? SUPPORT_FAQS_ID : SUPPORT_FAQS

  return (
    <div className="min-h-screen bg-brand-cream">
      <FaqSchema items={faqs} />
      <main
        id="main-content"
        className="mx-auto max-w-2xl px-5 sm:px-8 pt-24 sm:pt-32 pb-16 sm:pb-24"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
          {t("eyebrow")}
        </p>
        <h1
          className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-ink"
          style={{ letterSpacing: "-0.02em" }}
        >
          {t("title")}
        </h1>
        <p className="mt-6 text-[15px] sm:text-base leading-[1.75] text-brand-muted">
          {t("intro")}
        </p>

        {/* Contact — the section Apple's field text is asking for. Static, no JS. */}
        <div className="mt-10 rounded-2xl border border-brand-line bg-brand-card p-6">
          <h2 className="text-lg font-semibold text-brand-ink">{t("emailUs")}</h2>
          <p className="mt-3">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="text-lg font-semibold text-brand-orange hover:underline"
            >
              {SUPPORT_EMAIL}
            </a>
          </p>
          <p className="mt-3 text-[15px] leading-[1.75] text-brand-muted">
            {t("reply")}
          </p>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {t("details")}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-brand-muted">
            {t("press")}{" "}
            <Link href={localizePath(locale, "/contact")} className="text-brand-orange hover:underline">
              {t("contact")}
            </Link>
            .
          </p>
        </div>

        {/* Common questions — native <details>, so every answer is in the HTML. */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">
            {t("questions")}
          </h2>
          <div className="mt-6">
            {faqs.map((f) => (
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
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">{t("dataTitle")}</h2>
          <p className="mt-4 text-[15px] leading-[1.75] text-brand-muted">
            {t("dataBody")}{" "}
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
              {t("privacy")}
            </Link>
            {" · "}
            <Link href="/tos" className="text-brand-orange hover:underline">
              {t("terms")}
            </Link>
          </p>
        </section>

        {/* Statutory trading disclosure — same wording as components/Footer.tsx
            (Companies Act 2006 / 2015 Names & Trading Disclosures Regs, reg. 25). */}
        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">{t("who")}</h2>
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
