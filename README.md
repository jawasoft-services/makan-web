<div align="center">

<img src="./public/makan-icon.svg" alt="Makan" width="72" height="72" />

# Makan — the website

**The app you open when you don't know what to order.**

Ten minutes with the menu and you still have no idea. So you order the safe thing.
Makan learns which dishes you'd choose again — from meals you actually ate.
Next menu, you'll know.

[makanofficial.com](https://www.makanofficial.com) · [Manifesto](https://www.makanofficial.com/en/manifesto) · [The standings](https://www.makanofficial.com/en/standings)

![Next.js](https://img.shields.io/badge/Next.js-16-000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firestore-admin-FFCA28?logo=firebase&logoColor=black)
![i18n](https://img.shields.io/badge/languages-EN%20%C2%B7%20ID-FF9932)

</div>

---

## What this is

This is the **marketing + public web** for Makan — the food-diary app that helps you decide what to order. It is **not** the app itself (that's a separate React Native codebase). This repo is the front door: the story, the proof, and a public page for every restaurant people save meals at.

The whole site is built around one idea — **the minute before you order** — and everything on it earns its place against that.

### The pages that matter

| Route | What it does |
|---|---|
| `/` | The pitch, told as one meal: you sit down, the menu comes, you have no idea — and what Makan does about it. |
| `/places/[slug]` | **A public page for every restaurant on Makan** — its meals, its standing, and its 👑 Maître'D. This is what a shared restaurant link opens. |
| `/standings` | Live Eat-or-Yeet standings — restaurants ranked by real diner comparisons, by city. |
| `/manifesto` | Why Makan exists, in plain words. |
| `/story` · `/blog` | The origin, and the occasional real food story. |
| `/partner` | For restaurants — no cut of the bill, your name on every meal a guest saves. |
| `/privacy-policy` · `/tos` · `/*-deletion` | The honest legal surface. |

## The 👑 Maître'D

Every restaurant page has a Maître'D seat. The Maître'D is **whoever eats there most** — not who pays, not who follows. If nobody holds it yet, the page says so and invites you to claim it:

> *Be this restaurant's most loyal customer. Get treated like it.*

Hold the seat and you publish a tiny menu for strangers deciding what to order — *"Always order this / Try this if… / Good to know."* Restaurants **recognise** their regulars; they don't govern the app.

## Built with

- **[Next.js 16](https://nextjs.org)** (App Router) · **React 19** · **TypeScript** (strict)
- **[next-intl](https://next-intl.dev)** — every page in **English and Indonesian** (`/` and `/id`), because Makan is Indonesia-first, not Indonesia-translated
- **[Firebase Admin](https://firebase.google.com/docs/admin/setup)** — reads public aggregates and verifies live source records before exposing eligible public content
- **[Tailwind CSS](https://tailwindcss.com)** · **[Framer Motion](https://www.framer.com/motion/)** · **[Lenis](https://lenis.darkroom.engineering/)** — cream-and-saffron brand, scroll-driven scenes
- **[Leaflet](https://leafletjs.com)** + OpenStreetMap — the maps · **[Resend](https://resend.com)** + Google Sheets — the forms
- Deployed on **Vercel**

## Getting started

```bash
npm install
npm run dev
```

Open [localhost:3000](http://localhost:3000).

You'll get the site, but the data-backed pages (`/places`, `/standings`) will show their empty states until Firebase credentials are set — they read live aggregates. To wire those up, copy the example env file and fill it in:

```bash
cp .env.local.example .env.local
# then set FIREBASE_* (a service account) and the rest
```

Local dev also falls back to `gcloud auth application-default login` if you'd rather not paste a service-account key.

To review the compiled draft against live Makan data with existing local Application Default Credentials:

```bash
MAKAN_WEBSITE_FIXTURES=0 FIREBASE_PROJECT_ID=munchies-expo ./node_modules/.bin/next build --webpack
MAKAN_WEBSITE_FIXTURES=0 FIREBASE_PROJECT_ID=munchies-expo ./node_modules/.bin/next start --hostname localhost --port 3471
```

This serves a local draft; it does not push or deploy. Live reads use `.next`, while `MAKAN_WEBSITE_FIXTURES=1` keeps automated checks in the separate `.next-fixtures` build. Run repeated browser checks with fixtures and use a bounded live check to confirm real content. Do not copy production keys into the repository. Email delivery remains unconfigured unless its separate environment variables are supplied.

### Credentials the deployed site needs

The site should run on a **least-privilege service account**, not the Firebase project's full admin key. Aggregates alone are insufficient: the live gallery, Maître d’ verification, venue claims and shared links also read their source records. Review the loaders in `lib/` when provisioning access; the cron writes aggregates and the photo loader writes its cache. A successful local ADC preview does not verify the deployed account's permissions. The forms write leads through a **separate** Sheets-only account: `GOOGLE_SHEETS_CLIENT_EMAIL` and `GOOGLE_SHEETS_PRIVATE_KEY` must be set in Vercel, because `lib/sheets-auth.ts` otherwise falls back to the `FIREBASE_*` key with full project authority and logs a warning. `TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY` turn on the bot check for the contact and partner forms; without them the check is skipped and logged. See `.env.local.example`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server |
| `npm run build` | Generate static images, then the production build |
| `npm run lint` | ESLint **+ the house checks** (see below) |
| `npm run check:i18n` | Every string exists in both EN and ID |
| `npm run check:contrast` | Brand colours meet contrast on the page |
| `npm run check:photo-credits` | Every photo has its credit |
| `npm run check:founder-decisions` | Locked copy/decisions haven't been quietly changed |
| `npm run venue-qr` | Mint a venue's QR landing page + print-ready card |

### The house checks 🏠

`npm run lint` runs more than ESLint. Because this is a small team shipping fast, a few **guardrails run on every lint** so mistakes can't sneak in: strings must exist in both languages, colours must pass contrast, photos must be credited, and copy the founder locked stays locked. If a check fails, it's usually telling you something true.

## How the data works

The **daily cron** (`/api/cron/aggregates`, bearer-token protected) writes the public venue, statistics and Eat-or-Yeet aggregates. Pages normally reuse these documents, but list/statistics readers can fall back to collection scans when the aggregate is missing or its heartbeat is over 36 hours old. The homepage also reads a live meal count and a bounded selection of public meal posts. Maître d’ identity and published orders use a separate five-minute verification window and read their current source records when that public aggregate is absent or stale; this fallback does not write an aggregate.

Restaurant photos reuse the existing Firestore photo cache. A missing or expired photo can call Google Places and update that cache, so opening a live-data page is not guaranteed to be free of paid calls or cache writes. Fixture mode bypasses these integrations. Public output is filtered by the loaders' visibility and moderation rules; credentials stay on the server.

## A note on the code being public

This is a marketing/content site — no secrets live in it (they're all environment variables). The app, its data, and its Firestore security rules live elsewhere. If you spot something that looks like a leak, please open an issue rather than a PR.

---

<div align="center">

*Made in Bali. Start with your next meal.* 🍜

</div>

<!-- deploy: repo public + Vercel reconnected to jawasoft-services/makan-web (2026-09-19) -->
