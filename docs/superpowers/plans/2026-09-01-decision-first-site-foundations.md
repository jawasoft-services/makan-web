# Decision-First Site — Foundations, Hero and Ladder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unblock the two lint guards that would fail a from-scratch rebuild, land the paper/colour design system, and build the two designed sections — the hero diptych and the evidence ladder — behind the deploy gate.

**Architecture:** Three layers, built bottom-up. `PaperSheet` renders the four CSS-only paper layers and is the ground every section sits on. `MenuSheet`/`MenuItem` render printed-menu typography. `AnswerCard` renders Makan's voice with a six-value evidence level taken verbatim from RM19665. The hero and ladder compose those three. Nothing here changes an existing route or homepage section — new components plus a dev-only harness route that 404s in production, assembled on a branch that is not deployed.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS 4, next-intl 4, TypeScript 5. No test runner exists in this repo; the verification cycle is `npm run lint` (eslint + two custom guards), `npm run build`, and browser assertions via the preview tools.

## Global Constraints

- **Do not deploy.** This branch must not merge to `main` until the §2 release condition in `docs/superpowers/specs/2026-09-01-decision-first-website-design.md` is met. `main` auto-deploys to makanofficial.com.
- **Saffron is exactly `#FF9932`** and never changes. FD-001 remains in force.
- **Saffron may carry emphasis, never sole meaning.** Every saffron string must have its meaning repeated in ink adjacent to it. Anything a reader must be able to read is ink (`#2B1503`).
- **Never introduce a token containing `brand-orange-ink`** — `check-founder-decisions.mjs` fails the build on it.
- **Plus Jakarta Sans only.** No second typeface, no webfont additions.
- **No image assets for texture.** Paper is inline SVG filters only. Text stays real DOM text.
- **`messages/en.json` and `messages/id.json` stay key-for-key.** Every new string lands in both.
- **Author identity:** commit as the configured author. Never `-c user.email`.
- **Branch:** all work lands on `docs/decision-first-site-rebuild` (already exists, based on `origin/main`).

---

## File Structure

| File | Responsibility |
| --- | --- |
| `scripts/check-founder-decisions.mjs` | *Modify.* Read locked surfaces from a manifest instead of hard-coded filenames |
| `docs/founder-decisions.locked-surfaces.json` | *Create.* The manifest — surface path → required class strings |
| `scripts/check-i18n.mjs` | *Modify.* Assert a product term is preserved only when English still uses it |
| `tailwind.config.ts` | *Modify.* `brand.muted` → `#785739` |
| `app/globals.css` | *Modify.* Paper layer classes and the ring draw keyframes |
| `components/paper/PaperSheet.tsx` | *Create.* The four paper layers + optional centre fold |
| `components/menu/MenuItem.tsx` | *Create.* One printed menu line: name, diet markers, description, price |
| `components/menu/MenuSheet.tsx` | *Create.* House name, section heads, items, the `++` legal line |
| `components/decision/evidence.ts` | *Create.* `DecisionEvidenceLevel` type + the saffron mark form per level |
| `components/decision/AnswerCard.tsx` | *Create.* Makan's voice — mark, dish, reason, optional note |
| `components/decision/HandRing.tsx` | *Create.* The two-lap displaced SVG ring |
| `components/home/HeroDiptych.tsx` | *Create.* Movement 1 — the open spread |
| `components/home/EvidenceLadder.tsx` | *Create.* Movement 4 — five levels + fallback |
| `messages/en.json`, `messages/id.json` | *Modify.* `Decision.Hero` and `Decision.Ladder` namespaces |

**Out of scope for this plan.** Movements 2, 3, 5, 6, 7 and 8 in the spec's page map are named but **not yet designed** — there are no approved compositions or copy for them. Writing tasks for them would mean inventing content. They need a design pass before they can be planned.

---

## Task 1: Make the founder-decision guard data-driven

`check-founder-decisions.mjs` hard-codes four component filenames. Renaming or replacing any of them fails `npm run lint`, which fails `next build`. The *rule* is correct and stays; the *guard* must stop depending on filenames that a rebuild will change.

**Files:**
- Create: `docs/founder-decisions.locked-surfaces.json`
- Modify: `scripts/check-founder-decisions.mjs:60-86`

**Interfaces:**
- Consumes: nothing.
- Produces: a manifest at `docs/founder-decisions.locked-surfaces.json` with shape `Array<{ file: string, required: string[] }>`. Any later task that renames a locked surface updates this file in the same commit.

- [ ] **Step 1: Write the failing check**

Create `scripts/__fixtures__/locked-surfaces.missing.json`:

```json
[
  { "file": "components/DoesNotExist.tsx", "required": ["text-white"] }
]
```

- [ ] **Step 2: Run the guard against the fixture to verify it fails cleanly**

```bash
cd ~/dev/makan-web-saffron
LOCKED_SURFACES=scripts/__fixtures__/locked-surfaces.missing.json node scripts/check-founder-decisions.mjs; echo "exit=$?"
```

Expected before the change: `FD-001 passed` and `exit=0` — the guard ignores the fixture entirely, because nothing reads `LOCKED_SURFACES` yet. That silent pass IS the failing test: it proves the guard is coupled to hard-coded filenames rather than to a declared contract.
Expected after Step 3: `FD-001 failed` listing `components/DoesNotExist.tsx is declared in the locked-surface manifest but does not exist`, `exit=1`.

- [ ] **Step 3: Replace the hard-coded list with the manifest**

Create `docs/founder-decisions.locked-surfaces.json`:

```json
[
  { "file": "components/Navbar.tsx", "required": ["text-white/90", "text-white", "bg-white"] },
  { "file": "components/B2BTeaser.tsx", "required": ["text-white", "bg-white"] },
  { "file": "components/LatestOnMakan.tsx", "required": ["bg-brand-orange text-white"] },
  { "file": "components/FinalCTA.tsx", "required": ["text-white", "bg-white"] }
]
```

In `scripts/check-founder-decisions.mjs`, replace the `lockedSurfaceChecks` array and the loop that follows it with:

```js
const manifestPath =
  process.env.LOCKED_SURFACES ?? 'docs/founder-decisions.locked-surfaces.json'
const lockedSurfaceChecks = JSON.parse(
  await readFile(join(projectRoot, manifestPath), 'utf8'),
)

for (const check of lockedSurfaceChecks) {
  let source
  try {
    source = await readFile(join(projectRoot, check.file), 'utf8')
  } catch {
    failures.push(
      `${check.file} is declared in the locked-surface manifest but does not exist. ` +
        `If it was renamed, update ${manifestPath} in the same commit.`,
    )
    continue
  }
  for (const required of check.required) {
    if (!source.includes(required)) {
      failures.push(`${check.file} must preserve the founder colour contract: ${required}`)
    }
  }
}
```

- [ ] **Step 4: Verify the fixture now fails readably and the real manifest passes**

```bash
LOCKED_SURFACES=scripts/__fixtures__/locked-surfaces.missing.json node scripts/check-founder-decisions.mjs; echo "exit=$?"
```
Expected: `FD-001 failed`, the "declared in the locked-surface manifest but does not exist" line, `exit=1`.

