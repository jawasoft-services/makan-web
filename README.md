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
- **[Firebase Admin](https://firebase.google.com/docs/admin/setup)** — reads public, privacy-safe aggregates from Firestore (a daily cron does the heavy scan; pages read one small document)
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

The site never scans Firestore on a page load. A **daily cron** (`/api/cron/aggregates`, bearer-token protected) does the one big scan of meals and Eat-or-Yeet comparisons, writes small privacy-safe aggregate documents, and every page reads just the document it needs. Private data never leaves the app — the projection the web reads is stripped fail-closed.

## A note on the code being public

This is a marketing/content site — no secrets live in it (they're all environment variables). The app, its data, and its Firestore security rules live elsewhere. If you spot something that looks like a leak, please open an issue rather than a PR.

---

<div align="center">

*Made in Bali. Start with your next meal.* 🍜

</div>

<!-- deploy: repo public + Vercel reconnected to jawasoft-services/makan-web (2026-09-19) -->
