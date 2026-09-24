# RM19740 — Consent and data rules alignment

Version 1 · 6 September 2026 · Source-review contract, not approval to publish.

## Problem and outcome

Makan's doctrine, privacy policy, support procedure and analytics implementation describe different controls. The current policy groups Firebase Analytics and Sentry together and promises account-wide stopping by email. RM19738 implements a device-level analytics preference; Sentry remains separate. The previous RM19740 draft still carries that account-wide promise and a visible publication-date placeholder. The ticket's delivery card also asks Devon to repeat a decision already recorded in journal 198226.

Readers should be able to understand what is measured, which control stops it, where that control applies, and how to raise a separate objection. Reviewers should receive the complete documentation and policy change in one exact branch, with unresolved production/legal obligations visible.

## Authority, delivery unit and preserved decisions

Devon's instruction on 6 September: “finish the prd and plan, proceed down pipeline until wait code review”. This authorises RM19740 specification, implementation, verification, branch push and Code Review handoff. It does not authorise policy publication, a main merge, production configuration changes, counsel sign-off or downstream ticket transitions.

The complete original RM19740 unit is retained: D-032.1 and discrepancy correction, operating-status alignment, a purpose/control matrix, a support-objection procedure, three draft LIAs, the web-policy branch and a recorded worldwide-default decision. This PRD adds the evidence corrections already identified in the 5 September reconciliation; it does not reduce the intended product route.

D-031.3a preserves the historic-photo opt-in promise. D-032's built-in feature direction and D-032.1's worldwide analytics opt-out/no-geogate decision remain. Product decisions do not establish legal compliance. No app feature or photo-processing pipeline is introduced here. This is a standalone documentation/policy ticket with separately owned release dependencies, not a claim that the mobile integration programme is complete.

## Source identity

- Web repository: `https://github.com/Ridorichard04/makan-web.git`.
- Work branch: `RM19740-privacy-analytics-optout`; starting commit `9a485365c8c213c03e1fc00a6d7e331cc6c56ecf`.
- Web base: `origin/main` at `a8b5ad0f6c26e1128c8a70e3b4a505db59ba8d3a`, refreshed 6 September; no divergence behind main at intake.
- Mobile source contract: RM19738 at `40fbbb3239ee7832a0813de0e756702cdd556451` in `jawasoft-services/munchies-rn`. Its fresh ticket status is Branch Test (revision 2026-09-05T12:05:38Z); the older delivery card still says Code Review. Status alone proves no release or device result.
- Mobile evidence: `store/useAnalyticsConsentStore.ts`, `services/AnalyticsService.ts`, `services/SentryService.ts`, `localization/resources/en.json`, `analytics/sql/production_events.sql`, `analytics/sql/product_activation_retention.sql` at that source revision.
- Live policy: direct HTTPS fetch on 6 September still reads “Last updated: 30 August 2026”; archived under the run evidence. Search-index text is not the current policy baseline.
- Canonical local doctrine remains `strategy/pivot/DECISION_LOG.md` in the MAKAN workspace. This repository packet is a versioned review snapshot, not a replacement doctrine authority.

## Requirements and acceptance

| ID | Requirement | Acceptance evidence |
|---|---|---|
| AC-01 | Finish the PRD and ordered plan, preserving the original six acceptance requirements and the recorded worldwide decision | This PRD, PLAN.md, original-to-current mapping below; fresh Redmine description/history readback |
| AC-02 | State default-on analytics, the exact Settings control, device scope, preserved opt-outs and sign-out persistence | Rendered §7 and source parity with RM19738; no assertion that default `granted` is affirmative consent |
| AC-03 | Distinguish Firebase usage events from Sentry crash/performance diagnostics, including Sentry account linkage and independent control | Rendered §2.3 and §7; `SentryService.ts` source parity |
| AC-04 | Replace the unsupported blanket account-wide stopping promise with a clear objection route; distinguish future collection from held data | Rendered §7; support procedure below; no claim that sending instructions proves suppression |
| AC-05 | Retain no-advertising/cross-app tracking and personal-taste separation commitments; remove obsolete other-user ID usage-event wording | §2.3/§7 before-and-after comparison; processor/retention proof remains a publication condition |
| AC-06 | Retain historic-photo, dish-recognition, audience and roster decisions; make no schema, Rules, SDK or app behavior change | Narrow source diff; preserved policy sections; purpose/control matrix |
| AC-07 | Carry all three LIAs into the reviewer tree as unsigned draft assessments with MAKAN APP LTD as controller | ASSESSMENTS.md; no claim that a product default establishes a lawful basis |
| AC-08 | Preserve public route, support link, navigation, layout and English baseline across existing locale routes; no visible date placeholders | Production build, typecheck/lint, local rendered route/section checks, existing link destination inspection; visible candidate date 6 September 2026 |
| AC-09 | Name each outstanding production/legal requirement, owner, unlock evidence and release consequence | Obligation register below; no fabricated legal/GA4/runtime PASS |
| AC-10 | Publish an accurate current Redmine card and hand the verified exact remote web SHA to Codex Ewan 291 in Code Review | Identity-bound intent, single PUT, semantic GET readback, protected-field preservation and WAIT_CODE_REVIEW state |