```bash
node scripts/check-founder-decisions.mjs; echo "exit=$?"
```
Expected: `FD-001 passed — solid saffron surfaces preserve the founder colour contract.`, `exit=0`.

- [ ] **Step 5: Record the manifest in the founder-decisions doc**

Append to `docs/founder-decisions.md`, under FD-001's `Enforcement:` list:

```markdown
- Locked-surface manifest: `docs/founder-decisions.locked-surfaces.json`
  (rename a locked component and update this file in the same commit)
```

- [ ] **Step 6: Commit**

```bash
git add scripts/check-founder-decisions.mjs docs/founder-decisions.locked-surfaces.json \
        docs/founder-decisions.md scripts/__fixtures__/locked-surfaces.missing.json
git commit -m "chore(guards): read FD-001 locked surfaces from a manifest

The guard hard-coded four component filenames, so any rename failed lint
and therefore the build. The rule is unchanged; only the coupling moves."
```

---

## Task 2: Make the i18n product-term guard conditional

`check-i18n.mjs` requires `messages/id.json` to contain the literals `Eat or Yeet`, `Top 4`, `Public` and `Friends Only`. The intent is "never translate a product term." As written it also means "never retire a product term" — so removing diary-frame copy fails lint. Assert the term only when English still uses it.

**Files:**
- Modify: `scripts/check-i18n.mjs:32-42`

**Interfaces:**
- Consumes: nothing.
- Produces: unchanged CLI contract — `node scripts/check-i18n.mjs`, exit 0 on pass.

- [ ] **Step 1: Reproduce the failure**

```bash
cd ~/dev/makan-web-saffron
cp messages/en.json /tmp/en.backup.json && cp messages/id.json /tmp/id.backup.json
node -e '
const fs=require("fs");
for (const f of ["messages/en.json","messages/id.json"]) {
  const s=fs.readFileSync(f,"utf8").replaceAll("Top 4","your ranking");
  fs.writeFileSync(f,s);
}'
node scripts/check-i18n.mjs; echo "exit=$?"
```

Expected: `Indonesian copy must preserve product term: Top 4`, `exit=1` — even though English no longer uses the term either.

- [ ] **Step 2: Make the assertion conditional**

In `scripts/check-i18n.mjs`, replace the existing `const indonesianSource = JSON.stringify(indonesian)` line **and** the product-term loop that follows it with (the replacement re-declares both consts — leaving the original in place is a duplicate-declaration SyntaxError):

```js
const englishSource = JSON.stringify(english)
const indonesianSource = JSON.stringify(indonesian)
for (const productTerm of [
  "Eat or Yeet",
  "Top 4",
  "Public",
  "Friends Only",
]) {
  // The rule is "never translate a product term we use" — not "never retire
  // one". Only assert preservation while the English catalogue still uses it.
  if (!englishSource.includes(productTerm)) continue
  if (!indonesianSource.includes(productTerm)) {
    console.error(`Indonesian copy must preserve product term: ${productTerm}`)
    process.exit(1)
  }
}
```

- [ ] **Step 3: Verify the retirement case passes and the translation case still fails**

```bash
node scripts/check-i18n.mjs; echo "exit=$?"
```
Expected: `i18n passed — <N> shared message keys and route availability are in sync.`, `exit=0`.

```bash
node -e '
const fs=require("fs");
fs.writeFileSync("messages/id.json",
  fs.readFileSync("messages/id.json","utf8").replaceAll("Eat or Yeet","Makan atau Buang"));'
node scripts/check-i18n.mjs; echo "exit=$?"
```
Expected: `Indonesian copy must preserve product term: Eat or Yeet`, `exit=1`.

- [ ] **Step 4: Restore the catalogues**

```bash
cp /tmp/en.backup.json messages/en.json && cp /tmp/id.backup.json messages/id.json
node scripts/check-i18n.mjs; echo "exit=$?"
```
Expected: `i18n passed`, `exit=0`. Confirm `git diff --stat messages/` is empty.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-i18n.mjs
git commit -m "chore(guards): assert product terms only while English uses them

The guard blocked retiring a product term, not just translating one.
Diary-frame copy cannot be removed while it hard-asserts 'Top 4'."
```

---

## Task 3: Darken `brand.muted` for legibility on textured paper

Measured in the spec §6.2: on paper composited at multiply 0.80, `#85613F` falls to 4.30:1 average and 4.03:1 in the darkest patches — below AA. `#785739` restores 5.05:1 and 4.72:1 and is visually indistinguishable.

**Files:**
- Modify: `tailwind.config.ts:19`

**Interfaces:**
- Consumes: nothing.
- Produces: `brand.muted` = `#785739`, used by every later task via `text-brand-muted`.

- [ ] **Step 1: Write the contrast assertion**

Create `scripts/check-contrast.mjs`:

```js
import { readFile } from "node:fs/promises"

const config = await readFile("tailwind.config.ts", "utf8")
const muted = config.match(/muted:\s*"(#[0-9A-Fa-f]{6})"/)?.[1]
if (!muted) {
  console.error("Could not read brand.muted from tailwind.config.ts")
  process.exit(1)
}

const channel = (c) => {
  const v = c / 255
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const luminance = ([r, g, b]) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
const ratio = (a, b) => {
  const [x, y] = [luminance(rgb(a)), luminance(rgb(b))].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

// #e4dace is the darkest patch of the paper stack (spec 2026-09-01 §6.2)
const DARKEST_PAPER = "#e4dace"
const measured = ratio(muted, DARKEST_PAPER)
if (measured < 4.5) {
  console.error(
    `brand.muted ${muted} is ${measured.toFixed(2)}:1 on the darkest paper ` +
      `(${DARKEST_PAPER}); AA body text needs 4.5:1.`,
  )
  process.exit(1)
}
console.log(`contrast passed — brand.muted ${muted} is ${measured.toFixed(2)}:1 on paper.`)
```

- [ ] **Step 2: Run it to verify it fails on the current token**

```bash
node scripts/check-contrast.mjs; echo "exit=$?"
```
Expected: `brand.muted #85613F is 4.03:1 on the darkest paper (#e4dace); AA body text needs 4.5:1.`, `exit=1`.

- [ ] **Step 3: Change the token**

In `tailwind.config.ts`, change the `muted` line to:

```ts
          muted: "#785739",           // secondary text on cream and paper (4.72:1 on stock)
```

- [ ] **Step 4: Run it to verify it passes, and wire it into lint**

```bash
node scripts/check-contrast.mjs; echo "exit=$?"
```
Expected: `contrast passed — brand.muted #785739 is 4.72:1 on paper.`, `exit=0`.

In `package.json`, change the `lint` script to:

```json
    "lint": "eslint && npm run check:founder-decisions && npm run check:i18n && npm run check:contrast",
```

and add:

```json
    "check:contrast": "node scripts/check-contrast.mjs",
```

- [ ] **Step 5: Verify the full gate**

```bash
npm install
npm run lint
```
Expected: eslint clean, `FD-001 passed`, `i18n passed`, `contrast passed`.

- [ ] **Step 6: Commit**

