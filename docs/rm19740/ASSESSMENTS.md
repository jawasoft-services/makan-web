# Legitimate interests assessments — DRAFTS for counsel (RM19740)

**Status:** DRAFT, written 2026-09-05 by the Makan2 controller from the published policy, the
decision log and the shipping code. Not signed. Not counsel-reviewed. D-032 makes a recorded LIA a
precondition of every built-in processing purpose; none existed on disk before this file.
**Controller:** MAKAN APP LTD (verified in the live policy on 2026-09-05). Jawasoft's processor or
other role requires its own contractual evidence; it is not substituted for the named controller.
**Framework:** UK GDPR Art. 6(1)(f), ICO
three-part test (purpose, necessity, balancing). Indonesia: UU PDP 27/2022 Art. 20(2)(f).

Each assessment answers the same seven questions. Fill the bracketed items at signature.

**Evidence correction, 2026-09-05:** These are proposed assessments, not findings that a lawful
basis has been established. A built-in product default does not itself satisfy necessity and
balancing. The candidate safeguards below belong to RM19738
`40fbbb3239ee7832a0813de0e756702cdd556451`, reviewed mobile source (the fresh ticket status is Branch Test), and must not be described
as production controls. See [current evidence and obligations](PRD.md).
Reference: [ICO legitimate interests assessment](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/legitimate-interests/).

---

## A. Usage analytics (Firebase Analytics) — live purpose; candidate safeguards not released

**1. Purpose.** Understand which screens and features are used, and where flows fail, so the App can
be improved. Policy §7 and §2.3. Not used for advertising, cross-app tracking, or the taste picture.

**2. Proposed basis.** Legitimate interests is the basis stated in the published policy. That
statement and Devon's opt-out product decision are not evidence that the required assessment has
passed. The proposed storage/access exception is PECR Sch A1 ¶5; applicability remains conditional
on the unresolved evidence in the current reconciliation, including retention and provider use.

**3. Necessity — to assess.** Explain why the chosen device event collection and retention period
are proportionate compared with less intrusive measurement. Candidate configuration: no User-ID, no account UID in parameters, no
advertising identifiers, no ad storage/personalisation, finite safe parameter registry (RM19738).
Debug builds do not collect.

**4. Balancing — interests of the individual.** Data: pseudonymous app-instance id, device model/OS,
app version, screen and feature events, coarse IP-derived location. Reasonable expectation: a person
using a consumer app expects usage measurement; the policy says so plainly. Intrusion: low; no
content, names, captions, place names, precise coordinates or image URIs (RM19738 contract).
Children: no age gate exists (policy §12 "13+", §5 "cannot verify age"), so the higher standard
applies — plain language, no nudging, no repeat prompting.

**5. Safeguards.** Device-level opt-out in Settings › Privacy, effective immediately, persisting
across sign-out and deletion (RM19738 rework); email objection route (policy §7/§11); Google as
processor under Firebase terms with GA4 data-sharing settings OFF [VERIFY IN CONSOLE]; retention per
GA4 setting [RECORD VALUE]; no EU launch cell (EU users remain a recorded residual — RM19740 §4).

**6. Proposed outcome — NOT CLEARED.** The draft proposes legitimate interests. GA4 access,
aggregation/retention, disclosure and the working objection route remain unverified. Removing
account IDs and shipping the switch do not by themselves establish the statistical exception.

**7. Review.** At RM19738 release; whenever an event parameter is added; if an EU launch cell is
approved; on counsel review. [Signature, date]

---

## B. Dish recognition — RM19718 text path (Branch Test); RM19663 photo path DEFERRED

**1. Purpose.** Name the dish a person ate so Makan can answer "what should I order" (D-029). Policy
§3, §4.2, §13. RM19718 names dishes by matching the caption the person typed against the venue's dish
list; **no photograph of a person or a meal is read**. RM19663 (visual clustering of the person's own
photographs) is deferred and is excluded from this assessment until it returns; it will also need a
DPIA (privacy-clauses-v2 §F).

