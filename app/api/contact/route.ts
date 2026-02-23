import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

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

    const resend = new Resend(process.env.RESEND_API_KEY)
    const toAddress = process.env.CONTACT_EMAIL ?? 'team@makanofficial.com'
    const fromAddress = process.env.RESEND_FROM ?? 'Makan Website <onboarding@resend.dev>'

    const { error } = await resend.emails.send({
      from: fromAddress,
      to: toAddress,
      subject: `New seat request from ${name.trim()}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px;">
          <h2 style="margin: 0 0 16px;">New seat request</h2>
          <p style="margin: 0 0 8px;"><strong>Name:</strong> ${name.trim()}</p>
          <p style="margin: 0 0 24px;"><strong>Email:</strong> ${email.trim()}</p>
          <hr style="border: none; border-top: 1px solid #eee;" />
          <p style="margin: 16px 0 0; color: #999; font-size: 13px;">
            Sent from makanofficial.com contact form
          </p>
        </div>
      `,
    })

    if (error) {
      console.error('Resend error:', error)
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
