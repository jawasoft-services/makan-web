# Venue QR — signing playbook

The repeatable process for taking a **newly signed restaurant** to a live
`makanofficial.com/r/<slug>` page + a printed QR card. Follow this the same way
for every venue so the cards, URLs, and copy stay consistent.

_Ticket family: Growth — venues (epic RM18717). First shipped: RM18720 (Cellar Door + FIIK)._

---

## The model — why the card is "print once"

The printed QR encodes a **stable** URL on a domain we own
(`makanofficial.com/r/<slug>`). What that URL *does* is a Next.js route we
control, so we can change the behaviour by deploying — the physical card never
changes. This is a self-hosted "dynamic QR"; we deliberately do **not** use a
third-party dynamic-QR service (it would add cost, a dependency, and a redirect
hop we don't control).

- **Phase 1 (now):** `/r/<slug>` shows the venue as context + gets the scanner
  onto Makan (App Store CTA + best-effort "open the app").
- **Phase 2 (blocked on RM18722):** the *same* slug becomes a universal link
  that opens the composer pre-tagged to the venue. Cards untouched.

---

## Step 0 — When a venue signs, collect this

| Field | Notes |
|---|---|
| **Display name** | Exactly as it should read on the card (e.g. `Cellar Door`). **Keep it short** — up to ~15 characters shows at full size; longer names auto-shrink to fit the card (they never overflow), but a very long name gets small. If the real name is long, use a shortened card name. |
| **City** | Shown under the name (e.g. `Durham`). Keep it to a line. |
| **Slug** | Lowercase kebab-case, human-readable, **unique**, and **never reused**. It's printed under the QR, so it doubles as trust ("this really is Cellar Door"). e.g. `cellar-door`, `fiik`. |
| **Google Place ID** *(optional)* | The app's `placeProviderId`. Leave blank in Phase 1 — it's only needed for Phase-2 auto-tag, and adding it later needs **no reprint**. |

---

## Step 1 — Add the venue + generate the card (one command)

```bash
npm run venue:add -- --name "Cellar Door" --city "Durham"
```

That single command validates the venue, writes the registry, mints the
print-ready card, and verifies the card's QR actually encodes the right URL. It
prints the exact `git add` / `git commit` lines to run next.

- **Slug** is derived from the name (`The Cheesy Grin` → `the-cheesy-grin`).
  Override it when the derived one reads badly on a card: `--slug cheesy-grin`.
- **Google Place ID** is optional in Phase 1: `--place-id ChIJ...`. It's only
  needed for Phase-2 auto-tag, and adding it later needs **no reprint**.

**Do not hand-edit `lib/venues.data.json`.** The command writes it for you —
that's the point. Hand-editing is how you get a stray trailing comma, a
`key ≠ slug` typo, or a duplicate slug, on the one workflow that ends in a
*physically printed* artefact. (`venue:check` will still catch all of those, but
it's better not to make the mistake.)

The `/r/<slug>` page needs no new code; it reads the registry.

### What runs, and why each step is fail-closed

| Command | Does | Fails when |
|---|---|---|
| `npm run venue:add` | the whole flow below, in order | any step below fails |
| `npm run venue:check` | validates the registry + enforces print-safety | bad/duplicate slug, `key ≠ slug`, unparseable JSON, or a **printed slug repointed at a different venue** |
| `npm run venue-qr` | mints `public/venue-qr/<slug>.svg` for every venue | refuses to write anything if `venue:check` would fail |
| `npm run venue:verify` | re-encodes each card's QR and byte-compares it | a card's QR doesn't encode its own URL, or two cards share one QR |

`venue:check` also runs automatically on **every build** (it's wired to
`prebuild`), so a broken or repurposed registry can never reach a Vercel deploy.

---

## Step 2 — Verify before shipping

> ⚠️ **Local `next dev` / `next build` HANG** in the iCloud-synced checkout
> (`~/Desktop/Projects/MAKAN/MakanGit/makan-web`). Do all Next work from the
> non-iCloud copy:
> ```bash
> rsync -a --delete --exclude node_modules --exclude .next --exclude .git \
>   "$PWD/" ~/dev/makan-web-preview/
> cd ~/dev/makan-web-preview && npm install   # first time only, ~12s
> ./node_modules/.bin/next dev -p 3119        # Ready in ~1s
> ```

- **Compiles:** `npx tsc --noEmit` is safe to run anywhere (the Desktop repo is
  fine). But `npm run build` = `next build`, which **hangs** in the Desktop
  checkout — run it from `~/dev/makan-web-preview` instead
  (`./node_modules/.bin/next build`). Both must be clean; the route shows as
  `ƒ /r/[place]`.

  > ⚠️ Calling `next build` **directly** (as above) skips npm's `prebuild` hook,
  > so it does **not** run `venue:check`. That's fine for a quick compile, but run
  > `npm run venue:check` yourself before you push — on Vercel the gate *does* run
  > (`vercel.json` pins the build command to `npm run build`), so a registry problem
  > you skipped locally will fail the deploy instead.
- **Renders correctly** — load `http://localhost:3119/r/<slug>` and confirm:
  - the venue **name + city** show (eyebrow),
  - **"Download on the App Store"** → `https://apps.apple.com/app/id6756131450`,
  - **"Already have Makan? Open the app"** → `makanapp://`,
  - an unknown slug (`/r/typo`) still renders a valid generic landing (no 404).
  - _If the page shows the generic "Remember every meal." copy instead of the
    venue name, the `slug` field is wrong/mistyped — fix the registry._
- **The QR encodes the right URL** — `npm run venue:add` already ran
  `npm run venue:verify` for you. It re-encodes the URL each card *should* carry
  and byte-compares it against the minted SVG, and it fails if two cards ever
  share the same QR. This is the check that stands between you and a **dead print
  run**, so don't skip it if you edited anything by hand.
- **The QR scans in the real world** — still worth doing once per venue: open
  `public/venue-qr/<slug>.svg` on screen and scan it with a phone camera; it must
  land on `/r/<slug>`. `venue:verify` proves the *bytes* are right; only a camera
  proves it scans off a physical card.

---

## Step 3 — Ship the branch

**Start from a clean tree on `main`.** There is often partner-page or other WIP
uncommitted in this repo — do NOT drag it onto your venue branch.

```bash
git status                                     # if WIP is in flight, stash it or
git checkout main && git pull                  # branch from main explicitly
git checkout -b feat/venue-qr-<slug>           # or feat/venue-qr-<batch> for several

# stage ONLY your venue files — never `git add -A`
git add lib/venues.data.json lib/venues.lock.json "public/venue-qr/<slug>.svg"
git commit -m "feat(venue-qr): add <Name> (<City>) — /r/<slug>"
git push -u origin feat/venue-qr-<slug>
```

> ⚠️ **`lib/venues.lock.json` is not optional.** It is what makes the slug
> un-repointable. Commit a card without its lock entry and that slug ships
> *unprotected* — someone could later aim it at a different restaurant with every
> check green, and the cards already on the tables would send diners to the wrong
> place. `venue:check` now fails the build if a card exists with no lock entry, so
> you'll be caught — but stage it and save yourself the round trip.
>
> If you hit a **merge conflict in the lock** (two venues signed on parallel
> branches), keep **both** entries. Never resolve it by taking one side.

Open a PR to `main` on `Ridorichard04/makan-web`. **Do not push straight to
`main`** — `main` deploys to Vercel production, and that deploy is Devon's call
(see Step 4).

---

## Step 4 — Deploy (Devon's call — this is the live site)

`main` auto-deploys to **Vercel** production, so **merging the PR = a live
marketing-site push**. That's a deliberate go, never automatic — the same "stop
for an outward-facing production action" rule the `/makan` pipeline uses.

- Devon merges PR → Vercel builds + promotes → `https://www.makanofficial.com/r/<slug>`
  is live.
- **Verify live:** load the URL in a browser; scan the QR at its printed size.

---

## Step 5 — Print + place

`public/venue-qr/<slug>.svg` is vector — it prints crisp at any size. Open it in
a browser and print, or drop it into Figma/Canva/a print shop.

- **Sizing.** A QR needs roughly a **10:1 scan-distance-to-QR-width ratio**. The
  QR is **~53% of the card width** (340 of 640 px), so you print the whole card,
  not the QR alone — size the *card*:

  | Scanned from | Target QR | → print the card |
  |---|---|---|
  | Table / arm's length (~30 cm) | ~3 cm | **~6 cm** wide (A7-ish table card) |
  | Across a room (~2 m) | ~20 cm | **~38 cm** wide (A3-ish poster) |

  Default: a **laminated A6 table tent** (lamination survives grease). The QR is
  minted at error-correction level **Q (~25% recovery)** so it still scans with
  smudges or partial occlusion.
- **Placement:** table tents, by the till, on the menu, on the receipt — wherever
  a diner is already looking at their food. The point is to catch them *while
  they're eating*, when the meal is fresh.
- Hand the venue a few printed cards + tell them the URL
  (`makanofficial.com/r/<slug>`) so they can verify it. **Record** the print +
  placement (date, format) on the venue's Redmine ticket so we know who's
  live-on-a-table vs merely-in-the-registry.

---

## Step 6 — Phase 2 (only once RM18722 lands)

When universal links / AASA ship (RM18722):

1. Set each venue's `googlePlaceId` (= the app's `placeProviderId`):

   ```bash
   npm run venue:set-place-id -- --slug cellar-door --place-id ChIJ...
   ```

   (Don't hand-edit the registry. Changing a Place ID that's already locked needs
   `--force`, because in Phase 2 the Place ID **is** the venue — repointing it
   makes every printed card pre-tag a different restaurant.)
2. The same `/r/<slug>` becomes a universal link that opens the composer
   **pre-tagged** to that venue — closing the auto-tag loop (only ~16% of meals
   are venue-tagged today; venue-taggers retain far better).
3. **No reprint** — the slug and card are unchanged.

Phase 2 needs a Pencil mockup first.

---

## Lifecycle — retiring a venue, fixing a mis-print

**A venue un-signs.** Delete its entry from `lib/venues.data.json` and redeploy.
The route returns a generic landing for any unknown slug (it never 404s), so any
card still in the wild keeps scanning and simply degrades to the plain
get-the-app page — the venue name just stops showing. **Never reuse or rename
that slug for a different venue** (an old printed card would then point people at
the wrong place).

**A card is printed with a typo.**
- **Name or city typo** (same venue, wrong label):

  ```bash
  npm run venue:relabel -- --slug cellar-door --name "Cellar Door" --confirm-same-venue
  ```

  This is the *only* sanctioned way to change a minted venue's label. It updates
  the registry and the lock together, keeps a `history[]` of what the printed
  cards actually say, re-mints, and re-verifies. Cards already out keep scanning
  and show the corrected name once deployed — then reprint.

  `--confirm-same-venue` is required, and it is the whole point: you are stating
  that this is the *same restaurant* with a wrong label. If it's a **different**
  restaurant, stop — use `venue:add` with its own slug. (Editing the name by hand
  instead will fail `venue:check`, on purpose — see below.)
- **Slug typo (already printed):** do NOT rename the printed slug — the lock will
  refuse it, and rightly. Add a **new, correct** entry with `venue:add`, and keep
  the typo slug in the registry as an alias (same name/city) so both the old and
  new cards resolve. Reprint from the corrected slug going forward.

---

## The lock — why you can't just rename a slug

`lib/venues.lock.json` is an append-only ledger of every slug that has ever been
minted into a card, and the venue it was minted for. `venue:check` compares the
registry against it on every build.

**The asymmetry that makes this necessary:** everything else here is recoverable
by a deploy. A wrong page redeploys; a wrong name re-renders. But a QR card is
*physically printed* and sitting on a table in Durham. If a printed slug is ever
repointed at a **different** venue, every card already in the wild starts sending
diners to the wrong restaurant — and you cannot recall them. There is no deploy
that fixes it.

So the lock enforces exactly one rule: **a minted slug may never point at a
different venue.**

- ✅ **Removing** a venue (it un-signed) — fine. The route degrades to the generic
  landing, cards in the wild keep scanning, the slug stays permanently reserved.
- ✅ **Relabelling** the same venue (typo fix) — fine, via `venue:relabel`, which
  moves the lock forward with the registry.
- ❌ **Repointing** a minted slug at a different venue — blocked, at `venue:add`,
  at mint time, and at build time.

The guard isn't trying to read your mind about which of these you meant. It exists
so the irreversible one is **impossible to do silently**.

---

## Invariants — never break these

- **Never rename a live slug, and never point it at a different venue.** The
  cards are physically printed. Removing an entry is fine (card degrades to the
  generic landing); *renaming or repurposing* a printed slug sends people to the
  wrong place. **This is now enforced** by `lib/venues.lock.json` + `venue:check`
  (which runs on every build) — not just by this sentence.
- **Slug = lowercase kebab-case, human-readable.** It's on the card in plain
  sight (`venue:check` enforces the character set; eyeball it for readability).
- **Copy stays honest.** In Phase 1 the venue tag is *not* carried through
  install — the page must **not** promise auto-tagging. It just gets the right
  people onto Makan.
- **The QR encodes the `www` URL.** Skips the apex→www 308 (see `middleware.ts`).
- **Deploy is Devon's call.** Merging (or any push to `main`) = a live
  marketing-site push — always branch + PR, never push to `main` directly.

## Gotchas

- **iCloud hang** — build/render from `~/dev/makan-web-preview`, never the
  Desktop checkout (same class as the Metro hang on the app repo).
- **CTA colour** — the venue page reuses the `AppLanding` button (currently
  **dark-text-on-saffron**, the site's house style). A white-on-saffron site
  redesign is in flight; keep the venue button matching whatever
  `AppLanding`/`FinalCTA` use so it never looks off-brand.
- **Registry is JSON, docs are in `lib/venues.ts`** — edit the data in
  `venues.data.json`; the contract + types live in `venues.ts`. The page
  resolves off each entry's `slug` field, so the JSON key is just for tidiness.

---

## Files at a glance

| File | Role |
|---|---|
| `lib/venues.data.json` | Venue registry (single source of truth). **Written by `venue:add` — don't hand-edit.** |
| `lib/venues.lock.json` | Append-only ledger of minted (printed) slugs. **Never hand-edit.** |
| `lib/venues.ts` | Typed helpers + the dynamic-QR contract docs |
| `app/r/[place]/page.tsx` | The `/r/<slug>` landing page |
| `scripts/venue-lib.mjs` | Shared registry I/O, slug rules, print-safety guard |
| `scripts/venue-add.mjs` | `npm run venue:add` — sign a venue in one command |
| `scripts/venue-check.mjs` | `npm run venue:check` — validation + print-safety (runs on every build) |
| `scripts/generate-venue-qr.mjs` | `npm run venue-qr` — card generator |
| `scripts/verify-venue-qr.mjs` | `npm run venue:verify` — QR round-trip proof |
| `scripts/venue-relabel.mjs` | `npm run venue:relabel` — the sanctioned typo fix |
| `scripts/venue-set-place-id.mjs` | `npm run venue:set-place-id` — the Phase-2 Place ID |
| `public/venue-qr/<slug>.svg` | Generated print-ready cards |
| `vercel.json` | Pins the build command to `npm run build`, so the gate always runs in prod |
