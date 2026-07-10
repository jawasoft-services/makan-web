# Support page (`/support`) — design

**Date:** 2026-07-10
**Status:** approved by Devon, ready for implementation plan
**Goal:** give makanofficial.com a support page suitable for the App Store Connect **Support URL** field.

---

## 1. Why

Makan is live on the App Store. `Support URL` is a **required, version-level, localizable** property in App Store Connect (CONFIRMED — [platform version information](https://developer.apple.com/help/app-store-connect/reference/app-information/platform-version-information/)). It carries no "editable" flag in Apple's [required/localizable/editable table](https://developer.apple.com/help/app-store-connect/reference/app-information/required-localizable-and-editable-properties/), so the **URL string** changes with a version submission — though the **page content** it points at is ours to change any time.

Apple's own field text: *"This URL must lead to actual contact information (legal address, email address, telephone number)… so that users can reach you regarding app issues, general feedback, and feature enhancement requests."*

Governing guidelines (all CONFIRMED on developer.apple.com):

| Guideline | Requirement |
|---|---|
| 1.5 Developer Information | "Make sure your app and its Support URL include an easy way to contact you." |
| 2.1(a) App Completeness | "fully functional URLs… placeholder text, empty websites… should be scrubbed." |
| 2.3 Accurate Metadata | metadata must be accurate and current |
| 5.1.1(v) | account deletion must be initiable in-app — **already satisfied** (see §7) |

REPORTED (developer anecdote, not Apple text): reviewers open the URL on mobile Safari; pages that 404, require login, show placeholder copy, or render nothing draw *"We were unable to access your support URL."* A contact **form** is generally accepted, but Apple's field text names email and address specifically.

### Why not just point Support URL at the existing `/contact`

`/contact` exists (H1 "Get in touch", Name + Email + honeypot → `/api/contact` → Resend + Google Sheets). Three gaps make it a poor Support URL:

1. **It publishes no visible contact information.** The page is a form and nothing else — no email, no address.
2. **It is framed as press/partnerships**, not app support ("Questions, press, or partnerships?").
3. **`ContactForm.tsx` is a `'use client'` island.** If the reviewer's browser fails to render it, the page offers *zero* way to contact anyone.

`/contact` is kept as-is for press and partnerships. This change does not touch it.

---

## 2. Decisions (settled — do not re-litigate)

| # | Decision | Rationale |
|---|---|---|
| D1 | **New `/support` route**, not an upgrade of `/contact` | A URL named "support", framed as app support. `/contact` stays the press/partnership funnel. |
| D2 | Published address is **`support@makanofficial.com`** | Already the sole support address on `/privacy-policy` and `/tos` (5 occurrences), and the exact `mailto:` behind the app's Settings → "Help & Support" row and the tab-bar "Feedback" button. `team@` is a server-side form recipient, never user-visible; `hello@` is press-only. |
| D3 | **Static email + registered address; no form** | Zero client JS ⇒ no render path where the contact method disappears. The existing form only collects Name + Email, so it cannot carry a bug report anyway; a `mailto:` lets people describe the problem. |
| D4 | Response-time copy is **"We aim to reply the same day."** | Devon's call. Phrased as an aim, not a guarantee — a support page is measured against the worst week, not the average one. |
| D5 | **No telephone number** | Apple's "(legal address, email address, telephone number)" is an illustrative parenthetical, not a conjunction. Email + registered address is the standard pass. |
| D6 | **No web account-deletion page** | 5.1.1(v) requires in-app *initiation*, which exists. A web deletion page would be net-new surface for no compliance gain. |
| D7 | The delete-account answer **routes anyone stuck to email** rather than naming the Google bug | True today, still true after the bug is fixed ⇒ no wording churn. See §7. |

---

## 3. Files

**New**
- `app/support/page.tsx` — React Server Component. No `'use client'` anywhere in its tree.
- `lib/support.ts` — single source of truth: `SUPPORT_EMAIL`, `SUPPORT_FAQS`. Follows the existing convention of `lib/faq.ts`, `lib/links.ts`, `lib/press.ts`.

**Modified**
- `app/sitemap.ts` — add `/support` to the hardcoded static array (there is no route registry; only `/blog/<slug>` auto-enumerates via `lib/reviews`).
- `app/llms.txt/route.ts` — add a `## Support` section to the hardcoded `lines` array (after `## Product`, before `## Author`), e.g. `` `- [Support](${base}/support): Contact Makan support, delete your account, or make a privacy request.` ``
- `components/Footer.tsx` — add `{ label: 'Support', href: '/support' }` to `appLinks`, before `Contact`.
- `components/FaqSchema.tsx` — accept an FAQ array as a prop instead of importing `FAQS` directly, so `/support` can emit its own `FAQPage`. Homepage call site passes `FAQS`; behaviour unchanged.

**Untouched**
- `app/robots.ts` — blanket `allow: "/"`. Nothing to add.
- `components/Navbar.tsx` — nav stays marketing-focused.
- `app/contact/**`, `app/api/contact/**` — unchanged.
- `app/privacy-policy/page.tsx`, `app/tos/page.tsx` — the 5 hardcoded `support@` occurrences stay hardcoded. Centralising them is a legal-text edit with churn risk and no benefit to this change.

**Do NOT reuse `lib/faq.ts`.** Its header comment states the questions are phrased as search queries for People-Also-Ask and AI answer engines ("What does makan mean?", "Does Makan use AI?"). That is marketing SEO. A support FAQ answers *something is wrong and I need it fixed*. Separate content, separate file.

---

## 4. Design system

Tokens from `tailwind.config.ts` (`theme.extend.colors.brand`):

- `brand-cream #FFF4E6` page ground · `brand-ink #2B1503` headings/body (14.9:1) · `brand-muted #85613F` secondary (5.1:1) · `brand-line #F3E2CD` hairlines · `brand-card #FFFFFF` cards · `brand-orange #FF9932` accent (locked) · `brand-espresso #241102` footer only.
- `brand-muted` is `#85613F` and not the mockup's `#8F6C49`, which measured 4.38:1 and failed WCAG AA. Use the token; do not hand-pick.
- Font: `font-sans` → Plus Jakarta Sans, loaded in `app/layout.tsx`.
- No prose component and no Tailwind Typography plugin — hand-roll the type scale.

Page shell follows `app/story/page.tsx` (**not** `app/manifesto/page.tsx`, which redundantly double-mounts `<Navbar/>`):

```tsx
<div className="min-h-screen bg-brand-cream">
  <main id="main-content" className="mx-auto max-w-2xl px-5 sm:px-8 pt-24 sm:pt-32 pb-16 sm:pb-24">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-orange">Support</p>
    <h1 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-brand-ink" style={{ letterSpacing: "-0.02em" }}>…</h1>
    …
  </main>
  <Footer />
</div>
```

`<Navbar/>` comes from the root layout — never mount it per-page. Inline links: `text-brand-orange hover:underline`. Card: `rounded-2xl border border-brand-line bg-brand-card p-6`. Focus rings resolve automatically on cream; `inverse-ground` is only for dark/saffron sections.

Metadata (`title` convention `"<Page> — Makan"`; `viewport`/`themeColor` are global):

```tsx
const DESCRIPTION =
  "Get help with Makan — contact support, delete your account, report a problem, or make a privacy request."

export const metadata: Metadata = {
  title: "Support — Makan",
  description: DESCRIPTION,
  alternates: { canonical: "https://www.makanofficial.com/support" },
  openGraph: { title: "Support — Makan", description: DESCRIPTION, url: "https://www.makanofficial.com/support", siteName: "Makan", type: "article" },
  twitter: { card: "summary_large_image", title: "Support — Makan", description: DESCRIPTION, site: "@app_makan" },
}
```

---

## 5. Page structure

1. **Header** — eyebrow "Support"; H1; one-line lead.
2. **Contact card** — the section Apple's field text is actually asking for.
   - `support@makanofficial.com` as **visible text** and a `mailto:` link.
   - "We aim to reply the same day."
   - A "what to tell us" line: what happened, your iPhone model, your iOS version, and the app version from Settings.
3. **Common questions** — §6.
4. **Your data** — links to `/privacy-policy` and `/tos`; privacy requests route to `support@`.
5. **Company** — the statutory disclosure, reusing `COMPANY` from `lib/press.ts`, worded exactly as `components/Footer.tsx` already words it:
   > MAKAN APP LTD is a company registered in England and Wales, company no. 16736412. Registered office: 86–90 Paul Street, London EC2A 4NE, United Kingdom.
6. **`FAQPage` JSON-LD** via the parameterised `FaqSchema`.

A one-line pointer to `/contact` for press and partnership enquiries sits at the foot of the contact card.

---

## 6. FAQ content

Every answer below was verified against **`origin/main` of `jawasoft-services/munchies-rn`** (HEAD `4f07d744`) by reading blobs with `git show origin/main:<path>`, **not** the working tree. See §9 for why that distinction matters. UI labels are quoted verbatim from source.

### Q1. How do I delete my account?
> Open Settings, scroll to the bottom, and tap **Delete Account**, then confirm on the **Delete My Data** prompt. You'll be asked to verify it's you first — how depends on how you signed in. Deletion is permanent and cannot be undone: your account, your meals, and your photos are removed. If you can't complete the verification step, email us and we'll delete your account for you.

Evidence: `app/(modals)/settings/index.tsx:769` `<ThemedText style={styles.deleteAccountText}>Delete Account</ThemedText>`; `:316` `'Delete My Data'` alert title; `:314` *"permanently delete your account and all associated data? This action cannot be undone."*

Constraints: do **not** promise a grace period or recovery window (deletion is immediate, no undo path). Do **not** claim *all* data is wiped — `shouldSkipCollectionForAccountDeletion` intentionally retains `businesses`, `businessClaims`, `businessMetricsDaily`, `entitlements`, and Storage cleanup is best-effort. Hence "your account, your meals, and your photos", not "everything".

### Q2. How do I change my username or display name?
> You can change your display name from the Profile tab — tap **Edit profile**, edit your name, and save. Your username is fixed when you create your account and can't be changed in the app; on that screen it appears as **USERNAME · LOCKED**. If your username is a problem — for example it contains personal information — email us.

Evidence: `app/tabs/profile/index.tsx:651` `>Edit profile<`; `app/(modals)/editProfile.tsx:711` `USERNAME · LOCKED`.

Constraints: do **not** state a display-name cooldown duration. `main` has `DISPLAY_NAME_COOLDOWN_MS = 5 * 60 * 1000` (5 minutes, AsyncStorage, "resets on reinstall"), while the settled product decision is 30 days and has not landed. Saying either number would be wrong or would go stale. See §8.

### Q3. I can't sign in.
> Makan supports **Sign in with Apple**, **Google**, and email with a password. Sign in the same way you signed up. If you use an email and password, tap **Forgot Password?** on the sign-in screen and we'll email you a reset link.

Evidence: `components/onboarding/SocialAuthButtons.tsx:94,119` Apple/Google buttons; `providers/Firebase/FirebaseAuthProvider.ts:315` `signInWithEmailAndPassword`, `:490` `createUserWithEmailAndPassword`, `:612` `sendPasswordResetEmail`; `app/(modals)/(auth)/signIn.tsx:341` `>Forgot Password?<`.

Constraints: do **not** claim that signing in with a different provider creates a separate account — that account-linking behaviour was not verified.

### Q4. My meal won't upload.
> Makan retries automatically when you're offline — you'll see **"You're offline. Posts will retry when connected."** If an upload fails, the banner gives you **Retry** and **Discard**, so a failed post isn't lost. If it keeps failing on a good connection, email us.

Evidence: `components/NetworkIndicator.tsx:112` verbatim offline copy; `:29` *"Failed items → 'Upload failed' + [Retry] + [Discard]"*.

### Q5. How do I report a meal, or block someone?
> Tap the three-dot menu on any meal. **Report** sends it to us for review. **Block User** stops them seeing your meals or finding you on Makan.

Evidence: `components/meal/MealActionMenu.tsx:6,24` three-dot → `MealPostReportMenu`; `components/MealPostReportMenu.tsx:96` `>Report<`, `:106` `>Block User<`, `:52` *"Block {displayName}? They won't be able to see your meals or find you on Makan."*

Constraints: no review-time SLA — reports are reviewed manually and nothing in code or config promises a turnaround.

### Q6. Is Makan on Android?
> Not yet — Makan is iPhone-only today. Android is in the works, and we don't have a release date to share.

Evidence: `eas.json:59-60` both Android submit profiles are `"releaseStatus": "draft"`; no committed native `android/` project. Android intent is real (`google-services.json`, a distinct Android Maps key, `playstore-icon.png`).

Constraints: no date, and no "coming next". **Note:** `lib/faq.ts:23` on the homepage currently says *"Android is coming next."* That is an unbacked forward promise. Softening it is a separate copy change — see §8.

### Q7. How do I get a copy of my data?
> There's no in-app export. Email us to request access, correction, deletion, or portability of your data — the same address handles all privacy requests. See our Privacy Policy for what we hold and why.

Evidence: no export/download feature exists anywhere in `app/`, `components/`, `lib/`, `hooks/`, `functions/src`. `app/privacy-policy/page.tsx` lists those rights and directs users to `support@makanofficial.com`.

Constraints: do **not** state a response deadline. The privacy policy says only *"within the time limits required by law."* Its "30 days" figure is the **retention window for an already-deleted account**, not a response-time commitment — do not repurpose it.

---

## 7. Account deletion and Guideline 5.1.1(v)

In-app deletion exists and is complete for Apple and email/password users: reauthenticate → Firestore/Storage cascade → `currentUser.delete()` (`app/(modals)/settings/index.tsx`, `:511`).

**It is broken for Google-only users.** The flow branches on `providerId === 'apple.com'`; `google.com` appears **zero** times in that file on `main`. Google users therefore fall to `setShowPasswordModal(true)` → `EmailAuthProvider.credential(email, password.current)` → `reauthenticateWithCredential`, which always throws for an account that never had a password, surfacing *"Incorrect password. Please check your password and try again."* (`:571`). `currentUser.delete()` is unreachable for them.

The comment above the branch (`:322`) reads: *"Apple-only users have no password and must reauth via native SiwA sheet; routing them through PasswordModal traps them (Codex R1 P1)."* The identical trap was fixed for Apple and left for Google.

This is tracked as a **separate ticket** and is out of scope here. Per D7, the Q1 copy describes the flow and routes anyone who cannot verify to email — accurate before and after the fix. Both the fix and the Support URL are version-level changes, so they naturally ride the same submission.

---

## 8. Out of scope (flagged, not done)

1. **Google account-deletion bug** — §7. Own ticket.
2. **RM17988 R2 never landed** — the 30-day display-name cooldown (commit `8b144f40`) is not an ancestor of `origin/main`; `utils/displayNameCooldown.ts` and `displayNameCooldownKey` are absent. Production runs a 5-minute, reinstall-clearable cooldown. Own ticket.
3. **Homepage FAQ says "Android is coming next"** (`lib/faq.ts:23`) — an unbacked promise, and now inconsistent with `/support`. One-line copy fix, Devon's call.
4. **No in-app link to `/support`** — the app's Settings row opens `mailto:support@…` directly. Repointing it needs a new binary and full review (no production OTA path). Defer to the next app release. The Support URL does not depend on it.
5. **`/contact` metadata** has no `robots`, `openGraph`, or canonical. Unrelated to this change.

---

## 9. Verification plan

No claim of completion until each of these has been run and its output read.

1. `npx tsc --noEmit` — green.
2. `npx next build` — green; `/support` appears in the route manifest as static.
3. **JS-off check (the one that matters).** Serve the production build and assert the email is in the *raw server-rendered HTML*:
   `curl -s localhost:3000/support | grep -c 'support@makanofficial.com'` → must be ≥ 1.
   This is the mechanical proof of D3. Eyeballing a rendered browser page does not test it, because the browser runs the JS.
4. `curl -s -o /dev/null -w '%{http_code}' localhost:3000/support` → `200`.
5. `curl -s localhost:3000/sitemap.xml | grep -c '/support'` → `1`.
6. `curl -s localhost:3000/llms.txt | grep -c 'support'` → ≥ 1.
7. Mobile-viewport screenshot (390×844) — the surface an App Review engineer actually opens.
8. Validate the `FAQPage` JSON-LD parses and that the homepage `FAQPage` still emits after the `FaqSchema` prop refactor.

**Repo hygiene.** Work in `~/dev/makan-web-saffron` (clone of `Ridorichard04/makan-web`, `main` @ `9090820`, in sync with origin). Do **not** work in `~/Desktop/Projects/MAKAN/MakanGit/makan-web` — it is iCloud-synced; `git status` there hangs and `next dev` never binds its port.

---

## 10. Deployment

`git push origin main` → Vercel auto-builds and promotes `makanofficial.com`. (It also rebuilds the stale duplicate `makanwebsite` project — harmless.)

Then, in App Store Connect, set **Support URL** to `https://www.makanofficial.com/support` on the next version. Use the `www` host: the apex 308-redirects to `www`, and a reviewer hitting a redirect is a needless variable.
