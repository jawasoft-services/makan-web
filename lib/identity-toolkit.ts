import "server-only"

import { SERVER_KEY_ENV, type ActionProject } from "@/lib/auth-action"

/*
 * RM20616 A10 unit 10 (R1) — the three Identity Toolkit REST calls the action page makes, from the server.
 *
 * Each call uses the project's server key (AUTH_ACTION_SERVER_KEY_DEV / _PROD, see lib/auth-action.ts),
 * not the key in the link: that one is a browser key and Google refuses a server's calls made with it.
 * Callers name the project; the key is read from the environment here, at the moment of the call, so it is
 * never on an object the page or its actions hold. It travels only in the X-Goog-Api-Key request header to
 * Google, never in a URL; the code and the password travel only in the POST body. A redirect is refused
 * (`redirect: "error"`): fetch would carry the header, and on a 307 or 308 the body, to the other host. None
 * of the three is ever logged, thrown or returned. A failure comes back as a reason, not as Google's message:
 *
 *   expired      EXPIRED_OOB_CODE: a code Google issued whose hour has passed (Google has to read a code's
 *                issue time to say this; a made-up code is answered INVALID_OOB_CODE)
 *   used         INVALID_OOB_CODE: a code that was used, superseded, malformed or made up (Google gives one
 *                answer for all of these)
 *   disabled     the account was disabled or deleted
 *   weak         Firebase refused the new password
 *   unavailable  no usable answer (no connection, a timeout, a 5xx, a key refused by its restrictions, …)
 */

const ENDPOINT = "https://identitytoolkit.googleapis.com/v1/accounts"
const TIMEOUT_MS = 10_000

export type ToolkitFailure = "expired" | "used" | "disabled" | "weak" | "unavailable"
export type ToolkitResult<T> = { ok: true; value: T } | { ok: false; reason: ToolkitFailure }

/** What Firebase calls each kind of code (the `requestType` of a checked code). */
export type RequestType = "PASSWORD_RESET" | "VERIFY_EMAIL" | "VERIFY_AND_CHANGE_EMAIL" | "RECOVER_EMAIL" | string

interface CheckedCode {
  requestType: RequestType
  /** The account's address; for an email change, the address before the change. */
  email: string | null
  /** For an email change, the new address; for an undo, the address being undone. */
  newEmail: string | null
}

const DISABLED = new Set(["USER_DISABLED", "USER_NOT_FOUND", "EMAIL_NOT_FOUND"])

/** Google's error message is a code, sometimes followed by " : explanation". Only the code is read. */
function errorCode(message: unknown): string {
  return typeof message === "string" ? message.split(/[\s:]/, 1)[0] : ""
}

function failure(message: unknown): ToolkitFailure {
  const code = errorCode(message)
  if (code === "EXPIRED_OOB_CODE") return "expired"
  if (code === "INVALID_OOB_CODE") return "used"
  if (DISABLED.has(code)) return "disabled"
  if (code === "WEAK_PASSWORD") return "weak"
  return "unavailable"
}

type Answer = { status: "answered"; ok: boolean; code: number; json: boolean; body: Record<string, unknown> } | { status: "none" }

type Project = ActionProject["name"]

async function post(method: string, project: Project, body: Record<string, unknown>): Promise<Answer> {
  const serverKey = process.env[SERVER_KEY_ENV[project]]?.trim()
  // Removed since the link was read: no call, and the link goes on to Firebase's own page.
  if (!serverKey) return { status: "none" }
  try {
    const response = await fetch(`${ENDPOINT}:${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Goog-Api-Key": serverKey },
      body: JSON.stringify(body),
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    let parsed: Record<string, unknown> = {}
    let json = false
    try {
      const value: unknown = await response.json()
      if (value && typeof value === "object") {
        parsed = value as Record<string, unknown>
        json = true
      }
    } catch {
      // A body that is not JSON is read as no usable answer below.
    }
    return { status: "answered", ok: response.ok, code: response.status, json, body: parsed }
  } catch {
    // No connection, a timeout, an aborted request or a redirect. The error is dropped on purpose: it can carry the
    // request, and nothing about this call may reach a log.
    return { status: "none" }
  }
}

function errorMessage(body: Record<string, unknown>): unknown {
  const error = body.error
  return error && typeof error === "object" ? (error as { message?: unknown }).message : undefined
}

const text = (value: unknown) => (typeof value === "string" && value ? value : null)

/** Checks a code without using it up (`accounts:resetPassword` with the code alone). */
export async function checkCode(project: Project, oobCode: string): Promise<ToolkitResult<CheckedCode>> {
  const answer = await post("resetPassword", project, { oobCode })
  if (answer.status === "none") return { ok: false, reason: "unavailable" }
  if (!answer.ok) return { ok: false, reason: failure(errorMessage(answer.body)) }
  const requestType = text(answer.body.requestType)
  if (!requestType) return { ok: false, reason: "unavailable" }
  return { ok: true, value: { requestType, email: text(answer.body.email), newEmail: text(answer.body.newEmail) } }
}

/** Sets the new password with the reset code (`accounts:resetPassword` with `newPassword`). */
export async function resetPassword(project: Project, oobCode: string, newPassword: string): Promise<ToolkitResult<null>> {
  const answer = await post("resetPassword", project, { oobCode, newPassword })
  if (answer.status === "none") return { ok: false, reason: "unavailable" }
  if (!answer.ok) return { ok: false, reason: failure(errorMessage(answer.body)) }
  return { ok: true, value: null }
}

/** Applies a verification, email-change or undo code (`accounts:update` with the code). */
export async function applyCode(project: Project, oobCode: string): Promise<ToolkitResult<null>> {
  const answer = await post("update", project, { oobCode })
  if (answer.status === "none") return { ok: false, reason: "unavailable" }
  if (!answer.ok) return { ok: false, reason: failure(errorMessage(answer.body)) }
  return { ok: true, value: null }
}

/*
 * The answers to a send that depend on whether the address has an account (or on how often it was sent
 * to). Each of them is shown as Email sent, like a success, so the form never tells anyone whether an
 * address has an account.
 */
const ACCOUNT_ANSWERS = new Set(["EMAIL_NOT_FOUND", "USER_NOT_FOUND", "USER_DISABLED", "RESET_PASSWORD_EXCEED_LIMIT", "TOO_MANY_ATTEMPTS_TRY_LATER"])

/**
 * Asks Firebase to send a new reset email (`accounts:sendOobCode`, PASSWORD_RESET).
 *
 *   answered     Google accepted the request (a 2xx), or refused it for a reason about the account
 *                (ACCOUNT_ANSWERS): an unknown, disabled or limited address looks exactly like a sent one.
 *   unavailable  nothing was sent, for a reason that has nothing to do with the account: no connection, a
 *                timeout, a key refused by its restrictions (403), a quota or rate answer (429), a 5xx, a
 *                body that is not JSON, or any other 400. The page says so (the si-fp-8 line) rather than
 *                promising an email that will never come.
 */
export async function sendPasswordReset(project: Project, email: string): Promise<"answered" | "unavailable"> {
  const answer = await post("sendOobCode", project, { requestType: "PASSWORD_RESET", email })
  if (answer.status === "none" || !answer.json) return "unavailable"
  if (answer.ok) return "answered"
  return answer.code === 400 && ACCOUNT_ANSWERS.has(errorCode(errorMessage(answer.body))) ? "answered" : "unavailable"
}
