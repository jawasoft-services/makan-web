import { Metadata } from 'next'
import Footer from '@/components/Footer'
import PartnerForm from './PartnerForm'
import { createPageMetadata } from '@/lib/site-metadata'

export const metadata: Metadata = createPageMetadata({
  title: 'Claim your restaurant — Makan',
  description:
    'Claim your restaurant on Makan and connect with diners who remember where they ate.',
  path: '/partner',
})

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
