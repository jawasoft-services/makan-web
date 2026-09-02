# Eats: dish and restaurant scores, and monthly standings — Design

**Status:** approved by Devon 2026-09-02 ("every dish has a score and so does the restaurant, override and update"; design approved "yes").
**Doctrine:** D-033 (recorded in `strategy/pivot/DECISION_LOG.md`), amending §17 and the "Calm by design" clause of `PROPOSED_MAKAN_DIRECTION_2026-08-28.md`.
**Builds on:** RM19117 (restaurant-level Eat or Yeet aggregate, at Upload), RM19440 (dish-at-venue identity, Closed), RM17893 and RM17832 (pairwise ranking as the authority signal for the Makan 100, Closed concepts), RM19073/RM19465 (taste graph), `business_launch_partner_enabled` (launch-partner flag, exists).

## 1. What this is

Every time a real diner picks a meal from your restaurant over a meal from another restaurant in Eat or Yeet, the dish gets an **Eat** and the restaurant gets an **Eat**. Eats add up for life. Every month, in every city, Makan publishes the standings, and the restaurant with the most Eats is the city's Restaurant of the Month. The earlier a restaurant is on Makan, the more Eats it has.

The signal is honest by construction: Eat or Yeet only ever compares one person's own saved meals, so nobody can rank a place they did not eat at.

## 2. The rule

| Term | Definition |
|---|---|
| Comparison | One immutable `rankingComparisons` doc: `{userId, mealAId, mealBId, winnerId, timestamp}`, both meals the actor's own (existing). |
| Verified matchup | A comparison where both meals resolve to a restaurant (`placeProviderId`) and the restaurants differ (RM19117's trigger condition). |
| Eat | The winner's restaurant, and the winner's dish-at-venue subject (RM19440), each receive one Eat from a verified matchup. |
| Yeet | The loser's restaurant and dish each receive one Yeet. |
| Tie | `winnerId === 'tie'`: one tie outcome to both sides; no Eat. |
| Same-restaurant comparison | Both meals at one restaurant: the winning dish subject gets an Eat, the losing dish a Yeet, the restaurant gets nothing (a win over your own other dish proves nothing about the place). Dish subjects only; excluded from restaurant totals. |
| Score | `eats` (lifetime count). Displayed with `eatRate = eats / (eats + yeets + ties)` as the quality signal. |
| Evidence floor | No score or rate is shown for a restaurant or dish with fewer than 10 verified matchups (RM19117 §6). Below it: "not enough matchups yet". |
| Daily cap | At most 3 counted Eats per (user, restaurant) per UTC day, and 3 per (user, dish subject) per day. Comparisons beyond the cap still record Yeets and ties for the other side and still feed personal ranking; only the Eat is not counted. |
| Unresolved dish | If a meal has no confident dish subject, the restaurant still scores; the dish Eat waits in the ledger and is applied when the subject resolves (RM19440's unresolved state). |

## 3. Standings and publication

- **Scope:** one city (the place's resolved city from RM19072 identity), one calendar month. Standings rank restaurants by lifetime `eats` at month end, ties broken by `eatRate`, then by earlier `firstMealAt` (the date of the first meal ever tagged to the place).
- **Published:** the top restaurant is Restaurant of the Month for that city. Surfaces: Discover (a card at the top of the city's Discover for the month), the website (`/standings/<city>`, public, indexable, with the whole list and each restaurant's Eats, Eat rate, "on Makan since" and Restaurant of the Month history), and an Instagram post from the same data. The annual Makan 100 (RM17832) is generated from the same ledger over twelve months.
- **Dish standings:** each restaurant page shows its dishes ranked by Eats ("the dish that keeps winning here"), and the city standings show the top dish per restaurant.
- **Early joiners:** `eats` never resets. Standings show "on Makan since" for every restaurant. The first restaurants in a city keep the founding mark the app already carries for launch partners (`business_launch_partner_enabled` push exists; the mark becomes a field on the place record).
- **Corrections:** a deleted meal or a re-resolved dish triggers compensation on the affected counters (RM19117 §"correction/deletion uses compensation or deterministic rebuild"); standings are recomputed nightly from the ledger, so a rebuild is always possible.

## 4. Data and scale

- **Ledger (server-owned, exactly once):** Cloud Function `onCreate(rankingComparisons/{id})` writes `eatLedger/{comparisonId}` once, then increments counters. Re-delivery is idempotent on the ledger doc.
- **Counters:** `placeScores/{placeProviderId}` `{eats, yeets, ties, matchups, firstMealAt, city, updatedAt}` and `dishScores/{placeProviderId}_{dishSubjectId}` `{eats, yeets, ties, matchups}`. Hot places use 10 shards; reads sum shards through the nightly rollup, never on the client.
- **Caps:** `eatCaps/{userId}_{placeProviderId}_{yyyymmdd}` counters enforce the daily cap inside the same transaction.
- **Rollup:** nightly scheduled function writes `standings/{city}/{yyyy-mm}` `{rank, placeProviderId, eats, eatRate, matchups, firstMealAt, topDish}` and, on month end, freezes the month and marks Restaurant of the Month. Clients and the website read `standings` and `placeScores` only; `rankingComparisons` and the ledger stay private.
- **Rules:** counters, ledger and standings are server-write, client-read. Raw comparisons never leave the actor's own document scope.
- **Costs:** one ledger write and two or three counter increments per comparison; standings reads are one doc per city per month.

## 5. Doctrine amendment D-033

§17 changes "a popularity-based 'best restaurants' authority" to: "a guide judged from outside. Makan publishes standings derived only from verified choices by people who ate there." The "Calm by design" clause keeps its ban on unbounded leaderboards and states that the standings are bounded (one city, one month, an evidence floor) and truthful, which is the condition under which play is allowed. Q7 of the review questions ("could popularity, a restaurant or payment manipulate the result?") is answered by: own-meal comparisons only, exactly-once ledger, daily caps, no paid input.

## 6. Website section (the ten-year-old version)

Eyebrow "For restaurants". Title: "Every time someone picks your dish, you get an Eat." Body: "When a real diner picks a meal at your place over a meal somewhere else, your dish gets an Eat and so do you. Eats add up. Every month, the restaurant with the most Eats in your city gets published. The earlier you're on Makan, the more Eats you have." Three lines: nothing to pay; only people who ate there can give you an Eat; the standings show when you joined. Visual: the Discover screen and a standings card mock built from real data once the ledger runs. The Maitre'D remains as the second beat. The section ships on the deploy-gated home; the standings page ships when RM19117's aggregate is live.

## 7. Out of scope

Paid placement of any kind; restaurant-controlled edits to scores; showing who gave an Eat; cross-city standings; changing Eat or Yeet's pairing or the personal ranking engine.

## 8. Open items for the plans

- Website plan: the section copy in both locales, a standings page reading `standings/{city}/{month}`, credits for any screens.
- App/backend plan (munchies-rn): extend RM19117's aggregate to dishes (RM19440 subjects), add caps, the nightly rollup, the Discover card, the founding mark field, rules and tests.
