import "server-only"

import { MIN_PASSWORD_LENGTH, REQUEST_TYPE, plausibleEmail, type ActionLink, type ActionView } from "@/lib/auth-action"
import { sealFor } from "@/lib/auth-action-seal"
import { applyCode, checkCode, resetPassword, sendPasswordReset, type ToolkitFailure } from "@/lib/identity-toolkit"

/*
 * RM20616 A10 unit 10 (R1) — what the action page shows for each Firebase answer. Pure decisions over the
 * calls in lib/identity-toolkit.ts; the page and its form actions (app/auth-action/[locale]) do the
 * cookie and the rendering. Every outcome is one of the approved boards, or Firebase's own page where no
 * board covers it.
 */

/**
 * True when the request is a browser opening the page as a document (a person following the link), from the
 * Fetch Metadata headers: `Sec-Fetch-Mode: navigate` and `Sec-Fetch-Dest: document`. Chrome and Edge (76+),
 * Firefox (90+) and Safari (16.4+) send both on every top-level navigation, redirects included. A link
 * scanner or an HTTP library sends neither. `Sec-Fetch-User` is not required: browsers send it only when the
 * navigation follows a user gesture, which a mail app's in-app browser or the 303 hop may not carry.
 */
export function isDocumentNavigation(headers: Headers): boolean {
  return headers.get("sec-fetch-mode") === "navigate" && headers.get("sec-fetch-dest") === "document"
}

/**
 * True when the page is being drawn for the answer to one of its own form posts: Next draws the page in that
 * answer (always for a plain form post, which is how a page without JavaScript posts; for a scripted post,
 * when the action set a cookie). The card shown is then the action's result, so the page asks Google nothing.
 * A scripted post carries Next's `Next-Action` header; a plain post is `multipart/form-data` (React's form
 * actions always post that way), which no browser opening a page sends.
 */
export function isActionPost(headers: Headers): boolean {
  return headers.has("next-action") || /^multipart\/form-data/i.test(headers.get("content-type") ?? "")
}

/**
 * The card the link opens on. Verification and email-change codes are applied here, as Firebase's own page
 * does, but only for a browser opening the page (`navigation`, see isDocumentNavigation). Any other fetch of
 * such a link (a mail scanner, a preview bot) goes on to Firebase's own page untouched, before any call to
 * Google, so it cannot verify an address, confirm an email change or undo one. A reset link changes nothing
 * by being opened, so it is checked for every request.
 */
export async function openingView(link: ActionLink, { navigation }: { navigation: boolean }): Promise<ActionView> {
  if (link.mode !== "resetPassword" && !navigation) return { view: "firebase" }
  const project = link.project.name
  const checked = await checkCode(project, link.oobCode)
  if (!checked.ok) {
    if (checked.reason === "expired" || checked.reason === "used") return expiredView(link, checked.reason)
    if (checked.reason === "disabled" && link.mode === "resetPassword") return { view: "broken" }
    return { view: "firebase" }
  }
  if (checked.value.requestType !== REQUEST_TYPE[link.mode]) return { view: "firebase" }

  if (link.mode === "resetPassword") return { view: "choose", email: checked.value.email, seal: sealFor("save", link) }

  // The address the email-change pages name: the new one after a change, the restored one after an undo.
  const shown = link.mode === "verifyAndChangeEmail" ? checked.value.newEmail : checked.value.email
  if (link.mode !== "verifyEmail" && !shown) return { view: "firebase" }

  const applied = await applyCode(project, link.oobCode)
  if (!applied.ok) return applied.reason === "expired" || applied.reason === "used" ? expiredView(link, applied.reason) : { view: "firebase" }
  if (link.mode === "verifyEmail") return { view: "verified" }
  return link.mode === "verifyAndChangeEmail" ? { view: "emailChanged", email: shown! } : { view: "emailUndone", email: shown! }
}

/**
 * The expired card. For a reset link it carries the send seal only when Google said the code had expired:
 * INVALID_OOB_CODE is also Google's answer to a made-up code, so a "used" link shows the same card but its
 * Send reset link sends nothing (lib/auth-action-seal.ts).
 */
function expiredView(link: ActionLink, reason: ToolkitFailure): ActionView {
  if (link.mode === "resetPassword") return reason === "expired" ? { view: "expired", seal: sealFor("send", link) } : { view: "expired" }
  if (link.mode === "verifyEmail") return { view: "verifyExpired" }
  return { view: "emailExpired" }
}

/**
 * Save password (si-fp-5): the new password, or why it was not set. `email` is only the line the card shows
 * again; it is never sent anywhere.
 */
export async function savePassword(link: ActionLink, password: string, email: string | null): Promise<ActionView> {
  const choose = (error: "network" | "weak"): ActionView => ({ view: "choose", email, error, keep: password, seal: sealFor("save", link) })
  if (link.mode !== "resetPassword") return { view: "firebase" }
  if (password.length < MIN_PASSWORD_LENGTH) return choose("weak")

  const saved = await resetPassword(link.project.name, link.oobCode, password)
  if (saved.ok) return { view: "changed" }
  switch (saved.reason) {
    case "weak":
      return choose("weak")
    case "disabled":
      return { view: "broken" }
    case "unavailable":
      return choose("network")
    case "expired":
    case "used":
      // Also the rare retry after a save whose answer was lost and which did go through: the page never asks
      // Firebase whether a password works (that would make it a password checker for any account), so the
      // person gets the expired card and its Send a new link.
      return expiredView(link, saved.reason)
  }
}

/**
 * Send reset link (si-fp-10 / si-fp-12): Email sent for every answer that depends on the address (sent, no
 * account, disabled, limited); the si-fp-8 line when Google refused or failed the send for any other reason.
 */
export async function sendNewLink(link: ActionLink, email: string, allowed: () => boolean): Promise<ActionView> {
  if (!plausibleEmail(email)) return { view: "forgot", error: "email", keep: email }
  // Without a genuine expired link, or past the per-address or per-client limit (lib/auth-action-limit.ts),
  // nothing is sent, and the card is the same as for a sent email.
  if (!allowed()) return { view: "sent" }
  const answer = await sendPasswordReset(link.project.name, email)
  return answer === "answered" ? { view: "sent" } : { view: "forgot", error: "network", keep: email }
}
