# Decision-first website — design

**Date:** 2026-09-01
**Owner:** Devon Makepeace
**Status:** Design accepted. **Not authorised to deploy.** See §2.
**Supersedes as the site's organising frame:** `2026-07-09-white-on-saffron-redesign-design.md`
(its colour system, motion layer and route structure all survive; only the proposition changes)

---

## 1. What this is

A ground-up rebuild of makanofficial.com around **D-029, the decision-first doctrine**:

> Makan is the app you use when you don't know what to order.

The current site sells a food diary. Every headline, section and FAQ answer on it argues
memory. That is D-028-era framing, and `strategy/pivot/APP_INVENTORY.md` already carries the row:

> *Web home and Indonesian route — MODIFY. Risk: Website promises a product the app does not deliver.*

This spec resolves that row in the opposite direction from the one the inventory anticipated. The
inventory assumed the site should be pulled back to match the app. Devon's decision (§2, D1) is to
build the site to the **destination** and gate the deploy instead.

## 2. The deploy gate — read before building

**D1. The site is built now to the full D-029 promise, and deployed only when that promise is
true.** Devon, 2026-09-01: *"build all now, i dont mind promising what we are building as we will
deploy when it is true."*

This converts doctrine §20 from a **content constraint** into a **release constraint**. Everything
in this document may be built, reviewed and merged. None of it may reach makanofficial.com until
the decision spine lands.

**Gating tickets, read live from Redmine on 2026-09-01:**

| Ticket | Subject | Status |
| --- | --- | --- |
| RM19663 | Canonical Dish entity | Design/Clarify |
| RM19664 | Dish-level decision surface | Design/Clarify |
| RM19665 | Decision fallback ladder — five evidence levels | Develop/Rework |
| RM19666 | Restaurant page as decision moment | Pending |
| RM19667 | Decision outcome and attribution | Pending |
| RM19505 | Maitre'D — restaurant loyalty status | Develop/Rework |

**Release condition:** the site ships when RM19664 and RM19665 are live in a public build, with
RM19505 live or the Maitre'D rung removed. RM19663 is a prerequisite of both.

**Drift to reconcile (Redmine hygiene, not a website task):** RM19665's status field reads
`Develop/Rework`, but the delivery card inside its own description reads
`Disposition: AWAITING_CANDIDATE`, `Phase: SPECIFY / Pending`, *"Candidate/build: Not verified — do
not test or hand off yet."* Those disagree. The release condition above depends on which is true.

## 3. Audience and language

**D2. The site is written for a diner anywhere in the world staring at a menu. Bahasa Indonesia is
a full translation of that same story, not a separate market skin.**

This is a deliberate, recorded departure from the doctrine's *"Indonesia-first is operational, not
cosmetic"* (§16). Devon, 2026-09-01: *"written for a diner worldwide staring at a menu, indonesian
language available for the same problem, just in indonesian."* Bali remains the operational
first-bet market; that is a go-to-market fact, not a website fact. No Bali-specific hero, no
Indonesian decoration, no geographic claims.

Consequences:

- Both locales carry identical argument, structure and evidence. No content exists in one only.
- `messages/en.json` and `messages/id.json` stay key-for-key. `npm run check:i18n` enforces this
  and runs during lint.
- Indonesian text expansion is a layout constraint, not an afterthought — see §8.

**D2a (2026-09-01).** The mockup menu artefact — Bright Palm's section headings and dish
descriptions — is provider-authored content in the restaurant's own voice and stays English in
both locales, exactly as dish names do. A Berawa café's printed menu genuinely is in English.
Makan's own copy remains fully translated. (Resolution of final-review finding I7.)

**Platform.** Makan is iOS-only; Android is an email waitlist. Statcounter puts Indonesia at ~77%
Android / ~23% iOS (July 2026), which would cap conversion hard in the operational market — but the
site's audience is worldwide, and the Canggu/Berawa Western-café cohort the first bet targets skews
far more iOS than the national figure. The iOS-only CTA is therefore accepted for launch. The
Android waitlist stays a real, designed capture, not a footnote.

## 4. Positioning and copy

