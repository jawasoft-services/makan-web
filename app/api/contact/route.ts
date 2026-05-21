import { NextResponse } from "next/server"
import { Resend } from "resend"
import { google } from "googleapis"
import {
  htmlEscape,
  sanitizeSubject,
  parseSafeJson,
  isBotByHoneypot,
  isAllowedOrigin,
  FIELD_MAX,
  ALLOWED_ORIGINS,
} from "@/lib/api-validation"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function appendToSheet(name: string, email: string) {
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!sheetId) return

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  })

  const sheets = google.sheets({ version: "v4", auth })
  const now = new Date().toISOString()

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Sheet1!A:D",
    // RAW prevents Sheets from interpreting leading =/+/-/@ as formulas
    // (CSV/formula injection — attacker submits =IMPORTXML(...) etc.).
    valueInputOption: "RAW",
    requestBody: {
      values: [[now, name, email]],
    },
  })
}

interface ContactBody {
  name?: string
  email?: string
  website?: string // honeypot
}

export async function POST(request: Request) {
  try {
    // 1. Origin allowlist — block browser-based cross-site POSTs.
    if (!isAllowedOrigin(request, ALLOWED_ORIGINS)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    // 2. Size-capped JSON parse — reject oversized bodies up front.
    const body = await parseSafeJson<ContactBody>(request)
    if (!body) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 })
    }

    // 3. Honeypot — silently 200 to bots so we don't signal the trap.
    if (isBotByHoneypot(body)) {
      return NextResponse.json({ success: true })
    }

    const { name, email } = body

    // 4. Per-field validation + length caps.
    if (!name?.trim() || name.length > FIELD_MAX.name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 })
    }
    if (
      !email?.trim() ||
      email.length > FIELD_MAX.email ||
      !EMAIL_RE.test(email.trim())
    ) {
      return NextResponse.json(
        { error: "A valid email is required." },
        { status: 400 },
      )
    }

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    const resend = new Resend(process.env.RESEND_API_KEY)
    const toAddress = process.env.CONTACT_EMAIL ?? "team@makanofficial.com"
    const fromAddress =
      process.env.RESEND_FROM ?? "Makan Website <onboarding@resend.dev>"

    const [emailResult] = await Promise.all([
      resend.emails.send({
        from: fromAddress,
        to: toAddress,
        // Strip CR/LF (header injection) + cap length.
        subject: sanitizeSubject(`New seat request from ${trimmedName}`),
        // HTML-escape every user value before interpolating into HTML.
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px;">
            <h2 style="margin: 0 0 16px;">New seat request</h2>
            <p style="margin: 0 0 8px;"><strong>Name:</strong> ${htmlEscape(trimmedName)}</p>
            <p style="margin: 0 0 24px;"><strong>Email:</strong> ${htmlEscape(trimmedEmail)}</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="margin: 16px 0 0; color: #999; font-size: 13px;">
              Sent from makanofficial.com contact form
            </p>
          </div>
        `,
      }),
      appendToSheet(trimmedName, trimmedEmail).catch((err) => {
        console.error("Google Sheets error:", err)
      }),
    ])

    if (emailResult.error) {
      console.error("Resend error:", emailResult.error)
      return NextResponse.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Contact API error:", err)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    )
  }
}
