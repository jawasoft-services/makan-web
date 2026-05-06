# Responsive Optimisation — All Devices

## Problem
The site was designed desktop-first. Nearly every section uses `px-8` (32px padding)
and large font sizes with only `lg:` (1024px) breakpoints. On a 375px mobile screen,
64px of padding consumes 17% of width. On tablets (768px), layouts jump awkwardly from
stacked-mobile to full-desktop at the `lg:` threshold with no intermediate state.

## Breakpoint Strategy (Tailwind defaults)
- **Mobile** (< 640px): Reduce padding, scale fonts down, tighten gaps
- **Tablet** `sm:` (640px) / `md:` (768px): Add intermediate layouts where needed
- **Desktop** `lg:` (1024px+): Already designed for — minimal changes

## Approach
Pure Tailwind class adjustments. No structural changes, no new components, no JS changes.
Touch only what affects rendering at different viewports.

---

## Phase 1: Layout & Global
- [ ] Add explicit `viewport` export to `layout.tsx` (best practice for max-scale control)
- [ ] Reduce Navbar padding: `px-5 sm:px-8`, `py-4 sm:py-5`; adjust CTA button padding for small screens

## Phase 2: Hero Section
- [ ] Scale H1: `text-3xl sm:text-5xl lg:text-7xl`
- [ ] Scale description: `text-base sm:text-lg`
- [ ] Reduce container padding: `px-5 sm:px-8`
- [ ] Add tablet card width: `w-72 sm:w-80 lg:w-[32rem]`
- [ ] Reduce button padding and gap for mobile
- [ ] Reduce hero height on mobile: `h-[160vh] sm:h-[200vh]`

## Phase 3: Features Section
- [ ] Reduce padding: `py-16 sm:py-28 lg:py-36`, `px-5 sm:px-8`
- [ ] Scale heading: `text-2xl sm:text-3xl lg:text-4xl`
- [ ] Reduce feature row padding: `py-6 sm:py-10`
- [ ] Add tablet grid: `md:grid-cols-12` (stacked on mobile, side-by-side on tablet+)
- [ ] Reduce mt-16 to mt-10 on mobile

## Phase 4: LatestOnMakan Section
- [ ] Reduce padding: `py-16 sm:py-28 lg:py-36`, `px-5 sm:px-8`
- [ ] Scale heading: `text-3xl sm:text-4xl lg:text-5xl`
- [ ] Add tablet grid column: `md:grid-cols-3` (2 cols mobile, 3 cols tablet+)
- [ ] Tighten gap: `gap-3 sm:gap-5`
- [ ] Reduce mt-14 to mt-10 on mobile

## Phase 5: BrandStory Section
- [ ] Reduce padding: `py-16 sm:py-28 lg:py-36`, `px-5 sm:px-8`
- [ ] Scale heading: `text-2xl sm:text-4xl lg:text-6xl`
- [ ] Scale body text: `text-base sm:text-lg`
- [ ] Add tablet grid: `md:grid-cols-3`
- [ ] Tighten pillar gap: `gap-8 md:gap-10 lg:gap-12`
- [ ] Reduce mt-16 to mt-10 on mobile
- [ ] Scale decorative quote mark for mobile

## Phase 6: FAQ Section
- [ ] Reduce padding: `py-16 sm:py-28 lg:py-36`, `px-5 sm:px-8`
- [ ] Add tablet layout: `md:grid-cols-12` (stacked on mobile, side-by-side on tablet+)
- [ ] Tighten grid gap: `gap-8 md:gap-12`
- [ ] Scale heading: `text-2xl sm:text-3xl lg:text-4xl`

## Phase 7: DownloadCTA Section
- [ ] Reduce padding: `py-16 sm:py-28 lg:py-36`, `px-5 sm:px-8`
- [ ] Scale heading: `text-3xl sm:text-4xl lg:text-6xl`
- [ ] Scale body/quote text: `text-base sm:text-lg`
- [ ] Constrain decorative glow on mobile: smaller size + less offset

## Phase 8: Footer
- [ ] Reduce padding: `px-5 sm:px-8`
- [ ] Tighten gap: `gap-8 sm:gap-12 lg:gap-20`

## Phase 9: Secondary Pages
- [ ] Contact page: reduce padding `px-5 sm:px-8`
- [ ] Privacy/ToS: scale H1 `text-3xl sm:text-4xl`, reduce padding `px-5 sm:px-8`, `pt-24 sm:pt-32`
- [ ] 404 page: scale H1, reduce body text
- [ ] MealDisplay: reduce button padding for mobile

## Phase 10: Verification
- [ ] `next build` passes
- [ ] Visual check at 375px (mobile)
- [ ] Visual check at 768px (tablet)
- [ ] Visual check at 1280px (desktop — no regressions)
