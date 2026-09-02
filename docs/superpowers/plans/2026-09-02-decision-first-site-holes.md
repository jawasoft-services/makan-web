# Decision-First Site — Close the Holes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Take the decision-first homepage from a dev-preview harness that convinces on copy to a deployable page that shows the product, tells the truth about what ships, credits its photos, reads correctly in Indonesian, sits on the real route with metadata, analytics and navigation, is gated on the app work it depends on, and cannot regress silently.

**Architecture:** Everything the page is made of already exists under `components/home/*` and is mounted by `app/[locale]/dev-preview/page.tsx`. This plan (1) adds the one missing section (real app screens), (2) fixes copy seams and the restaurant section, (3) lifts the composition into a `DecisionHome` component that the real `/` route renders behind a build-time gate, and (4) turns this session's browser probes into scripts so collisions, overflow and gate state fail a build instead of a reviewer's eye.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind 4 (custom variants `staged:` and `armed:` in `app/globals.css`), next-intl 4 (`messages/en.json` + `messages/id.json`, key parity enforced by `scripts/check-i18n.mjs`), Lenis, Playwright (new devDependency, Task 9), Lighthouse + axe CLIs (Task 10), Python 3 + Pillow for image prep (already on the machine).

## Global Constraints

- Saffron is exactly `#FF9932` and is never changed; never introduce a `brand-orange-ink` token; no colour literals in components (use `text-brand-orange` / `currentColor`).
- Plus Jakarta Sans only. No em dashes in visible Decision copy. No "honestly". Ten-year-old-readable sentences.
- `messages/en.json` and `messages/id.json` stay in key parity (`npm run lint` runs `check:founder-decisions`, `check:i18n`, `check:contrast` and must pass after every task).
- The `Decision` namespace is filtered out of the client message payload in `app/[locale]/layout.tsx`; gated strings must not appear in production pages (`grep -c "<gated string>" .next/server/app/en/story.html` → `0`).
- Only meal photos that are public on Makan may appear on the site; every photo used gets a line in the credits file (Task 5).
- Never merge or push to `main` (auto-deploys). Never run git with `-c user.email`. Push only when Devon says so.
- Product invariants: no calorie/dish-name structured fields, streaks never freeze, like counts hidden, Maitre'D is earned by visit-days (two inside 60), never bought.
- Release condition (spec D1): the decision home ships only when RM19664 and RM19665 are live in a public build, and RM19505 is live or the Maitre'D rung is removed.
- Dev server: `.claude/launch.json` → `makan-web-saffron-dev` on port 3456. Turbopack sometimes serves stale CSS for new arbitrary classes: `rm -rf .next` and restart when a class you just added has no effect.
- Programmatic scrolling in probes must go through `window.__lenis.scrollTo(y, { immediate: true, force: true })`; `window.scrollTo` is ignored. Wait for real animation frames (`requestAnimationFrame` chains), not timers, before reading layout.

---

## File map

| Path | Responsibility |
|---|---|
| `components/home/SeeTheApp.tsx` (create) | Two real app screens in phone frames, between the proof scene and the first-day scene |
| `public/app-screens/story/eat-or-yeet.webp`, `diary.webp` (create) | 720px-wide, exif-stripped copies of the signed-in screenshots |
| `components/home/StoreLink.tsx` (create) | Client `<a>` to the App Store that fires the `App Store CTA Clicked` analytics event |
| `components/home/DecisionHome.tsx` (create) | The full page composition, used by both `/dev-preview` and `/` |
| `components/home/ForRestaurants.tsx` (modify) | Adds the two handout numbers with sources and the "you do almost nothing" list |
| `lib/faq.ts` (modify) | Closes the "only you vote" / "other people's picks" seam |
| `app/[locale]/page.tsx` (modify) | Renders `DecisionHome` when the gate allows, legacy home otherwise |
| `app/[locale]/partner/page.tsx` (modify) | Says what the handout says, in the handout's order |
| `docs/decision-first/photo-credits.md` (create) | One line per story photo: file, source, account, public, date |
| `docs/decision-first/gate.json` (create) | Ticket states the release condition reads |
| `scripts/check-photo-credits.mjs` (create) | Every referenced story photo has a credit line |
| `scripts/check-decision-gate.mjs` (create) | Build fails if the decision home is on and the gate is not met |
| `scripts/check-scenes.mjs` (create) | Playwright: collisions, overflow, flight landing, at two viewports |
| `scripts/id-review-sheet.mjs` (create) | Writes the en/id side-by-side sheet Devon reviews |
| `package.json` (modify) | New scripts wired into `lint`, `prebuild`, and a `check:scenes` / `audit:home` pair |

---

### Task 1: Show the product — `SeeTheApp`

The single biggest gap from every audit: a diner never sees a screen of Makan. Two real signed-in screenshots exist in the project folder. Use them.

**Files:**
- Create: `components/home/SeeTheApp.tsx`
- Create: `public/app-screens/story/eat-or-yeet.webp`, `public/app-screens/story/diary.webp`
- Modify: `messages/en.json`, `messages/id.json` (new `Decision.App` namespace)
- Modify: `app/[locale]/dev-preview/page.tsx` (mount between `EatOrYeetScene` and `FirstDayScene`)

**Interfaces:**
- Produces: `export default async function SeeTheApp(): Promise<JSX.Element>` — server component, no props.

- [ ] **Step 1: Prepare the two screens (720px wide, WebP, no metadata)**

```bash
cd ~/dev/makan-web-saffron && mkdir -p public/app-screens/story && python3 - <<'EOF'
from PIL import Image
src = "/Users/devonmakepeace/Desktop/Projects/MAKAN/"
for name, out in (("02-eat-or-yeet-comparison-signed-in.png.png", "eat-or-yeet"), ("01-diary-calendar-signed-in.png.png", "diary")):
    im = Image.open(src + name).convert("RGB")
    w, h = im.size
    im = im.resize((720, round(h * 720 / w)), Image.LANCZOS)
    im.save(f"public/app-screens/story/{out}.webp", "WEBP", quality=84, method=6)
    print(out, im.size)
EOF
ls -la public/app-screens/story
```
Expected: two files, each under 200KB, sizes `(720, 1565)`.

- [ ] **Step 2: Add the copy (both locales)**

