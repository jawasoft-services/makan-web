// RM19740 — PUBLISH ONLY with release parity for the RM19738 analytics opt-out controls: section 7 describes a Settings switch
// and section 2.3 a narrowed event payload. Resolve docs/rm19740/PRD.md O-01–08 and recheck both dates before publication.
// RM20320 — PUBLISH ONLY once counsel has confirmed the wording of sections 2.7, 4, 11, 12, 13 and 14 (the taste
// picture is now part of the service under contract, and friends see a taste match), and publish this page and its
// Indonesian twin (components/legal/PrivacyPolicyId.tsx) together, before the app version that shows the notice
// and the friend match reaches anyone. Recheck the "Last updated" date at publication.
// Website analytics: enable only after Google automatic collection is off and the revised basis is reviewed.
// Maître d’ web visibility: 6 Nov product rule; notify existing diners and review its stated basis before publication.
import PlayfulArrow from '@/components/PlayfulArrow'
import styles from '@/components/utility.module.css'
import { Metadata } from 'next'
import Footer from '@/components/Footer'
import Link from 'next/link'
import PrivacyPolicyId from '@/components/legal/PrivacyPolicyId'
import MaitredPrivacyDisclosure from '@/components/legal/MaitredPrivacyDisclosure'
import { createPageMetadata } from '@/lib/site-metadata'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return locale === 'id'
    ? createPageMetadata({
      title: 'Kebijakan Privasi — Makan',
      description: 'Bagaimana Makan App Ltd mengumpulkan, menggunakan, dan melindungi data pribadimu.',
      path: '/id/privacy-policy',
      locale,
    })
    : createPageMetadata({
      title: 'Privacy Policy — Makan',
      description: 'How Makan App Ltd collects, uses, and protects your personal data.',
      path: '/privacy-policy',
      locale,
    })
}

const sections = [
  "1. Who We Are",
  "2. Personal Data We Collect",
  "3. How We Use Personal Data",
  "4. Lawful Bases for Processing",
  "5. Sharing and Visibility Controls",
  "6. Service Providers and Other Recipients",
  "7. Cookies and Similar Technologies",
  "8. International Data Transfers",
  "9. Security",
  "10. Data Retention",
  "11. Your Rights",
  "12. Children",
  "13. Automated Decision-Making and Profiling",
  "14. Changes to This Policy"
]

