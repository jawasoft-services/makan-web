# Evidence snapshot from 5 September 2026

Preserved from `strategy/pivot/legal/CONSENT_DATA_RECONCILIATION_2026-09-05.md` in the MAKAN workspace. The historical status rows below are superseded by [PRD.md](PRD.md) and the exact-SHA Redmine handoff. RM19738 is now Branch Test; RM19740 is proceeding to source Code Review. These snapshots establish provenance, not current deployment or legal clearance.

---

# Consent and data rules — current reconciliation

**RM19740 · 5 September 2026 · Documentation alignment; external obligations remain open.**

This record refreshes the earlier same-day alignment. It preserves D-031.3a, D-032 and D-032.1,
including the recorded worldwide opt-out decision. It does not change app behavior or authorise a
release. Source inspection establishes what code does; it does not establish deployed behavior,
vendor settings or legal clearance.

## Verified identity

| Surface | Current evidence |
|---|---|
| RM19740 | Fresh GET: Design/Clarify, Devon (270), revision 2026-09-05T10:27:18Z; journal 198226 records the worldwide decision |
| RM19738 | Fresh GET: Code Review, Codex Ewan (291), revision 2026-09-05T10:40:15Z |
| Analytics source | Clean local RM19738 checkout and direct canonical GitHub remote read both resolve to `40fbbb3239ee7832a0813de0e756702cdd556451` |
| Integration remote | `RM19069-integration-v2` = `01973780f53bc4abaff691dd987c509500544400`; the earlier alignment's `c62650673` is not the current remote tip |
| Main remote | `1abfc783839bdf97c84fd9866c9b6166ffd438e5`; this read does not identify the installed production build |
| Existing policy draft | Clean checkout `/Users/devonmakepeace/dev/makan-web-RM19740`, branch `RM19740-privacy-analytics-optout`, local SHA `9a485365c8c213c03e1fc00a6d7e331cc6c56ecf`; no new remote verification of that web branch in this refresh |
| Live policy | Direct HTTPS response from `https://www.makanofficial.com/privacy-policy`: last updated 30 August 2026; controller MAKAN APP LTD; §7 has email objection, no Settings switch |
| GA4 | Browser navigation to account 353645907/property 487368190 returned “Missing permissions”; no sharing, Signals, Ads links or retention values verified or changed |

The web search index returned an older 18 July policy. The saved direct HTTPS response is the
current content evidence. A policy page fetch does not prove which Git commit serves production.

Raw Redmine responses, live HTML/text and read time are under
`.makan2-state/makan2/evidence/RM19740/reconcile-20260905/` in the MAKAN workspace. No user meal
records were needed for this reconciliation.

## Aligned behavior and remaining gaps

| Purpose | Rule/control | Evidence and remaining obligation |
|---|---|---|
| Firebase usage analytics | Worldwide default-on under the recorded D-032.1 decision, with a device opt-out | Source waits for stored preference and authenticated identity, preserves legacy denials and the opt-out after sign-out. `analyticsConsent='granted'` can mean the default; it must never be used as proof of affirmative consent. Actual native/Firebase receipt is still CANNOT_VERIFY in RM19738's handoff. |
| Crash and performance diagnostics | Separate purpose and control from Firebase Analytics | `services/SentryService.ts:24` enables Sentry when configured, samples performance transactions, and `setSentryUser` attaches the account UID. The analytics switch does not disable it. Policy text must describe that distinction and account-linked diagnostics honestly. |
| Email objections | Case-based purpose-specific handling, backed by proof | Both live §7 and the web draft promise stopping “for your account”. A device preference cannot fulfil that promise on every device or prove Sentry stops. Engineering must prove the supported suppression route; support must not mark a case stopped merely because it sent instructions. |
| Analytics reporting | Aggregate service improvement; separate from personal taste evidence | `analytics/sql/production_events.sql:8` retains `user_pseudo_id` as `analytics_instance_id`; `product_activation_retention.sql` links events over a 29-day cohort window. These are views, not raw-data deletion or expiry controls. Aggregate output is insufficient evidence of the entire data lifecycle. |
| Dish recognition | Built-in direction; historical-photo promise preserved | Current RM19663 journal keeps the photo/embedding route deferred and points to RM19718's text/menu route. No new photo-processing permission or backfill is authorised. The LIA and operational objection route remain separate obligations. |
| Historical photographs | Existing opt-in promise survives | Preserve the recorded pre-19-August boundary. The historical count of 4,926 is not a fresh census. |
| Maitre'D venue roster | Preserve the complete approved venue-recognition route and activation gates | Fresh RM19505 status is Branch Test. Privacy/terms and objection/recompute evidence remain prerequisites before activation; this task neither cuts the route nor claims the dark/live state was freshly checked in production. |
| OS permissions and intentional sharing | Preserve location/camera/library/push permissions and user-initiated audience/table actions | No permissions or audience rules changed here. The earlier matrix's implementation claims were not re-tested in this refresh. |