```bash
cd ~/dev/makan-web-saffron && python3 - <<'EOF'
import json, collections
def load(p): return json.load(open(p), object_pairs_hook=collections.OrderedDict)
en = load("messages/en.json"); idn = load("messages/id.json")
en["Decision"]["App"] = collections.OrderedDict([
  ("eyebrow", "This is Makan"),
  ("title", "Two screens you'll use most."),
  ("shot1Title", "Eat or Yeet"),
  ("shot1Body", "Two meals you saved. Tap the one you'd eat again first. Ten seconds, when you're bored."),
  ("shot1Alt", "The Eat or Yeet screen in Makan: two saved meals side by side"),
  ("shot2Title", "Your meals"),
  ("shot2Body", "Every photo you've taken, by day. The answer on the menu comes from here."),
  ("shot2Alt", "The diary screen in Makan: a calendar of saved meals"),
  ("soon", "The menu that gets answered is being built now. These two screens are in the app today."),
])
idn["Decision"]["App"] = collections.OrderedDict([
  ("eyebrow", "Ini Makan"),
  ("title", "Dua layar yang paling sering kamu pakai."),
  ("shot1Title", "Eat or Yeet"),
  ("shot1Body", "Dua makanan yang kamu simpan. Ketuk yang mau kamu makan lagi duluan. Sepuluh detik, saat kamu bosan."),
  ("shot1Alt", "Layar Eat or Yeet di Makan: dua makanan tersimpan berdampingan"),
  ("shot2Title", "Makananmu"),
  ("shot2Body", "Semua foto yang kamu ambil, per hari. Jawaban di menu datang dari sini."),
  ("shot2Alt", "Layar jurnal di Makan: kalender makanan tersimpan"),
  ("soon", "Menu yang dijawab sedang dibangun sekarang. Dua layar ini sudah ada di aplikasi hari ini."),
])
for p, d in (("messages/en.json", en), ("messages/id.json", idn)):
    json.dump(d, open(p, "w"), ensure_ascii=False, indent=2); open(p, "a").write("\n")
EOF
npm run lint 2>&1 | grep -c passed
```
Expected: `3`.

- [ ] **Step 3: Write the component**

```tsx
// components/home/SeeTheApp.tsx
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import Reveal from "@/components/motion/Reveal"

// The two screens a diner actually uses: the game that teaches Makan taste,
// and the diary the answer is drawn from. Real signed-in screenshots. The
// `soon` line keeps the page honest about the menu surface (RM19664/5).
const SHOTS = [
  { src: "/app-screens/story/eat-or-yeet.webp", titleKey: "shot1Title", bodyKey: "shot1Body", altKey: "shot1Alt" },
  { src: "/app-screens/story/diary.webp", titleKey: "shot2Title", bodyKey: "shot2Body", altKey: "shot2Alt" },
] as const

export default async function SeeTheApp() {
  const t = await getTranslations("Decision.App")
  return (
    <section id="features" className="w-full bg-brand-cream px-6 py-20 md:px-10 md:py-28">
      <Reveal className="mx-auto max-w-5xl">
        <p data-beat className="text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-brand-orange md:text-[0.74rem]">
          {t("eyebrow")}
        </p>
        <h2
          data-beat
          style={{ "--beat": 1 } as React.CSSProperties}
          className="mt-4 max-w-[18ch] text-[clamp(2rem,4vw,3.4rem)] font-bold leading-[1.02] tracking-[-0.02em] text-brand-ink"
        >
          {t("title")}
        </h2>
        <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          {SHOTS.map((shot, i) => (
            <figure key={shot.src} data-beat style={{ "--beat": 2 + i } as React.CSSProperties} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-6">
              {/* Phone frame: ink bezel, rounded, the screenshot inside. */}
              <div className="mx-auto w-full max-w-[15rem] rounded-[2.2rem] border-[6px] border-brand-ink bg-brand-ink shadow-[0_1px_2px_rgba(43,21,3,0.08),0_16px_32px_-18px_rgba(43,21,3,0.5)]">
                <div className="overflow-hidden rounded-[1.8rem]">
                  <Image src={shot.src} alt={t(shot.altKey)} width={720} height={1565} sizes="(min-width: 768px) 240px, 60vw" className="block h-auto w-full" />
                </div>
              </div>
              <figcaption>
                <p className="text-[1.25rem] font-bold tracking-[-0.01em] text-brand-ink">{t(shot.titleKey)}</p>
                <p className="mt-2 text-[1rem] leading-[1.55] text-brand-ink">{t(shot.bodyKey)}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <p data-beat style={{ "--beat": 4 } as React.CSSProperties} className="mt-12 max-w-[52ch] text-[0.9rem] font-semibold leading-[1.5] text-brand-orange">
          {t("soon")}
        </p>
      </Reveal>
    </section>
  )
}
```

- [ ] **Step 4: Mount it and type-check**

In `app/[locale]/dev-preview/page.tsx`, add `import SeeTheApp from "@/components/home/SeeTheApp"` and render `<SeeTheApp />` directly after `<EatOrYeetScene />`.

```bash
cd ~/dev/makan-web-saffron && npx tsc --noEmit -p . && npm run lint 2>&1 | grep -c passed
```
Expected: no type errors, `3`.

- [ ] **Step 5: Verify in the browser (pane at 1280×720 and mobile)**

Open `http://localhost:3456/en/dev-preview`. Run in the console:

```js
const s = document.getElementById('features');
const imgs = [...s.querySelectorAll('img')];
await Promise.all(imgs.map(i => i.complete ? 1 : new Promise(r => { i.onload = r; i.onerror = r })));
({ loaded: imgs.filter(i => i.naturalWidth > 0).length, of: imgs.length, h: Math.round(s.getBoundingClientRect().height), overflow: document.documentElement.scrollWidth > innerWidth })
```
Expected: `loaded: 2, of: 2`, `overflow: false` at both sizes. Take a screenshot at each size and confirm the phone frames are not clipped and the captions sit beside them (desktop) or below them (mobile).

- [ ] **Step 6: Commit**

```bash
cd ~/dev/makan-web-saffron && git add -A && git commit -m "feat(home): show the product — two real screens in phone frames

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 2: Close the FAQ seam ("only you vote" vs "other people's picks")

**Files:**
- Modify: `lib/faq.ts` — the `What is Eat or Yeet?` answer in `FAQS` (index 5) and `FAQS_ID` (index 5)

- [ ] **Step 1: Write the failing check**

```bash
cd ~/dev/makan-web-saffron && grep -c "nobody votes on your meals but you" lib/faq.ts
```
Expected: `0`.

- [ ] **Step 2: Replace the two sentences**

In `lib/faq.ts`, `FAQS[5].a` currently ends `It's your taste, so only you get a vote.` Replace that sentence with:

```
It's your taste: nobody votes on your meals but you. Makan only ever adds other people's picks up as totals, for the place, never for your dishes.
```

