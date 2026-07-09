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

## Step 1 — Add the venue + generate the card (~5 min)

1. Add one entry to [`lib/venues.data.json`](../lib/venues.data.json) — the
   single source of truth for both the page and the card. Insert it as a new
   **comma-separated** key inside the existing object (mind the trailing comma
   on the line above — the file must stay valid JSON):

   ```json
   {
     "cellar-door": { "slug": "cellar-door", "name": "Cellar Door", "city": "Durham" },
     "fiik":        { "slug": "fiik",        "name": "FIIK",        "city": "Durham" }
   }
   ```

   - The top-level **key must equal the `slug` value** (both lowercase
     kebab-case). The page actually resolves off the `slug` field, so a mismatch
     still works — but the generator warns on it; keep them identical.
   - Add `"googlePlaceId": "ChIJ..."` only when you have it (Phase 2).

2. Mint the print-ready card:

   ```bash
   npm run venue-qr
   ```

   → writes `public/venue-qr/<slug>.svg` for every venue in the registry. The QR
   encodes the **www** URL (`https://www.makanofficial.com/r/<slug>`) so a scan
   skips the apex→www redirect. The generator **validates the whole registry
   before writing** — it errors on a malformed JSON file, a bad slug
   (leading/trailing/double hyphens, non-kebab), or a duplicate slug, so a bad
   entry can't reach a printed card.

The `/r/<slug>` page needs no new code; it reads the registry.

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
- **Renders correctly** — load `http://localhost:3119/r/<slug>` and confirm:
  - the venue **name + city** show (eyebrow),
  - **"Download on the App Store"** → `https://apps.apple.com/app/id6756131450`,
  - **"Already have Makan? Open the app"** → `makanapp://`,
  - an unknown slug (`/r/typo`) still renders a valid generic landing (no 404).
  - _If the page shows the generic "Remember every meal." copy instead of the
    venue name, the `slug` field is wrong/mistyped — fix the registry._
- **The QR scans** — open `public/venue-qr/<slug>.svg` on screen and scan it with
  a phone camera; it must land on `/r/<slug>`.

---

## Step 3 — Ship the branch

**Start from a clean tree on `main`.** There is often partner-page or other WIP
uncommitted in this repo — do NOT drag it onto your venue branch.

```bash
git status                                     # if WIP is in flight, stash it or
git checkout main && git pull                  # branch from main explicitly
git checkout -b feat/venue-qr-<slug>           # or feat/venue-qr-<batch> for several

# stage ONLY your venue files — never `git add -A`
git add lib/venues.data.json "public/venue-qr/<slug>.svg"
git commit -m "feat(venue-qr): add <Name> (<City>) — /r/<slug>"
git push -u origin feat/venue-qr-<slug>
```

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

1. Add each venue's `googlePlaceId` (= the app's `placeProviderId`) to
   `lib/venues.data.json`.
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
- **Name or city typo:** correct `lib/venues.data.json`, `npm run venue-qr`,
  redeploy, reprint. Cards already out still scan and show the corrected name
  after deploy.
- **Slug typo (already printed):** do NOT rename the printed slug. Add a **new,
  correct** entry, and keep the typo slug as an **alias** entry (same name/city)
  so both the old and new cards resolve. Reprint from the corrected slug going
  forward.

---

## Invariants — never break these

- **Never rename a live slug, and never point it at a different venue.** The
  cards are physically printed. Removing an entry is fine (card degrades to the
  generic landing); *renaming or repurposing* a printed slug sends people to the
  wrong place.
- **Slug = lowercase kebab-case, human-readable.** It's on the card in plain
  sight (the generator enforces the character set; eyeball it for readability).
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
| `lib/venues.data.json` | Venue registry (single source of truth) |
| `lib/venues.ts` | Typed helpers + the dynamic-QR contract docs |
| `app/r/[place]/page.tsx` | The `/r/<slug>` landing page |
| `scripts/generate-venue-qr.mjs` | Card generator (`npm run venue-qr`) |
| `public/venue-qr/<slug>.svg` | Generated print-ready cards |