export default async function PrivacyPolicy({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (locale === 'id') return <PrivacyPolicyId />
  return (
    <div className="min-h-screen bg-brand-cream">
      <main id="main-content" className={styles.legalPage}>
        <header className={styles.legalHeading}>

        {/* Eyebrow */}
        <p>
          Legal
        </p>

        {/* Title */}
        <h1>Privacy Policy</h1>
        <p>Last updated: 7 November 2026</p>

        </header>
        <div className={styles.legalLayout}>
          <aside className={styles.contents}><details><summary>On this page</summary><nav aria-label="On this page">{sections.map((title, index) => <a key={title} href={`#legal-section-${index + 1}`}>{title}</a>)}</nav></details></aside>
          <article className={styles.legalProse} data-policy-copy>


          <p>
            MAKAN APP LTD (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) operates the Makan mobile
            application (the &ldquo;App&rdquo;) and the website at makanofficial.com (the
            &ldquo;Site&rdquo;) (together, the &ldquo;Services&rdquo;).
          </p>
          <p>
            <strong>Makan is for deciding what to eat.</strong>{' '}
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
            <h2 id="legal-section-1">1. Who We Are</h2>
            <div>
              <p>Data controller: MAKAN APP LTD</p>
              <p>Registered address: 86–90 Paul Street, London, EC2A 4NE, United Kingdom</p>
              <p>
                Contact email:{' '}
                <a href="mailto:support@makanofficial.com">
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
            <h2 id="legal-section-2">2. Personal Data We Collect</h2>
            <div>
              <div>
                <h3>2.1 Account data (App)</h3>
                <ul>
                  <li>Name or display name (if provided)</li>
                  <li>Email address</li>
                  <li>Username and unique user identifier</li>
                  <li>Account status</li>
                  <li>Account creation and activity timestamps</li>
                </ul>
              </div>
              <div>
                <h3>2.2 Meal content and social data (App)</h3>
                <p>Depending on how you use the App, we process:</p>
                <ul>
                  <li>Meal photos you upload</li>
                  <li>Captions or notes added to meals</li>
                  <li>Restaurant or location tags applied to meals</li>
                  <li>The audience you choose for each meal — friends-only or public (see section 5)</li>
                  <li>Friend relationships and friend requests (Makan uses mutual friendships)</li>
                  <li>Likes, craves, and comments</li>
                  <li>Your answers when the App asks you to compare two of your own meals and pick the one you would choose again</li>
                  <li>The order you arrange your own meals in (&ldquo;Your order&rdquo;), including meals you move up or down</li>
                </ul>
              </div>
              <div>
                <h3>2.3 Technical, usage, and security data (App and Site)</h3>
                <ul>
                  <li>Device and app information required to operate the Services, such as device type, operating system, and app version</li>
                  <li>Usage and analytics events, collected to understand and improve the Services. These record which screens are opened and which features are used. Where an action involves another person — for example liking or commenting on someone else&apos;s meal — the event records only the kind of interaction, never who the other person was</li>
                  <li>Crash and performance diagnostics, including app and device information, diagnostic context and your account identifier while signed in, used to find and fix faults</li>
                  <li>Approximate location derived from your IP address, used for aggregate analytics</li>
                  <li>Security, abuse-prevention, and diagnostic logs used to protect users and the Services</li>
                </ul>
              </div>
              <div>
                <h3>2.4 Location data (App)</h3>
                <p>
                  With your permission, the App accesses your device&apos;s location to show you
                  nearby places and calculate distances to restaurants. You can grant or revoke this
                  permission at any time in your device settings. If you decline, location-based
                  discovery features are limited, but the rest of the App works normally. We use your
                  location to provide these features at the time you use them and do not build a
                  history of your movements.
                </p>
              </div>
              <div>
                <h3>2.5 Enquiry data (Site)</h3>
                <p>
                  If you contact us through the Site, we process the name and email address you
                  submit, and a timestamp, so we can respond to you.
                </p>
              </div>
              <div>
                <h3>2.6 What you have to give us, and what you do not</h3>
                <p>
                  To create and use a Makan account we need your email address; without it we cannot
                  provide the App. Everything else is your choice. You do not have to add a display
                  name, upload meals, tag a restaurant, add captions, add friends, or allow location
                  access. If you choose not to, the related features are unavailable but the rest of
                  the App works normally.
                </p>
                <p>
                  We do not intentionally collect special category personal data. However,
                  user-generated content may reveal sensitive information. You should avoid uploading
                  personal data you do not wish to be processed.
                </p>
              </div>
              <div>
                <h3>2.7 How we work out what you like</h3>
                <p>
                  This is the part of Makan that answers the question you came with, so it is worth
                  reading.
                </p>
                <p>
                  When the App shows you two of your own saved meals and asks which one you would
                  choose again, we keep your answer. We also keep the order you put your own meals
                  in. From those we build a picture of your own taste: an ordering of your own meals
                  and dishes, a sense of which restaurants suit you, and short written reasons for
                  what Makan suggests. That picture is what lets Makan tell you what you are likely
                  to like at a restaurant you have never been to.
                </p>
                <p>
                  It is personal data about you, and it is fair to call it a profile of your
                  preferences, so you should know exactly what it is and is not:
                </p>
                <ul>
                  <li>It is built <strong>only from choices you made on purpose</strong> — the comparisons you answered and the order you set. We do not build it by watching what you look at, tap, or linger on.</li>
                  <li>It is <strong>stored privately against your account.</strong> We do not show it to other users. Two things other people can see come from it, and only these two. First, a <strong>taste match with your friends</strong>: where you and a mutual friend have both ranked the same dishes, each of you sees how many dishes you have both ranked and how many of those sit in the same half of each of your orders — for example &ldquo;You agree on 4 of 6 dishes&rdquo;. It counts only your public and friends-only meals, the ones each of you can already see, and never drafts, held, deleted or test meals; it leaves out drinks, since it compares dishes; it shows neither your private order nor the dishes. Someone who is no longer your friend, or whom you have blocked or reported, sees nothing. Second, <strong>public rankings</strong>: your answers count, combined with everyone else&apos;s, toward public rankings such as a restaurant&apos;s Eat percentage. No individual answer is shown or attributed to you.</li>
                  <li>It is used <strong>only to help you decide what to eat</strong> — your suggestions, your taste match with friends and those combined rankings. Never to advertise to you, never to rank you against other people, never to make a decision that affects you outside the App.</li>
                  <li>Losing a comparison does not mean you disliked something. It records only which of two meals you would return to first.</li>
                  <li>It is <strong>part of how Makan works</strong>, so there is no setting to switch it off; we rely on contract for it (section 4.1). Earlier versions of the App had a &ldquo;Share my taste&rdquo; setting. It has been removed, and if you had it switched off the App tells you once. Answers you gave while it was off have never counted toward public rankings, but your order kept updating, so the taste match with friends uses it.</li>
                  <li>You can ask for a copy of it (section 11), and it is <strong>deleted when you delete your account.</strong></li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3 */}
          <section>
            <h2 id="legal-section-3">3. How We Use Personal Data</h2>
            <div>
              <p>We use personal data to:</p>
              <ul>
                <li><strong>Help you decide what to eat</strong> — by remembering the meals you have saved, keeping the comparisons you have answered, and building the picture of your taste described in section 2.7</li>
                <li>Show you and your friends how your tastes match, as described in section 2.7</li>
                <li>Create and manage user accounts</li>
                <li>Provide core App functionality, including saving meals and displaying feeds according to the audience you chose</li>
                <li>Operate the friend graph, including friend requests and mutual friendships</li>
                <li>Recognise Maître d’ title holders publicly and show the usual orders they choose to publish, with the controls described in section 5</li>
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
                <strong>Dish recognition — a feature we are building.</strong>{' '}
                The hardest version of the question Makan exists to answer is a menu in a restaurant
                you have never visited. To help there, we are building a feature that recognises when
                two of your own meals are the same dish — so the App can tell you that you have eaten
                something before, and point to a dish somewhere new that resembles one you already
                chose to return to.
              </p>
              <p>
                <strong>It is not available yet, and nothing analyses your photographs today.</strong>{' '}
                We will describe the feature in this Policy, and name the service provider involved,
                before it starts. Photographs you uploaded before it existed will never be analysed
                unless you separately opt them in — doing nothing means they are never touched. That
                was our promise when you saved them, and it does not change.
              </p>
              <p>
                <strong>When it arrives, it will be part of how the App works.</strong>{' '}
                Recognising your own dishes is not an extra we add on the side; it is how Makan answers
                the question you opened it to ask. So we will not ask you to switch it on, and there
                will not be a setting to switch it off. For this we rely on legitimate interests rather
                than your consent, and we explain that choice in section 4.2.
              </p>
              <p>
                <strong>You can still tell us to stop.</strong>{' '}
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
            <h2 id="legal-section-4">4. Lawful Bases for Processing</h2>
            <div>
              <p>
                Under UK GDPR, we rely on the following lawful bases. In short:{' '}
                <strong>contract</strong> covers your account,
                the core features and the picture of your taste and the taste match built from it;{' '}
                <strong>legitimate
                interests</strong> covers dish recognition, usage
                measurement, security, fault-fixing, improving the Services, and featuring meals you
                have made public in our marketing, and the public Maître d’ cards described in section 5; and{' '}
                <strong>consent</strong> covers enquiries
                and any analysis of photographs you saved before dish recognition existed.
              </p>
              <div>
                <h3>4.1 Contract</h3>
                <p>
                  Processing is necessary to provide the App and its core features once you create an
                  account — account management, saving and displaying meals according to your chosen
                  audience, the friend graph, and syncing across your devices.
                </p>
                <p>
                  <strong>The picture of your taste and the taste match (section 2.7).</strong>{' '}
                  Makan exists to help you decide what to order, and this picture is the means by which
                  it does so. Your suggestions, the taste match with your friends and the combined
                  rankings are the service you asked us for, so we process the data behind them to
                  provide it, and there is no separate setting to switch it off. We keep it to what the
                  service needs: it is built only from choices you made on purpose, it is never used to
                  advertise to you or to evaluate you, and what other people can see from it is limited
                  to the friend taste match and the combined rankings described in section 2.7.
                </p>
              </div>
              <div>
                <h3>4.2 Legitimate interests</h3>
                <p>
                  <strong>Dish recognition (section 3).</strong>{' '}
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
                <p>
                  <strong>Public Maître d’ cards (section 5).</strong>{' '}
                  We rely on legitimate interests in helping diners find restaurant regulars and
                  their published recommendations. We limit the card to your name, optional profile
                  photo, venue title and notes you publish. You can stop taking part through the
                  Maître d’ participation setting, or contact us to raise an objection. Your saved
                  meals remain subject to their chosen audience.
                </p>
                <p>
                  <strong>Featuring public meals in our marketing (section 5).</strong>{' '}
                  We rely on legitimate interests to feature meals you have set to a public audience,
                  including the photo, your caption and your username or display name, in our own
                  promotional materials and on our own channels, such as Instagram and TikTok. You
                  chose to make the meal public; we only use public content, never friends-only; we
                  credit you; and we do not feature photographs in which other people are clearly
                  identifiable, or content from users we know to be under 18. You can object, or ask us
                  to remove something we have featured, at any time using the contact details above,
                  and we will.
                </p>
                <p>
                  <strong>Operating and improving the Services.</strong>{' '}
                  We also rely on legitimate interests for internal operations: measuring how the App
                  is used, security, abuse prevention, crash and fault diagnosis, and improving
                  reliability and design. We balance these against your rights and expectations, we do
                  not use this data for advertising, and you can object as described in section 11.
                </p>
              </div>
              <div>
                <h3>4.3 Consent</h3>
                <p>
                  We rely on your consent when you submit an enquiry through the Site, and before we
                  analyse any photograph you saved before dish recognition existed (section 3). We do not rely on consent for dish recognition
                  itself; that is explained in section 4.2.
                </p>
                <p>
                  You can withdraw consent at any time by contacting us or unsubscribing. Withdrawing
                  your consent does not affect the lawfulness of any processing we carried out before
                  you withdrew it.
                </p>
              </div>
            </div>
          </section>

          {/* 5 */}
          <section>
            <h2 id="legal-section-5">5. Sharing and Visibility Controls</h2>
            <div>
              <p>
                Each meal you save has one of two audiences. What other people can see depends on
                which you choose.
              </p>
              <ul>
                <li><strong>Public</strong> — visible to other users, and it may appear in discovery features within the App</li>
                <li><strong>Friends only</strong> — visible to your mutual friends</li>
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

              <MaitredPrivacyDisclosure locale="en" />
              <div>
                <h3>Featuring your public content in our marketing</h3>
                <p>
                  Where you post content to a public audience, we may feature it in our own
                  promotional materials and on our own channels, including third-party platforms such
                  as Instagram and TikTok — for example, a curated &ldquo;Makan of the Week&rdquo;.
                  This may include your meal photo, your caption, and your username or display name.
                </p>
                <ul>
                  <li>Only public content. We never use content you have set to friends-only.</li>
                  <li>Lawful basis. We rely on our legitimate interests in promoting Makan, balanced against your rights (section 4.2). We do not ask before each feature; you can object, or ask us to remove featured content, at any time.</li>
                  <li>Other people in your photos. Before we feature anything externally we look at it first, and we do not publish photographs in which other people are clearly identifiable. If you appear in content we have featured and you did not agree to it, contact us and we will remove it from the channels we control.</li>
                  <li>Under-18s. We do not knowingly feature content from users under 18 in external marketing. We cannot verify age, so if this applies to you, contact us and we will remove it.</li>
                  <li>
                    Your controls. You can decline, ask us to remove featured content from channels we
                    control, or object, by contacting{' '}
                    <a href="mailto:support@makanofficial.com">
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
            <h2 id="legal-section-6">6. Service Providers and Other Recipients</h2>
            <div>
              <p>
                We use the following providers to operate the Services. Where they process personal
                data on our behalf, they do so under contractual terms requiring appropriate security
                and confidentiality. Some of the services below are contacted directly by your device,
                which means they see your IP address even where we send them nothing about you; those
                are listed here too, so the picture is complete.
              </p>
              <div>
                <h3>Providers that process data on our behalf</h3>
                <ul>
                  <li>Google LLC (Firebase) — the App&apos;s backend. We use Firebase Authentication, Cloud Firestore, Cloud Storage, Cloud Functions, and Firebase Analytics to store and synchronise account and meal data, operate core features, and understand usage.</li>
                  <li>Functional Software, Inc. (Sentry) — crash and error reporting for the App. Receives diagnostic data about faults, including a user identifier and the sequence of actions before a crash, so we can find and fix them.</li>
                  <li>Google LLC (Firebase App Hosting and Google Analytics) — hosting for the Site and, when enabled, aggregate measurement of page views and selected actions.</li>
                  <li>Google LLC (Google Sheets) — secure storage of contact-form and enquiry submissions.</li>
                  <li>Resend — delivery of transactional emails, such as contact-form notifications.</li>
                  <li>Apple Inc. — distribution of the App through the App Store.</li>
                </ul>
              </div>
              <div>
                <h3>Services your device contacts directly</h3>
                <ul>
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
            <h2 id="legal-section-7">7. Cookies and Similar Technologies</h2>
            <div>
              <p>
                <strong>The Site.</strong> The Site is hosted on Firebase App Hosting. When website
                analytics is enabled, Google Analytics measures page views and selected actions,
                such as app-download clicks. Analytics and advertising storage remain denied:
                we do not use analytics cookies or browser storage, or send account identifiers,
                form contents, invite or claim secrets, URL queries or fragments. Google still
                processes technical request information, such as IP address and browser details.
                We respect your browser&apos;s Do Not Track and Global Privacy Control signals.
                Fonts are served from our own domain.
              </p>
              <p>
                <strong>App usage analytics.</strong>{' '}
                We use Firebase Analytics by Google to understand how the App&apos;s screens and
                features are used so we can improve them. It uses an app-instance identifier. Usage
                analytics is on by default on this device once you are signed in and your saved
                preference has been checked. You can turn it off under Settings › Privacy ›{' '}
                <strong>App usage analytics</strong>.
                The switch stops future usage measurement on this device. Your choice is kept when
                you sign out or delete your account; set it separately on other devices. Existing
                opt-outs stay off. Turning off collection does not itself erase data already collected.
              </p>
              <p>
                Usage events do not include your account ID, other people&apos;s account IDs, meal
                content, place names, captions or precise location. Advertising storage and
                personalisation are disabled. We use usage analytics solely to improve the App,
                not for advertising, cross-app tracking or the personal taste picture described in
                section 2.7. Our analytics provider must process this information only to help us
                improve the App, not for its own separate purposes.
              </p>
              <p>
                <strong>Crash and performance diagnostics.</strong>{' '}
                We use Sentry to identify crashes and performance faults. Reports can include your
                account identifier while signed in, app and device information, and diagnostic
                context. The App usage analytics switch controls Firebase Analytics; it does not
                turn off Sentry diagnostics. We do not use these diagnostics for advertising,
                cross-app tracking or the personal taste picture.
              </p>
              <p>
                We rely on legitimate interests for these purposes as described in section 4.2.
                To object to processing based on legitimate interests, contact{' '}
                <a href="mailto:support@makanofficial.com">
                  support@makanofficial.com
                </a>.
                We will assess the affected processing, explain the action taken and confirm its
                scope. The device analytics switch is not an account-wide control. Your rights,
                including how to ask us to delete information already held, are explained in section 11.
              </p>
            </div>
          </section>

          {/* 8 */}
          <section>
            <h2 id="legal-section-8">8. International Data Transfers</h2>
            <div>
              <p>
                Some of the services listed in section 6 — including Google, Sentry, Resend,
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
                <a href="mailto:support@makanofficial.com">
                  support@makanofficial.com
                </a>
                .
              </p>
            </div>
          </section>

          {/* 9 */}
          <section>
            <h2 id="legal-section-9">9. Security</h2>
            <div>
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
            <h2 id="legal-section-10">10. Data Retention</h2>
            <div>
              <p>
                We retain personal data only for as long as necessary for the purposes described in
                this Privacy Policy.
              </p>
              <div>
                <h3>10.1 Active accounts</h3>
                <p>
                  Account data and meal content are retained while an account remains active.
                </p>
              </div>
              <div>
                <h3>10.2 Deleted accounts</h3>
                <p>
                  When an account is deleted, personal data is deleted or anonymised within 30 days,
                  unless a longer retention period is required by law or necessary for security
                  purposes such as preventing abuse. We keep a permanent record that an account was
                  deleted, in a form that does not identify you, so that the deletion cannot be
                  accidentally undone.
                </p>
              </div>
              <div>
                <h3>10.3 Enquiry data</h3>
                <p>
                  Enquiry data is retained until you ask us to remove it, or until it is no longer
                  needed for the purpose it was submitted for.
                </p>
              </div>
              <div>
                <h3>10.4 Backups and security logs</h3>
                <ul>
                  <li>Backups retain data for a limited period as part of system resilience and recovery</li>
                  <li>Security and abuse-prevention logs are retained for a limited period appropriate to detecting and investigating abuse</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 11 */}
          <section>
            <h2 id="legal-section-11">11. Your Rights</h2>
            <div>
              <p>Under UK GDPR, you have the right to:</p>
              <ul>
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of personal data</li>
                <li>Request restriction of processing in certain circumstances</li>
                <li>Request data portability where applicable</li>
                <li>Object to processing we carry out on the basis of legitimate interests, such as the usage measurement and crash reporting described in section 7</li>
                <li>Withdraw consent where we rely on it. Withdrawing consent does not affect the lawfulness of processing we carried out before you withdrew it</li>
              </ul>
              <p>
                The picture of your taste (section 2.7) is part of the service under contract, so the
                right to object to processing based on legitimate interests does not apply to it, and
                there is no setting to turn it off. You can still ask for a copy of it, ask us to correct
                it, and have it deleted by deleting your account. If you think it is being used in a way
                this Policy does not describe, tell us.
              </p>
              <p>
                You can delete your account at any time from within the App, which begins the deletion
                process described above. To exercise any other right, contact us at{' '}
                <a href="mailto:support@makanofficial.com">
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
            <h2 id="legal-section-12">12. Children</h2>
            <div>
              <p>You must be at least 13 to create an account.</p>
              <p>
                The App does not verify age. Because a service like ours may be used by children and
                we cannot reliably tell which of our users are children, we apply the protections
                expected by the UK Age Appropriate Design Code (the Children&apos;s Code) to{' '}
                <strong>every</strong> user, not only to
                those we believe to be young. In practice this means:
              </p>
              <ul>
                <li>Your first shared meal is always friends-only; after that, you choose friends-only or public for each meal</li>
                <li>Location access is off by default and only used, with permission, at the moment you use a location feature</li>
                <li>We collect the minimum data needed, and we never use your data for targeted advertising</li>
                <li>We build a picture of your own taste from the comparisons you answer and the order you set, as described in section 2.7. It exists to help you choose what to eat, it is private to you apart from the friend taste match and the combined rankings described there, and it is never used to advertise to you, to judge you, or to decide anything about you</li>
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
            <h2 id="legal-section-13">13. Automated Decision-Making and Profiling</h2>
            <div>
              <p>
                We do not use automated decision-making or profiling that produces legal effects or
                similarly significant effects for you.
              </p>
              <p>
                Makan does build the picture of your taste described in section 2.7, and it is fair to
                call that a profile of your preferences. We would rather say so plainly than hide
                behind wording. What matters is what it is for and what it cannot do: it exists to
                answer &ldquo;what should I order&rdquo;, it is assembled from comparisons you chose to
                answer and the order you set, the only things other people see from it are the friend
                taste match and the combined rankings described in section 2.7, and it is never used to
                evaluate you, to decide whether you can use any part of the Services, or to advertise
                to you.
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
            <h2 id="legal-section-14">14. Changes to This Policy</h2>
            <div>
              <p>We may update this Privacy Policy from time to time.</p>
              <p>
                The updated version will be published with a revised &ldquo;Last updated&rdquo; date.
                Where the change is significant, we will take reasonable steps to notify you, for
                example within the App or by email.
              </p>
              <p>
                The update dated 4 November 2026 makes the picture of your taste part of the service
                rather than a setting. It describes the friend taste match and the combined public
                rankings in section 2.7, moves the picture from legitimate interests to contract in
                section 4, removes the right-to-object wording that applied to it in sections 11 and
                13, and explains that the &ldquo;Share my taste&rdquo; setting has been removed.
              </p>
              <p>
                The previous update, made on 30 August 2026, rewrote the dish recognition parts of
                sections 3, 4 and 13. That feature is now described as part of how the App works rather
                than as something you switch on, and legitimate interests replaces consent as its
                lawful basis. Your right to object is explained in sections 3 and 11. Photographs you
                saved before the feature existed are still excluded from it unless you opt them in.
              </p>
              <p>
                {/* RM19740: recheck this date and the header against the actual authorised publication. */}
                The update dated 6 September 2026 describes the device-level App usage analytics
                switch in section 7, distinguishes it from Sentry crash and performance diagnostics,
                and clarifies how to object. Section 2.3 explains that usage interaction events no
                longer record the other person&apos;s account identifier. This update also clarifies
                that turning off future collection does not itself erase information already held.
              </p>
            </div>
          </section>

          {/* Back to home */}
          <div>
            <Link href="/">
              <PlayfulArrow direction="left" /> Back to home
            </Link>
          </div>


          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}
