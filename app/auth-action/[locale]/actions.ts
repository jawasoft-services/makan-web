"use server"

import { cookies, headers } from "next/headers"
import { ACTION_COOKIE, decodeStoredLink, readStoredLink, type ActionView } from "@/lib/auth-action"
import { savePassword, sendNewLink } from "@/lib/auth-action-flow"
import { rateLimited } from "@/lib/rate-limit"

/*
 * RM20616 A10 unit 10 (R1) — the reset card's form posts (Save password, Send a new link, Send reset link).
 * They run on the server so the page works with JavaScript off, the browser makes no call to Google (the
 * site's Content-Security-Policy allows none), and the code never leaves the HttpOnly cookie for the page.
 * The password and the code are passed to Google and to nothing else: no log line, no error report.
 */

const text = (value: FormDataEntryValue | null) => (typeof value === "string" ? value : "")

/** The typed value is handed back only to a page without JavaScript, which has no other way to keep it. */
function forThisPage(view: ActionView, scripted: boolean): ActionView {
  if (!scripted || !("keep" in view)) return view
  const { keep: _keep, ...rest } = view
  void _keep
  return rest as ActionView
}

export async function resetFlowAction(previous: ActionView, form: FormData): Promise<ActionView> {
  const link = readStoredLink(decodeStoredLink((await cookies()).get(ACTION_COOKIE)?.value))
  // The cookie is gone (a day after the link was opened) or was never for a reset: the link is no use now.
  if (!link || link.mode !== "resetPassword") return { view: "expired" }
  const requestHeaders = await headers()
  // A post made by the page's script carries Next's action header; a plain form post (JavaScript off) does not.
  const scripted = requestHeaders.has("next-action")

  switch (text(form.get("intent"))) {
    case "save": {
      // The address only comes back as the card's "For …" line; nothing is checked or sent with it.
      const email = text(form.get("email")) || null
      const view = await savePassword(link, text(form.get("password")), email)
      return forThisPage(view, scripted)
    }
    case "forgot":
      return { view: "forgot" }
    case "send": {
      const limited = rateLimited(new Request("https://www.makanofficial.com/auth/action", { headers: requestHeaders }), "auth-action-send", { burst: 5, perMinute: 2 })
      const view = await sendNewLink(link, text(form.get("email")).trim(), limited)
      return forThisPage(view, scripted)
    }
    default:
      return previous
  }
}