`FAQS_ID[5].a` ends with the Indonesian equivalent of that sentence; replace it with:

```
Ini seleramu: tidak ada yang menilai makananmu selain kamu. Makan hanya menjumlahkan pilihan orang lain sebagai total untuk tempatnya, bukan untuk makananmu.
```

- [ ] **Step 3: Verify**

```bash
cd ~/dev/makan-web-saffron && grep -c "nobody votes on your meals but you" lib/faq.ts && grep -c "tidak ada yang menilai makananmu" lib/faq.ts && npx tsc --noEmit -p .
```
Expected: `1`, `1`, no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/faq.ts && git commit -m "copy(faq): your vote is yours; other people's picks are totals for the place

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 3: Restaurant section — the numbers and "you do almost nothing"

**Files:**
- Modify: `components/home/ForRestaurants.tsx`
- Modify: `messages/en.json`, `messages/id.json` (`Decision.Restaurants` gains keys)

- [ ] **Step 1: Add the copy**

```bash
cd ~/dev/makan-web-saffron && python3 - <<'EOF'
import json, collections
def load(p): return json.load(open(p), object_pairs_hook=collections.OrderedDict)
en = load("messages/en.json"); idn = load("messages/id.json")
en["Decision"]["Restaurants"].update({
  "stat1": "60%", "stat1Body": "of restaurant revenue comes from repeat guests.", "stat1Src": "Olo, 100 million guest records, 2024",
  "stat2": "48%", "stat2Body": "of guests say being remembered matters more than points.", "stat2Src": "Toast & Resy, The Regulars Report, 2026",
  "doTitle": "What you have to do: almost nothing.",
  "do1": "Sign up once. Confirm you're the real place.",
  "do2": "When a new diner redeems an offer, staff glance at their code and tap once.",
  "do3": "You don't track anything. Makan works out who your Maitre'D is.",
})
idn["Decision"]["Restaurants"].update({
  "stat1": "60%", "stat1Body": "pendapatan restoran datang dari tamu yang kembali.", "stat1Src": "Olo, 100 juta catatan tamu, 2024",
  "stat2": "48%", "stat2Body": "tamu bilang diingat lebih penting daripada poin.", "stat2Src": "Toast & Resy, The Regulars Report, 2026",
  "doTitle": "Yang harus kamu lakukan: hampir tidak ada.",
  "do1": "Daftar sekali. Konfirmasi kamu tempat yang asli.",
  "do2": "Saat tamu baru menukar promo, staf melihat kodenya dan ketuk sekali.",
  "do3": "Kamu tidak perlu mencatat apa pun. Makan yang menentukan siapa Maitre'D-mu.",
})
for p, d in (("messages/en.json", en), ("messages/id.json", idn)):
    json.dump(d, open(p, "w"), ensure_ascii=False, indent=2); open(p, "a").write("\n")
EOF
npm run lint 2>&1 | grep -c passed
```
Expected: `3`.

- [ ] **Step 2: Render them**

In `components/home/ForRestaurants.tsx`, directly after the `<ul>` of `p1..p3` and before the `honest` paragraph, insert:

```tsx
          {/* Two numbers from the handout, each with its source in ink. */}
          <dl className="mt-10 grid max-w-[52ch] grid-cols-2 gap-6">
            {(["stat1", "stat2"] as const).map((k, i) => (
              <div key={k} data-beat style={{ "--beat": 6 + i } as React.CSSProperties}>
                <dt className="text-[2.4rem] font-bold leading-none tracking-[-0.02em] text-brand-orange">{t(k)}</dt>
                <dd className="mt-2 text-[0.95rem] font-semibold leading-[1.45] text-brand-ink">{t(`${k}Body`)}</dd>
                <dd className="mt-1 text-[0.78rem] leading-[1.4] text-brand-muted">{t(`${k}Src`)}</dd>
              </div>
            ))}
          </dl>
          <p data-beat style={{ "--beat": 8 } as React.CSSProperties} className="mt-10 text-[1.05rem] font-bold text-brand-ink">{t("doTitle")}</p>
          <ol className="mt-3 max-w-[52ch] space-y-2">
            {(["do1", "do2", "do3"] as const).map((k, i) => (
              <li key={k} data-beat style={{ "--beat": 9 + i } as React.CSSProperties} className="flex items-baseline gap-3 text-[1rem] leading-[1.5] text-brand-ink">
                <span className="text-[0.8rem] font-bold text-brand-orange">{i + 1}.</span>
                {t(k)}
              </li>
            ))}
          </ol>
```

Then change the `honest` paragraph's `--beat` from `6` to `12` and the CTA's from `7` to `13`.

- [ ] **Step 3: Verify contrast and collisions**

`text-brand-muted` on white is the source line only (4.72:1 on paper, higher on white; passes). Run the collision probe from Task 9's script if it exists yet; otherwise in the console at 1280×720:

```js
const s = document.getElementById('for-restaurants');
const L = [...s.querySelectorAll('*')].filter(e => [...e.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim())).map(e => e.getBoundingClientRect());
let n = 0; for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) { const a = L[i], b = L[j]; if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) n++ } n
```
Expected: `0` (nested text elements are excluded by the Task 9 script; a handful of parent/child pairs here is fine, but two sibling lines overlapping is not).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(home): restaurant section — the two numbers and what you have to do

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 4: Partner page says what the handout says

**Files:**
- Modify: `app/[locale]/partner/page.tsx` (keep `PartnerForm.tsx` untouched)
- Modify: `messages/en.json`, `messages/id.json` (`Partner` namespace, whichever keys the page already reads; add the ones below)

- [ ] **Step 1: Read the page and list the gaps**

```bash
cd ~/dev/makan-web-saffron && grep -n "t(\"\|t('" "app/[locale]/partner/page.tsx" | head -60 && python3 -c "import json;d=json.load(open('messages/en.json'));print(json.dumps(d.get('Partner', d.get('PartnerPage', {})), indent=1, ensure_ascii=False)[:3000])"
```
Compare against the handout's required statements (page numbers from `external/Makan-Restaurant-Handout-branded.pdf`):

