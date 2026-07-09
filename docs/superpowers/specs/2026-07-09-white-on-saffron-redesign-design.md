# White on Saffron — sitewide colour redesign

**Date:** 2026-07-09
**Status:** Approved by Devon (mockup variant A · cream relief, strict white-on-saffron)
**Mockup:** https://claude.ai/code/artifact/3771b007-8dfa-410a-b57f-7be9a31c89df (tab A is the approved direction)

## What this is

Flip makanofficial.com from its current dark theme (near-black `#050505` ground,
white text, saffron accents) to a **saffron-led** identity: saffron `#FF9932`
bands carrying white display type at the brand and conversion moments, with
warm cream relief sections carrying body copy between them. This aligns the
website with the app's founder branding rule (text/icons ON saffron = white,
2026-06-15) — the site's current dark-text-on-saffron CTAs diverge from it.

## Decisions made (do not re-litigate)

1. **Coverage:** saffron-led with relief — NOT a full saffron takeover.
   Saffron bands at nav, hero, B2B teaser, final CTA; cream everywhere else.
2. **Relief surface:** cream (mockup variant A), not white, not dark.
3. **Small text:** never sits on saffron. **Strictly white-on-saffron — no
   dark-ink-on-saffron exception.** Anything below display size inside a
   saffron band either bumps to ≥20px semibold white or moves onto a panel.
4. **Scope:** whole site — every route inherits the new system.
5. Saffron stays exactly `#FF9932` (locked; identical light/dark per founder call).

## Token system (`tailwind.config.ts` `brand.*`)

| Token | Was (dark site) | Becomes | Role |
|---|---|---|---|
| `orange` | `#FF9932` | `#FF9932` | unchanged, locked |
| `bg` | `#050505` | `#FFF4E6` | page ground — saffron-tinted cream |
| `ink` | — (new) | `#2B1503` | espresso body ink on cream (14.9:1) |
| `muted` | `#888888` | `#85613F` | secondary text on cream (5.1:1 — the mockup's `#8F6C49` measured 4.38:1, just under AA) |
| `dim` | `#767676` | retire or map to `muted` | |
| `surface` | `#0f0f0f` | `#FFFFFF` | elevated cards on cream |
| `line` | `#1a1a1a` (`border`) | `#F3E2CD` | hairlines/dividers on cream |
| `footer` | — (new) | `#241102` | deep espresso footer ground, white/`#C9A985` text |

`globals.css`: body flips to `bg`/`ink`; `::selection` stays saffron-tinted
(darken text to ink); **focus ring is espresso ink everywhere** — ink reads on
cream (14.9:1) AND on saffron (7.3:1); a saffron or white ring fails the 3:1
non-text minimum on one surface or the other. Inverse grounds (espresso
footer, hero glass panel) flip the ring to cream via an `inverse-ground` class.

## The on-saffron contract (site-wide)

- White display type only (headlines, nav links, CTA pill labels).
- White-on-saffron is 2.1:1 — accepted as a deliberate brand statement for
  display type; **never** paragraph copy.
- CTA pills on saffron invert: **white fill, saffron text**. (A saffron pill
  on a saffron band disappears.)
- Sublines/captions inside saffron bands: bump to ≥20px semibold white, or
  place on a panel (hero glass) — never small white text straight on saffron.
- Logo on saffron: white wordmark + white M-mark (new SVG assets, see below).

## Homepage rhythm (`app/page.tsx` section order)

| Section | Surface |
|---|---|
| Navbar | **saffron** (scrolled + top states both saffron; mobile menu saffron) |
| Hero | **saffron** — waterfall cards over saffron, edge fades blend to saffron (not black); dark glass panel stays (it's what lets the tagline + fine print exist inside the hero; "Where was that again?" stays saffron-on-glass); CTA pill inside the panel stays saffron-fill/white-text (it sits on glass, not on saffron) |
| MemoryTest | cream |
| Manifesto | cream |
| AppShowcase | cream |
| LatestOnMakan | cream |
| FounderStory | cream |
| B2BTeaser | **saffron** (the /partner conversion moment) |
| FAQ | cream |
| FinalCTA | **saffron** — "Makan is live." white display; subline bumps to ≥20px semibold white; white pill / saffron text |
| Footer | **deep espresso** `#241102`, white brand row, `#C9A985` links |

## Sub-pages

All routes inherit saffron nav + espresso footer and cream ground:
`/manifesto`, `/story`, `/blog` + `/blog/[slug]` (ReviewArticle: cream reading
ground, white cards where elevation is needed — long-form reads better on
light), `/partner`, `/contact`, `/meal`, `/app` landing, `/tos`,
`/privacy-policy`, 404. `opengraph-image.tsx` re-cut to saffron brand.
`components/blog/*` (ReviewArticle, MealGallery lightbox, schema untouched —
JSON-LD has no colour).

## New assets (`public/`)

- `makan-wordmark-white.svg` — clean white letterform path (extracted from the
  traced wordmark's primary `#FEA32E` path; noise paths dropped).
- `makan-icon-white.svg` — white M glyph on transparent (the cream `M` path
  from `makan-icon.svg`, filled white).
- Existing saffron assets stay for use on cream/espresso surfaces.

## Constraints & logistics

- **Uncommitted partner WIP** (PartnerForm, partner/page, B2BTeaser, Navbar,
  Footer, PartnerPitch + package.json) is live in the working tree. Restyle
  ON TOP of the working-tree state; never revert content/functionality.
  No commits that bundle WIP content changes with restyle changes without
  Devon's say-so.
- Dev flow (iCloud gotcha): edit the real repo here, `cp` changed files into
  `~/dev/makan-web-preview` for HMR; `next dev` from `~/dev` only.
- Deploy = push to `Ridorichard04/makan-web` main → Vercel auto-promotes.
  **Devon pushes; the agent never deploys.**

## Verification

- `tsc --noEmit` green.
- Visual pass of every route, desktop + 375px mobile, light chrome.
- Reduced-motion pass (waterfall pauses, no shimmer).
- Contrast spot-checks: ink/cream 14.9:1, white/espresso ≥15:1, focus rings
  visible on both surface types. Saffron eyebrow labels on cream are ~2:1 —
  acceptable ONLY as decorative anchors per the app's saffron-contrast
  contract: every saffron eyebrow must be immediately followed by a full-
  contrast heading that carries the content on its own.
- Grep sweep: no remaining `#050505`/`brand-bg`-as-dark assumptions,
  no `text-brand-bg` on saffron pills (the old dark-text-on-saffron pattern).

## Out of scope

- Copy changes (this is a restyle; wording stays).
- The `perfect.` shimmer keeps its white+glint treatment on the dark glass.
- App-side tokens, marketing collateral, blog content.
- Deleting the duplicate `makanwebsite` Vercel project.
