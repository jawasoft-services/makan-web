import { hasLocale } from "next-intl"
import { getTranslations } from "next-intl/server"
import { cookies, headers } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { localizePath } from "@/i18n/paths"
import { routing } from "@/i18n/routing"
import { ACTION_COOKIE, decodeStoredLink, isDoneMarker, passThroughUrl, readStoredLink, type ActionView } from "@/lib/auth-action"
import { isActionPost, isDocumentNavigation, openingView } from "@/lib/auth-action-flow"
import { openAllowed, trustedClientAddress } from "@/lib/auth-action-limit"
import { Clip, Frame, OpenMakan, STRING_KEYS, withEmail, type Strings } from "./parts"
import ResetFlow from "./ResetFlow"
import styles from "./auth-action.module.css"

/*
 * RM20616 A10 unit 10 (R1) — makanofficial.com/auth/action and /id/auth/action, the page every Makan account
 * email links to (see lib/auth-action.ts). The proxy has already checked the link's apiKey, kept the link in
 * an HttpOnly cookie and taken the code out of the address. This page checks the code with Firebase on the
 * server and shows the approved card for the answer: reset password (ResetFlow), email verified, email
 * changed, email change undone, or the link has expired. With no usable answer, a case no board covers, a
 * verification or email-change link fetched by anything but a browser opening it, or a client past the
 * opening limit, the link goes on to Firebase's own page, which works as it does today.
 *
 * Next also draws this page in the answer to the reset card's form posts (actions.ts). There the card shown
 * is the post's own result, so the page asks Google nothing: it draws the reset card's frame, whose first card
 * (the expired card with no seal) the result replaces. That is also what a link that was done with shows
 * (the cookie's DONE_MARKER) until the marker lapses.
 */

export const dynamic = "force-dynamic"

interface Props {
  params: Promise<{ locale: string }>
}

async function actionStrings(locale: "en" | "id"): Promise<Strings> {
  const t = await getTranslations({ locale, namespace: "SharePages.authAction" })
  return Object.fromEntries(STRING_KEYS.map((key) => [key, t.raw(key) as string])) as Strings
}

/** The reset card. Always drawn at the same place in the tree, so a post's answer keeps the client's card. */
async function resetCard(locale: "en" | "id", initial: ActionView) {
  const s = await actionStrings(locale)
  return <ResetFlow initial={initial} strings={s} locale={locale} supportHref={localizePath(locale, "/support")} appPage={localizePath(locale, "/app")} />
}

/** The reset card's first card when nothing is asked of Google: the expired card, with no seal. */
const NO_CALL: ActionView = { view: "expired" }

export default async function AuthActionPage({ params }: Props) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()
  const stored = (await cookies()).get(ACTION_COOKIE)?.value
  if (isDoneMarker(stored)) return resetCard(locale, NO_CALL)
  const link = readStoredLink(decodeStoredLink(stored))
  if (!link) notFound()

  const requestHeaders = await headers()
  if (link.mode === "resetPassword" && isActionPost(requestHeaders)) return resetCard(locale, NO_CALL)

  const firebasePage = passThroughUrl(link.project.authDomain, link.query)
  // A client opening the page over and over is sent on to Firebase's own page, which asks Google nothing on
  // Makan's behalf (lib/auth-action-limit.ts).
  if (!openAllowed(trustedClientAddress(requestHeaders))) redirect(firebasePage)

  const view = await openingView(link, { navigation: isDocumentNavigation(requestHeaders) })
  if (view.view === "firebase") redirect(firebasePage)

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
      return resetCard(locale, view)
  }
}
