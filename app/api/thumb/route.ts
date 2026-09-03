import { NextResponse } from 'next/server'
import { THUMB_WIDTHS } from '@/lib/thumb'

export const runtime = 'nodejs'

/**
 * Resizes a Firebase meal photo on the server. The originals are phone
 * photos of several hundred kilobytes; a grid tile needs a tenth of that.
 * Only this project's storage bucket is accepted, the result is WebP, and
 * it is cached for a year at the CDN and the browser (originals never
 * change: a new upload is a new URL). Any failure sends the browser to the
 * original rather than a broken image.
 */
const ALLOWED_PREFIX = 'https://firebasestorage.googleapis.com/v0/b/munchies-expo'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const u = searchParams.get('u') ?? ''
  const w = Number(searchParams.get('w'))
  if (!u.startsWith(ALLOWED_PREFIX) || !THUMB_WIDTHS.includes(w as (typeof THUMB_WIDTHS)[number])) {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }
  try {
    const upstream = await fetch(u, { cache: 'force-cache' })
    if (!upstream.ok) return NextResponse.redirect(u, 302)
    const input = Buffer.from(await upstream.arrayBuffer())
    const sharp = (await import('sharp')).default
    const out = await sharp(input).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 72 }).toBuffer()
    return new NextResponse(new Uint8Array(out), {
      headers: {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
    })
  } catch {
    return NextResponse.redirect(u, 302)
  }
}
