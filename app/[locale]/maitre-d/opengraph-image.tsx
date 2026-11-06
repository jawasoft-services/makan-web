import en from '@/messages/en.json'
import id from '@/messages/id.json'
import { createDecisionSocialImage } from '../_social-image'

export const alt = 'Maître d’ on Makan'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const t = (locale === 'id' ? id : en).MaitredPage
  return createDecisionSocialImage('Maître d’', `${t.heroStart} ${t.heroEnd}`, 108)
}
