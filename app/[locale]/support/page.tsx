import type { Metadata } from "next"
import { getTranslations, setRequestLocale } from "next-intl/server"
import Link from "next/link"
import DocPage, { slugId } from "@/components/site/DocPage"
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

// RM20773: the approved prototype's document page (strategy/website-direction-2026-11-25/site/support.html).
// Still a server component: the address and company block carry no reveal, so they show with or without script.
export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const [t, account, data] = await Promise.all([
    getTranslations("Support"), getTranslations("AccountDeletion"), getTranslations("DataDeletion"),
  ])
  const faqs = locale === "id" ? SUPPORT_FAQS_ID : SUPPORT_FAQS
  const heads = [t("emailUs"), t("questions"), t("dataTitle"), t("who")]
  const toc = heads.map(label => ({ id: slugId(label), label }))
  return (
    <main id="main-content" className="sx">
      <FaqSchema items={faqs} />
      <DocPage title={t("title")} lede={t("intro")} toc={toc}>
        <h2 id={toc[0].id}>{t("emailUs")}</h2>
        <a className="mail" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        <p>{t("reply")}</p>
        <p>{t("details")}</p>
        <p>{t("press")} <Link href={localizePath(locale, "/contact")}>{t("contact")}</Link>.</p>
        <h2 id={toc[1].id}>{t("questions")}</h2>
        <div className="faq">{faqs.map(f => <details name="support-faq" key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>)}</div>
        <h2 id={toc[2].id}>{t("dataTitle")}</h2>
        <p>{t("dataBody")} <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
        <p className="doc-pair"><Link href={localizePath(locale, "/privacy-policy")}>{t("privacy")}</Link><Link href="/tos">{t("terms")}</Link></p>
        <ul className="doc-links" aria-label={account("relatedLinksLabel")}>
          <li><Link href={localizePath(locale, "/account-deletion")}>{account("title")}</Link></li>
          <li><Link href={localizePath(locale, "/data-deletion")}>{data("title")}</Link></li>
        </ul>
        <h2 id={toc[3].id}>{t("who")}</h2>
        <p lang="en">{COMPANY.legalName} is a company registered in England and Wales, company no. {COMPANY.registration}. Registered office: 86–90 Paul Street, London EC2A 4NE, United Kingdom.</p>
      </DocPage>
    </main>
  )
}
