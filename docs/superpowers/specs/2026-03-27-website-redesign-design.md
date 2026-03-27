# Makan Website Redesign — Design Spec

## Overview

Redesign the Makan marketing website from a warm, light-themed landing page to a dark, cinematic, air.inc-inspired beta waitlist experience. The site's purpose is to build anticipation, tell the Makan story, and drive "Request a Seat" signups.

**Scope:** Single-page redesign of makanofficial.com. No new routes, no auth, no admin. Existing `/contact`, `/privacy-policy`, `/tos`, and `/meal/[id]` routes remain unchanged.

**Inspiration:** air.inc — dark backgrounds, ambient motion, tabbed feature showcase, branded CTA language, generous spacing.

---

## Visual direction

### Palette

| Token | Value | Usage |
|-------|-------|-------|
| `background` | `#050505` | Page base |
| `surface` | `#0f0f0f` | Cards, tab content areas, elevated containers |
| `border` | `#1a1a1a` | Subtle dividers, card borders |
| `accent` | `#FF9932` | CTAs, tab indicators, numbered elements, italic emphasis |
| `text-primary` | `#FFFFFF` | Headlines, primary copy |
| `text-muted` | `#888888` | Descriptions, secondary copy |
| `text-dim` | `#555555` | Tertiary labels, scroll indicators |

Orange accent used sparingly — CTAs, active tab pills, numbered brand pillars, and italic emphasis words only. Food photos provide all other color.

### Typography

Font: Plus Jakarta Sans (already installed, no change).

| Role | Weight | Size range | Notes |
|------|--------|------------|-------|
| Hero word ("makan") | 800 | 56px desktop, 40px mobile | Tight letter-spacing (-2px) |
| Section headings | 600 | 20-24px | Natural tracking |
| Body copy | 400 | 13-14px | Line-height 1.6 |
| Italic accent | 400 italic | Matches context | On key emphasis words, orange color |
| Labels/captions | 400 | 10-11px | Uppercase, letter-spacing 2-3px, muted color |

### Motion

Three categories, all using Framer Motion (already a dependency):

1. **Scroll reveal (hero):** Food photos from the Firebase meal gallery cascade in from edges as the user scrolls. The word "makan" stays centered via sticky positioning. Photos have slight parallax depth (different scroll speeds). At full scroll, the manifesto fades in.

2. **Ambient motion (feature tabs):** Auto-rotate through 5 tabs on ~8 second intervals. Smooth crossfade between tab content (app screen recordings or animated mockups). Users can click tabs to override auto-rotation. Timer resets on manual interaction.

3. **Micro-interactions:** CTA hover glow (orange spread shadow). Meal card hover lift (translateY -4px, subtle shadow). FAQ accordion spring animation. Navbar backdrop blur on scroll (already exists, keep).

No scroll-jacking. No parallax outside the hero section. Motion serves content discovery.

### Grain texture

Remove the current SVG fractal noise grain overlay. The dark theme doesn't need it — food photography provides texture. Cleaner without it.

---

## Page sections

8 sections in order. Navbar is persistent.

### Navbar (persistent)

Sticky header. Transparent on load, gains `background: rgba(5,5,5,0.9)` + `backdrop-filter: blur(8px)` on scroll (similar to current behavior).

**Left:** "makan" wordmark (16px, weight 700, white).
**Right:** Text links (Story, Features, FAQ) in muted color + "Request a Seat" orange pill button.

Mobile: Hamburger menu or simplified nav with just the CTA.

### Section 1 — Hero (scroll reveal)

Full viewport height (100vh), sticky positioning.

**Initial state:** Centered on screen:
- "makan" in 56px/800 weight
- "/mah·kahn/ — to eat" in 16px italic, orange
- Subtle down-arrow scroll indicator

**On scroll:** Real food photos (sourced from the existing Firebase meal gallery, same as current LatestOnMakan component) cascade in from edges. Staggered entrance with Framer Motion. Photos positioned at varying depths (parallax). The "makan" text stays fixed center as photos build a mosaic behind it.

