import "server-only"

/*
 * RM20616 A10 unit 10 (R1) — the three Identity Toolkit REST calls the action page makes, from the server.
 *
 * Each call uses the link's own apiKey (already checked against the allowlist) and needs no secret. The
 * code and the password travel only in the POST body to Google; they are never put in a URL, never
 * logged, never thrown and never returned. A failure comes back as a reason, not as Google's message:
 *
 *   expired      the code is too old, used, or not a code of this kind (Firebase gives one answer for both)
 *   disabled     the account was disabled or deleted
 *   weak         Firebase refused the new password
 *   unavailable  no usable answer (no connection, a timeout, a 5xx, a key refused by its restrictions, …)
 */

const ENDPOINT = "https://identitytoolkit.googleapis.com/v1/accounts"
const TIMEOUT_MS = 10_000

export type ToolkitFailure = "expired" | "disabled" | "weak" | "unavailable"
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

const EXPIRED = new Set(["EXPIRED_OOB_CODE", "INVALID_OOB_CODE"])
const DISABLED = new Set(["USER_DISABLED", "USER_NOT_FOUND", "EMAIL_NOT_FOUND"])

/** Google's error message is a code, sometimes followed by " : explanation". Only the code is read. */
function failure(message: unknown): ToolkitFailure {
  const code = typeof message === "string" ? message.split(/[\s:]/, 1)[0] : ""
  if (EXPIRED.has(code)) return "expired"
  if (DISABLED.has(code)) return "disabled"
  if (code === "WEAK_PASSWORD") return "weak"
  return "unavailable"
}

type Answer = { status: "answered"; ok: boolean; body: Record<string, unknown> } | { status: "none" }

async function post(method: string, apiKey: string, body: Record<string, unknown>): Promise<Answer> {
  try {
    const response = await fetch(`${ENDPOINT}:${method}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
    let parsed: Record<string, unknown> = {}
    try {
      const json: unknown = await response.json()
      if (json && typeof json === "object") parsed = json as Record<string, unknown>
    } catch {
      // A body that is not JSON is read as no usable answer below.
    }
    return { status: "answered", ok: response.ok, body: parsed }
  } catch {
    // No connection, a timeout or an aborted request. The error is dropped on purpose: it can carry the
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
export async function checkCode(apiKey: string, oobCode: string): Promise<ToolkitResult<CheckedCode>> {
  const answer = await post("resetPassword", apiKey, { oobCode })
  if (answer.status === "none") return { ok: false, reason: "unavailable" }
  if (!answer.ok) return { ok: false, reason: failure(errorMessage(answer.body)) }
  const requestType = text(answer.body.requestType)
  if (!requestType) return { ok: false, reason: "unavailable" }
  return { ok: true, value: { requestType, email: text(answer.body.email), newEmail: text(answer.body.newEmail) } }
}

/** Sets the new password with the reset code (`accounts:resetPassword` with `newPassword`). */
export async function resetPassword(apiKey: string, oobCode: string, newPassword: string): Promise<ToolkitResult<null>> {
  const answer = await post("resetPassword", apiKey, { oobCode, newPassword })
  if (answer.status === "none") return { ok: false, reason: "unavailable" }
  if (!answer.ok) return { ok: false, reason: failure(errorMessage(answer.body)) }
  return { ok: true, value: null }
}

/** Applies a verification, email-change or undo code (`accounts:update` with the code). */
export async function applyCode(apiKey: string, oobCode: string): Promise<ToolkitResult<null>> {
  const answer = await post("update", apiKey, { oobCode })
  if (answer.status === "none") return { ok: false, reason: "unavailable" }
  if (!answer.ok) return { ok: false, reason: failure(errorMessage(answer.body)) }
  return { ok: true, value: null }
}

/**
 * Asks Firebase to send a new reset email (`accounts:sendOobCode`, PASSWORD_RESET). Only whether an answer
 * came back is returned: an unknown, disabled or limited address looks exactly like a sent one.
 */
export async function sendPasswordReset(apiKey: string, email: string): Promise<"answered" | "unavailable"> {
  const answer = await post("sendOobCode", apiKey, { requestType: "PASSWORD_RESET", email })
  return answer.status === "answered" ? "answered" : "unavailable"
}
