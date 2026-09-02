# Handoff: what the website claims that is not built, and what has no ticket

Written 2026-09-02 for the decision-first homepage (`/dev-preview`, `/` behind `DECISION_HOME=1`) and the partner page. Every line was checked against the app (`munchies-rn` `origin/main`, production `app.json` feature flags) and Redmine on this date. "Live" means shipped in the production app or site today.

## A. Claims with a ticket, not yet live

| Claim on the site | Where | What it depends on | Ticket | Status on 2026-09-02 |
|---|---|---|---|---|
| "Open Makan at the table. It says what to order here." and the ring "A good match for you" on the menu | Home, menu scene | The dish-level decision surface and the evidence ladder | RM19664, RM19665 (prerequisite RM19663) | Design/Clarify |
| "Your picks tell Makan what you like. Other people's picks tell it what gets ordered again at Bright Palm." | Home, proof scene | Grouped, privacy-safe place evidence (rung 4 of the ladder) | RM19665 | Design/Clarify |
| A friend's three plates ringed on the menu ("Ordered here three times") | Home, first-day scene | Trusted people's eligible meals (rung 2 of the ladder) | RM19665 | Design/Clarify |
| The Maître d': two visit-days inside 60, most visits holds it, the slip of notes, "earned never bought" | Home restaurant section, first-day scene, partner page, FAQ | Maître d' status and its notes | RM19505 | Develop/Rework |
| "Reward showing up, not reviews" (a saved table, a coffee for the Maître d') | Partner page | The Maître d' perk | RM19505 covers the status; the perk itself is described in the restaurant handout and in RM17928 (reward redemption screen, Closed) but no ticket ties a perk to the Maître d' | Gap: raise a child of RM19505 or confirm it is in scope |
| "Not enough meals here yet to help you choose." (the honest empty state) | Home, first-day scene | The ladder's fallback state | RM19665 | Design/Clarify |
| "How does Makan know what to order?" FAQ answer (your picks, other people's picks as totals, says so when too few meals) | FAQ | Same as the proof scene | RM19665 | Design/Clarify |
| Restaurant-level Eat or Yeet aggregate (the base of the Eat) | Implied by the Eats section | Server-owned Eat/Yeet/tie counts per restaurant, 10-matchup floor | RM19117 | Upload/Rework |
| "A QR code for your venue. Scan it and Makan opens on your restaurant's page." | Home restaurant section, partner page | Today `/r/<slug>` is the Phase 1 get-the-app landing page. Devon's wording (2026-09-02): the QR opens the restaurant's place-detail screen (`restaurantPage.tsx`) in the app. Needs the universal link wired on web `main` and the slug resolved to a place id. | RM18722 (infrastructure, Closed; not wired here) | Gap: raise a follow-up to wire `/r/<slug>` to the place screen |
| "You see who your Maître d' is in the app, by first name" and "you see who holds it in the app" | Partner page, home restaurant section | An owner view. The owner dashboard exists behind `business_dashboard_enabled` (false in production) and has no Maître d' yet. Devon chose the in-app promise over an email (2026-09-02). | RM19505 for the status; the owner view is unticketed | Gap: child of RM19505, or the dashboard epic |

## B. Claims with no ticket at all (D-033, the Eat)

The spec is `docs/superpowers/specs/2026-09-02-eats-standings-design.md`; the decision is D-033 in `strategy/pivot/DECISION_LOG.md`. RM19117 supplies the restaurant aggregate; everything below extends it and is unticketed.

| Claim on the site | Where | What has to exist | Proposed ticket |
|---|---|---|---|
| "Your dish gets an Eat" (a score per dish at a place) | Home restaurant section, partner page | Eats/Yeets/ties per dish-at-venue subject (RM19440 identity) written by the same ledger as RM19117; same-restaurant comparisons feed dishes only | **Eats-1** — Extend the Eat or Yeet aggregate to dish subjects (child of an Eats epic; blocked on RM19117) |
| "Eats add up, for life" with no way to pump them | Both | Exactly-once ledger (`eatLedger/{comparisonId}`), daily cap of 3 counted Eats per user per restaurant and per dish, sharded counters, compensation on meal deletion | **Eats-1** (same ticket: ledger, caps, counters) |
| "Every month, the restaurant with the most Eats in your city gets published" | Both | Nightly rollup to `standings/{city}/{yyyy-mm}`, month-end freeze, Restaurant of the Month; city from RM19072 place identity | **Eats-2** — Standings rollup and Restaurant of the Month |
| "…in the app" | Partner page | Discover card for the city's Restaurant of the Month | **Eats-3** — Discover card |
| "…on this site" | Partner page | ✅ Live 2026-09-02: `/standings` (en and id). Today it reduces the raw `rankingComparisons` + `meals` server-side (`lib/eat-standings.ts`, same rule as RM19117: own meals, both tagged, different places, tie to both; 10-matchup floor; sorted by Eats, Eat rate, first meal). Lifetime and all cities in one table because meals carry no city. Production's `eatEvidenceAggregateState` (RM19117) is live but not backfilled (23 places, comparisons since mid-Aug 2026); when it is, switch the reader to it and add per-city months. | **Eats-4** — done on the site; the reader swap and `/standings/<city>` remain |
| "…and on our Instagram" | Partner page | A monthly post built from the same data | Operations, not code; note in the epic |
| "The standings show when you joined" | Both | `firstMealAt` on the place record, shown in standings | **Eats-2** |
| "The earlier you're on Makan, the more Eats you have" and the founding mark | Both | Lifetime Eats (no reset) and a founding-restaurant field on the place record; the app already has the launch-partner push (`business_launch_partner_enabled`) | **Eats-2** (field) and **Eats-3** (display) |

Suggested shape: one epic "Eats standings (D-033)" with Eats-1 to Eats-4 as children, each referencing the spec. Eats-1 is blocked on RM19117; Eats-2 on Eats-1; Eats-3 and Eats-4 on Eats-2.

## C. Claims that are live and verified (for completeness)

| Claim | Evidence |
|---|---|
| Every saved meal carries the restaurant's name into friends' feeds | Feed screenshot; meals carry `locationName` and `placeProviderId` |
| Cravings and Want to Try; Discover's "one good option" nearby with distance | RM18642, RM19115, RM17819, RM19465 (Closed); Discover screenshot |
| Eat or Yeet puts a dish in a public top three with the venue named | Profile screenshot; RM17893 lineage |
| A QR for your table opens Makan with your name on it | `/r/<slug>` route, RM18720 and RM18776 (Closed). Phase 1 only: it does not open the app pre-tagged (no AASA on web `main`; RM18722 infrastructure closed but not wired here). The site no longer names venues: the Durham pilot was not chased. |
| Nothing to pay, no cut of the bill, no way to buy an Eat | No paid mechanism exists; `business_paid_enabled: false` in production |
| 5,000+ real meals saved; App Store rating (shown only at 10+ ratings) | Live Firestore count; Apple's public lookup |

## D. Deliberately not claimed (built, but off in production)

Business claim flow, owner dashboard with visit metrics, nudges and rewards: all in the app behind `business_claim_enabled`, `business_dashboard_enabled`, `business_paid_enabled`, all `false` in `app.json`. The site does not describe them, with one exception Devon chose on 2026-09-02: the promise that an owner sees their Maître d' in the app (section A).

## E. Promises on the site that are commitments, not features

| Line | Where | What backs it | Who owns it |
|---|---|---|---|
| "Devon, the founder, replies in person within two days." | Partner form (intro and success state) | Nothing in code. A reply-time promise Devon has to keep, or change the copy. | Devon |
| "Mostly Jakarta, Bali and the UK so far." | Hero trust line, homepage restaurant section, partner page, FAQ | Read off the top 80 venues by meal count on 2026-09-02 (Jakarta and Bali names dominate; London, Durham and Cork follow). Not computed from addresses: meals carry a Place id and a name only. Re-check when a new city takes off. | Devon (re-read when the mix changes) |
| The named places under the numbers ("Most meals saved" / "Places with the most meals saved") | Homepage restaurant section (top 4), partner page (top 6) | Live from the same Firestore pass: venues by count of meals tagged to them, named as the meals tag them (so "double't Tokyo Bento" appears as tagged). No owner involvement; Devon chose this over a testimonial (2026-09-02). Empty if Firestore is unreachable. | Code |
| Live numbers: places with meals saved, meals in the last 30 days, meals in total | Homepage restaurant section, partner page | Firestore via `getPlaceStats()` (distinct `placeProviderId`, cached 24h) and `getMealCount()`; floors of 600 / 500 / 581 if Firestore is unreachable. Measured 2026-09-02: 666 places, 692 meals in 30 days, 5,009 total. | Code |

## F. Open items only Devon can close

- The account handle to print on the Lucky Plaza chicken rice cards (user id starts `644Yh`), or keep "Saved at Lucky Plaza".
- The Indonesian review sheet: `docs/decision-first/id-review.md`.
- Creating the Eats epic and children in Redmine (not done: writes to Redmine were not authorised).
- Setting `DECISION_HOME=1` on production when ready (`docs/decision-first/launch-checklist.md`).
