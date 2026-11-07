import PlayfulArrow from '@/components/PlayfulArrow'
import type { Metadata } from "next"
import Image from "next/image"
import styles from "@/components/utility.module.css"
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

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)
  const [t, account, data] = await Promise.all([
    getTranslations("Support"), getTranslations("AccountDeletion"), getTranslations("DataDeletion"),
  ])
  const faqs = locale === "id" ? SUPPORT_FAQS_ID : SUPPORT_FAQS
  return (
    <div className="min-h-screen bg-brand-cream">
      <FaqSchema items={faqs} />
      <main id="main-content" className={styles.page}>
        <header className={styles.heading}>
          <p className={styles.eyebrow}>{t("eyebrow")}</p>
          <h1>{t("title")}</h1><p className={styles.intro}>{t("intro")}</p>
        </header>
        <div className={styles.supportLayout}>
          <aside className={styles.contactCard}>
            <Image className={styles.bowl} src="/redesign/food-noodles.svg" width={142} height={114} alt="" aria-hidden />
            <h2>{t("emailUs")}</h2><a className={styles.email} href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
            <p>{t("reply")}</p><p>{t("details")}</p>
            <p>{t("press")} <Link href={localizePath(locale, "/contact")}>{t("contact")}</Link>.</p>
          </aside>
          <section className={styles.questions} aria-labelledby="support-questions">
            <h2 id="support-questions">{t("questions")}</h2>
            {faqs.map(f => <details name="support-faq" key={f.q} className={styles.faq}>
              <summary>{f.q}<span aria-hidden>+</span></summary><p>{f.a}</p>
            </details>)}
          </section>
        </div>
        <div className={styles.bottomGrid}>
          <section><h2>{t("dataTitle")}</h2><p>{t("dataBody")} <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
            <div className={styles.linkRow}><Link href={localizePath(locale, "/privacy-policy")}>{t("privacy")}</Link><Link href="/tos">{t("terms")}</Link></div>
          </section>
          <nav className={styles.linkStack} aria-label={account("relatedLinksLabel")}>
            <Link href={localizePath(locale, "/account-deletion")}>{account("title")} <PlayfulArrow /></Link>
            <Link href={localizePath(locale, "/data-deletion")}>{data("title")} <PlayfulArrow /></Link>
          </nav>
        </div>
        <section className={styles.company}><h2>{t("who")}</h2>
          <p lang="en">{COMPANY.legalName} is a company registered in England and Wales, company no. {COMPANY.registration}. Registered office: 86–90 Paul Street, London EC2A 4NE, United Kingdom.</p>
        </section>
      </main><Footer />
    </div>
  )
}