| # | Statement the page must make | Handout |
|---|---|---|
| 1 | Makan is the app people open when staring at a menu and don't know what to pick. | p3 |
| 2 | Maître d': two visit-days inside 60 days to qualify; whoever comes most holds it; earned by eating, never bought; quiet handover; win it back by coming in. | p3 |
| 3 | The Maître d' leaves a short guide: always get this, try this if, good to know. | p4 |
| 4 | You already do this for your langganan; Makan writes it down. | p4 |
| 5 | 60% of revenue from repeat guests (Olo); 48% say being remembered matters most (Toast & Resy). | p5 |
| 6 | Good rewards: saved table, coffee on the house, first to try a new dish, a small sign. Reward for showing up, never for a review. | p7 |
| 7 | What you do: sign up once; staff glance and tap once; you track nothing. | p7 |
| 8 | New customers: a discount nearby, you pay only when it works, you choose when it's on; the deal sits beside the honest recommendation and never buys it. | p8 |
| 9 | Costs: nothing to be on; the perk you pick; discounts only when someone turns up; flat Rp 10,000 per new diner redeemed; never a fee to appear, never a cut, never a monthly charge. | p9 |
| 10 | Never: pay-to-win, forced discounting, hidden fees on diners' spend. | p10 |
| 11 | Honest bit: designed and signed off, not built yet; building with a handful first; you pay nothing until it's on. | p10 |

- [ ] **Step 2: Write the failing check**

```bash
cd ~/dev/makan-web-saffron && for s in "two visit-days" "never bought" "always get this" "60%" "48%" "Rp 10,000" "not built yet" "never a cut"; do printf "%s: " "$s"; grep -ci "$s" messages/en.json; done
```
Expected: mostly `0` (the homepage section already carries a few; the partner namespace must carry all).

- [ ] **Step 3: Add the missing statements to the `Partner` namespace (both locales) and render them in the page's existing section pattern**

Follow the page's existing structure (eyebrow + h2 + paragraphs). For each row in the table above that the page lacks, add a keyed string pair in `messages/en.json`/`id.json` under the namespace the page reads, and a matching block in `page.tsx`. Use the handout's sentences verbatim where they are already plain (rows 2, 3, 7, 9, 10, 11). Keep every number with its source line.

- [ ] **Step 4: Verify**

```bash
cd ~/dev/makan-web-saffron && for s in "two visit-days" "never bought" "always get this" "60%" "48%" "Rp 10,000" "not built yet" "never a cut"; do printf "%s: " "$s"; grep -ci "$s" messages/en.json; done; npm run lint 2>&1 | grep -c passed
```
Expected: every count ≥ `1`; `3`. Open `http://localhost:3456/en/partner` and read it top to bottom once as an owner.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "copy(partner): the restaurant page says what the handout says

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 5: Photo credits and consent, enforced

**Files:**
- Create: `docs/decision-first/photo-credits.md`
- Create: `scripts/check-photo-credits.mjs`
- Modify: `package.json` (`lint` runs it)
- Modify: `messages/en.json`, `messages/id.json` (`Decision.FirstDay.friendMealSub` once Devon supplies the handle)

**Interfaces:**
- Produces: `npm run check:photo-credits` → exit 0 when every `/meals/story/<file>` referenced under `components/` has a row in the credits file whose `public` column is `yes`.

- [ ] **Step 1: Write the credits file**

```markdown
# Story photo credits

Every photo in `public/meals/story/` was public on Makan when copied. Source ids are Firestore `meals` document ids (read-only query, ADC, project `munchies-expo`, 2026-09-02).

| file | dish | account | public | date | source |
|---|---|---|---|---|---|
| card-30.jpg | ROS BEEEEF | (share card, live meal strip) | yes | — | live strip |
| card-40.jpg | Sushi | (share card, live meal strip) | yes | — | live strip |
| card-46.jpg | Fish Sando | (share card, live meal strip) | yes | — | live strip |
| IMG_6959.jpg | Hangover Tom yum | (share card, live meal strip) | yes | — | live strip |
| card-05.jpg | Bacon and Brie | (share card, live meal strip) | yes | — | live strip |
| card-15.jpg | Date night | (share card, live meal strip) | yes | — | live strip |
| lucky-plaza-chicken-rice-1.jpg | Chicken rice, Lucky Plaza | uid 644Yh… | yes | 2026-08-10 | meals/1UwpCJ9znTJSH7LFKOoM |
| lucky-plaza-chicken-rice-2.jpg | Chicken rice, Lucky Plaza | uid 644Yh… | yes | 2026-08-12 | meals/H20DLnOGp5Ew72sDdu6u |
| lucky-plaza-chicken-rice-3.jpg | Chicken rice, Lucky Plaza | uid 644Yh… | yes | 2026-08-21 | meals/fySk8AxebZPdxNbEBLWK |

Handle to print on the card: **pending Devon** (the username lookup is out of scope for the agent; Devon names the account or it stays "Saved at Lucky Plaza").
```

- [ ] **Step 2: Write the failing check**

```js
// scripts/check-photo-credits.mjs
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

const credits = readFileSync("docs/decision-first/photo-credits.md", "utf8")
const credited = new Map(
  [...credits.matchAll(/^\| ([\w.-]+\.jpg) \|[^|]*\|[^|]*\| (yes|no) \|/gm)].map((m) => [m[1], m[2] === "yes"]),
)
const files = []
const walk = (dir) => { for (const f of readdirSync(dir)) { const p = join(dir, f); statSync(p).isDirectory() ? walk(p) : (/\.(tsx?|mjs)$/.test(f) && files.push(p)) } }
walk("components")
const referenced = new Set()
for (const f of files) for (const m of readFileSync(f, "utf8").matchAll(/\/meals\/story\/([\w.-]+\.jpg)/g)) referenced.add(m[1])
let failed = false
for (const file of referenced) {
  if (!credited.has(file)) { console.error(`photo-credits: ${file} is used but has no credit line`); failed = true }
  else if (!credited.get(file)) { console.error(`photo-credits: ${file} is not marked public`); failed = true }
}
if (failed) process.exit(1)
console.log(`photo-credits passed — ${referenced.size} story photos credited and public.`)
```

- [ ] **Step 3: Run it to verify it fails before the credits file exists, then passes**

```bash
cd ~/dev/makan-web-saffron && mv docs/decision-first/photo-credits.md /tmp/pc.md && node scripts/check-photo-credits.mjs; echo "exit $?"; mv /tmp/pc.md docs/decision-first/photo-credits.md && node scripts/check-photo-credits.mjs
```
Expected: first run errors (`ENOENT` or "no credit line") with `exit 1`; second run prints `photo-credits passed — 9 story photos credited and public.`

- [ ] **Step 4: Wire into lint**

In `package.json`, add `"check:photo-credits": "node scripts/check-photo-credits.mjs"` and append ` && npm run check:photo-credits` to the `lint` script.

```bash
cd ~/dev/makan-web-saffron && npm run lint 2>&1 | grep -c passed
```
Expected: `4`.

- [ ] **Step 5: When Devon gives the handle, print it**

