import "server-only"

import { createHmac, timingSafeEqual } from "node:crypto"
import { actionSecret, type ActionLink } from "@/lib/auth-action"

/*
 * RM20616 A10 unit 10 (R1) — what the page signs about a link it has checked, so a form post can prove it.
 *
 * A seal is an HMAC-SHA256, keyed with AUTH_ACTION_SECRET, over the purpose, the link's apiKey, mode and
 * code, and an expiry. It travels in a hidden field of the card's form. It holds no secret in the clear: the
 * code is not in it and cannot be recovered from it, and it is worth nothing without the link's HttpOnly
 * cookie, which holds the same code.
 *
 *   save  drawn with "Choose a new password". Save password is applied only to the link the card was drawn
 *         for: if another link has since replaced the cookie (a second email, or a link planted by another
 *         site's top-level navigation), the seal no longer matches and the card is drawn again for the
 *         cookie's own link. No expiry: the code itself expires.
 *   send  drawn with "This link has expired." only when Google answered EXPIRED_OOB_CODE for this code,
 *         which it can only say about a code it issued. Send reset link sends only with it, so the form
 *         cannot be driven with a made-up code. Good for an hour; opening the link again draws a new one.
 */

export type SealPurpose = "save" | "send"

export const SEND_SEAL_LIFE_MS = 60 * 60 * 1000

type Env = Record<string, string | undefined>

function signature(secret: string, purpose: SealPurpose, link: ActionLink, expires: string): Buffer {
  return createHmac("sha256", secret)
    .update(["makan-auth-action", purpose, link.project.apiKey, link.mode, link.oobCode, expires].join("\n"))
    .digest()
}

/** A seal for this link, or "" when no secret is set (then nothing is ever accepted). */
export function sealFor(purpose: SealPurpose, link: ActionLink, now = Date.now(), env: Env = process.env): string {
  const secret = actionSecret(env)
  if (!secret) return ""
  const expires = purpose === "send" ? (now + SEND_SEAL_LIFE_MS).toString(36) : "0"
  return `${expires}.${signature(secret, purpose, link, expires).toString("base64url")}`
}

/** True only for a seal this server drew for this purpose and this very link, still in date. */
export function sealMatches(purpose: SealPurpose, link: ActionLink, seal: string | null | undefined, now = Date.now(), env: Env = process.env): boolean {
  const secret = actionSecret(env)
  if (!secret || !seal || seal.length > 200) return false
  const [expires, mac, extra] = seal.split(".")
  if (!expires || !mac || extra !== undefined) return false
  if (purpose === "send" ? !(parseInt(expires, 36) > now) : expires !== "0") return false
  const given = Buffer.from(mac, "base64url")
  const wanted = signature(secret, purpose, link, expires)
  return given.length === wanted.length && timingSafeEqual(given, wanted)
}
