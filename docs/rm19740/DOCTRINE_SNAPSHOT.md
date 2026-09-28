# Doctrine and operating-status provenance

Review snapshot captured 6 September 2026. Canonical authority remains the named files in the MAKAN workspace. Their historical ticket statuses are superseded by this candidate’s PRD and Redmine handoff. D-032.1 records a product decision; none of its conditional legal requirements is marked verified by this ticket.

## DECISION_LOG.md — D-032.1

### D-032.1 — Usage analytics is refusable by statutory opt-out, not by consent (amends the Bucket 2 table)

**Decision:** APPROVED — including the EU residual: opt-out ships worldwide, no geo-gated default (Devon, 2026-09-05)
**Actor:** Devon (instruction) / Makan2 controller (record), RM19740
**Recorded:** 2026-09-05
**Source:** Direct instruction on RM19738 — "make it opt out" (2026-09-05 10:05), superseding the
opt-in candidate at `9b75b7f5`; and PECR Schedule A1 paragraph 5, inserted by the Data (Use and
Access) Act 2025, in force 5 February 2026 — i.e. before D-032 was written.
**Primary artifacts:** `CONSENT_AND_DATA_RULES_ALIGNMENT_2026-09-05.md`;
`legal/LIA_DRAFTS_2026-09-05.md` §A; RM19738 opt-out follow-up specification.

### The rule

> **Usage analytics stays in Bucket 2 — held there by PECR, not by product taste — but the
> compulsion is a statutory opt-out, not consent.** Analytics is on by default; the person is told
> plainly what it is for; a simple, free, immediate switch exists in Settings and by email; the
> information is used solely to improve the App and is shared with no one for any other purpose.

The Bucket 2 row "Usage analytics | PECR — device identifiers require consent" is amended to
"Usage analytics | PECR Sch A1 ¶5 — statutory opt-out: sole statistical purpose, clear information,
simple free objection, no onward sharing". D-032's principle is unchanged: refusability follows the
law, and this row still cannot be moved by a product decision.

### Conditions that must hold (else the row reverts to consent)

No User-ID or account identifier in events; no advertising or cross-app identifiers; no
advertising storage or personalisation; GA4 property data-sharing settings off; information not
buried; objection effective immediately. RM19738 carries these as acceptance facts.

**Evidence clarification, 2026-09-05 (RM19740):** These conditions are obligations, not verified
facts. RM19738's current source candidate is `40fbbb3239ee7832a0813de0e756702cdd556451`; its device
switch does not prove account-wide email suppression or stop Sentry. GA4 settings access is blocked,
and the reporting source does not establish a raw-event expiry or aggregation lifecycle. The
[current reconciliation](legal/CONSENT_DATA_RECONCILIATION_2026-09-05.md) owns the evidence details.
The recorded worldwide product decision does not establish legal compliance in any jurisdiction.

### Residual and reversion

The UK exception does not cover EU/EEA users (ePrivacy Art. 5(3) still requires consent). No EU
launch cell exists. **Decided 2026-09-05 (Devon: "ship the opt-out worldwide, no geo-gate — record
it"):** the opt-out ships to every user regardless of region; no region-gated default is built; the
EU residual is accepted and recorded here for counsel. **Reversion:** an EU launch cell, or counsel
advising that incidental EU users require consent, or any condition above failing → analytics
returns to consent (opt-in) for the affected users and RM19738 gains a follow-up.

### Authority boundary

Records a decision already taken and its legal footing. Authorises no code, no deploy, no policy
publication; the policy §7 wording that names the switch publishes only with the RM19738 release.

## OPERATING_STATUS.md — consent/data reconciliation excerpt (lines 84–114)


### Open compliance gaps between the published notice and the shipping code

**Latest evidence correction, 2026-09-05:** RM19738 is now in source Code Review at
`40fbbb3239ee7832a0813de0e756702cdd556451`; the remote integration branch is
`01973780f53bc4abaff691dd987c509500544400`. The live policy still says 30 August 2026. The snapshot
below predates that handoff. [Current consent/data reconciliation](legal/CONSENT_DATA_RECONCILIATION_2026-09-05.md)
records the device/account objection mismatch, independent Sentry processing, unverified GA4
settings and event-retention evidence. D-032.1 remains the recorded product decision, not a legal
clearance. RM19740 remains Design/Clarify; neither policy publication nor release is proved.

Re-verified 2026-09-05 (RM19740, `CONSENT_AND_DATA_RULES_ALIGNMENT_2026-09-05.md`). The two gaps
recorded on 2026-09-01 read as follows today:

1. **Dish recognition — CLOSED on 30 August 2026.** The policy was republished at 13:25 that day
   (`makan-web` main @ `3dc5c2a`) and is live: §3/§4.2/§13/§14 describe dish recognition as built in
   on legitimate interests with objection by email; pre-existing photographs stay opt-in. The
   2026-09-01 entry quoted the pre-republication text. No photograph is processed anywhere on the
   integration line (RM19718 is text-only; RM19663 has no code).
2. **Analytics consent — OWNED by RM19738, reframed by D-032.1.** The integration line has no gate;
   RM19738 restored one (opt-in, `9b75b7f5`, Code Review 2026-09-05 09:37) and is now being reworked
   to Devon's "make it opt out" (10:05). Live §7 already states legitimate interests with objection
   by email; PECR Sch A1 ¶5 (in force 5 Feb 2026) makes a statutory opt-out lawful in the UK under
   five conditions RM19738 must keep. §7 must name the in-app switch and §2.3 must stop claiming
   other-user identifiers **when** that build ships — draft branch `RM19740-privacy-analytics-optout`.

Still owed under D-032 for built-in / LI processing: signed legitimate-interests assessments for
analytics, dish recognition and the venue roster (drafts at `legal/LIA_DRAFTS_2026-09-05.md`); a
recorded Article 21 handling procedure (alignment doc §6); the roster policy clause at RM19505
activation; GA4 console data-sharing verification. EU-user default DECIDED 2026-09-05: opt-out ships
worldwide, no geo-gate (D-032.1).
