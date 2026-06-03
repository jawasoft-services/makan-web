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
      <main className="mx-auto max-w-3xl px-5 sm:px-8 pt-24 sm:pt-32 pb-16 sm:pb-24">

        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
          Legal
        </p>

        {/* Title */}
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-brand-text">Terms of Use</h1>
        <p className="mt-2 text-sm text-brand-muted">Last updated: 3 June 2026</p>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-brand-text/80">

          <p>
            MAKAN APP LTD (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the Makan mobile
            application (the &ldquo;App&rdquo;) and related websites and waitlists (together, the
            &ldquo;Services&rdquo;). These Terms of Use (the &ldquo;Terms&rdquo;) govern your access to
            and use of the Services. By accessing or using the App, the website, or by joining the
            waitlist, you agree to be bound by these Terms. If you do not agree, do not use the
            Services.
          </p>

          {/* 1 */}
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
              <p>MAKAN APP LTD is responsible for operating and maintaining the Services.</p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">2. Eligibility</h2>
            <div className="mt-4 space-y-3">
              <p>
                You must be at least 13 years old to use the Services. By using the Services, you
                confirm that you meet this requirement and that you are able to enter into a binding
                agreement.
              </p>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">3. Beta Nature of the Service</h2>
            <div className="mt-4 space-y-3">
              <p>The App is currently provided on an early-access beta basis.</p>
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

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">4. Your Account</h2>
            <div className="mt-4 space-y-3">
              <p>
                You are responsible for maintaining the confidentiality of your account and for all
                activity that occurs under it. You agree to provide accurate information and to keep
                it up to date. Notify us promptly of any unauthorised use of your account.
              </p>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">5. Acceptable Use</h2>
            <div className="mt-4 space-y-3">
              <p>You agree to use the Services only for lawful purposes. You must not:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Misuse the Services or interfere with their normal operation</li>
                <li>Access, or attempt to access, accounts or data belonging to other users without authorisation</li>
                <li>Upload or share content that is unlawful, harmful, harassing, hateful, defamatory, obscene, or that infringes the rights of others</li>
                <li>Impersonate any person or misrepresent your affiliation with anyone</li>
                <li>Upload viruses or malicious code, or attempt to compromise the security of the Services</li>
                <li>Scrape, harvest, or collect data about other users, or use automated means to access the Services, without our permission</li>
                <li>Use the Services in any way that breaches applicable laws or regulations</li>
              </ul>
              <p>We may remove content and suspend or terminate access where misuse is identified.</p>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">6. User Content</h2>
            <div className="mt-4 space-y-3">
              <p>You retain ownership of content you upload to the App, including meal photos and captions.</p>
              <p>
                By uploading content, you grant us a worldwide, non-exclusive, royalty-free licence to
                host, store, reproduce, and display that content solely for the purpose of operating
                and providing the Services in accordance with your selected audience settings. This
                licence ends when you delete the content or your account, except for copies retained
                in backups for the limited periods described in our Privacy Policy.
              </p>
              <p>
                You are responsible for the content you upload and confirm that you have the rights to
                share it and that it does not infringe the rights of others or violate applicable
                laws.
              </p>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">7. Intellectual Property and Infringement</h2>
            <div className="mt-4 space-y-3">
              <p>
                All intellectual property rights in the Services, branding, design, and underlying
                software are owned by or licensed to MAKAN APP LTD. You may not copy, reproduce,
                distribute, modify, or create derivative works from any part of the Services without
                our prior written permission, except as permitted by law.
              </p>
              <p>
                If you believe content on the Services infringes your intellectual property rights,
                contact us at{' '}
                <a href="mailto:support@makanofficial.com" className="text-brand-orange hover:underline">
                  support@makanofficial.com
                </a>{' '}
                with details of the content and your rights, and we will review and act on valid
                notices, including removing infringing content where appropriate.
              </p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">8. Privacy</h2>
            <div className="mt-4 space-y-3">
              <p>
                Your use of the Services is governed by our{' '}
                <Link href="/privacy-policy" className="text-brand-orange hover:underline">
                  Privacy Policy
                </Link>
                . By using the Services or joining the waitlist, you acknowledge that your personal
                data will be processed in accordance with that policy.
              </p>
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">9. Apple App Store</h2>
            <div className="mt-4 space-y-3">
              <p>
                The following applies where you obtain the App through Apple&apos;s App Store or
                TestFlight:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>These Terms are between you and MAKAN APP LTD only, not with Apple. Apple is not responsible for the App or its content.</li>
                <li>Your licence to use the App is a non-transferable licence to use it on any Apple-branded products that you own or control, as permitted by the Usage Rules in the Apple Media Services Terms and Conditions.</li>
                <li>Apple has no obligation to provide maintenance or support for the App.</li>
                <li>In the event the App fails to conform to any applicable warranty, you may notify Apple, and Apple may refund the purchase price (if any). To the maximum extent permitted by law, Apple has no other warranty obligation with respect to the App.</li>
                <li>Apple is not responsible for addressing any claims relating to the App, including product-liability, legal or regulatory, or consumer-protection claims.</li>
                <li>Apple is not responsible for the investigation, defence, or resolution of any third-party intellectual-property claim relating to the App.</li>
                <li>You confirm you are not located in a country subject to a US Government embargo and are not on any US Government restricted-parties list.</li>
                <li>You must comply with applicable third-party terms, including the App Store Terms of Service.</li>
                <li>Apple and its subsidiaries are third-party beneficiaries of these Terms and may enforce them against you.</li>
              </ul>
            </div>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">10. Termination</h2>
            <div className="mt-4 space-y-3">
              <p>
                You may stop using the Services and delete your account at any time. We may suspend or
                terminate your access if you breach these Terms, if required by law, or to protect the
                Services or other users.
              </p>
              <p>
                On termination, your right to use the Services ends. Content associated with a deleted
                account is handled as described in our Privacy Policy. Provisions that by their nature
                should survive termination — including content licences already granted, intellectual
                property, disclaimers, limitations of liability, and indemnities — will survive.
              </p>
            </div>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">11. Disclaimers</h2>
            <div className="mt-4 space-y-3">
              <p>The Services are provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis.</p>
              <p>
                We do not guarantee that the Services will be uninterrupted, error-free, or secure at
                all times. To the fullest extent permitted by law, we exclude all warranties, express
                or implied, including any implied warranties of satisfactory quality or fitness for a
                particular purpose. Nothing in these Terms affects statutory rights that cannot be
                excluded under applicable consumer law.
              </p>
            </div>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">12. Limitation of Liability</h2>
            <div className="mt-4 space-y-3">
              <p>
                Nothing in these Terms limits or excludes our liability for death or personal injury
                caused by negligence, for fraud or fraudulent misrepresentation, or for any other
                liability that cannot be limited or excluded under applicable law.
              </p>
              <p>
                Subject to the above, to the fullest extent permitted by law, MAKAN APP LTD will not
                be liable for any indirect or consequential loss, or for any loss of data, profits,
                revenue, or goodwill, arising from your use of, or inability to use, the Services. Our
                total liability arising out of or in connection with the Services is limited to the
                greater of the amount you have paid us in the twelve months before the claim, or
                £100.
              </p>
            </div>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">13. Indemnity</h2>
            <div className="mt-4 space-y-3">
              <p>
                You agree to indemnify and hold harmless MAKAN APP LTD from any claims, losses, or
                expenses (including reasonable legal fees) arising from your breach of these Terms,
                your misuse of the Services, or content you upload, to the extent permitted by law.
                This clause does not apply to consumers except to the extent permitted by applicable
                law.
              </p>
            </div>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">14. Changes to the Terms</h2>
            <div className="mt-4 space-y-3">
              <p>We may update these Terms from time to time.</p>
              <p>
                The latest version will always be published with an updated &ldquo;Last updated&rdquo;
                date. Where a change is significant, we will take reasonable steps to notify you.
                Continued use of the Services after changes take effect constitutes acceptance of the
                revised Terms.
              </p>
            </div>
          </section>

          {/* 15 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">15. General</h2>
            <div className="mt-4 space-y-3">
              <p>
                If any provision of these Terms is found to be unenforceable, the remaining provisions
                will remain in full force. Our failure to enforce any right is not a waiver of that
                right. You may not assign or transfer these Terms without our consent; we may assign
                them to an affiliate or successor. These Terms, together with the Privacy Policy, form
                the entire agreement between you and us regarding the Services.
              </p>
            </div>
          </section>

          {/* 16 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">16. Governing Law and Jurisdiction</h2>
            <div className="mt-4 space-y-3">
              <p>These Terms are governed by the laws of England and Wales.</p>
              <p>
                Any disputes arising out of or in connection with these Terms or the Services are
                subject to the exclusive jurisdiction of the courts of England and Wales. If you are a
                consumer, this does not deprive you of the protection of mandatory laws of the country
                in which you live.
              </p>
            </div>
          </section>

          {/* 17 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">17. Contact</h2>
            <div className="mt-4 space-y-2">
              <p>If you have any questions about these Terms, you can contact us at:</p>
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
          <div className="pt-4 border-t border-brand-border">
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
