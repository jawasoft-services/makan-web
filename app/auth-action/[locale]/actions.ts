"use server"

import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import {
  ACTION_COOKIE,
  DONE_LIFE_SECONDS,
  DONE_MARKER,
  actionCookieOptions,
  cleanPath,
  decodeStoredLink,
  isDoneMarker,
  passThroughUrl,
  readStoredLink,
  type ActionLink,
  type ActionView,
} from "@/lib/auth-action"
import { openingView, savePassword, sendNewLink } from "@/lib/auth-action-flow"
import { sendAllowed, trustedClientAddress } from "@/lib/auth-action-limit"
import { sealMatches } from "@/lib/auth-action-seal"

/*
 * RM20616 A10 unit 10 (R1) — the reset card's form posts (Save password, Send a new link, Send reset link).
 * They run on the server so the page works with JavaScript off, the browser makes no call to Google (the
 * site's Content-Security-Policy allows none), and the code never leaves the HttpOnly cookie for the page.
 * The password and the code are passed to Google and to nothing else: no log line, no error report.
 *
 * Each post carries the seal the page drew with its card (lib/auth-action-seal.ts): Save password acts only
 * on the link the card was drawn for, and Send reset link sends only for a link Google said had expired.
 */

const text = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : "")

/** The typed value is handed back only to a page without JavaScript, which has no other way to keep it. */
function forThisPage(view: ActionView, scripted: boolean): ActionView {
  if (!scripted || !("keep" in view)) return view
  const { keep: _keep, ...rest } = view
  void _keep
  return rest as ActionView
}

/**
 * Once the link is done with, its code leaves the browser: the cookie's value becomes DONE_MARKER, which holds
 * nothing about the link, for ten minutes. Not cleared outright: Next draws the page again in this post's
 * answer, and that drawing needs to know the link was done with to show this post's card (lib/auth-action.ts).
 */
async function forgetLink(form: FormData) {
  const path = cleanPath(text(form.get("locale")) === "id" ? "id" : "en")
  ;(await cookies()).set(ACTION_COOKIE, DONE_MARKER, { ...actionCookieOptions(path), maxAge: DONE_LIFE_SECONDS })
}

/**
 * A post made while the cookie holds the done marker. The card of a done link is This link has expired with
 * Open Makan and no form, as for a used link, so nothing can be asked for here: every intent answers that
 * card. Nothing is asked of Google.
 */
function doneLinkAnswer(): ActionView {
  return { view: "expired" }
}

/** The card for the cookie's own link, drawn again (its seal did not match the card that was posted). */
async function redrawn(link: ActionLink): Promise<ActionView> {
  const view = await openingView(link, { navigation: false })
  if (view.view === "firebase") redirect(passThroughUrl(link.project.authDomain, link.query))
  return view
}

export async function resetFlowAction(previous: ActionView, form: FormData): Promise<ActionView> {
  const stored = (await cookies()).get(ACTION_COOKIE)?.value
  const requestHeaders = await headers()
  // A post made by the page's script carries Next's action header; a plain form post (JavaScript off) does not.
  const scripted = requestHeaders.has("next-action")
  if (isDoneMarker(stored)) return doneLinkAnswer()
  const link = readStoredLink(decodeStoredLink(stored))
  // The cookie is gone (the browser was closed, or the done marker's ten minutes passed) or was never for a reset.
  if (!link || link.mode !== "resetPassword") return { view: "expired" }
  const seal = text(form.get("seal"))

  switch (text(form.get("intent"))) {
    case "save": {
      // Another link has replaced the cookie since this card was drawn: draw the card for that link instead
      // of setting the typed password on an account the card did not name.
      if (!sealMatches("save", link, seal)) return redrawn(link)
      // The address only comes back as the card's "For …" line; nothing is checked or sent with it.
      const email = text(form.get("email")) || null
      const view = await savePassword(link, text(form.get("password")), email)
      if (view.view === "changed" || view.view === "broken") await forgetLink(form)
      return forThisPage(view, scripted)
    }
    // Send a new link and Send reset link exist only for a link Google said had timed out, which the send
    // seal proves. Without it (a used link, one that was never real, a hand-made post) the answer is the
    // expired card, which offers Open Makan and no form (Devon, 24 Nov 2026): nothing is sent and nothing
    // pretends to be.
    case "forgot":
      return sealMatches("send", link, seal) ? { view: "forgot", seal } : { view: "expired" }
    case "send": {
      if (!sealMatches("send", link, seal)) return { view: "expired" }
      const email = text(form.get("email")).trim()
      const view = await sendNewLink(link, email, () => sendAllowed(email, trustedClientAddress(requestHeaders)))
      if (view.view === "sent") await forgetLink(form)
      return forThisPage(view.view === "forgot" ? { ...view, seal } : view, scripted)
    }
    default:
      return previous
  }
}
