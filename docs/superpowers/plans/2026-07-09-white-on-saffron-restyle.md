# White-on-Saffron Sitewide Restyle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flip makanofficial.com from dark theme to the approved saffron-led identity: saffron `#FF9932` bands with white display type at brand/conversion moments, cream relief sections carrying body copy, espresso footer.

**Architecture:** Pure restyle — no copy, structure, or behaviour changes. The old dark tokens are *renamed away* (not revalued) so every stale usage becomes a greppable build-visible error rather than a silent wrong colour. Work proceeds token-first, then homepage top-to-bottom, then sub-pages, then global gates.

**Tech Stack:** Next.js 16 App Router, Tailwind v4 (`@config` → `tailwind.config.ts`), framer-motion, Plus Jakarta Sans via `next/font`.

**Spec:** `docs/superpowers/specs/2026-07-09-white-on-saffron-redesign-design.md` — the on-saffron contract there governs every ambiguity.
**Approved mockup:** https://claude.ai/code/artifact/3771b007-8dfa-410a-b57f-7be9a31c89df (tab A).

---

## Preconditions (Task 0) — DO NOT SKIP

- [ ] **0.1** This repo is shared with other live sessions. Verify the tree is settled: `git status --short` must show NO modified `.tsx`/`.ts` files (untracked `.superpowers/`, `docs/`, `tasks/` noise is fine). As of 2026-07-09 there was uncommitted partner WIP (`PartnerForm.tsx`, `partner/page.tsx`, `B2BTeaser.tsx`, `Navbar.tsx`, `Footer.tsx`, untracked `PartnerPitch.tsx`) belonging to the venue-qr session. **If any of those are still dirty: STOP and ask Devon** — restyling those files while another session owns them will corrupt both changes.
- [ ] **0.2** Branch from the settled HEAD (whatever branch carries the committed partner/venue-qr work — likely `feat/venue-qr-pilot` or `main` after merge): `git checkout -b feat/white-on-saffron`
- [ ] **0.3** Refresh the runnable preview copy (dev server HANGS on this iCloud path):
  `rsync -a --delete --exclude node_modules --exclude .next --exclude .git "/Users/devonmakepeace/Desktop/Projects/MAKAN/MakanGit/makan-web/" ~/dev/makan-web-preview/ && cd ~/dev/makan-web-preview && npm install`
- [ ] **0.4** Start dev server from `~/dev/makan-web-preview` ONLY (`./node_modules/.bin/next dev`, expect "Ready" in <2s). After each task below: `cp` the changed files into the preview copy for HMR; edit ONLY the real repo.

## Global class mapping (referenced by every task)

New `brand.*` tokens (Task 1) — old names cease to exist:

| Old class | New class | Notes |
|---|---|---|
| `bg-brand-bg` | `bg-brand-cream` | page/section grounds |
| `text-brand-bg` | context: `text-white` if on saffron-fill pill that STAYS on dark glass; `text-brand-orange` if the pill inverts to white-fill (pills sitting on saffron bands) — see per-task notes | the old dark-text-on-saffron pattern dies |
| `bg-brand-surface` | `bg-brand-card` | white cards; add `border border-brand-line` where the card needs an edge on cream |
| `border-brand-border` / `brand-border` | `border-brand-line` | |
| `text-brand-text` | `text-brand-ink` | |
| `text-brand-dim` | `text-brand-muted` | dim retires |
| `text-white` (on relief sections) | `text-brand-ink` | |
| `text-white` (inside saffron bands, hero glass, espresso footer) | stays `text-white` | display type / inverse grounds only |
| `text-white/NN` opacity variants | on relief → `text-brand-ink/NN` or `text-brand-muted`; on inverse grounds → keep |
| `bg-brand-orange text-brand-bg` (CTA pills on dark/relief) | `bg-brand-orange text-white` | founder rule: text ON saffron = white |
| CTA pills sitting ON a saffron band | `bg-white text-brand-orange` | inverted pill, spec §on-saffron |
| `hover:text-white` | `hover:text-brand-ink` on relief; keep on inverse |
| gradient fades `from-brand-bg` | hero: `from-brand-orange`; elsewhere `from-brand-cream` |