Original acceptance mapping: doctrine amendment/correction → AC-01/06; operating-status alignment → AC-01/09; matrix and objection procedure → AC-02–06/09; three LIA drafts → AC-07; web draft → AC-02–06/08; EU-default open question → AC-01 (superseded by the already recorded decision, not reopened).

## Purpose and control matrix

| Processing | Product/control rule | What this ticket implements |
|---|---|---|
| Firebase usage analytics | Worldwide default-on after stored preference/auth resolution; local device opt-out; historic denials persist | Accurate policy wording; no new mobile instrumentation |
| Sentry diagnostics | Independent configured crash/performance reporting; signed-in account UID can be attached | Explicit independent disclosure; the analytics toggle does not disable Sentry |
| Personal taste projections | Existing D-029/031/032 contracts; analytics is separate | Preserve policy; objection completion requires writer suppression and non-recreation evidence |
| Dish recognition | Current text/menu path; photo/embedding path deferred | Preserve built-in direction and historical-photo safeguard; no backfill or vendor selection |
| Venue roster | Complete existing recognition route with privacy/activation gates | Preserve obligations; no new roster publication |
| OS permissions and intentional sharing | Existing camera/library/location/push permissions and deliberate audience/table actions | No permission, relationship or audience change |

## Objection-handling contract

1. Log the purpose, received date, necessary account reference and deadline in the restricted support case; verify identity proportionately when needed. Never request passwords or put cases in analytics.
2. Acknowledge within three working days. Explain which controls exist on that person's build and whether they apply to one device or an account.
3. For Firebase usage analytics, help the person use the device setting and cover other devices explicitly. Stopping collection is distinct from handling previously held data.
4. Treat Sentry, taste projections, dish recognition and venue-roster objections separately. An accepted objection requires a supported suppression/removal path and readback; projection retries and recomputes must not recreate excluded outputs.
5. Escalate a missing control to Devon and the relevant engineering owner. Do not require account deletion or leaving the App as proof that an objection was fulfilled.
6. Answer within the applicable legal deadline (ordinary target: one month); record the decision and evidence. Say “stopped” only when the affected processing is verified stopped. Any unresolved limitation remains visible in the case.

The procedure is specified; its production rehearsal is not proved by this source review.

## Publication and external obligations

All rows remain open until their own evidence exists. Code Review of the authored policy is allowed; publication is blocked by the applicable unresolved rows. No reviewer is asked to provide legal sign-off.

| ID | Owner | Unlock evidence | State / consequence |
|---|---|---|---|
| O-01 | RM19738 owner; RM19069 integration owner | Exact released mobile candidate; Settings, migration/sign-out/device-scope and Firebase receipt evidence | CANNOT_VERIFY here; policy must not precede the described controls |
| O-02 | Devon / GA4 administrator | Exact account 353645907/property 487368190 sharing, Signals, Ads links and retention readbacks | Last browser attempt lacks permission; do not assert settings are off |
| O-03 | Analytics engineering / Devon with counsel | Documented aggregation window, raw-event expiry, GA4 and BigQuery retention, access and provider-use evidence | SQL views are not retention controls; unresolved before relying on the statistical exception |
| O-04 | Devon / support and relevant engineering owners | Rehearsed objection response, suppression and no-recreation receipts; independent Sentry handling | No operational-completion claim until proven |
| O-05 | Devon / counsel | Signed purpose-specific assessments, jurisdiction decision and applicable notice/processor terms | Draft only; no legal clearance inferred from worldwide opt-out |
| O-06 | Devon / product and counsel | Evidence of clear analytics disclosure at the appropriate point in the app | Presentation choice need not reopen default decision; disclosure proof is owed |
| O-07 | RM19505 owner / Devon | Roster notice, assessment and objection/removal evidence before activation | Existing route and activation restriction retained |
| O-08 | Devon / web release owner | Exact merge/deploy approval; current app/policy parity; actual publication date; G49 route-superset and live readback | No merge/deploy under this task; reverify current production before release |

A policy-source rollback is a revert on this feature branch or a later authorised release. A production rollback requires its own exact approval and current route-preservation evidence. Do not use this source review to expand production traffic or processing.

## Primary references and evidence limits

- [Live policy](https://www.makanofficial.com/privacy-policy), direct fetch on 6 September.
- [ICO statistical-purpose exception](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/): exception conditions, disclosure, objection, aggregate outcomes and limited individual-data retention need separate proof.
- [ICO right to object](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-object/): the response depends on the processing/basis and the applicable objection; a support acknowledgement is not technical suppression.
- [RM19740](https://redmine.jawasoft.com/issues/19740), [RM19738](https://redmine.jawasoft.com/issues/19738), [RM19505](https://redmine.jawasoft.com/issues/19505), [RM19663](https://redmine.jawasoft.com/issues/19663).

No new legal interpretation, raw diner data, analytics-console configuration or database writes are needed to review this change. Build/browser PASS means the authored policy renders correctly, not that underlying production processing complies.