```bash
git add tailwind.config.ts scripts/check-contrast.mjs package.json
git commit -m "fix(color): darken brand.muted to #785739 for paper legibility

Paper stock at multiply 0.80 pushed #85613F to 4.03:1 in its darkest
patches. #785739 restores 4.72:1 and is guarded by check:contrast."
```

---

## Task 4: `PaperSheet` — the four-layer stock

**Files:**
- Create: `components/paper/PaperSheet.tsx`
- Create: `app/[locale]/dev-preview/page.tsx` (dev-only render harness)
- Modify: `app/globals.css` (append a `@layer components` block)

**Interfaces:**
- Consumes: `brand.cream`, `brand.ink` from Task 3's config.
- Produces: `<PaperSheet fold?: boolean className?: string>{children}</PaperSheet>`. Children render inside `.paper-body`, which sits above every texture layer. Every later task wraps its section in this.

- [ ] **Step 1: Add the paper layers to `app/globals.css`**

Append:

```css
@layer components {
  .paper-sheet {
    position: relative;
    isolation: isolate;
    overflow: hidden;
    background-color: #FFF4E6;
    color: #2B1503;
  }
  .paper-tone,
  .paper-relief,
  .paper-tooth,
  .paper-fold,
  .paper-edge {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  .paper-tone {
    z-index: 1;
    background:
      radial-gradient(78% 58% at 18% 4%, rgba(255, 255, 255, 0.6), transparent 62%),
      radial-gradient(70% 55% at 92% 98%, rgba(43, 21, 3, 0.07), transparent 64%);
  }
  /* Fibre relief. baseFrequency must stay ~0.04: higher values produce
     per-pixel static that averages to flat grey. feDiffuseLighting turns the
     noise into a bump map, which is what reads as paper rather than speckle.
     multiply is required — the lit texture is near-white, so soft-light and
     overlay bleach the cream instead of darkening into it. */
  .paper-relief {
    z-index: 2;
    mix-blend-mode: multiply;
    opacity: 0.8;
    background-size: 420px 420px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='420' height='420'%3E%3Cfilter id='p' filterUnits='userSpaceOnUse' x='0' y='0' width='420' height='420'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.042' numOctaves='5' stitchTiles='stitch' result='n'/%3E%3CfeDiffuseLighting in='n' lighting-color='%23ffffff' surfaceScale='2.6'%3E%3CfeDistantLight azimuth='45' elevation='60'/%3E%3C/feDiffuseLighting%3E%3C/filter%3E%3Crect width='420' height='420' filter='url(%23p)'/%3E%3C/svg%3E");
  }
  .paper-tooth {
    z-index: 3;
    mix-blend-mode: multiply;
    opacity: 0.18;
    background-size: 220px 220px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='t' filterUnits='userSpaceOnUse' x='0' y='0' width='220' height='220'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch' result='n'/%3E%3CfeColorMatrix in='n' type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23t)'/%3E%3C/svg%3E");
  }
  .paper-fold {
    z-index: 4;
    background: linear-gradient(
      90deg,
      transparent 42%,
      rgba(43, 21, 3, 0.035) 47%,
      rgba(43, 21, 3, 0.1) 49.4%,
      rgba(43, 21, 3, 0.16) 50%,
      rgba(43, 21, 3, 0.1) 50.6%,
      rgba(43, 21, 3, 0.035) 53%,
      transparent 58%
    );
  }
  .paper-edge {
    z-index: 5;
    box-shadow: inset 0 0 110px rgba(43, 21, 3, 0.075);
  }
  .paper-body {
    position: relative;
    z-index: 6;
  }
}
```

- [ ] **Step 2: Create the component**

Create `components/paper/PaperSheet.tsx`:

```tsx
import type { ReactNode } from "react"

type PaperSheetProps = {
  children: ReactNode
  /** Renders the centre crease of an open spread. */
  fold?: boolean
  className?: string
}

/**
 * The paper ground every decision-first section sits on. Four CSS-only
 * layers — no image asset, so nothing to download and nothing to go soft on a
 * retina screen. All layers are pointer-events:none and sit below the content
 * in z-order, so the text above them stays real, selectable and translatable.
 */
export default function PaperSheet({
  children,
  fold = false,
  className = "",
}: PaperSheetProps) {
  return (
    <div className={`paper-sheet ${className}`.trim()}>
      <div className="paper-tone" aria-hidden />
      <div className="paper-relief" aria-hidden />
      <div className="paper-tooth" aria-hidden />
      {fold ? <div className="paper-fold" aria-hidden /> : null}
      <div className="paper-edge" aria-hidden />
      <div className="paper-body">{children}</div>
    </div>
  )
}
```

- [ ] **Step 3: Create the dev-only render harness**

Nothing in this plan mounts on a real route (the deploy gate), so without a
harness there is nowhere to verify anything visually. The harness returns 404
outside development, even if this branch ever merges. The sitemap is manually
curated, so it cannot leak there.

Create `app/[locale]/dev-preview/page.tsx`:

```tsx
import { notFound } from "next/navigation"
import { setRequestLocale } from "next-intl/server"
import PaperSheet from "@/components/paper/PaperSheet"

/**
 * Dev-only harness for the deploy-gated decision-first components.
 * Tasks 7 and 8 mount their sections here as they land.
 */
export default async function DevPreview({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  if (process.env.NODE_ENV === "production") notFound()
  const { locale } = await params
  setRequestLocale(locale)
  return (
    <main>
      <PaperSheet fold className="min-h-[50vh]">
        <p className="p-10 text-brand-muted">paper harness</p>
      </PaperSheet>
    </main>
  )
}
```

- [ ] **Step 4: Verify the build and the texture**

```bash
npm run lint && npm run build
```
Expected: all checks pass; `next build` completes (the harness prerenders as a 404 in production — that is correct, not a failure).

Start the dev preview (`makan-web-saffron-dev`, port 3456), open `http://localhost:3456/dev-preview`, and in the browser console:

```js
getComputedStyle(document.querySelector('.paper-relief')).mixBlendMode
// expected: "multiply"
getComputedStyle(document.querySelector('.paper-relief')).backgroundImage.slice(0, 30)
// expected: 'url("data:image/svg+xml,%3Csvg'
document.querySelectorAll('.paper-tone,.paper-relief,.paper-tooth,.paper-fold,.paper-edge').length
// expected: 5
```

- [ ] **Step 5: Commit**

```bash
git add components/paper/PaperSheet.tsx app/globals.css "app/[locale]/dev-preview/page.tsx"
git commit -m "feat(paper): CSS-only four-layer paper stock + dev-only harness

feTurbulence fibre relief lit by feDiffuseLighting, multiplied at 0.80,
plus tooth, tone, fold and edge. No image asset; text stays real DOM.
Harness route 404s in production."
```

---

## Task 5: Menu primitives

**Files:**
- Create: `components/menu/MenuItem.tsx`
- Create: `components/menu/MenuSheet.tsx`

**Interfaces:**
- Consumes: `PaperSheet` is *not* used here — `MenuSheet` renders inside a caller's `PaperSheet`.
- Produces:
  - `type MenuEntry = { name: string; description?: string; price: string; diet?: string }`
  - `type MenuSection = { heading: string; items: MenuEntry[] }`
  - `<MenuSheet house={string} meta={string} sections={MenuSection[]} legal={string} />`

