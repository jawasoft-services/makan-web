import { NextResponse } from 'next/server'
import { rateLimited } from '@/lib/rate-limit'
import { THUMB_WIDTHS, thumbSource } from '@/lib/thumb'

export const runtime = 'nodejs'

/**
 * Resizes a Firebase meal photo on the server. The originals are phone
 * photos of several hundred kilobytes; a grid tile needs a tenth of that.
 * Only objects in this project's storage bucket are accepted (lib/thumb.ts),
 * the result is WebP, and it is cached for a year at the CDN and the browser
 * (originals never change: a new upload is a new URL). Any failure sends the
 * browser to the original rather than a broken image.
 *
 * Each unique URL costs a function run and a resize, and a page loads at most
 * a few dozen; a stream of unique URLs from one address is not a page. Past
 * the limit the browser is sent to the original, so nothing breaks and the
 * resize is what is withheld. Vercel Firewall rules remain the global control.
 */
const LIMIT = { burst: 120, perMinute: 120 }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const u = thumbSource(searchParams.get('u') ?? '')
  const w = Number(searchParams.get('w'))
  if (!u || !THUMB_WIDTHS.includes(w as (typeof THUMB_WIDTHS)[number])) {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }
  if (rateLimited(request, 'thumb', LIMIT)) return NextResponse.redirect(u, 302)
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