Set `Decision.FirstDay.friendMealSub` to `Saved by @<handle> · three visits in August` (id: `Disimpan @<handle> · tiga kali di Agustus`) and update the credits file's "Handle to print" line. Until then this step stays unchecked and the card reads "Saved at Lucky Plaza, three times".

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore(home): photo credits file, enforced by lint

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 6: Indonesian review sheet

Devon is a native speaker; the agent wrote every Indonesian line. Give him one file to read.

**Files:**
- Create: `scripts/id-review-sheet.mjs`
- Create (generated): `docs/decision-first/id-review.md`

- [ ] **Step 1: Write the generator**

```js
// scripts/id-review-sheet.mjs — writes an en/id side-by-side sheet for the Decision namespace
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
const en = JSON.parse(readFileSync("messages/en.json", "utf8")).Decision
const id = JSON.parse(readFileSync("messages/id.json", "utf8")).Decision
const rows = []
for (const ns of Object.keys(en)) for (const k of Object.keys(en[ns])) rows.push([`${ns}.${k}`, en[ns][k], id[ns]?.[k] ?? "(missing)"])
const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ")
const out = ["# Indonesian review — Decision namespace", "", "Mark a row `fix` in the last column and write the better line under it. Rows without `fix` are approved.", "", "| key | en | id | fix? |", "|---|---|---|---|", ...rows.map(([k, e, i]) => `| \`${k}\` | ${esc(e)} | ${esc(i)} | |`), ""]
mkdirSync("docs/decision-first", { recursive: true })
writeFileSync("docs/decision-first/id-review.md", out.join("\n"))
console.log(`id-review: ${rows.length} rows written to docs/decision-first/id-review.md`)
```

- [ ] **Step 2: Run it**

```bash
cd ~/dev/makan-web-saffron && node scripts/id-review-sheet.mjs && head -12 docs/decision-first/id-review.md
```
Expected: `id-review: <N> rows written` with N equal to the number of Decision keys (about 110), and a table header.

- [ ] **Step 3: Devon reviews; apply his fixes to `messages/id.json`; regenerate; lint**

```bash
cd ~/dev/makan-web-saffron && node scripts/id-review-sheet.mjs && npm run lint 2>&1 | grep -c passed
```
Expected: `4`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "docs(i18n): Indonesian review sheet for the decision copy

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 7: The real route — `DecisionHome`, metadata, analytics, navigation

**Files:**
- Create: `components/home/DecisionHome.tsx`
- Create: `components/home/StoreLink.tsx`
- Modify: `components/home/Hero.tsx`, `components/home/EatOrYeetScene.tsx`, `components/home/FinalAsk.tsx` (use `StoreLink`)
- Modify: `components/home/HeroDiptych.tsx` (section id `how-it-works` on the `#story` wrapper), `components/home/EatOrYeetScene.tsx` (id `proof`), `components/home/FirstDayScene.tsx` (id `first-day`), `components/home/WontDo.tsx` (id `wont-do`)
- Modify: `app/[locale]/dev-preview/page.tsx` (renders `DecisionHome`)
- Modify: `app/[locale]/page.tsx` (renders `DecisionHome` when `process.env.DECISION_HOME === "1"`)
- Modify: `messages/en.json`, `messages/id.json` (`Metadata.decisionHome`)

**Interfaces:**
- Produces: `export default async function DecisionHome({ locale }: { locale: string })`, `export default function StoreLink({ location, className, children }: { location: string; className?: string; children: React.ReactNode })`.

- [ ] **Step 1: `StoreLink` — the CTA that reports itself**

```tsx
// components/home/StoreLink.tsx
"use client"

import { useLocale } from "next-intl"
import { track } from "@vercel/analytics"
import { APP_STORE_URL } from "@/lib/links"

/** App Store link that fires the same event the legacy hero fires, so the
 *  dashboard's funnel keeps working across the redesign. */
export default function StoreLink({ location, className, children }: { location: string; className?: string; children: React.ReactNode }) {
  const locale = useLocale()
  return (
    <a href={APP_STORE_URL} className={className} onClick={() => track("App Store CTA Clicked", { location, locale })}>
      {children}
    </a>
  )
}
```

- [ ] **Step 2: Use it in the three CTAs**

In `Hero.tsx`, `EatOrYeetScene.tsx`, `FinalAsk.tsx` replace each `<a href={APP_STORE_URL} className="…">{t("cta")}</a>` with `<StoreLink location="hero" className="…">{t("cta")}</StoreLink>` (locations: `hero`, `proof`, `final`), keeping the className unchanged, and remove the now-unused `APP_STORE_URL` import from each file.

```bash
cd ~/dev/makan-web-saffron && grep -n "StoreLink location" components/home/*.tsx | wc -l && npx tsc --noEmit -p .
```
Expected: `3`, no errors.

- [ ] **Step 3: Section ids the navbar and analytics already expect**

- `HeroDiptych.tsx`: `<div id="story" …>` → `<div id="how-it-works" …>` and change the hero's `href="#story"` in `Hero.tsx` to `href="#how-it-works"`.
- `EatOrYeetScene.tsx`: add `id="proof"` to the `ScrollScene` root via a new optional `id` prop on `ScrollScene` (`id?: string` passed to the root div).
- `FirstDayScene.tsx`: `id="first-day"` the same way.
- `WontDo.tsx`: `<section id="wont-do" …>`.
- `SeeTheApp.tsx` already carries `id="features"`, `ForRestaurants.tsx` carries `id="for-restaurants"`, `FAQ.tsx` carries `id="faq"`.

`components/HomepageAnalytics.tsx` observes elements by id; check its selector list and add `how-it-works`, `features`, `proof`, `first-day`, `wont-do`, `for-restaurants`, `faq` if it enumerates ids rather than all `section[id]`.

- [ ] **Step 4: `DecisionHome`**

