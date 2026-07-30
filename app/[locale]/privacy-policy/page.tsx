import { Metadata } from 'next'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { createPageMetadata } from '@/lib/site-metadata'

export const metadata: Metadata = createPageMetadata({
  title: 'Privacy Policy — Makan',
  description: 'How Makan App Ltd collects, uses, and protects your personal data.',
  path: '/privacy-policy',
})

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <main id="main-content" className="mx-auto max-w-3xl px-5 sm:px-8 pt-24 sm:pt-32 pb-16 sm:pb-24">

        {/* Eyebrow */}
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">
          Legal
        </p>

        {/* Title */}
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold text-brand-ink">Privacy Policy</h1>
        <p className="mt-2 text-sm text-brand-muted">Last updated: 18 July 2026</p>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-brand-ink/80">

          <p>
            MAKAN APP LTD (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the Makan mobile
            application (the &ldquo;App&rdquo;) and the website at makanofficial.com (the
            &ldquo;Site&rdquo;) (together, the &ldquo;Services&rdquo;). This Privacy Policy
            explains how we collect, use, store, and protect personal data when you use the Services.
          </p>
          <p>
            We comply with the UK General Data Protection Regulation (UK GDPR) and the Data
            Protection Act 2018.
          </p>

          {/* 1 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">1. Who We Are</h2>
            <div className="mt-4 space-y-2">
              <p>Data controller: MAKAN APP LTD</p>
              <p>Registered address: 86–90 Paul Street, London, EC2A 4NE, United Kingdom</p>
              <p>
                Contact email:{' '}
                <a href="mailto:support@makanofficial.com" className="text-brand-orange hover:underline">
                  support@makanofficial.com
                </a>
              </p>
              <p>
                MAKAN APP LTD is responsible for determining how and why personal data is processed
                under this Privacy Policy. We have not appointed a Data Protection Officer, as we are
                not required to; data-protection queries can be sent to the contact email above.
              </p>
            </div>
          </section>

          {/* 2 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">2. Personal Data We Collect</h2>
            <div className="mt-4 space-y-6">
              <div>
                <h3 className="font-medium text-brand-ink">2.1 Account data (App)</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Name or display name (if provided)</li>
                  <li>Email address</li>
                  <li>Username and unique user identifier</li>
                  <li>Account status</li>
                  <li>Account creation and activity timestamps</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">2.2 Meal content and social data (App)</h3>
                <p className="mt-2">Depending on how you use the App, we process:</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Meal photos you upload</li>
                  <li>Captions or notes added to meals</li>
                  <li>Restaurant or location tags applied to meals</li>
                  <li>Audience settings selected for each post (just me, friends-only, or public)</li>
                  <li>Friend relationships and friend requests (Makan uses mutual friendships)</li>
                  <li>Likes, craves, and comments</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">2.3 Technical, usage, and security data (App and Site)</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Device and app information required to operate the Services, such as device type, operating system, and app version</li>
                  <li>Usage and analytics events (for example, which screens are opened and which features are used), collected to understand and improve the Services</li>
                  <li>Approximate location derived from your IP address, used for aggregate analytics</li>
                  <li>Security, abuse-prevention, and diagnostic logs used to protect users and the Services</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">2.4 Location data (App)</h3>
                <p className="mt-2">
                  With your permission, the App accesses your device&apos;s location to show you
                  nearby places and calculate distances to restaurants. You can grant or revoke this
                  permission at any time in your device settings. If you decline, location-based
                  discovery features are limited, but the rest of the App works normally. We use your
                  location to provide these features at the time you use them and do not build a
                  history of your movements.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">2.5 Enquiry data (Site)</h3>
                <p className="mt-2">
                  If you contact us through the Site, we process the name and email address you
                  submit, and a timestamp, so we can respond to you.
                </p>
              </div>
              <p>
                We do not intentionally collect special category personal data. However,
                user-generated content may reveal sensitive information. You should avoid uploading
                personal data you do not wish to be processed.
              </p>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">3. How We Use Personal Data</h2>
            <div className="mt-4 space-y-3">
              <p>We use personal data to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Create and manage user accounts</li>
                <li>Provide core App functionality, including saving meals and displaying feeds according to your selected audience settings</li>
                <li>Operate the friend graph, including friend requests and mutual friendships</li>
                <li>Synchronise content across your devices</li>
                <li>Show nearby places and calculate distances, using your device location where you have granted permission</li>
                <li>Maintain security, prevent abuse, and protect the integrity of the Services</li>
                <li>Respond to support enquiries</li>
                <li>Feature content you post to a public audience in our own marketing, where permitted (see section 5)</li>
                <li>Understand usage and improve the reliability, performance, and design of the Services</li>
              </ul>
              <p>
                We do not sell personal data, we do not use personal data for third-party
                advertising, and we do not use AI to generate, infer, or analyse the content of your
                meals.
              </p>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">4. Lawful Bases for Processing</h2>
            <div className="mt-4 space-y-4">
              <p>Under UK GDPR, we rely on the following lawful bases.</p>
              <div>
                <h3 className="font-medium text-brand-ink">4.1 Contract</h3>
                <p className="mt-2">Processing is necessary to provide the App and its core features once you create an account.</p>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">4.2 Legitimate interests</h3>
                <p className="mt-2">
                  Processing is necessary for internal operations such as security, abuse prevention,
                  understanding usage, and improving the reliability of the Services. We balance these
                  interests against your rights and expectations.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">4.3 Consent</h3>
                <p className="mt-2">
                  We rely on your consent when you submit an enquiry through the Site, for any
                  optional analytics technologies that require consent, and before we feature content
                  that identifies you on an external platform such as our Instagram (see section 5).
                  You can withdraw consent at any time by contacting us or unsubscribing.
                </p>
              </div>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">5. Sharing and Visibility Controls</h2>
            <div className="mt-4 space-y-3">
              <p>The App supports different visibility settings. What other users can see depends on the choices you make.</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Public posts are visible to other users and may appear in discovery features within the App</li>
                <li>Friends-only posts are visible only to your mutual friends</li>
                <li>Private posts are visible only to you within your personal meal diary</li>
              </ul>
              <p>
                If you change the audience of a post or delete it, the change is applied within the
                App. Copies may remain temporarily in device caches or system backups for limited
                periods, as described in the retention section.
              </p>
              <div>
                <h3 className="font-medium text-brand-ink">Featuring your public content in our marketing</h3>
                <p className="mt-2">
                  Where you post content to a public audience, we may feature it in our own promotional
                  materials and on our own channels, including third-party platforms such as Instagram
                  and TikTok — for example, a curated &ldquo;Makan of the Week&rdquo;. This may include
                  your meal photo (which may show identifiable people), your caption, and your username
                  or display name.
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Only public content. We never use content you have set to private or friends-only.</li>
                  <li>Lawful basis. Where we feature content that identifies you on an external platform, we rely on your consent, which we ask for beforehand and which you can withdraw at any time. For promotional surfaces we operate inside the Services, we may rely on our legitimate interests in promoting Makan, balanced against your rights, and you can object at any time.</li>
                  <li>Under-18s. We do not feature content from users we know to be under 18 in external marketing.</li>
                  <li>Your controls. You can decline, ask us to remove featured content from channels we control, or object, by contacting support@makanofficial.com. Content already shared onward by others may remain outside our control.</li>
                  <li>Third-party platforms. When your content appears on a third-party platform, that platform processes it under its own privacy policy.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">6. Service Providers (Processors)</h2>
            <div className="mt-4 space-y-4">
              <p>
                We use the following providers to operate the Services. Each processes personal data
                on our behalf under contractual terms that require appropriate security and
                confidentiality.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <span className="text-brand-ink">Google LLC (Firebase)</span> — the App&apos;s
                  backend. We use Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud
                  Functions, and Firebase Analytics to store and synchronise account and meal data,
                  operate core features, and understand usage.
                </li>
                <li>
                  <span className="text-brand-ink">Vercel Inc.</span> — hosting for the Site, and
                  Vercel Web Analytics, which measures aggregate Site usage.
                </li>
                <li>
                  <span className="text-brand-ink">Google LLC (Google Sheets)</span> — secure
                  storage of contact-form and enquiry submissions.
                </li>
                <li>
                  <span className="text-brand-ink">Resend</span> — delivery of transactional emails,
                  such as contact-form notifications.
                </li>
                <li>
                  <span className="text-brand-ink">Apple Inc.</span> — distribution of the App
                  through the App Store.
                </li>
              </ul>
              <p>
                We do not use third-party advertising SDKs or cross-app tracking technologies. If we
                introduce additional processors, we will update this Privacy Policy before those
                changes take effect.
              </p>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">7. Cookies and Similar Technologies</h2>
            <div className="mt-4 space-y-3">
              <p>
                The Site uses Vercel Web Analytics, which is privacy-friendly and cookieless: it
                identifies visits using a hash that resets daily and cannot track you across days or
                across other websites. It stores no information on your device and collects no
                personal identifiers, so it does not require a consent banner.
              </p>
              <p>
                The App uses Firebase Analytics, which relies on device identifiers to measure how
                features are used. Because this stores and accesses information on your device, we ask
                for your consent within the App before enabling non-essential analytics, and you can
                change your choice at any time in the App&apos;s settings. We never use these
                technologies for advertising or cross-app tracking.
              </p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">8. International Data Transfers</h2>
            <div className="mt-4 space-y-3">
              <p>
                Some of our providers — including Google, Vercel, Resend, and Apple — process personal
                data outside the United Kingdom, including in the United States.
              </p>
              <p>
                Where international transfers occur, we rely on appropriate safeguards recognised under
                UK law, such as the UK International Data Transfer Agreement or Addendum, the UK
                extension to the EU Standard Contractual Clauses, or transfers to providers certified
                under an applicable data protection framework. You can request more information about
                these safeguards using the contact details above.
              </p>
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">9. Security</h2>
            <div className="mt-4 space-y-3">
              <p>
                We apply technical and organisational measures designed to protect personal data,
                including encryption in transit, access controls, and server-side security rules.
              </p>
              <p>
                No system is completely secure, but we take reasonable steps to protect data against
                unauthorised access, loss, or misuse. If a personal data breach occurs that is likely
                to result in a risk to your rights, we will notify the Information Commissioner&apos;s
                Office, and affected users where required, within the timeframes set by law.
              </p>
            </div>
          </section>

          {/* 10 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">10. Data Retention</h2>
            <div className="mt-4 space-y-4">
              <p>We retain personal data only for as long as necessary for the purposes described in this Privacy Policy.</p>
              <div>
                <h3 className="font-medium text-brand-ink">10.1 Active accounts</h3>
                <p className="mt-2">Account data and meal content are retained while an account remains active.</p>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">10.2 Deleted accounts</h3>
                <p className="mt-2">
                  When an account is deleted, personal data is deleted or anonymised within 30 days,
                  unless a longer retention period is required by law or necessary for security
                  purposes such as preventing abuse.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">10.3 Enquiry data</h3>
                <p className="mt-2">
                  Enquiry data is retained until you ask us to remove it, or until it is
                  no longer needed for the purpose it was submitted for.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">10.4 Backups and security logs</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Backups may retain data for up to 35 days as part of system resilience and recovery processes</li>
                  <li>Security and abuse-prevention logs may be retained for up to 180 days</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 11 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">11. Your Rights</h2>
            <div className="mt-4 space-y-3">
              <p>Under UK GDPR, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of personal data</li>
                <li>Request restriction of processing in certain circumstances</li>
                <li>Request data portability where applicable</li>
                <li>Object to processing in certain circumstances</li>
                <li>Withdraw consent where we rely on it</li>
              </ul>
              <p>
                You can delete your account at any time from within the App, which begins the deletion
                process described above. To exercise any other right, contact us at{' '}
                <a href="mailto:support@makanofficial.com" className="text-brand-orange hover:underline">
                  support@makanofficial.com
                </a>
                . We may request information to verify your identity, and we handle requests within
                the time limits required by law.
              </p>
              <p>
                You also have the right to lodge a complaint with the UK Information Commissioner&apos;s
                Office (ICO) at ico.org.uk.
              </p>
            </div>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">12. Children</h2>
            <div className="mt-4 space-y-3">
              <p>
                You must be at least 13 to create an account. Because a service like ours may be
                accessed by people under 18, we follow the UK Age Appropriate Design Code (the
                Children&apos;s Code). In practice this means:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your first post is friends-only; after that, you choose Public or Friends Only for each meal</li>
                <li>Location access is off by default and only used, with permission, at the moment you use a location feature</li>
                <li>We collect the minimum data needed and do not profile users or use data for targeted advertising</li>
                <li>We do not use manipulative design or nudges to push you to share more than you intend</li>
              </ul>
              <p>
                If we become aware that personal data has been collected from a child under 13, we
                will take steps to delete that data. If you believe a child has provided us with
                personal data, please contact us.
              </p>
            </div>
          </section>

          {/* 13 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">13. Automated Decision-Making</h2>
            <p className="mt-4">
              We do not use automated decision-making or profiling that produces legal or similarly
              significant effects, and we do not use AI to generate or interpret your meal content.
            </p>
          </section>

          {/* 14 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">14. Changes to This Policy</h2>
            <div className="mt-4 space-y-3">
              <p>We may update this Privacy Policy from time to time.</p>
              <p>
                The updated version will be published with a revised &ldquo;Last updated&rdquo; date.
                Where the change is significant, we will take reasonable steps to notify you, for
                example within the App or by email.
              </p>
            </div>
          </section>

          {/* Back to home */}
          <div className="pt-4 border-t border-brand-line">
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
