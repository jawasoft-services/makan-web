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

## B. Claims with no ticket at all (D-033, the Eat)

The spec is `docs/superpowers/specs/2026-09-02-eats-standings-design.md`; the decision is D-033 in `strategy/pivot/DECISION_LOG.md`. RM19117 supplies the restaurant aggregate; everything below extends it and is unticketed.

| Claim on the site | Where | What has to exist | Proposed ticket |
|---|---|---|---|
| "Your dish gets an Eat" (a score per dish at a place) | Home restaurant section, partner page | Eats/Yeets/ties per dish-at-venue subject (RM19440 identity) written by the same ledger as RM19117; same-restaurant comparisons feed dishes only | **Eats-1** — Extend the Eat or Yeet aggregate to dish subjects (child of an Eats epic; blocked on RM19117) |
| "Eats add up, for life" with no way to pump them | Both | Exactly-once ledger (`eatLedger/{comparisonId}`), daily cap of 3 counted Eats per user per restaurant and per dish, sharded counters, compensation on meal deletion | **Eats-1** (same ticket: ledger, caps, counters) |
| "Every month, the restaurant with the most Eats in your city gets published" | Both | Nightly rollup to `standings/{city}/{yyyy-mm}`, month-end freeze, Restaurant of the Month; city from RM19072 place identity | **Eats-2** — Standings rollup and Restaurant of the Month |
| "…in the app" | Partner page | Discover card for the city's Restaurant of the Month | **Eats-3** — Discover card |
| "…on this site" | Partner page | Public `/standings/<city>` page reading the rollup: list, Eats, Eat rate, "on Makan since", history | **Eats-4** — Website standings page (this repo) |
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

Business claim flow, owner dashboard with visit metrics, nudges and rewards: all in the app behind `business_claim_enabled`, `business_dashboard_enabled`, `business_paid_enabled`, all `false` in `app.json`. Do not describe them on the site until the flags are on.

## E. Open items only Devon can close

- The account handle to print on the Lucky Plaza chicken rice cards (user id starts `644Yh`), or keep "Saved at Lucky Plaza".
- The Indonesian review sheet: `docs/decision-first/id-review.md`.
- Creating the Eats epic and children in Redmine (not done: writes to Redmine were not authorised).
- Setting `DECISION_HOME=1` on production when ready (`docs/decision-first/launch-checklist.md`).
