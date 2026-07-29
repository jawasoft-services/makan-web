import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Footer from '@/components/Footer'
import PartnerForm from './PartnerForm'
import { createPageMetadata } from '@/lib/site-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Partner' })
  return createPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: locale === 'id' ? '/id/partner' : '/partner',
    locale,
  })
}

export default function PartnerPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <main id="main-content" className="flex min-h-screen items-center justify-center px-5 sm:px-8 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <PartnerForm />
      </main>
      <Footer />
    </div>
  )
}