**On-saffron contract (from spec — governs anything the table doesn't):** white display ≥20px semibold only; no paragraph text on saffron; no ink text on saffron; pills invert; saffron eyebrows only on cream and always followed by a full-contrast heading.

---

### Task 1: Token system — `tailwind.config.ts` + `globals.css`

**Files:** Modify `tailwind.config.ts`, `app/globals.css`

- [ ] **1.1** Replace the `colors.brand` block in `tailwind.config.ts`:

```ts
colors: {
  brand: {
    orange: "#FF9932",          // locked — never change
    cream: "#FFF4E6",           // page ground
    ink: "#2B1503",             // body text on cream (14.9:1)
    muted: "#85613F",           // secondary text on cream (5.1:1)
    line: "#F3E2CD",            // hairlines on cream
    card: "#FFFFFF",            // elevated surfaces
    night: "#050505",           // preserved dark — hero ONLY (+ dark-over-imagery)
    espresso: "#241102",        // footer ground
    "espresso-muted": "#C9A985" // footer secondary text (8.2:1)
  },
},
```

- [ ] **1.2** In `app/globals.css` replace the `@layer base` body/selection block and focus style:

```css
@layer base {
  body {
    background-color: #FFF4E6;
    color: #2B1503;
  }

  html {
    scroll-behavior: smooth;
  }

  ::selection {
    background-color: #FF993240;
    color: #2B1503;
  }
}

/* Focus ring: espresso ink reads on cream (14.9:1) AND on saffron (7.3:1).
   Inverse grounds (espresso footer, hero glass) flip it to cream. */
:focus-visible {
  outline: 2px solid #2B1503;
  outline-offset: 2px;
  border-radius: 4px;
}
.inverse-ground :focus-visible,
.inverse-ground:focus-visible {
  outline-color: #FFF4E6;
}
```

  Keep: waterfall keyframes, `perfect-arrive`/`perfect-glint`/`.perfect-shimmer` (glass panel stays dark — shimmer unchanged), `.scrollbar-hide`, reduced-motion block, waterfall hover-pause.

- [ ] **1.3** Verify: `cd ~/dev/makan-web-preview` after cp; site renders cream body with broken (transparent) sections — expected mid-flight state. `npx tsc --noEmit` in the real repo: PASS (colour classes aren't type-checked; this catches accidental syntax damage).
- [ ] **1.4** Commit: `git commit --only tailwind.config.ts --only app/globals.css -m "restyle(tokens): cream-ground brand palette, ink focus ring"`

### Task 2: White logo assets

**Files:** Create `public/makan-wordmark-white.svg`, `public/makan-icon-white.svg`

- [ ] **2.1** `public/makan-wordmark-white.svg` — the clean letterform path extracted from the traced wordmark (primary `#FEA32E` path only, noise paths dropped), filled white:

```svg
<svg viewBox="104 127 304 75" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFFFF" d="M249 132q3.72 2.25 12 1l.5 34 15-17 14.5.5-15 16-3 6 21 24-14.5.5-18-21-.5 21h-11.5l-.5-.5V132ZM119.5 149q13.53-2.17 18.5 3l2.5 4q2.25.75 1.5-1.5 4.46-8.04 19.5-5.5l8.5 5.5q4.49 4.51 5 13v28l-1.5 1.5H163l1-9.5-1-1v-21l-4.5-5.5q-8.31-1.31-10.5 3.5l-1 3V197h-12v-31.5l-4.5-5.5q-8.75-1.75-10.5 3.5l-1 2V197h-10.5l-1.5-1.5v-30q1.27-9.23 7.5-13.5l5-3ZM201.5 149q16.6-2.6 22 6l2-5h10l.5.5V197h-11v-5h-1.5q-5.1 8.4-21 6-8.35-2.15-12.5-8.5-6.72-6.78-5-22 2.75-10.25 10.5-15.5l6-3Zm4.5 11-2 1q-5 3-7 10-1 7 2 11 2 5 10 6l10-2q4-4 6-10l-2-10-6-6h-11ZM313.5 149h12l10.5 6v-5h11q1.88 2.69 1 9.5-3 2-1 9 2.5 1.5 1 7l-1 1v10q3 2 1 9-2.25 3.75-10.5 1.5l-2-5q-5.75 8.25-22 6-7.39-2.11-11.5-7.5-7.5-7.5-5-25l8.5-12.5 8-4Zm3.5 11q-7 4-9 12 0 8 4 12l9 4q8 0 12-4l3-6-1-11q-3-10-18-7ZM379.5 149q16.79-2.29 21.5 7.5l3 8V197h-10.5l-.5-1.5-1-1v-29l-3.5-4.5q-3.17-2.33-10-1l-5.5 4.5-1 3V197h-10.5l-.5-.5V150h11v3.5l2.5-1.5 5-3Z"/></svg>
```

- [ ] **2.2** `public/makan-icon-white.svg` — the M glyph from `makan-icon.svg` (its cream path), filled white on transparent:

```svg
<svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="#FFFFFF" d="M87.5 105h72q10.12 1.37 14.5 8.5L255.5 265l3.5-1.5 75-141 9.5-13.5 8-4 .5 1.5q-4 5-2 16l9.5 15.5 8 5h3.5l-1 12.5q3 12 11.5 18.5 6.85 6.15 20 6l2-1 7 9 13 7H437v204.5q-1.48 8.52-7.5 12.5l-7 3h-60l-9.5-5-5-11.5v-167l-1.5-1.5L287 342.5l-9.5 13.5q-10.21 7.79-31 5-10.25-1.75-15.5-8.5L164.5 230l-.5 170.5-7.5 11.5-7 3h-60q-7.89-2.11-11.5-8.5l-3-8v-280l7.5-11.5 5-2Z"/></svg>
```

- [ ] **2.3** Verify both render: open each file directly in a browser tab against a dark background.
- [ ] **2.4** Commit: `git commit --only public/makan-wordmark-white.svg --only public/makan-icon-white.svg -m "restyle(assets): white wordmark + M-mark for saffron surfaces"`

### Task 3: Navbar → saffron band

**Files:** Modify `components/Navbar.tsx`

- [ ] **3.1** Both scroll states become saffron (mockup shows a solid band):
  - scrolled/mobileOpen: `bg-brand-orange/95 backdrop-blur-md shadow-sm shadow-black/10`
  - top-of-page: `bg-brand-orange`
- [ ] **3.2** Swap logo images to `/makan-icon-white.svg` and `/makan-wordmark-white.svg` (same dimensions).
- [ ] **3.3** Desktop links: `text-brand-muted hover:text-white` → `text-white/90 hover:text-white`. "Get the app" pill (both desktop and mobile): `bg-brand-orange … text-brand-bg` → `bg-white text-brand-orange` (keep radius/padding/shadow classes; hover shadow → `hover:shadow-black/10`).
- [ ] **3.4** Hamburger button: keep `text-white`. Mobile dropdown links: `text-brand-muted hover:bg-brand-surface hover:text-white` → `text-white/90 hover:bg-white/15 hover:text-white`.
- [ ] **3.5** Verify: cp to preview; check top + scrolled + mobile-open states at 375px and desktop. All text/icons on the band are white; pill is white with saffron text.
- [ ] **3.6** Commit: `git commit --only components/Navbar.tsx -m "restyle(nav): saffron band, white logo + links, inverted CTA pill"`

### Task 4: Hero — PRESERVE current dark treatment (Devon, 2026-07-09)

**Files:** Modify `components/Hero.tsx` (token-rename survival only — zero visual change)

- [ ] **4.1** The hero keeps today's look exactly. Only swap dead token classes for the preserved dark token: `from-brand-bg` → `from-brand-night` (both edge fades, lines ~144-145), `bg-brand-bg` → `bg-brand-night` (scroll overlay ~149), `bg-brand-bg/70` → `bg-brand-night/70` (glass panel ~187), `text-brand-bg` → `text-brand-night` (CTA pill label ~215).
- [ ] **4.2** Add `inverse-ground` class to the glass panel div (~187) so focus rings inside it are cream.
- [ ] **4.3** Verify: cp to preview; hero is pixel-identical to production (dark ground, dark fades, glass panel, dark-text saffron pill, shimmer). Note for Devon: the hero pill keeps its dark-on-saffron label per "keep existing hero" — it's now the only non-white-on-saffron pill on the site; flag once at final review, don't change unilaterally.
- [ ] **4.4** Gate: `grep -nE "brand-(bg|surface|border|text|dim)" components/Hero.tsx` → no matches.
- [ ] **4.5** Commit: `git commit --only components/Hero.tsx -m "restyle(hero): preserve dark hero via brand.night token"`

### Task 5: MemoryTest + Manifesto (cream relief)

**Files:** Modify `components/MemoryTest.tsx`, `components/Manifesto.tsx`

- [ ] **5.1** MemoryTest: section `bg-brand-bg` → `bg-brand-cream`. Eyebrow "Try this" stays `text-brand-orange` (decorative anchor — the questions below carry content). Answered questions: `text-brand-muted line-through decoration-brand-orange/50` — keep classes (muted revalues automatically). Live question and remaining text: any `text-white`/`text-brand-text` → `text-brand-ink`. Buttons: keep shape; border → `border-brand-line`, label → `text-brand-ink`; any `bg-brand-surface` → `bg-brand-card`.
- [ ] **5.2** Manifesto: section ground → `bg-brand-cream`; headline `text-white` → `text-brand-ink`; keep saffron emphasis spans; body/sub copy → `text-brand-muted` where it was white-dimmed.
- [ ] **5.3** Verify: cp both; sections read espresso-on-cream, saffron accents intact; per-file gate returns nothing:
  `grep -nE "brand-(bg|surface|border|text|dim)|text-white" components/MemoryTest.tsx components/Manifesto.tsx`
- [ ] **5.4** Commit: `git commit --only components/MemoryTest.tsx --only components/Manifesto.tsx -m "restyle(memory,manifesto): cream relief"`

### Task 6: AppShowcase + LatestOnMakan(+Section) + FounderStory (cream relief)

**Files:** Modify `components/AppShowcase.tsx`, `components/LatestOnMakanSection.tsx`, `components/LatestOnMakan.tsx`, `components/FounderStory.tsx`

- [ ] **6.1** Apply the global mapping to all four (grounds → cream, headings → ink, secondary → muted, cards → card+line, dark fades → `from-brand-cream`). Meal-photo grids in LatestOnMakan keep photo treatment; any dark gradient overlays ON photos stay dark (they sit on imagery, not on cream).
- [ ] **6.2** Verify: cp all; scroll the four sections; per-file gate:
  `grep -nE "brand-(bg|surface|border|text|dim)" components/AppShowcase.tsx components/LatestOnMakan*.tsx components/FounderStory.tsx` → no matches. `text-white` matches allowed ONLY on photo-overlay elements — justify each remaining hit.
- [ ] **6.3** Commit: `git commit --only components/AppShowcase.tsx --only components/LatestOnMakanSection.tsx --only components/LatestOnMakan.tsx --only components/FounderStory.tsx -m "restyle(showcase,latest,founder): cream relief"`

### Task 7: B2BTeaser → saffron band

**Files:** Modify `components/B2BTeaser.tsx` (⚠️ carries partner-WIP edits — restyle classes only, do not touch copy/props/structure)

- [ ] **7.1** Section ground → `bg-brand-orange`. Headline → `text-white` display. Any subline: bump to `text-lg sm:text-xl font-semibold text-white` (≥20px rule) or move onto existing card if the section has one. CTA/link to /partner: `bg-white text-brand-orange` pill (inverted), or if it's a text link: `text-white underline decoration-white/60 font-semibold`.
- [ ] **7.2** Verify: cp; band renders pure saffron with only white type + white pill; no small text on saffron; no ink on saffron. Gate: `grep -nE "brand-(bg|surface|border|text|dim|muted)" components/B2BTeaser.tsx` → no matches (muted included: nothing muted can sit on saffron).
- [ ] **7.3** Commit: `git commit --only components/B2BTeaser.tsx -m "restyle(b2b): saffron conversion band"`

### Task 8: FAQ (cream) + FinalCTA (saffron band)

**Files:** Modify `components/FAQ.tsx`, `components/FinalCTA.tsx`

- [ ] **8.1** FAQ: global mapping (ground cream, questions ink, answers muted, accordion borders line, any surface → card).
- [ ] **8.2** FinalCTA per mockup: section `bg-brand-bg` → `bg-brand-orange`. "Makan is live." stays `text-white`. Subline: merge the two small lines into one ≥20px white line — replace the `text-brand-muted` paragraph classes with `text-xl font-semibold text-white` and change its copy join: `Remember every meal. Free on iPhone — Android is coming next.` — then DELETE the trailing `text-brand-dim` fine-print paragraph (its content just moved up; strictly-white rule forbids it at 12px). This is the plan's only copy-adjacent change and it is spec-mandated.
- [ ] **8.3** Pill: `bg-brand-orange … text-brand-bg` → `bg-white text-brand-orange`; glow span `bg-brand-orange/10` → `bg-white/20`; hover shadow → `hover:shadow-black/15`.
- [ ] **8.4** Verify: cp both; FinalCTA is saffron with white display + white pill only; FAQ reads on cream. Gates as per Task 5 pattern for both files.
- [ ] **8.5** Commit: `git commit --only components/FAQ.tsx --only components/FinalCTA.tsx -m "restyle(faq,final-cta): cream relief + saffron closing band"`

### Task 9: Footer → espresso

**Files:** Modify `components/Footer.tsx` (⚠️ partner-WIP file — classes only)

- [ ] **9.1** Ground → `bg-brand-espresso`, add `inverse-ground` class to the root element. Top border → `border-brand-line/20` or drop. Brand row: white icon (`/makan-icon-white.svg` or `text-white` currentColor SVG) + `text-white`. Link groups: `text-brand-espresso-muted hover:text-white`. Legal/meta line: `text-brand-espresso-muted/80`.
- [ ] **9.2** Verify: cp; footer deep espresso, links readable (8.2:1), focus rings cream. Gate: `grep -nE "brand-(bg|surface|border|text|dim)" components/Footer.tsx` → none.
- [ ] **9.3** Commit: `git commit --only components/Footer.tsx -m "restyle(footer): espresso ground"`

### Task 10: Homepage checkpoint

- [ ] **10.1** Full-page pass in preview at desktop (1280) and 375px: saffron rhythm reads nav→hero SAFFRON / memory→founder CREAM / b2b SAFFRON / faq CREAM / cta SAFFRON / footer ESPRESSO. No transparent/unstyled patches.
- [ ] **10.2** Screenshot both widths for Devon (headless Chrome one-at-a-time if preview MCP unavailable: `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot=<out> --window-size=1280,4000 http://localhost:3000`).
- [ ] **10.3** `npx tsc --noEmit` → PASS. Commit any stragglers found.

### Task 11: Manifesto page

**Files:** Modify `app/manifesto/page.tsx` (26 colour usages)

- [ ] **11.1** Apply global mapping. Long-form manifesto text: ink on cream; pull-quote/emphasis lines keep saffron only at display sizes; any full-bleed dark blocks become cream or (if the page has a closing CTA block) saffron-band treatment per the on-saffron contract.
- [ ] **11.2** Verify: cp; read the whole page; gate grep (Task 5 pattern). Commit: `git commit --only app/manifesto/page.tsx -m "restyle(manifesto): cream relief"`

### Task 12: Story page

**Files:** Modify `app/story/page.tsx` (14 usages; `components/story/StorySchema.tsx` is JSON-LD — no colours, untouched)

- [ ] **12.1** Global mapping; press-boilerplate cards → `bg-brand-card border-brand-line`.
- [ ] **12.2** Verify + gate + commit: `git commit --only app/story/page.tsx -m "restyle(story): cream relief"`

### Task 13: Blog index + article + gallery

**Files:** Modify `app/blog/page.tsx`, `components/blog/ReviewArticle.tsx` (35 usages), `components/blog/MealGallery.tsx` (lightbox). `ReviewSchema.tsx` untouched.

- [ ] **13.1** Index cards: `bg-brand-card border-brand-line`, titles ink, meta muted.
- [ ] **13.2** ReviewArticle: reading ground cream; prose ink/muted; block markers (quickFacts/bill/meals/faq/cta) → white cards with line borders; saffron kept for links/accents and the cta block may go full saffron-band (white display + inverted pill) per contract.
- [ ] **13.3** MealGallery lightbox: backdrop stays dark (`bg-black/90` class of dark-over-photo is correct on imagery) + `inverse-ground`; close/caption controls stay white.
- [ ] **13.4** Verify on `/blog` and `/blog/kendal-street-kitchen`; gates; commit: `git commit --only app/blog/page.tsx --only components/blog/ReviewArticle.tsx --only components/blog/MealGallery.tsx -m "restyle(blog): cream reading surface"`

### Task 14: Partner page trio

**Files:** Modify `app/partner/page.tsx`, `app/partner/PartnerPitch.tsx` (51 usages), `app/partner/PartnerForm.tsx` (22) — ⚠️ all partner-WIP files: restyle classes only; if content conflicts appear, STOP and ask Devon.

- [ ] **14.1** Global mapping throughout; form inputs: `bg-brand-card border-brand-line text-brand-ink placeholder:text-brand-muted focus:border-brand-orange`; submit button `bg-brand-orange text-white`; any hero/CTA banded sections follow the contract.
- [ ] **14.2** Verify `/partner` incl. form focus/filled/error states; gates; commit: `git commit --only app/partner/page.tsx --only app/partner/PartnerPitch.tsx --only app/partner/PartnerForm.tsx -m "restyle(partner): cream relief + saffron bands"`

### Task 15: Contact, /app landing, /meal, /r/[place], 404

**Files:** Modify `app/contact/page.tsx`, `app/contact/ContactForm.tsx` (15), `app/app/AppLanding.tsx` (4), `app/meal/[id]/page.tsx` (1), `app/r/[place]/page.tsx` (7), `app/not-found.tsx` (5)

- [ ] **15.1** Global mapping. ContactForm: same input recipe as 14.1. AppLanding + /r/[place] are conversion landers — treat as saffron-band pages if currently dark-hero-style, cream otherwise; App Store badge/pill inverts if on saffron. 404: cream, ink headline, saffron link.
- [ ] **15.2** Verify each route renders; gates; commit: `git commit --only app/contact/page.tsx --only app/contact/ContactForm.tsx --only app/app/AppLanding.tsx --only "app/meal/[id]/page.tsx" --only "app/r/[place]/page.tsx" --only app/not-found.tsx -m "restyle(contact,app,meal,r,404): cream relief"`

### Task 16: Legal pages

**Files:** Modify `app/privacy-policy/page.tsx` (40 usages), `app/tos/page.tsx` (29)

- [ ] **16.1** Mechanical: `text-brand-text` → `text-brand-ink` (53 of the 69 hits), grounds → cream, headings ink, muted stays. Long-form legal must be maximally readable: NO saffron bands here.
- [ ] **16.2** Verify both routes; gates; commit: `git commit --only app/privacy-policy/page.tsx --only app/tos/page.tsx -m "restyle(legal): ink on cream"`

### Task 17: OG image + layout metadata

**Files:** Modify `app/opengraph-image.tsx`, `app/layout.tsx`

- [ ] **17.1** opengraph-image.tsx: `background: '#F1F6F4'` → `'#FFF4E6'`; `color: '#11181C'` → `'#2B1503'`; `color: '#477681'` → `'#85613F'`; keep icon fills (`#FCA445`/`#FBF3DC`) and the `#FF9932` pill — but pill text must be white if it isn't.
- [ ] **17.2** layout.tsx: add `export const viewport: Viewport = { themeColor: '#FF9932' }` (import `Viewport` type from `next`) so mobile browser chrome matches the nav band.
- [ ] **17.3** Verify: hit `/opengraph-image` in the preview browser — renders cream card, espresso text. Commit: `git commit --only app/opengraph-image.tsx --only app/layout.tsx -m "restyle(og,meta): cream OG card + saffron theme-color"`

### Task 18: Global gates (release gate — all must pass)

- [ ] **18.1** Dead-token sweep — MUST return zero lines:
  `grep -rnE "brand-(bg|surface|border|text|dim)" app components --include="*.tsx"`
- [ ] **18.2** Dark-on-saffron sweep — MUST return zero lines (the old CTA pattern):
  `grep -rn "bg-brand-orange" app components --include="*.tsx" | grep -E "text-brand-(ink|espresso|cream|muted)"`
- [ ] **18.3** `npx tsc --noEmit` → clean.
- [ ] **18.4** Route matrix in preview — every route × {1280px, 375px}: `/`, `/manifesto`, `/story`, `/blog`, `/blog/kendal-street-kitchen`, `/partner`, `/contact`, `/app`, `/r/<any-slug>`, `/tos`, `/privacy-policy`, `/nonexistent` (404). No dark-theme remnants, no unstyled patches, no small text on saffron anywhere.
- [ ] **18.5** Reduced-motion pass on `/` (waterfall frozen, shimmer plain white). Keyboard-tab pass on `/` and `/partner` (focus rings visible on cream, saffron, espresso).
- [ ] **18.6** Screenshot set for Devon: homepage full-scroll both widths + one of each saffron band + footer.
- [ ] **18.7** Final commit of any gate fixes. **Devon reviews screenshots and pushes** — the agent never deploys (`git push` requires Devon's gh credential anyway).

## Orphaned components (out of scope)

`BrandPillars.tsx`, `FeatureTabs.tsx`, `Refusals.tsx`, `StatTicker.tsx` are imported by nothing — do NOT restyle them; a separate cleanup task exists to delete them. If Task 18.1's sweep flags matches inside these four files only, that is acceptable — note it and move on.

---

## Phase 2 — Motion layer (executed 2026-07-09, same branch)

Approved verbally ("do it all now"); micro-interactions group explicitly vetoed ("dont do 9").

| Item | Status | Where |
|---|---|---|
| Lenis smooth scroll (reduced-motion aware) | ✅ | `components/motion/SmoothScroll.tsx`, wired in `app/layout.tsx` |
| View transitions (page crossfade) | ✅ | `next-view-transitions` — layout wrapper + Link in Navbar/Footer |
| Hide-on-scroll navbar | ✅ | `components/Navbar.tsx` |
| Vaul bottom drawer (mobile menu) | ✅ | `components/Navbar.tsx` |
| Sticky-scroll app story (desktop) | ✅ | `components/AppShowcase.tsx` — N×100vh track, pinned phone, scroll-swapped screens, progress dots; stacked layout kept on <lg |
| Meal snap-carousel + arrows | ✅ | `components/LatestOnMakan.tsx` (desktop; mobile strip kept) |
| Focus-blur siblings + hover tilt | ✅ | `.meal-carousel`/`.meal-card` in `globals.css` + whileHover |
| Lens zoom in blog lightbox | ✅ | `components/blog/MealGallery.tsx` (cursor-origin scale 1.8) |
| Stateful buttons / ticker / marquee / FAQ motion / scroll progress | ❌ vetoed | Devon: "dont do 9" (StatTicker count-up already existed) |
| Partner testimonials | ⏭ skipped | No real partner quotes exist — structure without content would mean fabricating; needs Devon's Cellar Door / FIIK quotes first |
| Progressive blur photo edges | ⏭ skipped | Marginal texture; carousel blur covers the effect |
