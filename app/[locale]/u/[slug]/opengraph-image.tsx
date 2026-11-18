import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { getPublicProfile, profileKey, profileImage } from '@/lib/public-profile'
import { WEBSITE_FIXTURES } from '@/lib/website-fixtures'
import { createSocialImage } from '../../_social-image'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const dynamic = 'force-dynamic'

async function cardPhoto(src: string, width: number): Promise<string | null> {
  if (!profileImage(src)) return null
  try {
    const input = WEBSITE_FIXTURES ? await readFile(join(process.cwd(), 'public', src.slice(1)))
      : await fetch(src, { next: { revalidate: 86400 } }).then(async response => response.ok ? Buffer.from(await response.arrayBuffer()) : null)
    if (!input) return null
    const sharp = (await import('sharp')).default
    const jpeg = await sharp(input).rotate().resize(width, width, { fit: 'cover' }).jpeg({ quality: 82 }).toBuffer()
    return `data:image/jpeg;base64,${jpeg.toString('base64')}`
  } catch { return null }
}

export default async function ProfileImage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug } = await params
  const key = profileKey(slug)
  const profile = key ? await getPublicProfile(key) : null
  if (!profile) {
    const fallback = createSocialImage()
    fallback.headers.set('Cache-Control', 'public, s-maxage=300')
    return fallback
  }
  const [avatar, photos, font] = await Promise.all([
    cardPhoto(profile.avatar, 128), Promise.all(profile.top3.map(meal => cardPhoto(meal.imageURL, 240))),
    readFile(join(process.cwd(), 'public/fonts/PlusJakartaSans-Bold.ttf')),
  ])
  return new ImageResponse(<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 64, backgroundColor: '#FFF8EF', color: '#2B1503', fontFamily: 'Plus Jakarta Sans' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
      {avatar ? <img src={avatar} alt="" width={128} height={128} style={{ borderRadius: 64 }} /> : null}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', fontSize: profile.name.length > 30 ? 40 : 56, fontWeight: 700, lineHeight: 1.15 }}>{profile.name}</div>
        <div style={{ display: 'flex', marginTop: 12, fontSize: 28 }}>@{profile.handle}</div>
      </div>
    </div>
    <div style={{ display: 'flex', gap: 24, marginTop: photos.some(Boolean) ? 32 : 0 }}>
      {photos.map((photo, index) => photo ? <img key={index} src={photo} alt="" width={240} height={240} style={{ borderRadius: 16 }} /> : null)}
    </div>
  </div>, { ...size, headers: { 'Cache-Control': 'public, s-maxage=300' }, fonts: [{ name: 'Plus Jakarta Sans', data: font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength) as ArrayBuffer, weight: 700, style: 'normal' }] })
}
