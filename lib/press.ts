// Single source of truth for the /story page, its JSON-LD, metadata, and llms.txt.
// Update facts/boilerplate here only — every surface imports from this file.
import { APP_STORE_URL } from "@/lib/links"

export const PRESS_EMAIL = "hello@makanofficial.com"

export const FOUNDER = {
  name: "Devon Makepeace",
  role: "Founder",
  // Verifiable bio only (third culture kid; Indonesian heritage). Expand if Devon supplies more.
  bio: "Third culture kid — born in Jakarta, raised across Singapore and Bali, now in Durham. Devon drives Makan's product and design.",
} as const

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
  "Makan is a social food journal — a place to remember every meal, with the friends you eat it with."

export const BOILERPLATE_LONG =
  "Makan is a social food journal for remembering the meals that matter. Founded by Devon Makepeace and grown out of a shared Snapchat story his scattered friends kept through the pandemic, it lets you photograph a meal, add a caption, tag a place and friends, choose Public or Friends Only, and keep it in a dated diary. Makan launched worldwide on the Apple App Store in June 2026."

// Devon's own words (pre-approved by authorship).
export const QUOTES = [
  "The meal isn't a side note to the day. The day revolves around the meal.",
  "It was the one place we could all still sit at the same table.",
  "I'd accidentally built a photographic record of my whole life, one meal at a time.",
  "Your dinner isn't a four-point-something out of five. It's your number one of all time, and no one else gets a vote.",
] as const
