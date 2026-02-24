import { Metadata } from 'next'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — Makan',
  description: 'How Makan App Ltd collects, uses, and protects your personal data.',
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <main className="mx-auto max-w-3xl px-8 pt-32 pb-24">

        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
          Legal
        </p>

        {/* Title */}
        <h1 className="mt-4 text-4xl font-bold text-brand-text">Privacy Policy</h1>
        <p className="mt-2 text-sm text-brand-cyan">Last updated: 20 September 2025</p>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-brand-text/80">

          <p>
            MAKAN APP LTD (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the Makan mobile
            application (the &ldquo;App&rdquo;). This Privacy Policy explains how we collect, use, store,
            and protect personal data when you use the App.
          </p>
          <p>
            We comply with the UK General Data Protection Regulation (UK GDPR) and the Data
            Protection Act 2018.
          </p>

          {/* Section */}
          <section>
            <h2 className="text-lg font-semibold text-brand-text">1. Who We Are</h2>
            <div className="mt-4 space-y-2">
              <p>Data controller: MAKAN APP LTD</p>
              <p>
                Registered address: 86–90 Paul Street, London, EC2A 4NE, United Kingdom
              </p>
              <p>
                Contact email:{' '}
                <a href="mailto:support@makanofficial.com" className="text-brand-orange hover:underline">
                  support@makanofficial.com
                </a>
              </p>
              <p>
                MAKAN APP LTD is responsible for determining how and why personal data is
                processed under this Privacy Policy.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">2. Personal Data We Collect</h2>
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="font-medium text-brand-text">2.1 Account data</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Name (if provided)</li>
                  <li>Email address</li>
                  <li>Unique user identifier</li>
                  <li>Account status</li>
                  <li>Account creation and activity timestamps</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-brand-text">2.2 Meal content and social data</h3>
                <p className="mt-2">Depending on how you use the App, we process:</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Meal photos you upload</li>
                  <li>Captions or notes added to meals</li>
                  <li>Tags applied to meals</li>
                  <li>Audience settings selected for each post (just me, friends-only, or public)</li>
                  <li>Following and mutual friend relationships</li>
                </ul>
                <p className="mt-3">Where features are enabled, this may also include:</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Likes or reactions</li>
                  <li>Comments</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-brand-text">2.3 Technical and security data</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>App and device information required to operate the service, such as app version and device type</li>
                  <li>Security, abuse-prevention, and diagnostic logs used to protect users and the App</li>
                </ul>
              </div>
              <p>
                We do not intentionally collect special category personal data. However,
                user-generated content may reveal sensitive information. Users should avoid
                uploading personal data they do not wish to be processed.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">3. How We Use Personal Data</h2>
            <div className="mt-4 space-y-3">
              <p>We use personal data to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create and manage user accounts</li>
                <li>Provide core App functionality, including saving meals and displaying feeds based on selected audience settings</li>
                <li>Synchronise content across devices</li>
                <li>Maintain security, prevent abuse, and protect the integrity of the App</li>
                <li>Respond to support enquiries</li>
                <li>Maintain and improve reliability and performance</li>
              </ul>
              <p>We do not sell personal data and we do not use personal data for third-party advertising.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">4. Lawful Bases for Processing</h2>
            <div className="mt-4 space-y-4">
              <p>Under UK GDPR, we rely on the following lawful bases.</p>
              <div>
                <h3 className="font-medium text-brand-text">4.1 Contract</h3>
                <p className="mt-2">Processing is necessary to provide the App and its core features once you create an account.</p>
              </div>
              <div>
                <h3 className="font-medium text-brand-text">4.2 Legitimate interests</h3>
                <p className="mt-2">
                  Processing is necessary for internal operations such as security, abuse prevention,
                  and improving the reliability of the App. These interests are balanced against your
                  rights and expectations.
                </p>
              </div>
              <p>
                We do not rely on consent for core account functionality. If optional features are
                introduced that require consent, this will be requested at the relevant time.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">5. Sharing and Visibility Controls</h2>
            <div className="mt-4 space-y-3">
              <p>The App supports different visibility settings. What other users can see depends on the choices you make.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Public posts are visible to other users and may appear in discovery features within the App</li>
                <li>Friends-only posts are visible only to mutual friends</li>
                <li>Private posts are visible only to you within your personal meal tracker</li>
              </ul>
              <p>
                If you change the audience of a post or delete it, the change is applied within the
                App. Copies may remain temporarily in device caches or system backups for limited
                periods, as described in the retention section.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">6. Storage, Processors, and Security</h2>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-medium text-brand-text">6.1 Storage and processors</h3>
                <p className="mt-2">
                  We use Apple CloudKit to store and synchronise data. Apple processes personal data
                  on our behalf to provide this infrastructure.
                </p>
                <p className="mt-2">
                  For the MVP, we do not use third-party advertising SDKs or cross-app tracking
                  technologies. If additional processors such as analytics, crash reporting, or
                  customer support tools are introduced, this Privacy Policy will be updated before
                  those changes take effect.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-brand-text">6.2 Security</h3>
                <p className="mt-2">
                  We apply technical and organisational measures designed to protect personal data,
                  including encryption in transit and access controls.
                </p>
                <p className="mt-2">
                  No system is completely secure, but we take reasonable steps to protect data
                  against unauthorised access, loss, or misuse.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">7. International Data Transfers</h2>
            <div className="mt-4 space-y-3">
              <p>Apple and other service providers may process personal data outside the United Kingdom.</p>
              <p>
                Where international transfers occur, appropriate safeguards are used, such as
                recognised transfer mechanisms and contractual protections, to ensure an adequate
                level of data protection.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">8. Data Retention</h2>
            <div className="mt-4 space-y-4">
              <p>We retain personal data only for as long as necessary for the purposes described in this Privacy Policy.</p>
              <div>
                <h3 className="font-medium text-brand-text">8.1 Active accounts</h3>
                <p className="mt-2">Account data and meal content are retained while an account remains active.</p>
              </div>
              <div>
                <h3 className="font-medium text-brand-text">8.2 Deleted accounts</h3>
                <p className="mt-2">
                  When an account is deleted, personal data is deleted or anonymised within 30 days,
                  unless a longer retention period is required by law or necessary for security
                  purposes such as preventing abuse.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-brand-text">8.3 Backups and security logs</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Backups may retain data for up to 35 days as part of system resilience and recovery processes</li>
                  <li>Security and abuse-prevention logs may be retained for up to 180 days</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">9. Your Rights</h2>
            <div className="mt-4 space-y-3">
              <p>Under UK GDPR, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of personal data</li>
                <li>Request restriction of processing in certain circumstances</li>
                <li>Request data portability where applicable</li>
                <li>Object to processing in certain circumstances</li>
              </ul>
              <p>
                To exercise your rights, contact us at{' '}
                <a href="mailto:support@makanofficial.com" className="text-brand-orange hover:underline">
                  support@makanofficial.com
                </a>
                . We may request information to verify your identity. Requests are handled within
                the time limits required by law.
              </p>
              <p>You also have the right to lodge a complaint with the UK Information Commissioner&apos;s Office (ICO).</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">10. Children</h2>
            <p className="mt-4">
              The App is not intended for children under the age of 13. If we become aware that
              personal data has been collected from a child under 13, we will take steps to delete
              that data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">11. Automated Decision-Making</h2>
            <p className="mt-4">
              We do not use automated decision-making or profiling that produces legal or similarly
              significant effects.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-brand-text">12. Changes to This Policy</h2>
            <div className="mt-4 space-y-3">
              <p>We may update this Privacy Policy from time to time.</p>
              <p>
                The updated version will be published with a revised &ldquo;Last updated&rdquo; date.
                Where appropriate, we will notify users within the App.
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
