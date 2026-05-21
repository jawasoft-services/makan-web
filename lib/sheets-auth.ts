import 'server-only'
import { google } from 'googleapis'

// Module-scoped flag so the "fallback used" warning fires at most once per
// Vercel function instance (per cold start), not on every request.
let fallbackWarned = false

/**
 * Returns a GoogleAuth instance scoped to the Sheets API.
 *
 * PRIMARY path — dedicated Sheets-only service account:
 *   Uses GOOGLE_SHEETS_CLIENT_EMAIL + GOOGLE_SHEETS_PRIVATE_KEY. The account
 *   is scoped to just the leads spreadsheet (shared at the Sheet level —
 *   Google Sheets has no project-level "Sheets editor" role, so sheet-level
 *   sharing IS the access control). Compromise of this credential at worst
 *   lets an attacker write spam rows into one spreadsheet.
 *
 * FALLBACK path — Firebase Admin reuse:
 *   Uses FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY. This works but the
 *   credential has full project authority (Firestore, Auth, Storage,
 *   Functions). Vastly larger blast radius if it leaks. Acceptable as a
 *   transitional path; should be removed once the primary path is verified
 *   working in production.
 *
 * Server-only: the `server-only` import means this module never reaches the
 * client bundle, so neither credential set can leak into browser JS.
 *
 * Migration steps:
 *   1. GCP Console → IAM & Admin → Service Accounts → Create.
 *      Name: makan-web-sheets. NO project-level roles (this is the whole
 *      point — we want zero project authority).
 *   2. The new account → Keys → Add Key → Create new key → JSON. Save.
 *   3. Open the leads Google Sheet → Share. Paste the service account's
 *      email (looks like makan-web-sheets@<project>.iam.gserviceaccount.com)
 *      with Editor permission. Uncheck "Notify people".
 *   4. In Vercel → Settings → Environment Variables → add
 *      GOOGLE_SHEETS_CLIENT_EMAIL (= client_email from the JSON) and
 *      GOOGLE_SHEETS_PRIVATE_KEY (= private_key from the JSON, including
 *      the BEGIN/END headers and the \n escapes). Apply to Production
 *      (and Preview if you want previews to write to the sheet too).
 *   5. Redeploy (env var changes need a fresh build). Verify by submitting
 *      a test form and confirming a row lands in the sheet + no "sheets-auth"
 *      warning in Vercel function logs.
 *   6. Once verified, the FALLBACK block below can be removed in a follow-up
 *      commit for cleanliness.
 */
export function getSheetsAuth() {
  const sheetsEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
  const sheetsKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY

  // Primary path — dedicated Sheets-only credentials.
  if (sheetsEmail && sheetsKey) {
    return new google.auth.GoogleAuth({
      credentials: {
        client_email: sheetsEmail,
        private_key: sheetsKey.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
  }

  // Fallback path — over-privileged Firebase Admin. Log loudly (once per
  // instance) so misconfigured deploys are visible in Vercel function logs.
  if (!fallbackWarned) {
    console.warn(
      'sheets-auth: GOOGLE_SHEETS_* env vars not set; falling back to ' +
        'FIREBASE_* (full project authority — least-privilege NOT in effect). ' +
        'Set GOOGLE_SHEETS_CLIENT_EMAIL and GOOGLE_SHEETS_PRIVATE_KEY.',
    )
    fallbackWarned = true
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}