- [ ] **Step 1: Create `components/menu/MenuItem.tsx`**

```tsx
export type MenuEntry = {
  name: string
  description?: string
  price: string
  /** Dietary markers as printed, e.g. "VG GF". */
  diet?: string
}

/**
 * One printed menu line. Prices are right-aligned and tabular; cafés that
 * describe their dishes do not use dot leaders — those are a fine-dining
 * convention for undescribed items.
 */
export default function MenuItem({ name, description, price, diet }: MenuEntry) {
  return (
    <li className="mb-[0.8em] list-none">
      <div className="flex items-baseline justify-between gap-5">
        <span className="text-[1.05rem] font-semibold text-brand-ink">
          {name}
          {diet ? (
            <span className="ml-1.5 text-[0.6rem] font-bold tracking-[0.1em] text-brand-muted">
              {diet}
            </span>
          ) : null}
        </span>
        <span className="text-[0.95rem] font-semibold tabular-nums text-brand-muted">
          {price}
        </span>
      </div>
      {description ? (
        <p className="mt-[0.16em] max-w-[88%] text-[0.8rem] leading-[1.42] text-brand-muted">
          {description}
        </p>
      ) : null}
    </li>
  )
}
```

- [ ] **Step 2: Create `components/menu/MenuSheet.tsx`**

```tsx
import MenuItem, { type MenuEntry } from "./MenuItem"

export type MenuSection = { heading: string; items: MenuEntry[] }

type MenuSheetProps = {
  house: string
  meta: string
  sections: MenuSection[]
  /** The tax-and-service line. Printed menus in Bali always carry one. */
  legal: string
  className?: string
}

export default function MenuSheet({
  house,
  meta,
  sections,
  legal,
  className = "",
}: MenuSheetProps) {
  return (
    <div className={className}>
      <header className="mb-[1.6em] text-center">
        <h3 className="text-[1.3rem] font-bold uppercase tracking-[0.3em] text-brand-ink">
          {house}
        </h3>
        <div className="mx-auto my-[0.75em] h-px w-[3.4em] bg-brand-muted opacity-50" />
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-brand-muted">
          {meta}
        </p>
      </header>

      {sections.map((section) => (
        <section key={section.heading}>
          <div className="mb-[0.78em] mt-[1.3em] flex items-center gap-[0.8em] first:mt-0">
            <span className="whitespace-nowrap text-[0.72rem] font-bold uppercase tracking-[0.2em] text-brand-muted">
              {section.heading}
            </span>
            <i className="h-px flex-1 bg-brand-muted/30" />
          </div>
          <ul>
            {section.items.map((item) => (
              <MenuItem key={item.name} {...item} />
            ))}
          </ul>
        </section>
      ))}

      <p className="mt-[1.35em] border-t border-brand-muted/30 pt-[0.95em] text-center text-[0.62rem] leading-[1.6] text-brand-muted">
        {legal}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

```bash
npm run lint && npm run build
```
Expected: all checks pass, build completes.

- [ ] **Step 4: Commit**

```bash
git add components/menu/MenuItem.tsx components/menu/MenuSheet.tsx
git commit -m "feat(menu): printed-menu primitives

Right-aligned tabular prices, dietary markers, section rules and the
tax-and-service line. No dot leaders — described dishes do not use them."
```

---

## Task 6: Evidence levels, `AnswerCard` and `HandRing`

**Files:**
- Create: `components/decision/evidence.ts`
- Create: `components/decision/AnswerCard.tsx`
- Create: `components/decision/HandRing.tsx`
- Modify: `app/globals.css` (append the ring keyframes)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces:
  - `type DecisionEvidenceLevel = 'personal_taste' | 'trusted_person' | 'maitred_menu' | 'community_evidence' | 'restaurant_provided' | 'insufficient'` — names taken verbatim from RM19665's scope section so the site and the app share vocabulary.
  - `markFormFor(level: DecisionEvidenceLevel): 'solid' | 'rule' | 'dot' | 'ink' | 'none'`
  - `<AnswerCard level mark dish reason note? />`
  - `<HandRing>{children}</HandRing>`

- [ ] **Step 1: Create `components/decision/evidence.ts`**

```ts
/**
 * Level names are taken verbatim from RM19665 so the website and the app
 * describe the same six states with the same words.
 */
export type DecisionEvidenceLevel =
  | "personal_taste"
  | "trusted_person"
  | "maitred_menu"
  | "community_evidence"
  | "restaurant_provided"
  | "insufficient"

/**
 * The saffron grammar. Saffron drains as the evidence thins, and the
 * restaurant's own words carry none at all — Makan did not say them.
 */
export type MarkForm = "solid" | "rule" | "dot" | "ink" | "none"

const MARK_FORMS: Record<DecisionEvidenceLevel, MarkForm> = {
  personal_taste: "solid",
  trusted_person: "rule",
  maitred_menu: "rule",
  community_evidence: "dot",
  restaurant_provided: "ink",
  insufficient: "none",
}

export function markFormFor(level: DecisionEvidenceLevel): MarkForm {
  return MARK_FORMS[level]
}

export const MARK_CLASSES: Record<MarkForm, string> = {
  solid: "rounded-full bg-brand-orange px-[0.85em] py-[0.45em] text-white",
  rule: "border-b-2 border-brand-orange pb-[0.42em] text-brand-orange",
  dot: "text-brand-orange before:mr-[0.6em] before:align-[0.12em] before:text-[0.7em] before:content-['●']",
  ink: "rounded-full border border-brand-muted/35 px-[0.8em] py-[0.4em] text-brand-muted",
  none: "hidden",
}
```

- [ ] **Step 2: Create `components/decision/AnswerCard.tsx`**

```tsx
import type { ReactNode } from "react"
import {
  MARK_CLASSES,
  markFormFor,
  type DecisionEvidenceLevel,
} from "./evidence"

type AnswerCardProps = {
  level: DecisionEvidenceLevel
  /** The saffron label. Its meaning MUST also appear in ink nearby. */
  mark: string
  dish: ReactNode
  reason: string
  note?: string
  className?: string
}

