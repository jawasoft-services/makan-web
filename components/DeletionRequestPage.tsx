import Link from "next/link"
import { getTranslations } from "next-intl/server"
import Footer from "@/components/Footer"
import { localizePath } from "@/i18n/paths"
import { SUPPORT_EMAIL } from "@/lib/support"

type DeletionNamespace = "AccountDeletion" | "DataDeletion"

interface DeletionRequestPageProps {
  locale: string
  namespace: DeletionNamespace
  otherPath: "/account-deletion" | "/data-deletion"
}

export default async function DeletionRequestPage({
  locale,
  namespace,
  otherPath,
}: DeletionRequestPageProps) {
  const t = await getTranslations({ locale, namespace })
  const requestHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(t("emailSubject"))}`
  const steps = [1, 2, 3, 4] as const
  const deletedItems = [1, 2, 3, 4, 5] as const
  const retainedItems = [1, 2, 3, 4] as const

  return (
    <div className="min-h-screen bg-brand-cream">
      <main
        id="main-content"
        className="mx-auto max-w-3xl px-5 pb-16 pt-24 sm:px-8 sm:pb-24 sm:pt-32"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
          {t("eyebrow")}
        </p>
        <h1
          className="mt-4 max-w-2xl text-3xl font-bold text-brand-ink sm:text-4xl lg:text-5xl"
          style={{ letterSpacing: "-0.02em" }}
        >
          {t("title")}
        </h1>
        <p className="mt-6 max-w-2xl text-[15px] leading-[1.75] text-brand-muted sm:text-base">
          {t("intro")}
        </p>

        <section
          aria-labelledby="request-heading"
          className="mt-10 rounded-3xl bg-brand-orange p-6 text-white sm:p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
            Makan
          </p>
          <h2 id="request-heading" className="mt-3 text-2xl font-bold text-white">
            {t("requestTitle")}
          </h2>
          <p className="mt-3 max-w-2xl text-[15px] leading-[1.75] text-white/90">
            {t("requestBody")}
          </p>
          <a
            href={requestHref}
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 py-3 text-center text-sm font-bold text-brand-orange transition-shadow hover:shadow-lg hover:shadow-black/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {t("cta")}
          </a>
          <p className="mt-4 text-sm leading-relaxed text-white/80">{t("noSecrets")}</p>
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-bold text-brand-ink">{t("stepsTitle")}</h2>
          <ol className="mt-6 space-y-4">
            {steps.map((step) => (
              <li
                key={step}
                className="flex gap-4 rounded-2xl border border-brand-line bg-brand-card p-5"
              >
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-orange text-sm font-bold text-white"
                >
                  {step}
                </span>
                <div>
                  <h3 className="font-semibold text-brand-ink">{t(`step${step}Title`)}</h3>
                  <p className="mt-1 text-[15px] leading-[1.7] text-brand-muted">
                    {t(`step${step}Body`)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <section className="rounded-2xl border border-brand-line bg-brand-card p-6">
            <h2 className="text-xl font-bold text-brand-ink">{t("deletedTitle")}</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-[1.7] text-brand-muted">
              {deletedItems.map((item) => (
                <li key={item}>{t(`deletedItem${item}`)}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-brand-line bg-brand-card p-6">
            <h2 className="text-xl font-bold text-brand-ink">{t("retainedTitle")}</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-[15px] leading-[1.7] text-brand-muted">
              {retainedItems.map((item) => (
                <li key={item}>{t(`retainedItem${item}`)}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-5 rounded-2xl border border-brand-line bg-brand-card p-6">
          <h2 className="text-xl font-bold text-brand-ink">{t("retentionTitle")}</h2>
          <p className="mt-3 text-[15px] leading-[1.75] text-brand-muted">
            {t("retentionBody")}
          </p>
        </section>

        <section className="mt-12 border-t border-brand-line pt-10">
          <h2 className="text-xl font-bold text-brand-ink">{t("optionalTitle")}</h2>
          <p className="mt-3 text-[15px] leading-[1.75] text-brand-muted">
            {t("optionalBody")}
          </p>
        </section>

        <section className="mt-10 rounded-2xl bg-brand-card p-6">
          <h2 className="text-lg font-bold text-brand-ink">{t("otherTitle")}</h2>
          <p className="mt-2 text-[15px] leading-[1.7] text-brand-muted">{t("otherBody")}</p>
          <Link
            href={localizePath(locale, otherPath)}
            className="mt-4 inline-flex min-h-11 items-center font-semibold text-brand-orange hover:underline"
          >
            {t("otherLink")}
          </Link>
        </section>

        <nav
          aria-label={t("relatedLinksLabel")}
          className="mt-10 flex flex-col gap-2 border-t border-brand-line pt-8 sm:flex-row sm:items-center sm:gap-6"
        >
          <Link
            href="/privacy-policy"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-brand-orange hover:underline"
          >
            {t("privacyLink")}
          </Link>
          <Link
            href={localizePath(locale, "/")}
            className="inline-flex min-h-11 items-center text-sm text-brand-muted hover:text-brand-orange"
          >
            &larr; {t("backHome")}
          </Link>
        </nav>
      </main>
      <Footer />
    </div>
  )
}
