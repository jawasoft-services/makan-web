import { Metadata } from 'next'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms of Use — Makan',
  description: 'Terms of Use for the Makan mobile application and associated services.',
}

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <main className="mx-auto max-w-3xl px-8 pt-32 pb-24">

        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
          Legal
        </p>

        {/* Title */}
        <h1 className="mt-4 text-4xl font-bold text-brand-text">Terms of Use</h1>
        <p className="mt-2 text-sm text-brand-cyan">Last updated: 20 September 2025</p>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-brand-text/80">

          <p>
            MAKAN APP LTD (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the Makan mobile
            application (the &ldquo;App&rdquo;) and related websites and waitlists. These Terms of Use
            govern your access to and use of the App and associated services. By accessing or using
            the App or joining the waitlist, you agree to be bound by these Terms.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">1. Who We Are</h2>
            <div className="mt-4 space-y-2">
              <p>Company name: MAKAN APP LTD</p>
              <p>Registered address: 86–90 Paul Street, London, EC2A 4NE, United Kingdom</p>
              <p>
                Contact email:{' '}
                <a href="mailto:support@makanofficial.com" className="text-brand-orange hover:underline">
                  support@makanofficial.com
                </a>
              </p>
              <p>MAKAN APP LTD is responsible for operating and maintaining the App and related services.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">2. Beta Nature of the Service</h2>
            <div className="mt-4 space-y-3">
              <p>The App is currently provided on an invite-only beta basis.</p>
              <p>
                Features, functionality, and availability may change at any time without notice. We
                may suspend, restrict, or terminate access to the App or any part of it during the
                beta period.
              </p>
              <p>
                You acknowledge that beta software may contain errors or incomplete features and that
                use of the App during this period is at your own risk.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">3. Use of the App and Site</h2>
            <div className="mt-4 space-y-3">
              <p>You agree to use the App, website, and waitlist only for lawful purposes.</p>
              <p>You must not:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Misuse the App or attempt to interfere with its normal operation</li>
                <li>Access or attempt to access accounts or data belonging to other users without authorisation</li>
                <li>Upload or share unlawful, harmful, or abusive content</li>
                <li>Use the App in a way that infringes the rights of others or applicable laws</li>
              </ul>
              <p>We reserve the right to suspend or terminate access where misuse is identified.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">4. User Content</h2>
            <div className="mt-4 space-y-3">
              <p>You retain ownership of content you upload to the App, including meal photos and captions.</p>
              <p>
                By uploading content, you grant us a limited licence to store, display, and process
                that content solely for the purpose of operating and providing the App in accordance
                with your selected audience settings.
              </p>
              <p>
                You are responsible for ensuring that content you upload does not infringe the rights
                of others or violate applicable laws.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">5. Intellectual Property</h2>
            <div className="mt-4 space-y-3">
              <p>
                All intellectual property rights in the App, website, branding, design, and
                underlying software are owned by or licensed to MAKAN APP LTD.
              </p>
              <p>
                You may not copy, reproduce, distribute, modify, or create derivative works from any
                part of the App or website without our prior written permission, except as permitted
                by law.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">6. Privacy</h2>
            <div className="mt-4 space-y-3">
              <p>
                Your use of the App and website is governed by our{' '}
                <Link href="/privacy-policy" className="text-brand-orange hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
              <p>
                By using the App or joining the waitlist, you acknowledge that your personal data
                will be processed in accordance with the Privacy Policy.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">7. Availability and Liability</h2>
            <div className="mt-4 space-y-3">
              <p>The App and website are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.</p>
              <p>
                We do not guarantee that the App will be uninterrupted, error-free, or secure at all
                times. To the fullest extent permitted by law, we exclude all warranties, express or
                implied.
              </p>
              <p>
                MAKAN APP LTD is not liable for any loss, damage, or inconvenience arising from your
                use of, or inability to use, the App or website, except where liability cannot be
                excluded under applicable law.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">8. Changes to the Terms</h2>
            <div className="mt-4 space-y-3">
              <p>We may update these Terms of Use from time to time.</p>
              <p>
                The latest version will always be published with an updated &ldquo;Last updated&rdquo; date.
                Continued use of the App after changes take effect constitutes acceptance of the
                revised Terms.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">9. Governing Law and Jurisdiction</h2>
            <div className="mt-4 space-y-3">
              <p>These Terms of Use are governed by the laws of England and Wales.</p>
              <p>
                Any disputes arising out of or in connection with these Terms or the App shall be
                subject to the exclusive jurisdiction of the courts of England and Wales.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">10. Contact</h2>
            <div className="mt-4 space-y-2">
              <p>If you have any questions about these Terms of Use, you can contact us at:</p>
              <p className="font-medium text-brand-text">MAKAN APP LTD</p>
              <p>86–90 Paul Street</p>
              <p>London, EC2A 4NE</p>
              <p>United Kingdom</p>
              <p>
                Email:{' '}
                <a href="mailto:support@makanofficial.com" className="text-brand-orange hover:underline">
                  support@makanofficial.com
                </a>
              </p>
            </div>
          </section>

          {/* Back to home */}
          <div className="pt-4 border-t border-brand-cyan/10">
            <Link href="/" className="text-sm text-brand-orange hover:underline">
              &larr; Back to home
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  )
}