“Built in” describes product behavior. A lawful basis still needs its own assessment; it cannot be
established simply by calling a feature core. See the [ICO's legitimate interests guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/legitimate-interests/).

The [ICO's statistical exception guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/)
requires aggregate results and retention of individual information only as long as aggregation
needs it. This makes the aggregation window, raw-event expiry and provider use evidence material.
The source does not settle those questions. No conclusion that Makan qualifies for the exception
is made here.

## Obligations and owners

| ID | Owner | Evidence needed to close | Current state |
|---|---|---|---|
| CD-01 | Codex Ewan / RM19738; RM19069 for integrated testing | Exact-SHA review, reachable integrated build, real Settings/account-switch checks and Firebase receipt | Source Code Review; runtime CANNOT_VERIFY |
| CD-02 | Devon / GA4 administrator | Account sharing, property Signals, Ads links and retention readbacks for the exact IDs above | BLOCKED: browser lacks permission |
| CD-03 | Analytics engineering / Devon with counsel | Purpose-limited reporting, justified aggregation window, raw-event retention/expiry, access and provider settings; distinguish GA4 from BigQuery retention | OPEN; current SQL is not a retention receipt |
| CD-04 | Devon / support + relevant engineering owner | Rehearsed accepted-objection path, correct device/account scope, suppression survives subsequent events/recompute; separate diagnostics handling | OPEN; procedure corrected in alignment §6 |
| CD-05 | Devon / makan-web owner | Revised §7 wording, accurate Sentry disclosure, publication date, release-bound runtime parity and protected deployment approval | DRAFT text below; existing web branch still needs this refinement |
| CD-06 | Devon / counsel | Signed purpose-specific LIAs, jurisdiction assessment and historical-photo safeguard | DRAFT; controller name corrected; no counsel engagement performed |
| CD-07 | RM19505 owner / Devon | Roster activation notice, assessment and objection/removal verification | Existing activation obligation retained |
| CD-08 | Devon / product + counsel | Evidence that required analytics information is presented clearly before relying on the exception | OPEN; the choice of presentation can remain simple, but disclosure evidence is required |

Owner entries allocate the next action in this document; they are not Redmine assignments.
The existing worldwide decision remains recorded. Its accepted EU residual is not a compliance
finding. Existing reversion conditions in D-032.1 remain intact.

## Exact proposed policy replacement for §7, App paragraphs

**Draft for review and implementation only.** Use with the RM19738 release once controls and
processing claims are verified. It replaces the existing draft's combined Firebase/Sentry paragraph
and its unconditional account-wide stopping promise. Other policy sections retain their history
and require a publication-date update at release.

> **App usage analytics.** We use Firebase Analytics by Google to understand how the App's screens
> and features are used so we can improve them. It uses an app-instance identifier. Usage analytics
> is on by default on this device after your saved preference and sign-in state have been resolved.
> You can turn it off under Settings › Privacy › App usage analytics. The setting applies to this
> device and is kept when you sign out or delete your account; set it separately on other devices.
> Existing opt-outs stay off. Usage events do not include your account ID, other people's account
> IDs, meal content, place names, captions or precise location. Advertising storage and
> personalisation are disabled. Usage analytics is separate from the personal taste picture in §2.7.
>
> **Crash and performance diagnostics.** We use Sentry to identify crashes and performance faults.
> Reports can include your account identifier while signed in, app and device information, and
> diagnostic context. The App usage analytics switch controls Firebase Analytics; it does not turn
> off Sentry diagnostics.
>
> To object to processing based on legitimate interests, contact support@makanofficial.com. We
> will assess the affected processing, explain the action taken and confirm its scope. The device
> analytics switch is not an account-wide control.

Before publication, retain or refine the policy's purpose/processor commitments only where CD-02,
CD-03 and CD-06 support them. Check the distinction between stopping future collection and handling
information already held; the switch is not a promise to erase previously collected data.

## Acceptance readback

The original RM19740 documentation unit exists: doctrine amendment, operating status, matrix,
three LIA drafts and a policy branch. The worldwide decision is confirmed in journal 198226.
This refresh corrects current identity, legal-assurance wording, controller identity and objection
handling, and supplies the missing Sentry/retention distinctions. It introduces no product rescope.

RM19740 remains **Design/Clarify**. No new external messages, ticket mutations, app edits, policy
deployments, merges or data deletions occurred. There is no Code Review handoff or compliance-pass
claim for this documentation refresh. The policy branch is not ready to publish merely because it
exists; CD-01 through CD-06 identify the relevant remaining evidence.
