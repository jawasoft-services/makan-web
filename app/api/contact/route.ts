import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { google } from 'googleapis'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function appendToSheet(name: string, email: string) {
  const sheetId = process.env.GOOGLE_SHEET_ID
  if (!sheetId) return

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  const sheets = google.sheets({ version: 'v4', auth })
  const now = new Date().toISOString()

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'Sheet1!A:D',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[now, name, email]],
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email } = body as { name?: string; email?: string }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }

    if (!email?.trim() || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json(
        { error: 'A valid email is required.' },
        { status: 400 },
      )
    }

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()

    const resend = new Resend(process.env.RESEND_API_KEY)
    const toAddress = process.env.CONTACT_EMAIL ?? 'team@makanofficial.com'
    const fromAddress = process.env.RESEND_FROM ?? 'Makan Website <onboarding@resend.dev>'

    const [emailResult] = await Promise.all([
      resend.emails.send({
        from: fromAddress,
        to: toAddress,
        subject: `New seat request from ${trimmedName}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px;">
            <h2 style="margin: 0 0 16px;">New seat request</h2>
            <p style="margin: 0 0 8px;"><strong>Name:</strong> ${trimmedName}</p>
            <p style="margin: 0 0 24px;"><strong>Email:</strong> ${trimmedEmail}</p>
            <hr style="border: none; border-top: 1px solid #eee;" />
            <p style="margin: 16px 0 0; color: #999; font-size: 13px;">
              Sent from makanofficial.com contact form
            </p>
          </div>
        `,
      }),
      appendToSheet(trimmedName, trimmedEmail).catch((err) => {
        console.error('Google Sheets error:', err)
      }),
    ])

    if (emailResult.error) {
      console.error('Resend error:', emailResult.error)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 },
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Contact API error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}