**2. Proposed basis.** Legitimate interests (D-031.3a, D-032; policy §4.2). The built-in decision
describes the product default; necessity and balancing still require an assessment for this purpose.
Reversion condition stands: if counsel assesses dietary inference as Article 9 special-category
data, explicit consent is required and the feature returns to Bucket 2.

**3. Necessity.** Naming from text the person already typed is the least intrusive route to a named
dish; it needs no new data collection. The alternative (photo analysis) was set aside for exactly
this reason (RM19718 "Why this is not blocked").

**4. Balancing.** Data: caption text, venue tag, the derived dish name. Expectation: someone who asks
an app what to order expects it to recognise what they ate (policy §4.2 argues this). Intrusion: low
for the text path. Special-category risk: dietary patterns could indicate religion or health — the
policy's promise not to infer "your dietary habits, your health or your beliefs" (§3) is the
mitigation and must not be removed. Children: as in A.

**5. Safeguards.** Venue-scoped naming (an untagged meal gets no name); correction by the person;
email objection route (policy §3, §11); the 4,926 pre-existing photographs are excluded unless opted
in (published promise, D-031.3a); no historical replay (RM19718 O-5).

**6. Proposed outcome — NOT CLEARED.** The draft proposes legitimate interests for the text path.
**Gap:** a verified per-account suppression and non-recreation route is not evidenced. Resolve it
before claiming that the published objection promise is operational.

**7. Review.** If RM19663's photo path is reactivated (then: DPIA, vendor DPA, transfer mechanism,
Art. 30 update, counsel approval per privacy-clauses-v2 §G); on counsel review. [Signature, date]

---

## C. Venue roster (Maitre'D holder and close regulars) — DARK, before RM19505 activation

**1. Purpose.** Let a restaurant that has claimed its place see, for its own venue only, the names of
its current Maitre'D holder and a few close regulars so staff can recognise them (SPEC_maitred_
recognition_rework, decided 2026-08-31; D-032 Bucket 1).

**2. Basis.** Legitimate interests (Makan's and the venue's interest in recognising regulars; the
diner's interest in being recognised is the feature's point). Consent was rejected because the
feature is core and venue-scoped. **This is the sharpest Bucket 1 case:** it discloses a named
person's eating frequency at a named venue to a third-party business. Counsel should confirm the
balance before activation; opt-in would be materially safer (spec's own risk note).

**3. Necessity.** Only name and qualifying-day count per person are published; no dates, meals,
photos, captions or windows (`publishVenueRoster` contract test). Own-venue only. Not listable.
Server-written. Nothing less would let staff recognise a regular.

**4. Balancing.** Data: display name (+ photo needed to recognise), qualifying days, at one venue.
Expectation: a person who repeatedly tags meals at a claimed venue reasonably expects that venue to
know they are a regular — **only once the policy says so plainly** (it does not yet). Intrusion:
moderate; mitigated by venue scope and automatic removal on meal/account deletion. Children: as in A;
a minor regular being named to a business is the highest-risk configuration — consider excluding
accounts that self-declare under 18 [DECISION].

**5. Safeguards.** Rules: `maitredVenueRoster/{canonicalPlaceId}` readable only by that venue's
`businessOwnerUid`; recomputed from live counts so deletion removes the person; email objection
route; policy clause to publish AT activation (draft in the spec); in-app disclosure before the
first restaurant-tagged commit (RM19505 acceptance).

**6. Outcome.** Legitimate interests is arguable; activation is blocked until counsel confirms, the
clause is published and this LIA is signed (RM19505 already lists privacy/terms approval as a
launch blocker).

**7. Review.** Before activation; if a competitor table (public ranking to other diners) is pursued —
that is a different, higher-risk disclosure needing its own LIA and likely consent. [Signature, date]


## Review snapshot provenance

Copied from the canonical MAKAN workspace assessment drafts on 6 September 2026. The earlier dates describe the draft's origin. PRD.md binds the latest source/status and the open publication obligations. The three assessments remain unsigned and not counsel-reviewed. The snapshot does not supersede the canonical decision log.
