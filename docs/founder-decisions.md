# MAKAN founder decisions

These decisions are product constraints. They remain in force until Devon
explicitly replaces them.

## FD-001 — White on saffron

- **Owner:** Devon Makepeace
- **Original decision:** 15 June 2026
- **Website direction approved:** 9 July 2026
- **Reaffirmed and locked:** 23 July 2026
- **Status:** Active

Text and icons placed directly on MAKAN saffron (`#FF9932`) are white. Dark
espresso, muted, dim, or black text must never sit directly on the solid
saffron surface.

Controls and content panels that sit inside a saffron band invert: use a white
surface with saffron text for controls, or a white/cream surface with accessible
espresso text for body copy. Small paragraph copy does not sit directly on
saffron.

This rule applies to the navigation, saffron conversion bands, saffron meal
cards, buttons, and any future solid-saffron component. The brand saffron
remains exactly `#FF9932`.

Enforcement:

- Project instructions: `AGENTS.md`
- Approved design specification:
  `docs/superpowers/specs/2026-07-09-white-on-saffron-redesign-design.md`
- Automated check: `npm run check:founder-decisions` (also runs during lint)
- Locked-surface manifest: `docs/founder-decisions.locked-surfaces.json`
  (rename a locked component and update this file in the same commit)

Only an explicit new founder decision from Devon can supersede FD-001.
