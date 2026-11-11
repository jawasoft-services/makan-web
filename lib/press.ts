// Single source of truth for the /story and /press pages, their JSON-LD, metadata, and llms.txt.
// Update facts/boilerplate here only — every surface imports from this file.
import { APP_STORE_URL } from "@/lib/links"

export const PRESS_EMAIL = "hello@makanofficial.com"

export const FOUNDER = {
  name: "Devon Makepeace",
  role: "Founder",
  // Verifiable bio only. Sources: Devon's grant applications (Oct 2026); based in London (Devon, 11 Nov 2026).
  bio: "Born in Jakarta and raised across Singapore and Bali, now based in London. He wrote most of Makan himself and is studying for an MSc in Bioscience Futures at Imperial College London.",
} as const

// Each person approved their own line on 11 Nov 2026 (relayed by Devon). Claim ledger: strategy/press-2026-11-11/VERIFICATION.md.
export const COFOUNDERS = [
  { name: "Ewan Makepeace", city: "Jakarta" },
  { name: "Julian Buendia", city: "New York" },
] as const

// Facts a journalist can quote. Re-check version and platform at every release.
export const PRESS_FACTS = {
  iosMinimum: "15.1", // App Store minimumOsVersion
  version: "1.0.13", // current App Store version
  versionDate: "2026-11-02", // its release date (ISO)
} as const

// Downloads on /press. `bytes` is asserted against the real file by components/press/press.test.mjs.
export const PRESS_ASSETS = [
  { id: "icon", file: "/press/makan-app-icon-1024.png", preview: "/press/makan-app-icon-256.png", format: "PNG", dimensions: "1024 × 1024", bytes: 833690 },
  { id: "wordmarkOrange", file: "/makan-logo-orange.svg", format: "SVG", bytes: 3873 },
  { id: "wordmarkWhite", file: "/makan-logo-white.svg", format: "SVG", bytes: 3873 },
  { id: "founderPhoto", file: "/press/devon-makepeace-founder.jpg", format: "JPG", dimensions: "738 × 738", bytes: 179569, credit: "Devon Makepeace" },
] as const

export const COMPANY = {
  legalName: "MAKAN APP LTD",
  registration: "16736412", // England & Wales (Companies House)
  // Company incorporation year. Confirm exact date with Devon if a fuller date is wanted.
  foundingYear: "2025",
  city: "London",
  country: "United Kingdom",
} as const

export const LAUNCH = {
  date: "2026-06-19", // ISO, App Store worldwide launch
  display: "19 June 2026",
} as const

export const SOCIALS = {
  instagram: "https://www.instagram.com/makanappofficial/",
  x: "https://x.com/app_makan",
  tiktok: "https://www.tiktok.com/@makan.app",
} as const

export const APP_STORE = APP_STORE_URL

// Evergreen — NO usage numbers baked in (those stay on-page via the live meal count).
export const BOILERPLATE_SHORT =
  "Makan is the app you open when you don't know what to order. It learns what you'd choose again from the meals you actually ate."

export const BOILERPLATE_LONG =
  "Makan is the app you open when you don't know what to order. Founded by Devon Makepeace and grown out of a shared story his scattered friends kept through the pandemic, it lets you save the meals you eat, then puts two of your own meals side by side and asks which you'd order first. At a menu, it starts with your own evidence, then the people you chose to trust. Makan launched worldwide on the Apple App Store in June 2026."

// Devon's own words (pre-approved by authorship).
export const QUOTES = [
  "The meal isn't a side note to the day. The day revolves around the meal.",
  "It was the one place we could all still sit at the same table.",
  "I'd accidentally built a photographic record of my whole life, one meal at a time.",
  "Your dinner isn't a four-point-something out of five. It's your number one of all time, and no one else gets a vote.",
] as const
