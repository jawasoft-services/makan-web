import { Metadata } from 'next'
import Footer from '@/components/Footer'
import PartnerForm from './PartnerForm'

export const metadata: Metadata = {
  title: 'Claim your restaurant — Makan',
  description:
    'Claim your restaurant on Makan. Free for the life of your venue as a Durham Launch Partner. We’re opening 20 partnerships.',
}

export default function PartnerPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <main id="main-content" className="flex min-h-screen items-center justify-center px-5 sm:px-8 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <PartnerForm />
      </main>
      <Footer />
    </div>
  )
}