**At full scroll extent:** Photos settle, manifesto text fades in below, hero section unsticks and scrolls away naturally.

### Section 2 — Manifesto

Centered text block on dark background.

**Copy:**
> A food journal where your friends' *real meals* replace algorithms and influencers.
>
> No filters. No star ratings. No calorie counts.

"real meals" in orange italic.

Below: "Request a Seat" orange button.
Below button: "38 languages. Yes, already." in dim text.

### Section 3 — Feature tabs (auto-rotating)

**Header:** "How it works" (20px, 600 weight, centered).

**Tab bar:** 5 horizontal pills. Active tab: orange background, dark text. Inactive: dark surface background, muted text. Pills are clickable. Auto-rotation on ~8s interval with a subtle progress indicator (thin orange line under active tab that fills over 8s).

**Tab content:** Left side has headline + description text. Right side has a phone mockup frame (rounded rectangle, dark border) containing the app screen recording or animated mockup for that tab.

**Tab copy (humanized):**

| Tab | Headline | Description |
|-----|----------|-------------|
| Feed | Two feeds. Your choice. | One for friends, one for everyone else. |
| Share Cards | Makan cards. | Share a meal and it goes out as a Makan card — Stories, WhatsApp, wherever. |
| Explore & Map | See where your friends ate. | Discover where they haven't. Friend avatars on every pin. |
| Streaks & Titles | From Curious Eater to Local Legend. | Post daily, earn titles, collect 100 badges. |
| Food Journal | Your food diary. | Every meal, every day, on a calendar that doesn't look like a spreadsheet. |

**App recordings:** These need to be created separately (screen recordings of the actual app, or animated mockups). For initial implementation, use static app screenshots as placeholders. The component should accept video or image sources.

### Section 4 — Latest on Makan (live meals)

**Header:** "Latest on Makan" (20px, 600 weight, centered).
**Subheader:** "Meals from beta users right now." (muted text).

Grid of 6 meal cards (3x2 on desktop, 2x3 on tablet, 1-col stack on mobile). Each card shows the meal photo with a dark overlay gradient at bottom containing username, meal name, and a reaction emoji.

**Data source:** Existing Firebase integration. The current `LatestOnMakan` component already fetches from Firestore. Retain this logic, restyle the cards for dark theme.

Hover: card lifts slightly (translateY -4px), subtle orange border glow.

### Section 5 — Brand pillars

**Header:** "What we believe" (20px, 600 weight, centered).

Three cards in a row (stack on mobile). Each card: dark surface background, subtle border, centered content.

| # | Pillar name | Copy |
|---|-------------|------|
| 01 | No audience required | Your meal doesn't need likes to be worth sharing. |
| 02 | Ordinary is the point | The best food stories aren't from restaurants. They're from your kitchen at 11pm. |
| 03 | No algorithm required | Find places through what your friends actually ate. Not what an algorithm thinks you'll click. |

Numbers in orange, 28px, 700 weight. Pillar names in white, 14px, 600 weight. Copy in muted, 12px.

### Section 6 — FAQ

Two-column layout on desktop (heading left, accordion right). Single column on mobile.

**Left:** "Questions?" (18px, 600 weight) + "The stuff people ask us." (muted).

**Right:** Accordion with spring animation on open/close. Items separated by subtle border-bottom. "+" icon rotates to "×" on open.

Retain existing FAQ content from the current site. Restyle for dark theme.

### Section 7 — B2B teaser

Slightly different background shade (`#0a0808` or similar) to visually separate from surrounding sections.

**Copy (centered):**
> Own a restaurant?
>
> We're building something for you too. Get early access.

"Tell me more →" button in orange outline style (transparent fill, orange border + text). Links to the existing `/contact` page.

### Section 8 — Final CTA + footer

**CTA block:**
> Join the table.
>
> We're letting people in slowly. Request your seat.

"Request a Seat" orange button.

**Founder quote below:**
> "Makan started as a Snapchat story shared between our closest friends. Over six years and thousands of meals later, we realised we'd built a habit worth keeping — so we built an app around it."
>
> — Devon Makepeace, Founder of Makan, London

