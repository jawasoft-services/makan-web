import { Metadata } from 'next'
import Footer from '@/components/Footer'
import ContactForm from './ContactForm'

export const metadata: Metadata = {
  title: 'Request a Seat — Makan',
  description:
    'Join the Makan invite-only beta. Leave your details and we\u2019ll be in touch.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <main id="main-content" className="flex min-h-screen items-center justify-center px-5 sm:px-8 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <ContactForm />
      </main>
      <Footer />
    </div>
  )
}