**D3. Tagline: "Know what to order."** (19 characters; fits the App Store subtitle.)

Retires **"Remember every meal"** (founder-decided 2026-07-10) as the organising one-liner. Same
voice — plain, imperative, anti-marketing. Memory does not disappear; it moves into the body copy
as the *reason Makan can answer*, which is exactly its position in the doctrine.

Surfaces requiring the swap, none of which are a website deploy:

- `<title>`, `og:title`, `twitter:title` (website — in scope here)
- App Store subtitle (App Store Connect edit)
- Instagram `@makanappofficial` and TikTok `@makan.app` bios
- The share-card export baked into the app's meal images

**Hero headline (current):**

> **You still don't know what to order.**

**Resolved (2026-09-01, D4a):** both sentences ship, as separate story beats. The hero is now a
pinned scroll scene — the reader scrolls and the page discloses itself bit by bit, in the order
the evening happens: the scene line ("Tuesday night. The menu lands."), then *"Everything sounds
good."*, then the headline, then the answer card placed on the menu, then the doubt, then the
receipts, then the ask. Devon, 2026-09-01: *"dont display all the information slap bang, let the
user scroll and discover bit by bit. reframe the copy as a story."* This is D5's first earned
page-turn, built. Mobile discovers the same beats sequentially as they scroll into view.
Implementation note: the stage is driven by a rAF loop, not scroll events — the site runs Lenis
smooth-scroll and the loop survives any scroll machinery; content stays visible without JS and
under reduced motion.

**Sub:** *Makan helps you choose. It uses real meals — yours, and ones from people you trust.*

**D3a — voice (2026-09-01).** Doctrine §22 is a hard constraint on every visible string, not a
preference: *"It uses words a ten-year-old knows."* The first build failed it — `"It works down
from what it knows best to what it knows least"`, `"No level can answer"`, `"Facts the restaurant
supplied"`, `"labelled as theirs"`, `"never outranks a real meal"`. That register is a strategy
deck describing a product, not a person at the table talking to you.

The rewrite rule, for anyone writing a new section: **name the thing that happened, in the order it
happened, using the doctrine's own verbs — eat, save, remember, choose, share, try, know, trust.**
`"Everyone on Makan, counted together"` becomes `"Lots of people have eaten here."` `"No level can
answer"` becomes `"Nobody has eaten here yet."` The evidence marks RM19665 specifies stay verbatim;
everything around them is Makan's own voice and must read aloud without sounding written.

