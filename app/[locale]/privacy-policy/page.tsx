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
        <p className="mt-2 text-sm text-brand-muted">Last updated: 30 August 2026</p>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-brand-ink/80">

          <p>
            MAKAN APP LTD (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the Makan mobile
            application (the &ldquo;App&rdquo;) and the website at makanofficial.com (the
            &ldquo;Site&rdquo;) (together, the &ldquo;Services&rdquo;).
          </p>
          <p>
            <strong className="font-semibold text-brand-ink">Makan is for deciding what to eat.</strong>{' '}
            You use it when you are looking at a menu and do not know what to order. Almost everything
            the App does with your information exists to answer that one question: it remembers the
            meals you have had, it learns which ones you would choose again, and it uses that to tell
            you what you are likely to enjoy. This Policy explains what we collect and what we do with
            it, and where a thing we hold exists to help you decide, it says so.
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
                  <li>The audience you choose for each meal — friends-only or public (see section 5)</li>
                  <li>Friend relationships and friend requests (Makan uses mutual friendships)</li>
                  <li>Likes, craves, and comments</li>
                  <li>Your answers when the App asks you to compare two of your own meals and pick the one you would choose again</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">2.3 Technical, usage, and security data (App and Site)</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Device and app information required to operate the Services, such as device type, operating system, and app version</li>
                  <li>Usage and analytics events, collected to understand and improve the Services. These record which screens are opened and which features are used. Where an action involves another person — for example liking or commenting on someone else&apos;s meal — the event also records the account identifier of that other person, so we can tell what kind of interaction took place</li>
                  <li>Crash reports and diagnostic data, including a device identifier and the actions leading up to a crash, used to find and fix faults</li>
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
              <div>
                <h3 className="font-medium text-brand-ink">2.6 What you have to give us, and what you do not</h3>
                <p className="mt-2">
                  To create and use a Makan account we need your email address; without it we cannot
                  provide the App. Everything else is your choice. You do not have to add a display
                  name, upload meals, tag a restaurant, add captions, add friends, or allow location
                  access. If you choose not to, the related features are unavailable but the rest of
                  the App works normally.
                </p>
                <p className="mt-2">
                  We do not intentionally collect special category personal data. However,
                  user-generated content may reveal sensitive information. You should avoid uploading
                  personal data you do not wish to be processed.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">2.7 How we work out what you like</h3>
                <p className="mt-2">
                  This is the part of Makan that answers the question you came with, so it is worth
                  reading.
                </p>
                <p className="mt-2">
                  When the App shows you two of your own saved meals and asks which one you would
                  choose again, we keep your answer. From enough of those answers we build a private
                  picture of your own taste: an ordering of your own meals, a sense of which
                  restaurants suit you, and short written summaries of what your choices suggest you
                  enjoy. That picture is what lets Makan tell you what you are likely to like at a
                  restaurant you have never been to.
                </p>
                <p className="mt-2">
                  It is personal data about you, so you should know exactly what it is and is not:
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>It is built <strong className="font-semibold text-brand-ink">only from choices you made on purpose</strong> — the comparisons you answered. We do not build it by watching what you look at, tap, or linger on.</li>
                  <li>It is <strong className="font-semibold text-brand-ink">stored privately against your account and shown only to you.</strong> No other user sees it.</li>
                  <li>It is used <strong className="font-semibold text-brand-ink">only to help you decide what to eat.</strong> Never to advertise to you, never to rank you against other people, never to make a decision that affects you outside the App.</li>
                  <li>Losing a comparison does not mean you disliked something. It records only which of two meals you would return to first.</li>
                  <li>You can <strong className="font-semibold text-brand-ink">object</strong> to us building it at all — see section 11 — and it is <strong className="font-semibold text-brand-ink">deleted when you delete your account.</strong></li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">3. How We Use Personal Data</h2>
            <div className="mt-4 space-y-3">
              <p>We use personal data to:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="font-semibold text-brand-ink">Help you decide what to eat</strong> — by remembering the meals you have saved, keeping the comparisons you have answered, and building the private picture of your taste described in section 2.7</li>
                <li>Create and manage user accounts</li>
                <li>Provide core App functionality, including saving meals and displaying feeds according to the audience you chose</li>
                <li>Operate the friend graph, including friend requests and mutual friendships</li>
                <li>Synchronise content across your devices</li>
                <li>Show nearby places and calculate distances, using your device location where you have granted permission</li>
                <li>Find and fix faults, using crash reports and diagnostic data</li>
                <li>Maintain security, prevent abuse, and protect the integrity of the Services</li>
                <li>Respond to support enquiries</li>
                <li>Feature content you post to a public audience in our own marketing, where permitted (see section 5)</li>
                <li>Understand usage and improve the reliability, performance, and design of the Services</li>
              </ul>
              <p>
                We do not sell personal data, and we do not use personal data for third-party
                advertising.
              </p>
              <p>
                <strong className="font-semibold text-brand-ink">Dish recognition — a feature we are building.</strong>{' '}
                The hardest version of the question Makan exists to answer is a menu in a restaurant
                you have never visited. To help there, we are building a feature that recognises when
                two of your own meals are the same dish — so the App can tell you that you have eaten
                something before, and point to a dish somewhere new that resembles one you already
                chose to return to.
              </p>
              <p>
                <strong className="font-semibold text-brand-ink">It is not available yet, and nothing analyses your photographs today.</strong>{' '}
                We will describe the feature in this Policy, and name the service provider involved,
                before it starts. Photographs you uploaded before it existed will never be analysed
                unless you separately opt them in — doing nothing means they are never touched. That
                was our promise when you saved them, and it does not change.
              </p>
              <p>
                <strong className="font-semibold text-brand-ink">When it arrives, it will be part of how the App works.</strong>{' '}
                Recognising your own dishes is not an extra we add on the side; it is how Makan answers
                the question you opened it to ask. So we will not ask you to switch it on, and there
                will not be a setting to switch it off. For this we rely on legitimate interests rather
                than your consent, and we explain that choice in section 4.2.
              </p>
              <p>
                <strong className="font-semibold text-brand-ink">You can still tell us to stop.</strong>{' '}
                You have a right to object to processing we base on legitimate interests. If you would
                rather we did not do this with your photographs, write to us at
                support@makanofficial.com and we will stop for your account. Your guidance will then
                come from whatever other evidence we have, which may be less useful to you. We will not
                keep asking you to change your mind.
              </p>
              <p>
                When we introduce it: we will compare your photographs only with your own. We will
                use it only to recognise and compare dishes. We will not use it to identify people,
                faces or places, to work out your dietary habits, your health or your beliefs, for
                advertising, or to make decisions about you that have legal or similarly significant
                effects.
              </p>
            </div>
          </section>

          {/* 4 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">4. Lawful Bases for Processing</h2>
            <div className="mt-4 space-y-4">
              <p>
                Under UK GDPR, we rely on the following lawful bases. In short:{' '}
                <strong className="font-semibold text-brand-ink">contract</strong> covers your account
                and the core features; <strong className="font-semibold text-brand-ink">legitimate
                interests</strong> covers the private taste picture, dish recognition, usage
                measurement, security, fault-fixing, and improving the Services; and{' '}
                <strong className="font-semibold text-brand-ink">consent</strong> covers enquiries,
                external marketing, and any analysis of photographs you saved before dish recognition
                existed.
              </p>
              <div>
                <h3 className="font-medium text-brand-ink">4.1 Contract</h3>
                <p className="mt-2">
                  Processing is necessary to provide the App and its core features once you create an
                  account — account management, saving and displaying meals according to your chosen
                  audience, the friend graph, and syncing across your devices.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">4.2 Legitimate interests</h3>
                <p className="mt-2">
                  <strong className="font-semibold text-brand-ink">The private picture of your taste (section 2.7).</strong>{' '}
                  We rely on legitimate interests to build it. Makan exists to help you decide what to
                  order, and that picture is the means by which it does so — it is not an incidental
                  by-product of running the App, it is the service you came for. We consider the
                  interest a shared one: the picture is built only from comparisons you deliberately
                  answered, it is visible only to you, it is never used to advertise to you or to
                  evaluate you, and it produces nothing that leaves the App. Weighed against your
                  rights and reasonable expectations, we think someone who asks an app what they
                  should order expects that app to remember what they liked. If you disagree, you can
                  object at any time using the contact details above, and we will stop.
                </p>
                <p className="mt-2">
                  <strong className="font-semibold text-brand-ink">Dish recognition (section 3).</strong>{' '}
                  We rely on legitimate interests here for the same reason. Makan is the app you open
                  when you do not know what to order, and knowing that two of your photographs are the
                  same dish is what makes an answer possible — so the feature is the service, not an
                  addition to it. We consider the interest a shared one: the comparison happens only
                  between your own photographs, what it produces is a fact about food rather than a
                  judgement about you, nothing from it is used to advertise to you or to evaluate you,
                  and nothing about it leaves the App. Weighed against your rights and reasonable
                  expectations, we think someone who asks an app what to order expects it to recognise
                  the meals they already showed it. Two limits keep that balance honest. Photographs
                  you saved before the feature existed are left out of it unless you opt them in. And
                  you can object at any time using the contact details above, after which we stop for
                  your account.
                </p>
                <p className="mt-2">
                  <strong className="font-semibold text-brand-ink">Operating and improving the Services.</strong>{' '}
                  We also rely on legitimate interests for internal operations: measuring how the App
                  is used, security, abuse prevention, crash and fault diagnosis, and improving
                  reliability and design. We balance these against your rights and expectations, we do
                  not use this data for advertising, and you can object as described in section 11.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">4.3 Consent</h3>
                <p className="mt-2">
                  We rely on your consent when you submit an enquiry through the Site, before we
                  feature content that identifies you on an external platform such as our Instagram
                  (see section 5), and before we analyse any photograph you saved before dish
                  recognition existed (section 3). We do not rely on consent for dish recognition
                  itself; that is explained in section 4.2.
                </p>
                <p className="mt-2">
                  You can withdraw consent at any time by contacting us or unsubscribing. Withdrawing
                  your consent does not affect the lawfulness of any processing we carried out before
                  you withdrew it.
                </p>
              </div>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">5. Sharing and Visibility Controls</h2>
            <div className="mt-4 space-y-3">
              <p>
                Each meal you save has one of two audiences. What other people can see depends on
                which you choose.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong className="font-semibold text-brand-ink">Public</strong> — visible to other users, and it may appear in discovery features within the App</li>
                <li><strong className="font-semibold text-brand-ink">Friends only</strong> — visible to your mutual friends</li>
              </ul>
              <p>Your first shared meal is always friends-only. After that you choose for each meal.</p>
              <p>
                To be clear about what &ldquo;friends only&rdquo; means: a meal that is not public can
                be seen by people you and they have both added as friends. It is not visible only to
                you. If you do not want a meal seen by anyone else, do not save it to Makan.
              </p>
              <p>
                You choose a meal&apos;s audience at the moment you save it, and at present there is no
                way to change that choice afterwards. If you want a meal to have a different audience,
                delete it and save it again.
              </p>
              <p>
                Deleting a meal removes it from the App. Copies may remain temporarily in device
                caches or system backups for limited periods, as described in the retention section.
              </p>

              <div className="pt-2">
                <h3 className="font-medium text-brand-ink">Featuring your public content in our marketing</h3>
                <p className="mt-2">
                  Where you post content to a public audience, we may feature it in our own
                  promotional materials and on our own channels, including third-party platforms such
                  as Instagram and TikTok — for example, a curated &ldquo;Makan of the Week&rdquo;.
                  This may include your meal photo, your caption, and your username or display name.
                </p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Only public content. We never use content you have set to friends-only.</li>
                  <li>Lawful basis. Where we feature content that identifies you on an external platform, we rely on your consent, which we ask for beforehand and which you can withdraw at any time. For promotional surfaces we operate inside the Services, we may rely on our legitimate interests in promoting Makan, balanced against your rights, and you can object at any time.</li>
                  <li>Other people in your photos. Before we feature anything externally we look at it first, and we do not publish photographs in which other people are clearly identifiable. If you appear in content we have featured and you did not agree to it, contact us and we will remove it from the channels we control.</li>
                  <li>Under-18s. We do not knowingly feature content from users under 18 in external marketing. We cannot verify age, so if this applies to you, contact us and we will remove it.</li>
                  <li>
                    Your controls. You can decline, ask us to remove featured content from channels we
                    control, or object, by contacting{' '}
                    <a href="mailto:support@makanofficial.com" className="text-brand-orange hover:underline">
                      support@makanofficial.com
                    </a>
                    . Content already shared onward by others may remain outside our control.
                  </li>
                  <li>Third-party platforms. When your content appears on a third-party platform, that platform processes it under its own privacy policy.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 6 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">6. Service Providers and Other Recipients</h2>
            <div className="mt-4 space-y-4">
              <p>
                We use the following providers to operate the Services. Where they process personal
                data on our behalf, they do so under contractual terms requiring appropriate security
                and confidentiality. Some of the services below are contacted directly by your device,
                which means they see your IP address even where we send them nothing about you; those
                are listed here too, so the picture is complete.
              </p>
              <div>
                <h3 className="font-medium text-brand-ink">Providers that process data on our behalf</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Google LLC (Firebase) — the App&apos;s backend. We use Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud Functions, and Firebase Analytics to store and synchronise account and meal data, operate core features, and understand usage.</li>
                  <li>Functional Software, Inc. (Sentry) — crash and error reporting for the App. Receives diagnostic data about faults, including a user identifier and the sequence of actions before a crash, so we can find and fix them.</li>
                  <li>Vercel Inc. — hosting for the Site, and Vercel Web Analytics, which measures aggregate Site usage.</li>
                  <li>Google LLC (Google Sheets) — secure storage of contact-form and enquiry submissions.</li>
                  <li>Resend — delivery of transactional emails, such as contact-form notifications.</li>
                  <li>Apple Inc. — distribution of the App through the App Store.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">Services your device contacts directly</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Google LLC (Places and Maps) — restaurant search and nearby places. When you search for a restaurant or ask the App for places near you, your search text and your approximate location are sent to Google.</li>
                  <li>KLIPY — the GIF picker in comments. When you type in the GIF search box, what you type is sent to Klipy, and because the request comes from your phone, Klipy also sees your IP address. Klipy does not receive your Makan account identifier or any device identifier. Klipy also sees the IP address of anyone whose device loads a GIF in a comment.</li>
                  <li>Unsplash — supplies the photographs used in our own editorial collections inside the App. Your device loads those images directly from Unsplash, so Unsplash sees your IP address. Nothing about you or your meals is sent.</li>
                </ul>
              </div>
              <p>
                We do not use third-party advertising SDKs or cross-app tracking technologies. We keep
                this list current. Where we replace or add a provider performing a function already
                described in this Policy, we update this list before the new provider begins processing
                personal data. Where a change would introduce a new purpose, we describe it in this
                Policy and establish a lawful basis for it first.
              </p>
            </div>
          </section>

          {/* 7 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">7. Cookies and Similar Technologies</h2>
            <div className="mt-4 space-y-3">
              <p>
                <strong className="font-semibold text-brand-ink">The Site.</strong> The Site uses
                Vercel Web Analytics, which is privacy-friendly and cookieless: it identifies visits
                using a hash that resets daily and cannot track you across days or across other
                websites. Vercel Web Analytics does not use cookies and collects no personal
                identifiers. The fonts used on the Site are served from our own domain, so loading a
                page does not send your details to a font provider.
              </p>
              <p>
                <strong className="font-semibold text-brand-ink">The App.</strong> The App uses
                Firebase Analytics, which relies on a device identifier to measure how features are
                used, and Sentry, which uses a device identifier to report crashes. We rely on our
                legitimate interests in understanding usage and fixing faults, as described in section
                4.2. We never use these technologies for advertising, for cross-app tracking, or to
                build the picture of your taste described in section 2.7. If you would prefer that we
                did not process your usage data in this way, tell us at{' '}
                <a href="mailto:support@makanofficial.com" className="text-brand-orange hover:underline">
                  support@makanofficial.com
                </a>{' '}
                and we will stop for your account.
              </p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">8. International Data Transfers</h2>
            <div className="mt-4 space-y-3">
              <p>
                Some of the services listed in section 6 — including Google, Sentry, Vercel, Resend,
                Apple, Klipy, and Unsplash — receive or process personal data outside the United
                Kingdom, including in the United States.
              </p>
              <p>
                Where international transfers occur, we rely on appropriate safeguards recognised
                under UK law, such as the UK International Data Transfer Agreement or Addendum, the UK
                extension to the EU Standard Contractual Clauses, or transfers to providers certified
                under an applicable data protection framework. You can request more information about
                these safeguards using the contact details above.
              </p>
              <p>
                If you use the Services in Indonesia, additional rights and protections apply to you
                under Indonesia&apos;s Personal Data Protection Law (UU PDP No. 27/2022). We are
                extending this Policy and our practices to meet those requirements. For questions
                about your data as a user in Indonesia, contact{' '}
                <a href="mailto:support@makanofficial.com" className="text-brand-orange hover:underline">
                  support@makanofficial.com
                </a>
                .
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
              <p>
                We retain personal data only for as long as necessary for the purposes described in
                this Privacy Policy.
              </p>
              <div>
                <h3 className="font-medium text-brand-ink">10.1 Active accounts</h3>
                <p className="mt-2">
                  Account data and meal content are retained while an account remains active.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">10.2 Deleted accounts</h3>
                <p className="mt-2">
                  When an account is deleted, personal data is deleted or anonymised within 30 days,
                  unless a longer retention period is required by law or necessary for security
                  purposes such as preventing abuse. We keep a permanent record that an account was
                  deleted, in a form that does not identify you, so that the deletion cannot be
                  accidentally undone.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">10.3 Enquiry data</h3>
                <p className="mt-2">
                  Enquiry data is retained until you ask us to remove it, or until it is no longer
                  needed for the purpose it was submitted for.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-brand-ink">10.4 Backups and security logs</h3>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Backups retain data for a limited period as part of system resilience and recovery</li>
                  <li>Security and abuse-prevention logs are retained for a limited period appropriate to detecting and investigating abuse</li>
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
                <li>Object to processing we carry out on the basis of legitimate interests. This includes the private picture of your taste described in section 2.7, and the usage measurement and crash reporting described in section 7</li>
                <li>Withdraw consent where we rely on it. Withdrawing consent does not affect the lawfulness of processing we carried out before you withdrew it</li>
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
                You also have the right to lodge a complaint with the UK Information
                Commissioner&apos;s Office (ICO) at ico.org.uk.
              </p>
            </div>
          </section>

          {/* 12 */}
          <section>
            <h2 className="text-lg font-semibold text-brand-ink">12. Children</h2>
            <div className="mt-4 space-y-3">
              <p>You must be at least 13 to create an account.</p>
              <p>
                The App does not verify age. Because a service like ours may be used by children and
                we cannot reliably tell which of our users are children, we apply the protections
                expected by the UK Age Appropriate Design Code (the Children&apos;s Code) to{' '}
                <strong className="font-semibold text-brand-ink">every</strong> user, not only to
                those we believe to be young. In practice this means:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Your first shared meal is always friends-only; after that, you choose friends-only or public for each meal</li>
                <li>Location access is off by default and only used, with permission, at the moment you use a location feature</li>
                <li>We collect the minimum data needed, and we never use your data for targeted advertising</li>
                <li>We build a private picture of your own taste from the comparisons you answer, as described in section 2.7. It exists to help you choose what to eat, it is shown only to you, and it is never used to advertise to you, to judge you, or to decide anything about you</li>
                <li>We do not use manipulative design or nudges to push you to share more than you intend</li>
                <li>We do not use streaks, badges, points, or leaderboards to keep you using the App</li>
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
            <h2 className="text-lg font-semibold text-brand-ink">13. Automated Decision-Making and Profiling</h2>
            <div className="mt-4 space-y-3">
              <p>
                We do not use automated decision-making or profiling that produces legal effects or
                similarly significant effects for you.
              </p>
              <p>
                Makan does build the private picture of your taste described in section 2.7, and it is
                fair to call that a profile of your preferences. We would rather say so plainly than
                hide behind wording. What matters is what it is for and what it cannot do: it exists
                to answer &ldquo;what should I order&rdquo;, it is assembled from comparisons you
                chose to answer, it is shown to nobody but you, and it is never used to evaluate you,
                to decide whether you can use any part of the Services, or to advertise to you.
              </p>
              <p>
                We do not analyse the content of your meal photographs. By &ldquo;analyse&rdquo; we
                mean working out what a photograph shows. Ordinary technical handling — resizing,
                compressing, storing and delivering your photographs so the App can display them — is
                not analysis, and we do that for every meal you save.
              </p>
              <p>
                When we introduce the dish recognition feature described in section 3, it will work by
                measuring how similar the food in two photographs looks. It affects only what the App
                shows you about your own meals, it does not produce a judgement about you, and it makes
                no decision that has a legal or similarly significant effect. You will be able to
                correct any grouping that is wrong, and you can object to the processing altogether as
                described in sections 3 and 11.
              </p>
            </div>
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
