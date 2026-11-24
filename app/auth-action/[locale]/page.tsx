import { hasLocale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { localizePath } from "@/i18n/paths"
import { routing } from "@/i18n/routing"
import { ACTION_COOKIE, decodeStoredLink, passThroughUrl, readStoredLink } from "@/lib/auth-action"
import { openingView } from "@/lib/auth-action-flow"
import { Clip, Frame, OpenMakan, STRING_KEYS, withEmail, type Strings } from "./parts"
import ResetFlow from "./ResetFlow"
import styles from "./auth-action.module.css"

/*
 * RM20616 A10 unit 10 (R1) — makanofficial.com/auth/action and /id/auth/action, the page every Makan account
 * email links to (see lib/auth-action.ts). The proxy has already checked the link's apiKey, kept the link in
 * an HttpOnly cookie and taken the code out of the address. This page checks the code with Firebase on the
 * server and shows the approved card for the answer: reset password (ResetFlow), email verified, email
 * changed, email change undone, or the link has expired. With no usable answer, or a case no board covers,
 * the link goes on to Firebase's own page, which works as it does today.
 */

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ locale: string }>
}

async function actionStrings(locale: "en" | "id"): Promise<Strings> {
  const t = await getTranslations({ locale, namespace: "SharePages.authAction" })
  return Object.fromEntries(STRING_KEYS.map((key) => [key, t.raw(key) as string])) as Strings
}

export default async function AuthActionPage({ params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const link = readStoredLink(decodeStoredLink((await cookies()).get(ACTION_COOKIE)?.value))
  if (!link) notFound()

  const view = await openingView(link)
  if (view.view === "firebase") redirect(passThroughUrl(link.project.authDomain, link.query))

  const s = await actionStrings(locale)
  const appPage = localizePath(locale, "/app")

  switch (view.view) {
    case "verified":
      return (
        <Frame>
          <Clip name="friends" />
          <h1 className={styles.title}>{s.emailVerified}</h1>
          <OpenMakan label={s.openMakan} appPath="verified" appPage={appPage} />
        </Frame>
      )
    case "verifyExpired":
      return (
        <Frame>
          <Clip name="saved" />
          <h1 className={styles.title}>{s.expired}</h1>
          <OpenMakan label={s.openMakan} appPath="verify" appPage={appPage} />
        </Frame>
      )
    case "emailChanged":
      return (
        <Frame>
          <Clip name="friends" />
          <h1 className={styles.title}>{s.emailChanged}</h1>
          <p className={styles.line}>{withEmail(s.signInWithEmail, view.email)}</p>
          <OpenMakan label={s.openMakan} appPath="signin" appPage={appPage} />
        </Frame>
      )
    case "emailUndone":
      return (
        <Frame>
          <Clip name="friends" />
          <h1 className={styles.title}>{s.emailChangeUndone}</h1>
          <p className={styles.line}>{withEmail(s.emailIsAgain, view.email)}</p>
          <OpenMakan label={s.openMakan} appPath="signin" appPage={appPage} />
        </Frame>
      )
    case "emailExpired":
      return (
        <Frame>
          <Clip name="saved" />
          <h1 className={styles.title}>{s.expired}</h1>
          <p className={styles.line}>{s.changeEmailAgain}</p>
          <OpenMakan label={s.openMakan} appPath="settings" appPage={appPage} />
        </Frame>
      )
    default:
      return <ResetFlow initial={view} strings={s} locale={locale} supportHref={localizePath(locale, "/support")} appPage={appPage} />
  }
}
