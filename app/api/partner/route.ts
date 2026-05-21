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
import { getSheetsAuth } from "@/lib/sheets-auth"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function appendToSheet(
  name: string,
  email: string,
  restaurant: string,
  city: string,
  message: string,
) {
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!sheetId) return

  const auth = getSheetsAuth()
  const sheets = google.sheets({ version: "v4", auth })
  const now = new Date().toISOString()

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "Partners!A:G",
    // RAW prevents Sheets from interpreting leading =/+/-/@ as formulas
    // (CSV/formula injection — attacker submits =IMPORTXML(...) etc.).
    valueInputOption: "RAW",
    requestBody: {
      values: [[now, name, email, restaurant, city, message]],
    },
  })
}

interface PartnerBody {
  name?: string
  email?: string
  restaurant?: string
  city?: string
  message?: string
  website?: string // honeypot
}

export async function POST(request: Request) {
  try {
    // 1. Origin allowlist — block browser-based cross-site POSTs.
    if (!isAllowedOrigin(request, ALLOWED_ORIGINS)) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 })
    }

    // 2. Size-capped JSON parse.
    const body = await parseSafeJson<PartnerBody>(request)
    if (!body) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 })
    }

    // 3. Honeypot — silent 200 to bots.
    if (isBotByHoneypot(body)) {
      return NextResponse.json({ success: true })
    }

    const { name, email, restaurant, city, message } = body

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
    if (!restaurant?.trim() || restaurant.length > FIELD_MAX.restaurant) {
      return NextResponse.json(
        { error: "Restaurant name is required." },
        { status: 400 },
      )
    }
    if (city && city.length > FIELD_MAX.city) {
      return NextResponse.json({ error: "City is too long." }, { status: 400 })
    }
    if (message && message.length > FIELD_MAX.message) {
      return NextResponse.json(
        { error: "Message is too long." },
        { status: 400 },
      )
    }

    const trimmed = {
      name: name.trim(),
      email: email.trim(),
      restaurant: restaurant.trim(),
      city: city?.trim() ?? "",
      message: message?.trim() ?? "",
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const toAddress = process.env.CONTACT_EMAIL ?? "team@makanofficial.com"
    const fromAddress =
      process.env.RESEND_FROM ?? "Makan Website <onboarding@resend.dev>"

    const [emailResult] = await Promise.all([
      resend.emails.send({
        from: fromAddress,
        to: toAddress,
        subject: sanitizeSubject(
          `Restaurant partner inquiry — ${trimmed.restaurant}`,
        ),
        // HTML-escape every user value before interpolating.
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px;">
            <h2 style="margin: 0 0 16px;">New restaurant partner inquiry</h2>
            <p style="margin: 0 0 8px;"><strong>Name:</strong> ${htmlEscape(trimmed.name)}</p>
            <p style="margin: 0 0 8px;"><strong>Email:</strong> ${htmlEscape(trimmed.email)}</p>
            <p style="margin: 0 0 8px;"><strong>Restaurant:</strong> ${htmlEscape(trimmed.restaurant)}</p>
            ${trimmed.city ? `<p style="margin: 0 0 8px;"><strong>City:</strong> ${htmlEscape(trimmed.city)}</p>` : ""}
            ${trimmed.message ? `<p style="margin: 0 0 8px;"><strong>Message:</strong> ${htmlEscape(trimmed.message)}</p>` : ""}
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="margin: 16px 0 0; color: #999; font-size: 13px;">
              Sent from makanofficial.com partner form
            </p>
          </div>
        `,
      }),
      appendToSheet(
        trimmed.name,
        trimmed.email,
        trimmed.restaurant,
        trimmed.city,
        trimmed.message,
      ).catch((err) => {
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
    console.error("Partner API error:", err)
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    )
  }
}
