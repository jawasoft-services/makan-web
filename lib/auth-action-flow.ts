import "server-only"

import { MIN_PASSWORD_LENGTH, REQUEST_TYPE, plausibleEmail, type ActionLink, type ActionView } from "@/lib/auth-action"
import { applyCode, checkCode, resetPassword, sendPasswordReset } from "@/lib/identity-toolkit"

/*
 * RM20616 A10 unit 10 (R1) — what the action page shows for each Firebase answer. Pure decisions over the
 * calls in lib/identity-toolkit.ts; the page and its form actions (app/auth-action/[locale]) do the
 * cookie and the rendering. Every outcome is one of the approved boards, or Firebase's own page where no
 * board covers it.
 */

/** The card the link opens on. Verification and email-change codes are applied here, as Firebase's own page does. */
export async function openingView(link: ActionLink): Promise<ActionView> {
  const { apiKey } = link.project
  const checked = await checkCode(apiKey, link.oobCode)
  if (!checked.ok) {
    if (checked.reason === "expired") return expiredView(link)
    if (checked.reason === "disabled" && link.mode === "resetPassword") return { view: "broken" }
    return { view: "firebase" }
  }
  if (checked.value.requestType !== REQUEST_TYPE[link.mode]) return { view: "firebase" }

  if (link.mode === "resetPassword") return { view: "choose", email: checked.value.email }

  // The address the email-change pages name: the new one after a change, the restored one after an undo.
  const shown = link.mode === "verifyAndChangeEmail" ? checked.value.newEmail : checked.value.email
  if (link.mode !== "verifyEmail" && !shown) return { view: "firebase" }

  const applied = await applyCode(apiKey, link.oobCode)
  if (!applied.ok) return applied.reason === "expired" ? expiredView(link) : { view: "firebase" }
  if (link.mode === "verifyEmail") return { view: "verified" }
  return link.mode === "verifyAndChangeEmail" ? { view: "emailChanged", email: shown! } : { view: "emailUndone", email: shown! }
}

function expiredView(link: ActionLink): ActionView {
  if (link.mode === "resetPassword") return { view: "expired" }
  if (link.mode === "verifyEmail") return { view: "verifyExpired" }
  return { view: "emailExpired" }
}

/**
 * Save password (si-fp-5): the new password, or why it was not set. `email` is only the line the card shows
 * again; it is never sent anywhere.
 */
export async function savePassword(link: ActionLink, password: string, email: string | null): Promise<ActionView> {
  const choose = (error: "network" | "weak"): ActionView => ({ view: "choose", email, error, keep: password })
  if (link.mode !== "resetPassword") return { view: "firebase" }
  if (password.length < MIN_PASSWORD_LENGTH) return choose("weak")

  const saved = await resetPassword(link.project.apiKey, link.oobCode, password)
  if (saved.ok) return { view: "changed" }
  switch (saved.reason) {
    case "weak":
      return choose("weak")
    case "disabled":
      return { view: "broken" }
    case "unavailable":
      return choose("network")
    case "expired":
      // Also the rare retry after a save whose answer was lost and which did go through: the page never asks
      // Firebase whether a password works (that would make it a password checker for any account), so the
      // person gets the expired card and its Send a new link.
      return { view: "expired" }
  }
}

/** Send reset link (si-fp-10 / si-fp-12): always Email sent once Firebase answers, whatever it answers. */
export async function sendNewLink(link: ActionLink, email: string, limited: boolean): Promise<ActionView> {
  if (!plausibleEmail(email)) return { view: "forgot", error: "email", keep: email }
  // Past the per-address limit nothing is sent, and the card is the same as for a sent email.
  if (limited) return { view: "sent" }
  const answer = await sendPasswordReset(link.project.apiKey, email)
  return answer === "answered" ? { view: "sent" } : { view: "forgot", error: "network", keep: email }
}