export default function AnswerCard({
  level,
  mark,
  dish,
  reason,
  note,
  className = "",
}: AnswerCardProps) {
  const form = markFormFor(level)
  const insufficient = level === "insufficient"

  return (
    <div
      className={[
        insufficient
          ? "rounded-[3px] border border-dashed border-brand-muted/35 bg-white/30"
          : "rounded-xl border-[1.5px] border-brand-orange bg-brand-card shadow-[0_3px_7px_-2px_rgba(43,21,3,0.14),0_16px_30px_-14px_rgba(43,21,3,0.34)]",
        "p-[1.5em]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={`inline-block text-[0.72rem] font-extrabold uppercase tracking-[0.15em] ${MARK_CLASSES[form]}`}
      >
        {mark}
      </span>
      <p className="mt-[0.9em] text-[1.5rem] font-bold leading-[1.1] text-brand-ink">
        {dish}
      </p>
      <p className="mt-[0.5em] text-[0.85rem] leading-[1.55] text-brand-muted">
        {reason}
      </p>
      {note ? (
        <p className="mt-[0.85em] border-l-2 border-brand-orange pl-[0.9em] text-[0.78rem] leading-[1.55] text-brand-muted">
          {note}
        </p>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 3: Create `components/decision/HandRing.tsx`**

```tsx
import type { ReactNode } from "react"

/**
 * A hand-drawn saffron ring around a dish name. Three things make it read as
 * a pen rather than a shape: the path is deliberately not an ellipse, a second
 * lighter lap sweeps back over the top-left past the start, and
 * feDisplacementMap pushes the edges around.
 *
 * One instance per page: the SVG filter id is fixed.
 *
 * baseFrequency must stay LOW (0.016). High-frequency displacement reads as a
 * shaky hand; low-frequency reads as a confident stroke that is simply not
 * perfect. Same amplitude, opposite character.
 */
export default function HandRing({ children }: { children: ReactNode }) {
  return (
    <span className="relative z-0 mx-[0.72em] my-[0.55em] inline-block">
      <span className="relative z-[1]">{children}</span>
      <svg
        className="hand-ring absolute left-[-23%] top-[-100%] z-[2] h-[300%] w-[148%] -rotate-[1.3deg] overflow-visible"
        viewBox="0 0 300 90"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <filter id="hand-ring-pen" x="-25%" y="-45%" width="150%" height="190%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.016"
              numOctaves="2"
              seed="9"
              result="n"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="n"
              scale="6"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
        <g filter="url(#hand-ring-pen)">
          <path
            className="hand-ring-lap1"
            d="M31,54 C25,30 74,13 149,9 C221,5 289,17 286,42 C283,67 209,86 141,84 C71,82 22,73 33,45"
          />
          <path
            className="hand-ring-lap2"
            d="M33,45 C40,27 78,18 131,13 C167,9 205,10 231,15"
          />
        </g>
      </svg>
    </span>
  )
}
```

- [ ] **Step 4: Add the ring styles and draw animation to `app/globals.css`**

Append inside the existing `@layer components` block from Task 4:

```css
  .hand-ring path {
    fill: none;
    stroke: #FF9932;
    stroke-linecap: round;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .hand-ring-lap1 { stroke-width: 3.6; }
  .hand-ring-lap2 { stroke-width: 2.1; opacity: 0.9; }

  /* Content must never depend on an animation to become visible: the ring is
     fully drawn by default and only animates when .is-revealing is applied. */
  @media (prefers-reduced-motion: no-preference) {
    .is-revealing .hand-ring-lap1 {
      stroke-dasharray: 1400;
      stroke-dashoffset: 1400;
      animation: hand-ring-draw 0.78s cubic-bezier(0.33, 0, 0.5, 1) 0.72s forwards;
    }
    .is-revealing .hand-ring-lap2 {
      stroke-dasharray: 700;
      stroke-dashoffset: 700;
      animation: hand-ring-draw 0.4s cubic-bezier(0.33, 0, 0.6, 1) 1.34s forwards;
    }
  }

@keyframes hand-ring-draw {
  to { stroke-dashoffset: 0; }
}
```

Note: `@keyframes` sits outside the `@layer components` block.

- [ ] **Step 5: Verify the level map and the build**

```bash
npm run lint && npm run build
```
Expected: all checks pass, build completes.

```bash
node -e '
const s = require("fs").readFileSync("components/decision/evidence.ts","utf8");
const levels = ["personal_taste","trusted_person","maitred_menu","community_evidence","restaurant_provided","insufficient"];
const missing = levels.filter(l => !s.includes(l));
if (missing.length) { console.error("missing RM19665 levels:", missing.join(", ")); process.exit(1); }
console.log("all six RM19665 evidence levels present");'
```
Expected: `all six RM19665 evidence levels present`.

- [ ] **Step 6: Commit**

```bash
git add components/decision/evidence.ts components/decision/AnswerCard.tsx \
        components/decision/HandRing.tsx app/globals.css
git commit -m "feat(decision): evidence levels, answer card and hand-drawn ring

Level names taken verbatim from RM19665. Saffron drains across five mark
forms; restaurant-provided carries none, because Makan did not say it."
```

---

## Task 7: `HeroDiptych` — movement 1

**Files:**
- Create: `components/home/HeroDiptych.tsx`
- Modify: `messages/en.json`, `messages/id.json` (add `Decision.Hero`)

**Interfaces:**
- Consumes: `PaperSheet` (Task 4), `MenuSheet`/`MenuEntry`/`MenuSection` (Task 5), `AnswerCard` (Task 6).
- Produces: `<HeroDiptych />` — a server component reading the `Decision.Hero` namespace. Not yet mounted on any route.

- [ ] **Step 1: Add `Decision.Hero` to `messages/en.json`**

Add a top-level `"Decision"` key:

```json
  "Decision": {
    "Hero": {
      "headline": "You still don't know what to order.",
      "body": "Makan answers with meals that actually happened — yours, and people you trust.",
      "cta": "Get Makan — free",
      "platform": "Free on iPhone",
      "house": "Bright Palm",
      "meta": "Jl. Pantai Berawa · 7am – 11pm",
      "legal": "V vegetarian · VG vegan · GF gluten free. Prices in thousands of rupiah, subject to 21% government tax & service.",
      "answerMark": "A good match for you",
      "answerDish": "Grilled Barramundi",
      "answerReason": "You've chosen grilled over fried six times out of seven, and fish every time it's been up against a burger. Nobody you trust has eaten here yet — this one comes from your own taste."
    }
  }
```

- [ ] **Step 2: Add the same keys to `messages/id.json`**

```json
  "Decision": {
    "Hero": {
      "headline": "Kamu masih belum tahu mau pesan apa.",
      "body": "Makan menjawab dengan makanan yang benar-benar pernah dimakan — punyamu, dan punya orang yang kamu percaya.",
      "cta": "Unduh Makan — gratis",
      "platform": "Gratis di iPhone",
      "house": "Bright Palm",
      "meta": "Jl. Pantai Berawa · 07.00 – 23.00",
      "legal": "V vegetarian · VG vegan · GF bebas gluten. Harga dalam ribuan rupiah, belum termasuk pajak dan layanan 21%.",
      "answerMark": "Cocok untuk kamu",
      "answerDish": "Grilled Barramundi",
      "answerReason": "Kamu memilih panggang dibanding goreng enam dari tujuh kali, dan selalu memilih ikan ketika dibandingkan dengan burger. Belum ada orang yang kamu percaya makan di sini — yang ini datang dari seleramu sendiri."
    }
  }
```

Dish names are provider-authored content and are never translated.

- [ ] **Step 3: Create `components/home/HeroDiptych.tsx`**

```tsx
import { getTranslations } from "next-intl/server"
import PaperSheet from "@/components/paper/PaperSheet"
import MenuSheet, { type MenuSection } from "@/components/menu/MenuSheet"
import AnswerCard from "@/components/decision/AnswerCard"

// A Western Berawa menu is a genuinely incoherent decision — brunch, poke,
// pizza and wagyu with no cuisine logic tying them together. That is the real
// paralysis, and it is what makes the answer's reason line land.
const SECTIONS: MenuSection[] = [
  {
    heading: "Brunch, served all day",
    items: [
      { name: "Smashed Avocado", diet: "VG", price: "85", description: "sourdough, whipped feta, chilli oil, dukkah" },
      { name: "Coconut Chia Bowl", diet: "VG GF", price: "78", description: "mango, passionfruit, toasted coconut" },
      { name: "Eggs Benedict", price: "98", description: "house hollandaise, muffin, smoked bacon or spinach" },
    ],
  },
  {
    heading: "Bowls & Greens",
    items: [
      { name: "Nourish Bowl", diet: "VG GF", price: "95", description: "quinoa, roast pumpkin, kale, tahini, pickled onion" },
      { name: "Tuna Poke", diet: "GF", price: "110", description: "yellowfin, sushi rice, edamame, sesame, nori" },
    ],
  },
  {
    heading: "From the Grill",
    items: [
      { name: "Wagyu Cheeseburger", price: "145", description: "aged cheddar, pickles, house sauce, fries" },
      { name: "Grilled Barramundi", diet: "GF", price: "165", description: "whole fish, sambal matah, charred lime, greens" },
      { name: "Half Chicken", price: "138", description: "lemon, garlic, chimichurri" },
    ],
  },
  {
    heading: "From the Oven",
    items: [
      { name: "Margherita", diet: "V", price: "95", description: "fior di latte, san marzano, basil" },
      { name: "Nduja & Hot Honey", price: "115", description: "fior di latte, nduja, oregano" },
    ],
  },
]

export default async function HeroDiptych() {
  const t = await getTranslations("Decision.Hero")

  return (
    <PaperSheet fold className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2">
        <MenuSheet
          house={t("house")}
          meta={t("meta")}
          sections={SECTIONS}
          legal={t("legal")}
          className="px-8 py-10 md:px-10"
        />
        <div className="flex flex-col justify-center px-8 py-10 md:px-12">
          <h1 className="max-w-[13ch] text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.04] tracking-[-0.015em] text-brand-ink">
            {t("headline")}
          </h1>
          <p className="mt-4 max-w-[34ch] text-base leading-[1.55] text-brand-muted">
            {t("body")}
          </p>
          <AnswerCard
            className="mt-7"
            level="personal_taste"
            mark={t("answerMark")}
            dish={t("answerDish")}
            reason={t("answerReason")}
          />
          <div className="mt-7 flex items-center gap-4">
            <span className="inline-flex items-center rounded-full bg-brand-orange px-7 py-3.5 text-sm font-bold text-white shadow-[0_7px_16px_-7px_rgba(255,153,50,0.55)]">
              {t("cta")}
            </span>
            <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-brand-muted">
              {t("platform")}
            </span>
          </div>
        </div>
      </div>
    </PaperSheet>
  )
}
```

The CTA is a `<span>` deliberately — wiring it to `APP_STORE_URL` happens when the section is mounted on a route, which is gated.

- [ ] **Step 4: Verify key parity and the build**

```bash
npm run lint && npm run build
```
Expected: `i18n passed` (proving EN/ID parity for the new keys), all other checks pass, build completes.

- [ ] **Step 5: Mount in the harness and verify both locales**

In `app/[locale]/dev-preview/page.tsx`, add the import and render `<HeroDiptych />` above the placeholder sheet:

```tsx
import HeroDiptych from "@/components/home/HeroDiptych"
```

With the dev preview running, on `http://localhost:3456/dev-preview`:

```js
document.body.innerText.includes("You still don't know what to order.")  // true
document.querySelectorAll('.paper-fold').length                          // >= 1 — the spread has its crease
```

and on `http://localhost:3456/id/dev-preview`:

```js
document.body.innerText.includes("Kamu masih belum tahu mau pesan apa.")  // true
```

- [ ] **Step 6: Commit**

```bash
git add components/home/HeroDiptych.tsx messages/en.json messages/id.json "app/[locale]/dev-preview/page.tsx"
git commit -m "feat(home): hero diptych — the menu and its answer as one spread

Menu on the left page, Makan's answer on the right, hairline spine
between. Not mounted on a route; the deploy gate still applies."
```

---

## Task 8: `EvidenceLadder` — movement 4

**Files:**
- Create: `components/home/EvidenceLadder.tsx`
- Modify: `messages/en.json`, `messages/id.json` (add `Decision.Ladder`)

**Interfaces:**
- Consumes: `PaperSheet` (Task 4), `AnswerCard` + `DecisionEvidenceLevel` (Task 6), `HandRing` (Task 6).
- Produces: `<EvidenceLadder />`. Not yet mounted on any route.

- [ ] **Step 1: Add `Decision.Ladder` to both catalogues**

Add under the existing `"Decision"` key in `messages/en.json`:

```json
    "Ladder": {
      "eyebrow": "Where answers come from",
      "title": "Makan tells you where the answer came from.",
      "titleAccent": "came from",
      "intro": "It works down from what it knows best to what it knows least — and when there isn't enough to go on, it says that instead of guessing.",
      "l1Mark": "Your top pick",
      "l1When": "Your own Eat or Yeet choices",
      "l1Dish": "Eggs Benedict",
      "l1Reason": "Chosen over 11 dishes at Bright Palm.",
      "l1Note": "Haven't eaten it? Makan says A good match for you instead — a careful guess from meals you have compared. It never gives an unseen dish a score as though you'd ranked it.",
      "l2Mark": "Maya ordered this again",
      "l2When": "People you chose to trust",
      "l2Dish": "Tuna Poke",
      "l2Reason": "Maya has ordered it again twice, across four visits to Bright Palm.",
      "l3Mark": "Maitre'D Adi",
      "l3When": "The current Maitre'D's published menu",
      "l3Always": "The barramundi, whole, with extra sambal matah.",
      "l3Try": "You're here before 11 — the benedict is only worth it early.",
      "l3Know": "The kitchen slows right down after 8pm at weekends.",
      "l3Reason": "Adi has eaten at Bright Palm on 23 different days.",
      "l4Mark": "Based on 34 meals from 21 people",
      "l4When": "Everyone on Makan, counted together",
      "l4Dish": "Wagyu Cheeseburger",
      "l4Reason": "The dish most often ordered again here. Counted together — nobody's meals are shown to you, and yours aren't shown to them.",
      "l5Mark": "From Bright Palm's menu",
      "l5When": "Facts the restaurant supplied",
      "l5Dish": "Nduja & Hot Honey",
      "l5Reason": "Fior di latte, nduja, oregano · 115. Menu information provided by the restaurant and labelled as theirs. They can't pay to be the answer, and this never outranks a real meal.",
      "l6When": "No level can answer",
      "l6Dish": "Not enough meals here yet to help you choose.",
      "l6Reason": "Bright Palm is new to Makan. Order what you fancy — and if you save it, you'll be the reason the next person gets an answer.",
      "closer": "No restaurant can pay to be the answer. Nobody wins by being popular. And Makan would rather tell you it doesn't know.",
      "alwaysKey": "Always order",
      "tryKey": "Try this if…",
      "knowKey": "Good to know"
    }
```

Add the Indonesian equivalents under the same keys in `messages/id.json`. Product terms **Eat or Yeet** and **Maitre'D** are not translated; dish names are not translated.

```json
    "Ladder": {
      "eyebrow": "Dari mana jawabannya",
      "title": "Makan memberitahu kamu dari mana jawabannya datang.",
      "titleAccent": "dari mana",
      "intro": "Makan mulai dari yang paling dikenalnya sampai yang paling sedikit diketahuinya — dan kalau belum cukup bukti, Makan mengatakannya, bukan menebak.",
      "l1Mark": "Pilihan teratasmu",
      "l1When": "Pilihan Eat or Yeet kamu sendiri",
      "l1Dish": "Eggs Benedict",
      "l1Reason": "Dipilih di atas 11 hidangan lain di Bright Palm.",
      "l1Note": "Belum pernah mencobanya? Makan akan bilang Cocok untuk kamu — perkiraan hati-hati dari makanan yang pernah kamu bandingkan. Makan tidak pernah memberi nilai pada hidangan yang belum kamu coba.",
      "l2Mark": "Maya memesannya lagi",
      "l2When": "Orang yang kamu percaya",
      "l2Dish": "Tuna Poke",
      "l2Reason": "Maya sudah memesannya lagi dua kali, dari empat kali kunjungan ke Bright Palm.",
      "l3Mark": "Maitre'D Adi",
      "l3When": "Menu yang diterbitkan Maitre'D saat ini",
      "l3Always": "Barramundi-nya, utuh, dengan tambahan sambal matah.",
      "l3Try": "Kalau datang sebelum jam 11 — benedict-nya hanya enak di pagi hari.",
      "l3Know": "Dapurnya melambat setelah jam 8 malam di akhir pekan.",
      "l3Reason": "Adi sudah makan di Bright Palm pada 23 hari berbeda.",
      "l4Mark": "Berdasarkan 34 makanan dari 21 orang",
      "l4When": "Semua orang di Makan, dihitung bersama",
      "l4Dish": "Wagyu Cheeseburger",
      "l4Reason": "Hidangan yang paling sering dipesan ulang di sini. Dihitung bersama — makanan orang lain tidak ditampilkan ke kamu, dan makananmu tidak ditampilkan ke mereka.",
      "l5Mark": "Dari menu Bright Palm",
      "l5When": "Fakta yang diberikan restoran",
      "l5Dish": "Nduja & Hot Honey",
      "l5Reason": "Fior di latte, nduja, oregano · 115. Informasi menu diberikan oleh restoran dan ditandai sebagai milik mereka. Mereka tidak bisa membayar untuk menjadi jawaban, dan ini tidak pernah mengalahkan makanan sungguhan.",
      "l6When": "Tidak ada tingkat yang bisa menjawab",
      "l6Dish": "Belum cukup makanan di sini untuk membantumu memilih.",
      "l6Reason": "Bright Palm baru di Makan. Pesan apa pun yang kamu mau — dan kalau kamu menyimpannya, kamu jadi alasan orang berikutnya mendapat jawaban.",
      "closer": "Tidak ada restoran yang bisa membayar untuk menjadi jawaban. Tidak ada yang menang hanya karena populer. Dan Makan lebih memilih mengatakan bahwa ia tidak tahu.",
      "alwaysKey": "Selalu pesan",
      "tryKey": "Coba ini kalau…",
      "knowKey": "Perlu diketahui"
    }
```

- [ ] **Step 2: Create `components/home/EvidenceLadder.tsx`**

```tsx
import { getTranslations } from "next-intl/server"
import PaperSheet from "@/components/paper/PaperSheet"
import HandRing from "@/components/decision/HandRing"
import { MARK_CLASSES, markFormFor, type DecisionEvidenceLevel } from "@/components/decision/evidence"

// Air and type size contract from 01 to 06 alongside the saffron, so the
// layout performs the thinning evidence rather than the copy explaining it.
const RUNG_PADDING: Record<number, string> = {
  1: "pb-9",
  2: "py-6",
  3: "py-6",
  4: "py-4",
  5: "py-4",
  6: "pt-5",
}

function Mark({ level, children }: { level: DecisionEvidenceLevel; children: string }) {
  return (
    <span
      className={`inline-block text-[0.78rem] font-extrabold uppercase tracking-[0.15em] ${MARK_CLASSES[markFormFor(level)]}`}
    >
      {children}
    </span>
  )
}

function Rung({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <article
      className={`grid grid-cols-[3rem_minmax(0,1fr)] gap-x-6 border-t border-brand-muted/20 first:border-t-0 ${RUNG_PADDING[n]}`}
    >
      <div className="text-[1.6rem] font-extralight leading-none tabular-nums text-brand-muted opacity-40">
        {String(n).padStart(2, "0")}
      </div>
      <div>{children}</div>
    </article>
  )
}

export default async function EvidenceLadder() {
  const t = await getTranslations("Decision.Ladder")
  const title = t("title")
  const accent = t("titleAccent")
  const [before, after] = title.split(accent)

  return (
    <PaperSheet className="w-full">
      <div className="px-8 py-14 md:px-16">
        <header className="mb-10">
          <p className="text-[0.82rem] font-extrabold uppercase tracking-[0.2em] text-brand-orange">
            {t("eyebrow")}
          </p>
          <h2 className="mt-3 max-w-[13ch] text-[clamp(1.9rem,3.4vw,3rem)] font-bold leading-[1.02] tracking-[-0.03em] text-brand-ink">
            {before}
            <em className="font-extrabold not-italic text-brand-orange">{accent}</em>
            {after}
          </h2>
          <p className="mt-4 max-w-[34em] text-[0.95rem] leading-[1.62] text-brand-muted">
            {t("intro")}
          </p>
        </header>

        <Rung n={1}>
          <Mark level="personal_taste">{t("l1Mark")}</Mark>
          <p className="mt-3 text-lg font-bold text-brand-ink">{t("l1When")}</p>
          <p className="text-[clamp(1.5rem,2.6vw,2.4rem)] font-bold leading-[1.1] text-brand-ink">
            <HandRing>{t("l1Dish")}</HandRing>
          </p>
          <p className="mt-2 text-[0.9rem] leading-[1.6] text-brand-muted">{t("l1Reason")}</p>
          <p className="mt-3 max-w-[34em] border-l-2 border-brand-orange pl-3 text-[0.8rem] leading-[1.55] text-brand-muted">
            {t("l1Note")}
          </p>
        </Rung>

        <Rung n={2}>
          <Mark level="trusted_person">{t("l2Mark")}</Mark>
          <p className="mt-3 text-base font-bold text-brand-ink">{t("l2When")}</p>
          <p className="mt-1 text-xl font-bold text-brand-ink">{t("l2Dish")}</p>
          <p className="mt-2 text-[0.85rem] leading-[1.6] text-brand-muted">{t("l2Reason")}</p>
        </Rung>

        <Rung n={3}>
          <Mark level="maitred_menu">{t("l3Mark")}</Mark>
          <p className="mt-3 text-base font-bold text-brand-ink">{t("l3When")}</p>
          <dl className="mt-3 grid gap-1.5">
            {[
              [t("alwaysKey"), t("l3Always")],
              [t("tryKey"), t("l3Try")],
              [t("knowKey"), t("l3Know")],
            ].map(([key, value]) => (
              <div key={key} className="grid grid-cols-[max-content_minmax(0,1fr)] gap-3">
                <dt className="text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-brand-orange">
                  {key}
                </dt>
                <dd className="text-[0.9rem] font-medium leading-[1.5] text-brand-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[0.85rem] leading-[1.6] text-brand-muted">{t("l3Reason")}</p>
        </Rung>

        <Rung n={4}>
          <Mark level="community_evidence">{t("l4Mark")}</Mark>
          <p className="mt-3 text-base font-bold text-brand-ink">{t("l4When")}</p>
          <p className="mt-1 text-lg font-bold text-brand-ink">{t("l4Dish")}</p>
          <p className="mt-2 text-[0.85rem] leading-[1.6] text-brand-muted">{t("l4Reason")}</p>
        </Rung>

        <Rung n={5}>
          <Mark level="restaurant_provided">{t("l5Mark")}</Mark>
          <p className="mt-3 text-base font-bold text-brand-ink">{t("l5When")}</p>
          <p className="mt-1 text-lg font-bold text-brand-ink">{t("l5Dish")}</p>
          <p className="mt-2 text-[0.85rem] leading-[1.6] text-brand-muted">{t("l5Reason")}</p>
        </Rung>

        <Rung n={6}>
          <p className="text-base font-bold text-brand-ink">{t("l6When")}</p>
          <div className="mt-3 rounded-[3px] border border-dashed border-brand-muted/35 bg-white/30 p-6">
            <p className="text-lg font-semibold text-brand-ink">{t("l6Dish")}</p>
            <p className="mt-2 text-[0.85rem] leading-[1.6] text-brand-muted">{t("l6Reason")}</p>
          </div>
        </Rung>

        <p className="mt-10 max-w-[22em] border-t-2 border-brand-ink pt-6 text-[clamp(1rem,1.5vw,1.3rem)] font-bold leading-[1.38] tracking-[-0.018em] text-brand-ink">
          {t("closer")}
        </p>
      </div>
    </PaperSheet>
  )
}
```

Every saffron mark's meaning is carried by the ink `when` line rendered directly beneath it — the D11 rule made structural. There is deliberately no `sr-only` duplicate: the ink line is already in the accessibility tree, and duplicating it would read each rung's condition twice.

- [ ] **Step 3: Verify parity, build, and the saffron rule**

```bash
npm run lint && npm run build
```
Expected: `i18n passed`, `contrast passed`, `FD-001 passed`, build completes.

```bash
node -e '
const en = require("./messages/en.json").Decision.Ladder;
const id = require("./messages/id.json").Decision.Ladder;
const a = Object.keys(en).sort(), b = Object.keys(id).sort();
if (JSON.stringify(a) !== JSON.stringify(b)) { console.error("ladder key mismatch"); process.exit(1); }
console.log("ladder catalogues in sync:", a.length, "keys");'
```
Expected: `ladder catalogues in sync: 34 keys`.

- [ ] **Step 4: Mount in the harness and verify**

In `app/[locale]/dev-preview/page.tsx`, import `EvidenceLadder` and render it under `<HeroDiptych />`:

```tsx
import EvidenceLadder from "@/components/home/EvidenceLadder"
```

Then on `http://localhost:3456/dev-preview`:

```js
document.querySelectorAll('article').length                          // 6 — five levels + fallback
document.querySelectorAll('.hand-ring-lap1,.hand-ring-lap2').length  // 2 — both laps of the ring
```

and on `http://localhost:3456/id/dev-preview`:

```js
document.body.innerText.includes("Belum cukup makanan di sini")  // true
```

- [ ] **Step 5: Commit**

```bash
git add components/home/EvidenceLadder.tsx messages/en.json messages/id.json "app/[locale]/dev-preview/page.tsx"
git commit -m "feat(home): evidence ladder — five levels plus fallback

Level names and evidence language taken from RM19665. Saffron drains as
evidence thins; restaurant-provided carries none. Every saffron label's
meaning is repeated in ink, so saffron never carries sole meaning."
```

---

## Task 9: Record the two guard blockers in the spec

The spec records B1 (FD-001 filenames). It does not record the i18n product-term coupling found while writing this plan.

**Files:**
- Modify: `docs/superpowers/specs/2026-09-01-decision-first-website-design.md` (§9)

- [ ] **Step 1: Add B4 under §9 Known blockers**

```markdown
**B4 — the i18n guard blocks retiring product terms.** `scripts/check-i18n.mjs`
asserts `messages/id.json` contains the literals `Eat or Yeet`, `Top 4`,
`Public` and `Friends Only`. The intent is "never translate a product term";
as written it also means "never retire one", so removing diary-frame copy
fails lint and therefore the build. Fixed by asserting a term only while
`messages/en.json` still uses it. Same class of problem as B1: a guard coupled
to today's content rather than to the rule it protects.
```

- [ ] **Step 2: Mark B1 and B4 as resolved with their commits**

Append to each of B1 and B4: `**Resolved:** see Task 1 / Task 2 of docs/superpowers/plans/2026-09-01-decision-first-site-foundations.md.`

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-09-01-decision-first-website-design.md
git commit -m "docs(spec): record the i18n product-term guard as blocker B4"
```

---

## Self-Review

**Spec coverage.** §2 deploy gate → Global Constraints + no route mounting in any task. §3 language → Tasks 7 and 8 land both catalogues; Task 2 unblocks retiring old terms. §4 tagline → **not covered**: the tagline swap touches `Metadata.home`, which is a live homepage string, so it is gated and belongs in the mount plan, not here. §5 architecture → Tasks 7 and 8 build movements 1 and 4; movements 2, 3, 5–8 are explicitly out of scope pending design. §6.1 paper → Task 4. §6.2 colour → Task 3 (muted) and Task 6 (saffron grammar, one orange only). §6.4 ring → Task 6. §7 ladder → Task 8. §8 motion → Task 6's `.is-revealing` opt-in; the section-level stagger belongs with the mount. §9 B1 → Task 1; new B4 → Tasks 2 and 9. §10 measurement → not covered; analytics attach at mount time.

**Placeholder scan.** No TBD/TODO. Every code step carries complete code. Every command carries expected output.

**Type consistency.** `DecisionEvidenceLevel` is defined once in Task 6 and consumed by name in Tasks 6, 7 and 8. `MenuEntry`/`MenuSection` are defined in Task 5 and consumed in Task 7. `markFormFor` and `MARK_CLASSES` are defined in Task 6 and used in Tasks 6 and 8. `PaperSheet`'s `fold` prop is defined in Task 4 and used in Task 7.

**Known gap, deliberate.** Nothing here is mounted on a public route — the only mount is the `dev-preview` harness, which returns 404 outside development. Nothing is visible on the site; that is the deploy gate working as designed. A follow-up plan mounts these sections, swaps the tagline, rewrites `docs/homepage-claim-audit.md` and attaches analytics — and it may only run once the §2 release condition is met.
