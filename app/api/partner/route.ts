import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { google } from 'googleapis'

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
    range: 'Partners!A:G',
    valueInputOption: 'USER_ENTERED',
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
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as PartnerBody
    const { name, email, restaurant, city, message } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }

    if (!email?.trim() || !EMAIL_RE.test(email.trim())) {
      return NextResponse.json(
        { error: 'A valid email is required.' },
        { status: 400 },
      )
    }

    if (!restaurant?.trim()) {
      return NextResponse.json(
        { error: 'Restaurant name is required.' },
        { status: 400 },
      )
    }

    const trimmed = {
      name: name.trim(),
      email: email.trim(),
      restaurant: restaurant.trim(),
      city: city?.trim() ?? '',
      message: message?.trim() ?? '',
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const toAddress = process.env.CONTACT_EMAIL ?? 'team@makanofficial.com'
    const fromAddress = process.env.RESEND_FROM ?? 'Makan Website <onboarding@resend.dev>'

    const [emailResult] = await Promise.all([
      resend.emails.send({
        from: fromAddress,
        to: toAddress,
        subject: `Restaurant partner inquiry — ${trimmed.restaurant}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px;">
            <h2 style="margin: 0 0 16px;">New restaurant partner inquiry</h2>
            <p style="margin: 0 0 8px;"><strong>Name:</strong> ${trimmed.name}</p>
            <p style="margin: 0 0 8px;"><strong>Email:</strong> ${trimmed.email}</p>
            <p style="margin: 0 0 8px;"><strong>Restaurant:</strong> ${trimmed.restaurant}</p>
            ${trimmed.city ? `<p style="margin: 0 0 8px;"><strong>City:</strong> ${trimmed.city}</p>` : ''}
            ${trimmed.message ? `<p style="margin: 0 0 8px;"><strong>Message:</strong> ${trimmed.message}</p>` : ''}
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
    console.error('Partner API error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 },
    )
  }
}
