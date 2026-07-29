import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Footer from '@/components/Footer'
import ContactForm from './ContactForm'
import { createPageMetadata } from '@/lib/site-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'Contact' })
  return createPageMetadata({
    title: t('metaTitle'),
    description: t('metaDescription'),
    path: locale === 'id' ? '/id/contact' : '/contact',
    locale,
  })
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <main id="main-content" className="flex min-h-screen items-center justify-center px-5 sm:px-8 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <ContactForm />
      </main>
      <Footer />
    </div>
  )
}