```tsx
// components/home/DecisionHome.tsx
import Hero from "@/components/home/Hero"
import HeroDiptych from "@/components/home/HeroDiptych"
import EatOrYeetScene from "@/components/home/EatOrYeetScene"
import SeeTheApp from "@/components/home/SeeTheApp"
import FirstDayScene from "@/components/home/FirstDayScene"
import WontDo from "@/components/home/WontDo"
import ForRestaurants from "@/components/home/ForRestaurants"
import FinalAsk from "@/components/home/FinalAsk"
import LatestOnMakan from "@/components/LatestOnMakan"
import FAQ from "@/components/FAQ"
import FaqSchema from "@/components/FaqSchema"
import Footer from "@/components/Footer"
import SiteSchema from "@/components/SiteSchema"
import HomepageAnalytics from "@/components/HomepageAnalytics"
import { getDecisionFaqs } from "@/lib/faq"
import { getMealCount, getRecentPublicMeals } from "@/lib/makan-stats"

/** The decision-first homepage, in page order. Used by `/` (gated) and by
 *  `/dev-preview` (always). */
export default async function DecisionHome({ locale }: { locale: string }) {
  const faqs = getDecisionFaqs(locale)
  const [mealCount, liveMeals] = await Promise.all([getMealCount(), getRecentPublicMeals()])
  return (
    <main id="main-content" className="pt-20">
      <SiteSchema locale={locale} />
      <HomepageAnalytics />
      <Hero />
      <HeroDiptych />
      <EatOrYeetScene />
      <SeeTheApp />
      <FirstDayScene />
      <div className="relative z-0 md:armed:-mt-[100vh]">
        <div className="md:armed:sticky md:armed:top-0">
          <WontDo />
          <LatestOnMakan mealCount={mealCount} liveMeals={liveMeals} />
        </div>
        <div aria-hidden className="hidden md:armed:block md:armed:h-screen" />
      </div>
      <ForRestaurants />
      <FaqSchema items={faqs} />
      <FAQ items={faqs} />
      <FinalAsk />
      <Footer />
    </main>
  )
}
```

`app/[locale]/dev-preview/page.tsx` becomes: notFound in production, `setRequestLocale(locale)`, `return <DecisionHome locale={locale} />`.

- [ ] **Step 5: Gate the real route and its metadata**

In `app/[locale]/page.tsx`:

```tsx
import DecisionHome from "@/components/home/DecisionHome"
const DECISION_HOME = process.env.DECISION_HOME === "1"
```
In `generateMetadata`, use namespace `Metadata.decisionHome` when `DECISION_HOME`, else `Metadata.home`. In the component body, `if (DECISION_HOME) return <DecisionHome locale={locale} />` before the legacy tree.

Add to both message files under `Metadata`:

```json
"decisionHome": {
  "title": "Makan — Know what to order",
  "description": "Take a photo of what you eat. Makan works out what you like, and what people keep ordering where you are. Then it tells you what to order. Free on iPhone."
}
```
(id: `"Makan — Tahu mau pesan apa"`, `"Foto apa yang kamu makan. Makan mencari tahu apa yang kamu suka, dan apa yang terus dipesan orang di tempat kamu berada. Lalu dia kasih tahu kamu mau pesan apa. Gratis di iPhone."`)

- [ ] **Step 6: Verify both routes and the leak**

```bash
cd ~/dev/makan-web-saffron && npx tsc --noEmit -p . && npm run lint 2>&1 | grep -c passed && rm -rf .next && npm run build 2>&1 | tail -3 && grep -c "No guessing" .next/server/app/en.html .next/server/app/en/story.html
```
Expected: `4`; build succeeds; both greps `0` (gate off, legacy home rendered). Then:

```bash
cd ~/dev/makan-web-saffron && DECISION_HOME=1 npm run build 2>&1 | tail -3 && grep -c "No guessing" .next/server/app/en.html && grep -o "<title>[^<]*</title>" .next/server/app/en.html
```
Expected: build succeeds; `1` (or more); `<title>Makan — Know what to order</title>`. Then `rm -rf .next` and restart the dev server.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(home): DecisionHome on the real route behind DECISION_HOME, with metadata, analytics and nav ids

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 8: Deploy gate as code

**Files:**
- Create: `docs/decision-first/gate.json`
- Create: `scripts/check-decision-gate.mjs`
- Modify: `package.json` (`prebuild`)

**Interfaces:**
- Produces: `npm run check:decision-gate` → exit 1 when `DECISION_HOME=1` and the gate is not met; exit 0 otherwise.

- [ ] **Step 1: The gate file (current truth)**

```json
{
  "note": "Release condition from docs/superpowers/specs/2026-09-01-decision-first-website-design.md D1. Update statuses from Redmine before flipping DECISION_HOME.",
  "RM19664": { "title": "Dish-level decision surface", "live": false },
  "RM19665": { "title": "Decision fallback ladder", "live": false },
  "RM19505": { "title": "Maitre'D — restaurant loyalty status", "live": false },
  "maitredRungOnSite": true
}
```

- [ ] **Step 2: The check**

```js
// scripts/check-decision-gate.mjs
import { readFileSync } from "node:fs"
if (process.env.DECISION_HOME !== "1") { console.log("decision-gate: DECISION_HOME is off; nothing to check."); process.exit(0) }
const g = JSON.parse(readFileSync("docs/decision-first/gate.json", "utf8"))
const problems = []
if (!g.RM19664?.live) problems.push("RM19664 (decision surface) is not live")
if (!g.RM19665?.live) problems.push("RM19665 (fallback ladder) is not live")
if (g.maitredRungOnSite && !g.RM19505?.live) problems.push("RM19505 (Maitre'D) is not live and the Maitre'D rung is still on the site")
if (problems.length) { for (const p of problems) console.error(`decision-gate: ${p}`); console.error("decision-gate: refusing to build the decision home. Update docs/decision-first/gate.json from Redmine or unset DECISION_HOME."); process.exit(1) }
console.log("decision-gate passed — release condition met.")
```

- [ ] **Step 3: Verify both outcomes**

```bash
cd ~/dev/makan-web-saffron && node scripts/check-decision-gate.mjs; DECISION_HOME=1 node scripts/check-decision-gate.mjs; echo "exit $?"
```
Expected: first prints "DECISION_HOME is off"; second lists three problems and `exit 1`.

- [ ] **Step 4: Wire into `prebuild`**

In `package.json` add `"check:decision-gate": "node scripts/check-decision-gate.mjs"` and `"prebuild": "npm run check:decision-gate"` (if a `prebuild` exists, append with `&&`).

```bash
cd ~/dev/makan-web-saffron && DECISION_HOME=1 npm run build 2>&1 | grep -c "refusing to build"
```
Expected: `1` (build stops).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore(release): decision home cannot build until the gate is met

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 9: Scene regression guard (Playwright)

Turn this session's console probes into a script. It fails on any two visible, non-nested text elements overlapping, on visible content past the fold at 1280×720, on a flight landing more than 4px from its receipt, and on horizontal overflow at 375px.

**Files:**
- Create: `scripts/check-scenes.mjs`
- Modify: `package.json` (`check:scenes`, `playwright` devDependency)

- [ ] **Step 1: Install**

```bash
cd ~/dev/makan-web-saffron && npm i -D playwright@1 && npx playwright install chromium 2>&1 | tail -1
```