Quote in dim italic text. Attribution in muted text.

**Footer:** Horizontal bar with subtle top border.
- Left: "© 2026 Makan · London, UK"
- Right: Privacy, Terms, Instagram, TikTok links

---

## Technical approach

### What stays

- Next.js 16 App Router (no framework change)
- Tailwind CSS v4 (retheme, don't replace)
- Framer Motion (already installed, extend usage)
- Firebase Admin SDK for meal data
- Resend + Google Sheets for contact form
- Vercel Analytics
- All non-homepage routes (`/contact`, `/privacy-policy`, `/tos`, `/meal/[id]`)
- SEO setup (metadata, OG images, sitemap, robots)

### What changes

- **Tailwind config:** Replace current brand colors with new dark palette tokens. Keep Plus Jakarta Sans.
- **globals.css:** Remove grain texture SVG filter. Update background to `#050505`. Update selection color for dark theme.
- **Component rewrites:** Hero, Features, LatestOnMakan, BrandStory, FAQ, DownloadCTA, Footer, Navbar all get rewritten for dark theme and new layout.
- **New component:** FeatureTabs (auto-rotating tabbed interface with progress indicator).
- **New section:** B2B teaser (simple, no backend needed — links to existing `/contact`).
- **Hero animation:** New scroll-driven photo cascade using Framer Motion scroll progress + sticky positioning.

### Component architecture

```
app/page.tsx          — Section composition (same pattern as current)
components/
  Navbar.tsx          — Restyle for dark, keep sticky behavior
  Hero.tsx            — Full rewrite: scroll-reveal with photo cascade
  Manifesto.tsx       — New component (simple centered text block)
  FeatureTabs.tsx     — New component: auto-rotating tabs with recordings
  LatestOnMakan.tsx   — Restyle cards for dark theme, keep Firebase logic
  BrandPillars.tsx    — Rename from BrandStory, new 3-card layout
  FAQ.tsx             — Restyle for dark, keep accordion logic
  B2BTeaser.tsx       — New component (static, links to /contact)
  FinalCTA.tsx        — Rename from DownloadCTA, new copy + founder quote
  Footer.tsx          — Restyle for dark, simplified layout
```

### App recordings / screen captures

The feature tabs need visual content for each tab. Options in order of preference:

1. **Screen recordings** of the actual app (best, requires creating 5 short clips)
2. **Animated mockups** built with Framer Motion showing UI transitions
3. **Static screenshots** of the app (acceptable placeholder for initial build)

The FeatureTabs component should accept either video (`<video>` with autoplay/muted/loop) or image sources, so content can be upgraded without code changes.

### Responsive breakpoints

Keep existing Tailwind breakpoints: `sm` (640px), `md` (768px), `lg` (1024px).

Key responsive behaviors:
- Hero: phone mockup in feature tabs hidden below `md`. Photo cascade reduces count on mobile.
- Feature tabs: pills wrap to 2 rows on mobile. Content stacks vertically (text above, mockup below).
- Brand pillars: 3-col → 1-col stack on mobile.
- FAQ: 2-col → 1-col on mobile.
- Latest on Makan: 3-col → 2-col → 1-col.
- Navbar: collapse links to hamburger below `md`, keep CTA visible.

### Performance

- Food photos from Firebase already use optimized URLs. Run through `next/image` for automatic optimization.
- App screen recordings: compress to WebM/MP4, keep under 2MB each. Use `poster` attribute for instant visual.
- Feature tab rotation: pause when tab is not in viewport (Intersection Observer) to save resources.
- Hero scroll animation: use `useScroll` + `useTransform` from Framer Motion (GPU-accelerated transforms only, no layout thrash).

---

## What this spec does NOT cover

- New routes or pages
- Authentication or user accounts
- Blog or CMS integration
- Full B2B landing page (the teaser links to existing `/contact`)
- App Store / Google Play download links (beta is invite-only via "Request a Seat")
- Content creation for app screen recordings (separate task)
- Mobile app changes
