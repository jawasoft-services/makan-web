import 'server-only'

// Fires at most once per function instance, like sheets-auth's warning.
let skipWarned = false

/**
 * Verifies a Cloudflare Turnstile token for the contact and partner forms.
 *
 * With TURNSTILE_SECRET_KEY unset (local development, a preview without the
 * variable) the check is skipped and logged once, so forms keep working. With
 * it set, a missing, stale or forged token fails, and so does an unreachable
 * verifier: a spam control that fails open is not one. Tokens are single-use;
 * the client resets its widget after any failed submit.
 */
export async function turnstilePassed(token: unknown, remoteip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    if (!skipWarned) {
      console.warn('turnstile: TURNSTILE_SECRET_KEY not set; skipping bot verification.')
      skipWarned = true
    }
    return true
  }
  if (typeof token !== 'string' || !token || token.length > 2048) return false
  try {
    const body = new URLSearchParams({ secret, response: token })
    if (remoteip !== 'unknown') body.set('remoteip', remoteip)
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    })
    const data = (await res.json()) as { success?: boolean }
    return data.success === true
  } catch (err) {
    console.error('turnstile: verification request failed', err)
    return false
  }
}