**Competitive note.** [OrderThis](https://orderthisapp.com/) (*"Skip the doubt."*) and
[MyOrderGuide](https://www.myorderguide.app/) (*"Stop scrolling menus. Just eat well."*) already
occupy "what to order" as AI menu-scanners with no memory and no people. Makan's separation is
that its answer comes from meals that actually happened — which doctrine §17 already names as the
enemy: *"a chatbot that invents confident recommendations."* The site must therefore be explicit
about occupying this ground, not allusive.

## 5. Architecture

**D4. The page is a menu that gets answered.** Page one is a real menu — dense, beautifully set,
no help. As the reader scrolls, Makan's marks appear on it. By the end it has resolved to one dish.
The scroll is not a slideshow of features; it is a menu being solved.

**D5. Menu as the ground everywhere; three earned page-turns.** The whole document is set as a
menu and scrolls normally. Real turns only at: the hero resolving into the answer, the ladder
descending, and the final page landing on one dish. Rejected: turning all eight movements, which is
~6,000px of captured scroll and a mobile drop-off risk before the CTA.

**D5a (2026-09-01, Devon).** The paper is the hero's object, not the site's wallpaper: every
movement after the hero sits on white. And the answer card is laid physically **on** the menu —
overlapping the spread across the spine on desktop, overlapping the menu's faded lower edge on
mobile — so the product's whole gesture (Makan's answer on your menu) is one object. This
supersedes D5's "menu as the ground everywhere"; the three earned page-turns survive.

**D6. Hero composition: the diptych.** An open spread — menu printed on the left page, Makan's
answer on the right, hairline spine between. It establishes the book object in the first second,
shows before-and-after in one glance, sets up every page-turn that follows, and stacks cleanly on
mobile (menu panel on top fading at its lower edge, then sentence, answer, button).

### Page map — eight movements

| # | Movement | Job |
| --- | --- | --- |
| 1 | **Hero — the diptych** | Problem as an object; answer card above the fold; CTA |
| 2 | **The turn** — *"It doesn't guess. It remembers."* | The competitive knife, one line, full-bleed |
| 3 | **How Makan learns you** | Eat or Yeet → saving meals → people you trust, as one movement |
| 4 | **The ladder** (§7) | Where answers come from; the honesty argument |
| 5 | **Proof** | The live meal strip — real meals, real venues, real count |
| 6 | **What Makan is not** | Doctrine §17, unhedged |
| 7 | **FAQ** | Rebuilt around decision objections; cold start is question one |
| 8 | **Final CTA** | *"Next time the menu lands, you'll know."* |

Nav: logo · How it works · Where answers come from · FAQ · **Get Makan** · EN/ID.
`/partner` stays footer-only — the guest-anonymity rule in
`feedback_makan_public_surface_softens_mechanism` is unchanged by this rebuild.

**Dies in the rebuild:** the memory-loss hero, *"For people who keep the photo and lose the
details,"* and *"Built around the meal, not the metric."* All three argue the diary frame. Their
substance survives inside movements 4 and 6.

**Cold start is the FAQ's first question.** Doctrine: cold start is the default, not an edge
case. *"What if I've never used Makan before?"* belongs at the top of the FAQ, not buried.

## 6. Visual system

Built on the existing tokens in `tailwind.config.ts`. Plus Jakarta Sans only — no second typeface.

### 6.1 Paper

**D7. Printed, not photographed — then given real stock.** Real menu print craft (small-caps
section heads, right-aligned tabular prices, dietary markers, the Bali `++` tax line), with paper
materiality built from CSS only. No image asset, no photographic paper, no skeuomorphic leather.
The constraint that mattered — **text stays real DOM text** — holds throughout, which is what keeps
the page indexable, selectable and translatable.

Four layers, under the content, all `pointer-events: none`:

| Layer | Build |
| --- | --- |
| Tone | Radial gradients — light from top-left, corners sinking |
| **Fibre relief** | `feTurbulence type=fractalNoise baseFrequency=0.042 numOctaves=5` → `feDiffuseLighting surfaceScale=2.6`, distant light az 45° el 60°; **`mix-blend-mode: multiply`, opacity 0.80** |
| Tooth | `feTurbulence baseFrequency=0.7 numOctaves=3` → `feColorMatrix saturate=0`; multiply, opacity 0.18 |
| Fold + edge | Gutter gradient at the spine; `inset` box-shadow at the sheet edges |

**D8. Multiply 80** — Devon's selection from a nine-tile calibration.

Two findings worth preserving, because both cost a rebuild to discover:

1. **`baseFrequency` must be ~0.04, not ~0.9.** High frequency produces per-pixel static that
   averages to flat grey. Low frequency produces fibrous variation the eye can resolve.
2. **The blend mode matters more than the opacity.** `feDiffuseLighting` outputs a near-white
   surface, so `soft-light` and `overlay` *lift* the base — pushing them harder bleaches the cream
   toward white. Only `multiply` keeps `#FFF4E6` intact and lets the relief's shadows darken into
   it.

Performance: the filter rasterises **once** into a 420px tile and is then reused as an ordinary
background. It is not re-run per frame and costs nothing during the page-turns.

### 6.2 Colour

**D9. `brand.muted` changes from `#85613F` to `#785739`.** Measured, not estimated — the relief
tile was rasterised and the composite computed:

| | plain cream | avg paper `#ebe1d4` | darkest `#e4dace` |
| --- | --- | --- | --- |
| `#85613F` (before) | 5.12:1 ✅ | 4.30:1 ❌ | 4.03:1 ❌ |
| **`#785739` (after)** | 6.00:1 ✅ | 5.05:1 ✅ | **4.72:1 ✅** |
| `#2B1503` ink | — | — | 12.56:1 ✅ |

The texture pushed the existing muted below AA. This matters specifically because `#85613F` exists
at all only because an earlier mockup's `#8F6C49` was rejected at 4.38:1 — multiply 80 arrived at
the same failure from the other direction. The change is invisible at a glance and costs nothing.

**D10. Saffron stays `#FF9932` everywhere, including as text, sized up to carry itself.**

Measured: `#FF9932` as text is **1.96:1** on cream, **1.65:1** on paper, **1.54:1** on the darkest
patches. Larger and bolder does not cross WCAG's 3:1 large-text threshold. This is accepted, for
three reasons:

1. **FD-001 explicitly permits it.** The rule forbids dark text on solid saffron; it prescribes
   *"a white surface with saffron text for controls."* Saffron text on white or cream is inside the
   contract, not an exception to it.
2. **It avoids reintroducing a killed token.** `check-founder-decisions.mjs` fails the build on any
   token containing `brand-orange-ink`. A darker orange text token existed and was deliberately
   removed. Keeping one orange means no lint change and no reversal of a founder decision.
3. **The governing rule below makes it safe.**

**D11 — the saffron rule: saffron may carry emphasis, never sole meaning.**

Every saffron string on the page is a label whose meaning is repeated in ink immediately beneath
it — *"A GOOD MATCH FOR YOU"* sits above *"You've eaten things like it"*; *"MAITRE'D ADI"* above
*"The current Maitre'D's published menu."* A reader who cannot resolve the orange at all loses zero
information. Anything a reader **must** be able to read is ink. This rule is what licenses saffron
as the marquee colour everywhere, and it is the rule to hand anyone building a new section.

Sizes: eyebrow 11–15px/800, section marks 10.5–14px/800, Maitre'D keys 9.5–12.5px/800.

Heading accents follow D11 by rendering in ink with a saffron underline — emphasis in saffron,
meaning in ink. The muted-token change (D9) is production-visible on every existing page the
moment this branch merges; named in the final review (I1) and accepted.

### 6.3 Who is speaking

The menu is ink, medium-weight, hairline-ruled, flat on cream. Makan is bold, saffron, and
white-carded. With no second typeface available, the separation is carried by **surface and weight
rather than typeface** — and it holds. Menu-ness lives in the dot-leaders-and-tabular-prices
conventions, not in a serif.

### 6.4 The ring

The hand-drawn saffron ellipse around the top pick is the memorable device: the menu marked by
hand, which is what Makan does. Build:

- Deliberately **not** an ellipse — flatter along the bottom, higher on the right, not closing
  where it started.
- **Two laps** — a heavier first pass, then a lighter, thinner second sweep back over the top-left,
  overshooting the start. Animated in sequence.
- `feTurbulence baseFrequency=0.016 numOctaves=2` → `feDisplacementMap scale=6`.
  **Low frequency is essential:** high-frequency displacement reads as a shaky hand; low-frequency
  reads as a confident stroke that simply isn't perfect. Same amplitude, opposite character.
- `vector-effect: non-scaling-stroke`, since the viewBox scales non-uniformly to the word width.
- Sits **behind** the words with clearance — the loop never crosses a letterform.

## 7. The ladder — aligned to RM19665

The most distinctive section on the page and the one no AI menu-scanner can copy. **Five evidence
levels plus a fallback**, exactly as RM19665 specifies. Evidence language is taken from the ticket,
not invented.

| # | Source | Evidence language | Saffron form |
| --- | --- | --- | --- |
| 01 | User's own Eat or Yeet evidence | **"Your top pick"** · *"Chosen over 11 dishes at Bright Palm."* | Solid pill |
| 02 | People the user chose to trust | **"Maya ordered this again"** · *"twice, across four visits."* | Underline rule |
| 03 | Current Maitre'D's published menu | **"Maitre'D Adi"** · Always order / Try this if… / Good to know | Underline rule |
| 04 | Privacy-safe aggregate | **"Based on 34 meals from 21 people"** | Dot |
| 05 | Provider-authored facts | **"From Bright Palm's menu"** · *"Fior di latte, nduja, oregano · 115"* | Ink outline, **no saffron** |
| — | No level can answer | **"Not enough meals here yet to help you choose."** | None; dashed |

**The descent is structural, not decorative.** Air, type size and saffron all contract together
from 01 to the fallback — rung 01 carries a photograph, the largest type and the most air; by the
fallback the type is a third of the size and the padding has halved. The layout performs the
thinning evidence, so the reader feels confidence draining before reading a word.

Three rules inside it:

- **Level 05 carries no saffron at all.** The restaurant is speaking, not Makan. Under D11 it
  cannot be saffron, and that single choice communicates "this wasn't bought" with no disclaimer.
- **Level 05 is menu/price/ingredient facts, never a testimonial.** A promotional restaurant quote
  in that slot turns the honest-facts rung into the merchant-controlled advertising surface
  doctrine §17 forbids.
- **The fallback is a designed state, not an error.** Dashed border, no shadow, a real invitation.
  Every competitor answers with identical confidence whether it knows or not; Makan's willingness
  to say it doesn't know is the claim that cannot be faked, and it must look intentional.

The doctrinal **"Your top pick here"** vs **"A good match for you"** distinction lives *inside*
level 01 as a subordinate note, not as a sixth level — which is how RM19665 models it. It must
state that an unseen dish never receives a personal score.

**No cards.** Everything sits directly on the paper, separated by hairlines. Seven identical
rounded rectangles with drop shadows was the first attempt and it violated `.impeccable.md`'s
*"prefer lived-in visual specificity over generic cards."*

**The meal is the hero.** Level 01 carries a real meal photograph. `.impeccable.md` principle 2 is
not optional, and a section with no food in it fails it.

## 8. Motion and accessibility

- One orchestrated arrival per section: staggered rise on ease-out-expo, ring drawing last.
  Transform and opacity only.
- **Content must never depend on an animation to become visible.** Elements default to visible;
  the animation class is added from JS. A page whose content starts at `opacity: 0` is blank to
  anyone whose animation never fires.
- Everything behind `prefers-reduced-motion`. The existing `useStaticMotionFallback` hook and
  `StaticPicture` component are the in-house pattern; reuse them.
- Wide content (the menu spread) scrolls inside its own container; the body never scrolls
  horizontally.
- Indonesian text expansion: no fixed-width labels on translated strings. The Maitre'D key column
  and every uppercase mark must tolerate ~30% growth without wrapping mid-phrase.
- Focus ring: espresso ink, flipping cream on inverse grounds — unchanged from the 2026-07-09 spec.

## 9. Known blockers

**B1 — FD-001 hard-codes component filenames.** `scripts/check-founder-decisions.mjs` asserts that
`components/Navbar.tsx`, `B2BTeaser.tsx`, `LatestOnMakan.tsx` and `FinalCTA.tsx` each contain the
white-on-saffron contract. A from-scratch rebuild renames or deletes those files and **`npm run
lint` fails**, which fails `next build`. The *rule* is correct and stays; the *guard* must be
re-pointed at the new components in the same commit that renames them. This is a required build
step, not a discovery to make at deploy time. **Resolved:** see Task 1 / Task 2 of docs/superpowers/plans/2026-09-01-decision-first-site-foundations.md.

**B2 — the claim audit must be rewritten, and it inverts.** `docs/homepage-claim-audit.md` maps
every current homepage claim to code evidence. Today all of them hold. Verified read-only against
`origin/main` of `munchies-rn` on 2026-09-01, **none of the decision-frame claims do**:

| Claim | Evidence on `origin/main` |
| --- | --- |
| Eat or Yeet ranks the user's own meals | ✅ `app/tabs/calendar`, `app/tabs/profile`, `app/(modals)/postMeal` |
| "Your top pick" / "A good match for you" | ❌ not present |
| Maitre'D, "Always order this" | ❌ not present |
| Evidence ladder / levels | ❌ not present |
| "Not enough meals here yet" | ❌ only a code comment in `store/useRankingStore.ts` |

RM19665's cited prior art — `DiscoverDecisionBand`, `FriendTasteMatchState`,
`MIN_PUBLIC_EAT_EVIDENCE_COMPARISONS`, `PrivateTasteExplanationCode` — is **not on `main`** either;
it is feature-branch work. The rewritten audit is the artefact that discharges the §2 deploy gate:
the site ships when that table has evidence in every row.

**B3 — local `main` drifts.** `~/dev/makan-web-saffron` is the canonical deploy source and `main`
auto-deploys to production. Check both directions (`git rev-list --left-right --count
main...origin/main`) before committing, and never `-c user.email`.

**B4 — the i18n guard blocks retiring product terms.** `scripts/check-i18n.mjs`
asserts `messages/id.json` contains the literals `Eat or Yeet`, `Top 4`,
`Public` and `Friends Only`. The intent is "never translate a product term";
as written it also means "never retire one", so removing diary-frame copy
fails lint and therefore the build. Fixed by asserting a term only while
`messages/en.json` still uses it. Same class of problem as B1: a guard coupled
to today's content rather than to the rule it protects. **Resolved:** see Task 1 / Task 2 of docs/superpowers/plans/2026-09-01-decision-first-site-foundations.md.

## 10. Measurement

Primary: **App Store link-outs per session**, split desktop (QR) vs mobile (badge), EN vs ID.
Secondary: scroll depth to the ladder, and to the final CTA. The existing `HomepageAnalytics` and
`SafeAnalytics` components are the hooks; no new vendor.

The highest-leverage build detail for conversion is **deferred deep linking** — carrying context (a
venue, an invite, a dish) through install so the first open is not an empty app. Benchmarks for
scale: App Store page-view→install runs ~33.7% overall and 35–50% for Food & Drink, so the store
page is not the bottleneck; earning a qualified tap is.

## 11. Out of scope

Restaurant-facing `/partner` copy; the app's own UI; App Store metadata; social bios; the Android
build; any change to `#FF9932`; any monetization surface.

## 12. Open questions

1. **Hero headline** — one sentence or the doctrine's full two (§4).
2. **RM19665 status drift** — which of the two states is true (§2), since the release condition
   depends on it.
3. **Photography** — resolved 2026-09-01: the marketing site uses only meal photographs already
   published on makanofficial.com's own public surfaces (`public/meals/`). The ladder uses
   `IMG_6952.jpg` (@Valesca's Eggs Benedict), which the live meal strip already displays.

### D12 — Two kinds of evidence, both named (2026-09-02)

The story's Eat or Yeet comparisons are **other people's picks**, shown as what
they are: the evidence Makan learns from. They are never framed as the reader's
own ("because you told it" is retired). The payoff names both evidence kinds
in plain words, in this order:

1. *Your picks teach Makan what you like.* (own taste, doctrine rung 1)
2. *Everyone's picks teach it what wins here.* (grouped, privacy-safe Makan
   evidence, doctrine rung 4 — wording follows the approved ladder copy:
   counted together, not by name)

Consequences: no first-person claims about the reader's history or friends
(a friend's meal is offered as "say your friend…"); real users are credited
only for what is true (they saved the meal), never for invented behaviour;
the Maitre'D slip keys are ink, so no meaning rides on saffron alone (D11).

### D13 — Show the product (2026-09-02)
Two real signed-in screens (Eat or Yeet, the diary) sit between the proof scene and the first day, in ink phone frames, each with a title and one sentence. No mock of the decision surface until RM19664 has a screen to photograph. The site carries no lines about what is or is not built yet; the founder decides when the page goes live.

### D14 — Credits, guards and the go (2026-09-02)
Every story photo has a row in `docs/decision-first/photo-credits.md`, enforced by `npm run lint`. Text collisions, content past the fold, flight landings and mobile overflow are checked by `npm run check:scenes` (Playwright) against the running site. Lighthouse and axe run via `npm run audit:home`; the 37 saffron-on-white and white-on-saffron contrast pairs it reports are accepted under D10, D11 and RM18846, and the carousel focus finding belongs to the live meal strip component. There is no build-time release gate: the decision home ships when Devon sets `DECISION_HOME=1` on production and says go.
