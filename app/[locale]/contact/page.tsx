import { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Footer from '@/components/Footer'
import ContactForm from './ContactForm'
import styles from '@/components/utility.module.css'
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
      <main id="main-content" className={`${styles.page} ${styles.contactPage}`}>
        <ContactForm />
      </main>
      <Footer />
    </div>
  )
}