- [ ] **Step 2: The script**

```js
// scripts/check-scenes.mjs — run against a dev or built server: BASE=http://localhost:3456 node scripts/check-scenes.mjs
import { chromium } from "playwright"
const BASE = process.env.BASE ?? "http://localhost:3456"
const URL = `${BASE}/en/dev-preview`
const browser = await chromium.launch()
const failures = []

const probeSource = `
  window.__probe = {
    eff(el){let o=1;for(let e=el;e&&e!==document.body;e=e.parentElement){const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')return 0;o*=+cs.opacity}return o},
    leaves(root){return [...root.querySelectorAll('*')].filter(e=>!e.closest('svg')&&!e.classList.contains('sr-only')&&[...e.childNodes].some(n=>n.nodeType===3&&n.nodeValue.trim())).filter(e=>this.eff(e)>0.5).map(e=>({e,r:e.getBoundingClientRect(),t:e.textContent.trim().slice(0,24)})).filter(x=>x.r.width>0&&x.r.height>0)},
    collide(root){const L=this.leaves(root);const out=[];for(let i=0;i<L.length;i++)for(let j=i+1;j<L.length;j++){const a=L[i],b=L[j];if(a.e.contains(b.e)||b.e.contains(a.e))continue;const ox=Math.min(a.r.right,b.r.right)-Math.max(a.r.left,b.r.left),oy=Math.min(a.r.bottom,b.r.bottom)-Math.max(a.r.top,b.r.top);if(ox>2&&oy>2&&a.t!=='or'&&b.t!=='or')out.push(a.t+' × '+b.t)}return out},
    frames(n){return new Promise(r=>{let k=0;const t=()=>{if(++k>=n)r();else requestAnimationFrame(t)};requestAnimationFrame(t)})},
  }`

// ---- desktop: every stage of every pinned scene
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  await page.goto(URL, { waitUntil: "networkidle" })
  await page.addStyleTag({ content: "*{transition:none!important;animation:none!important}" })
  await page.evaluate(probeSource)
  const result = await page.evaluate(async () => {
    const P = window.__probe
    const out = []
    for (const scene of document.querySelectorAll(".scene-armed")) {
      const beats = [...new Set([...scene.querySelectorAll("[data-scene]")].map((e) => +e.dataset.scene))].sort((a, b) => a - b)
      const top = scene.getBoundingClientRect().top + scrollY
      const span = scene.offsetHeight - innerHeight
      // stage thresholds are internal; sample the region every 2% instead
      for (let p = 0; p <= 1.0001; p += 0.02) {
        window.__lenis.scrollTo(top + span * p, { immediate: true, force: true })
        await P.frames(3)
        const vis = [...scene.querySelectorAll("[data-scene].scene-on")].filter((e) => P.eff(e) > 0.5)
        const maxBottom = Math.max(0, ...vis.map((e) => e.getBoundingClientRect().bottom))
        const col = P.collide(scene)
        if (col.length || maxBottom > innerHeight + 1) out.push({ scene: scene.textContent.trim().slice(0, 20), p: +p.toFixed(2), col, over: Math.round(maxBottom - innerHeight) })
        for (const f of scene.querySelectorAll("[data-eoy-shrink].scene-on")) {
          const thumbs = [...scene.querySelectorAll("[data-scene].scene-on")].filter((e) => e.textContent.includes(" / ") && e.dataset.scene === f.dataset.scene)
          if (!thumbs.length) continue
          const fr = f.getBoundingClientRect(), tr = thumbs[0].querySelectorAll("span.relative")[1].getBoundingClientRect()
          const dx = Math.abs(fr.left + fr.width / 2 - (tr.left + tr.width / 2)), dy = Math.abs(fr.top + fr.height / 2 - (tr.top + tr.height / 2))
          if (dx > 4 || dy > 4) out.push({ scene: "flight", p: +p.toFixed(2), col: [`lands ${Math.round(dx)}/${Math.round(dy)}px off`], over: 0 })
        }
      }
      void beats
    }
    return out
  })
  for (const r of result) failures.push(`desktop ${r.scene} @${r.p}: ${r.col.join("; ")}${r.over > 0 ? ` over-fold ${r.over}px` : ""}`)
  await page.close()
}

// ---- mobile: nothing overflows sideways, nothing collides with every beat on
{
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
  await page.goto(URL, { waitUntil: "networkidle" })
  await page.addStyleTag({ content: "*{transition:none!important;animation:none!important}" })
  await page.evaluate(probeSource)
  const r = await page.evaluate(() => {
    document.querySelectorAll("[data-scene]").forEach((e) => e.classList.add("scene-on"))
    const P = window.__probe
    return { overflow: document.documentElement.scrollWidth > innerWidth, col: [...document.querySelectorAll(".scene-armed")].flatMap((s) => P.collide(s)) }
  })
  if (r.overflow) failures.push("mobile: horizontal overflow")
  for (const c of r.col) failures.push(`mobile collision: ${c}`)
  await page.close()
}

await browser.close()
if (failures.length) { for (const f of failures) console.error(`check-scenes: ${f}`); process.exit(1) }
console.log("check-scenes passed — no collisions, nothing past the fold, flights land, mobile clean.")
```

- [ ] **Step 3: Run it against the dev server**

```bash
cd ~/dev/makan-web-saffron && BASE=http://localhost:3456 node scripts/check-scenes.mjs
```
Expected: `check-scenes passed — …`. If it reports a collision, that is a real finding: fix the layout, do not loosen the script.

- [ ] **Step 4: Prove it catches a regression**

Temporarily change `md:staged:top-[7.5rem]` on the first-day plates figure to `md:staged:top-0`, run the script, expect a `collision` line naming the turn text and the plates; revert the change; run again, expect pass.

- [ ] **Step 5: Wire it (not into `lint`; it needs a server)**

In `package.json` add `"check:scenes": "node scripts/check-scenes.mjs"`. Add to the ledger `.superpowers/sdd/progress.md`: "Pre-ship: `npm run check:scenes` against the dev server."

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "test(home): scene regression guard — collisions, fold, flights, mobile

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 10: Lighthouse and axe, with thresholds

**Files:**
- Modify: `package.json` (`audit:home`)
- Create (generated, git-ignored): `.superpowers/audits/lighthouse-mobile.json`, `.superpowers/audits/axe.json`

- [ ] **Step 1: Add the script**

```json
"audit:home": "mkdir -p .superpowers/audits && npx --yes lighthouse http://localhost:3456/en/dev-preview --preset=perf --form-factor=mobile --screenEmulation.mobile --only-categories=performance,accessibility,best-practices,seo --output=json --output-path=.superpowers/audits/lighthouse-mobile.json --chrome-flags='--headless=new' --quiet && node -e \"const r=require('./.superpowers/audits/lighthouse-mobile.json').categories;const s=Object.fromEntries(Object.entries(r).map(([k,v])=>[k,Math.round(v.score*100)]));console.log(s);const min={performance:80,accessibility:95,'best-practices':95,seo:95};for(const k in min)if(s[k]<min[k]){console.error('lighthouse:',k,s[k],'<',min[k]);process.exit(1)}\" && npx --yes @axe-core/cli http://localhost:3456/en/dev-preview --save .superpowers/audits/axe.json --exit"
```
Add `.superpowers/audits/` to `.gitignore`.

- [ ] **Step 2: Run it**

```bash
cd ~/dev/makan-web-saffron && npm run audit:home 2>&1 | tail -12
```
Expected: a score object like `{ performance: 8x, accessibility: 9x, 'best-practices': 9x, seo: 9x }` and axe reporting `0 violations`. Anything below the thresholds is a finding to fix in the component it names (the report lists the selector), not a threshold to lower. Likely first findings: images without explicit `width`/`height` in the live strip (existing component), and the `role="group"` fan in `Hero.tsx` if axe wants a labelled group (it has `aria-label`, so it should pass).

- [ ] **Step 3: Commit**

```bash
git add package.json .gitignore && git commit -m "chore(audit): lighthouse + axe against the decision home with thresholds

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 11: Retire the legacy homepage sections (after the gate flips)

Do not run this task until `DECISION_HOME=1` is the production build.

**Files:**
- Delete: whichever of `components/MemoryThesis.tsx`, `components/HowItWorks.tsx`, `components/EatOrYeet.tsx`, `components/ForYou.tsx`, `components/AppShowcase.tsx`, `components/WhyMakan.tsx`, `components/B2BTeaser.tsx`, `components/Hero.tsx`, `components/MemoryTest.tsx` have no importer other than the legacy branch of `app/[locale]/page.tsx`
- Modify: `app/[locale]/page.tsx` (remove the legacy branch and `DECISION_HOME`), `docs/founder-decisions.locked-surfaces.json` (remove entries for deleted files; the guard fails closed on an empty manifest, so keep `Navbar.tsx`, `LatestOnMakan.tsx`, `FinalCTA.tsx` if they survive)

- [ ] **Step 1: List importers**

```bash
cd ~/dev/makan-web-saffron && for c in MemoryThesis HowItWorks EatOrYeet ForYou AppShowcase WhyMakan B2BTeaser MemoryTest; do printf "%s: " $c; grep -rl "components/$c\"" app components lib --include='*.tsx' --include='*.ts' | grep -v "app/\[locale\]/page.tsx" | tr '\n' ' '; echo; done
```
Expected: components used elsewhere (for example by `/story`) show a path; the rest show nothing and are deletable.

- [ ] **Step 2: Delete the unreferenced ones, simplify `page.tsx`, fix the manifest, verify**

```bash
cd ~/dev/makan-web-saffron && npx tsc --noEmit -p . && npm run lint 2>&1 | grep -c passed && rm -rf .next && npm run build 2>&1 | tail -3
```
Expected: no errors, `4`, build succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "chore(home): retire the legacy homepage sections

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

### Task 12: Spec decisions and the launch checklist

**Files:**
- Modify: `docs/superpowers/specs/2026-09-01-decision-first-website-design.md` (append D13, D14)
- Create: `docs/decision-first/launch-checklist.md`

- [ ] **Step 1: Append to the spec**

```markdown
### D13 — Show the product (2026-09-02)
Two real signed-in screens (Eat or Yeet, the diary) sit between the proof scene and the first day, in ink phone frames, with one line saying the menu surface is being built and these two screens exist today. No mock of the decision surface until RM19664 has a screen to photograph.

### D14 — Truth in three places (2026-09-02)
The diner promise ("Open Makan at the table. It says what to order here.") ships only under the release condition in D1, enforced by `scripts/check-decision-gate.mjs`. The restaurant section and the partner page carry the handout's honest line verbatim. Every story photo has a row in `docs/decision-first/photo-credits.md`, enforced by lint.
```

- [ ] **Step 2: The checklist**

```markdown
# Decision home — launch checklist

- [ ] `docs/decision-first/gate.json` updated from Redmine; `DECISION_HOME=1 npm run check:decision-gate` passes
- [ ] `npm run lint` passes (founder decisions, i18n, contrast, photo credits)
- [ ] `npm run check:scenes` passes against the dev server
- [ ] `npm run audit:home` meets thresholds (perf ≥ 80 mobile, a11y ≥ 95, best practices ≥ 95, seo ≥ 95)
- [ ] `docs/decision-first/id-review.md` reviewed by Devon; no row marked `fix`
- [ ] Chicken rice card credit decided (handle printed or "Saved at Lucky Plaza" kept)
- [ ] `DECISION_HOME=1 npm run build` succeeds; `<title>` reads "Makan — Know what to order"
- [ ] Gated-copy leak: `grep -c "No guessing" .next/server/app/en/story.html` → 0
- [ ] Vercel env `DECISION_HOME=1` set on production only after all of the above
- [ ] Post-deploy: `App Store CTA Clicked` events arrive with locations `hero`, `proof`, `final`
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "docs: D13/D14 and the decision-home launch checklist

Co-Authored-By: Claude Fable 5.1 <noreply@anthropic.com>"
```

---

## Self-review

**Spec coverage.** Holes named in the audits → tasks: no app screen (1); FAQ seam (2); restaurant numbers and "you do almost nothing" (3); partner page against the handout (4); credits and consent (5); Indonesian review (6); real route, metadata, analytics, navigation (7); promise ahead of shipping and the deploy gate (8, 12); regression guards (9); Lighthouse and axe (10); legacy sections (11). The one hole this plan does not close is a screen of the decision surface itself, because it does not exist yet; D13 says so.

**Placeholder scan.** Task 4 step 3 asks the implementer to write copy from a table rather than giving every string, because the partner page's current keys are unknown until read; the table gives the exact statements and the verbatim-handout rule. Everything else is complete.

**Type consistency.** `StoreLink({ location, className, children })` in Task 7 matches its three call sites. `ScrollScene` gains `id?: string` in Task 7 step 3 and is used by `EatOrYeetScene` and `FirstDayScene` only. `check-photo-credits.mjs` matches rows by `| <file> |` in the credits table written in Task 5 step 1.
