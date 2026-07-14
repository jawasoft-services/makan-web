/**
 * Shared primitives for the venue-QR tooling — registry I/O, slug rules, and the
 * print-safety guard. Imported by every `venue:*` script so the generator, the
 * adder and the build-time check can never disagree about what a valid registry is.
 *
 * ── THE ONE INVARIANT THAT CANNOT BE FIXED BY A DEPLOY ──
 * Every other mistake here is recoverable: a wrong page redeploys, a bad name
 * re-renders. But a QR card is *physically printed* and sitting on a table. Once a
 * slug has been minted into a card, that slug is BURNED — it may never point at a
 * different venue, because the cards already in the wild cannot be recalled.
 *
 * Two things enforce that, and they are deliberately redundant:
 *   1. lib/venues.lock.json — the ledger of burned slugs (`assertNoRepurpose`).
 *   2. public/venue-qr/<slug>.svg — the CARD ITSELF is physical evidence the slug
 *      was minted. `assertMintedCardsAreLocked` requires the lock to agree with the
 *      cards on disk, so a lost/unmerged/conflict-resolved lock entry FAILS the
 *      build instead of silently leaving a printed slug unprotected.
 *
 * Never reconstruct a lock entry from the REGISTRY — that would bless whatever the
 * registry currently says as "what was printed", laundering the exact repurpose the
 * lock exists to catch. Reconstruct from the card, or not at all.
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const HERE = dirname(fileURLToPath(import.meta.url))
export const ROOT = join(HERE, "..")
export const DATA = join(ROOT, "lib", "venues.data.json")
export const LOCK = join(ROOT, "lib", "venues.lock.json")
export const OUT_DIR = join(ROOT, "public", "venue-qr")
export const SITE = "https://www.makanofficial.com"

/** Lowercase kebab-case, single internal hyphens. It is PRINTED — keep it readable. */
export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/** The exact URL a card's QR encodes. `www` form — skips the apex→www 308. */
export const cardUrl = (slug) => `${SITE}/r/${slug}`

/**
 * QR encode options. Shared so the generator and the verifier encode IDENTICALLY —
 * the verifier's whole job is to re-encode and byte-compare, which only proves
 * anything if both sides use the same options.
 *
 * 'Q' (~25% recovery): a table card lives with grease, smudges and partial
 * occlusion, where 'M' (~15%) is marginal.
 */
export const QR_OPTS = {
  type: "svg",
  margin: 1,
  width: 340,
  errorCorrectionLevel: "Q",
  color: { dark: "#0B0B0B", light: "#FFFFFF" },
}

/** Letters NFKD refuses to decompose — without these they'd be silently DELETED
 *  from a slug that gets printed on a card ("Straße" → "strae"). */
const TRANSLIT = {
  ß: "ss", ø: "o", đ: "d", æ: "ae", œ: "oe", ð: "d", þ: "th", ł: "l", ħ: "h", ı: "i",
}

/** "Cellar Door" → "cellar-door". Returns "" if nothing usable survives. */
export function deriveSlug(name) {
  return String(name)
    .toLowerCase()
    .replace(/[ßøđæœðþłħı]/g, (c) => TRANSLIT[c] ?? c)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function readJson(path, what) {
  try {
    return JSON.parse(readFileSync(path, "utf8"))
  } catch (err) {
    if (err.code === "ENOENT") return null
    // Fail CLOSED: a malformed registry must never be waved through as "empty".
    throw new Error(`${what} is not valid JSON (${path}):\n  ${err.message}`)
  }
}

export function loadRegistry() {
  const reg = readJson(DATA, "The venue registry")
  if (reg === null) throw new Error(`Venue registry missing: ${DATA}`)
  return reg
}

/** The lock legitimately does not exist until the first card is minted. */
export function loadLock() {
  return readJson(LOCK, "The venue lock") ?? {}
}

/** Slugs that have a minted card committed on disk. The card is the physical evidence. */
export function mintedCardSlugs() {
  try {
    return readdirSync(OUT_DIR)
      .filter((f) => f.endsWith(".svg"))
      .map((f) => f.slice(0, -4))
  } catch (err) {
    if (err.code === "ENOENT") return [] // no cards minted yet — legitimate
    throw err
  }
}

/** Best-effort: read the venue name a card actually PRINTS. Used only to make an
 *  error message actionable — never to auto-heal the lock. */
export function printedNameOn(slug) {
  try {
    const svg = readFileSync(join(OUT_DIR, `${slug}.svg`), "utf8")
    const texts = [...svg.matchAll(/<text[^>]*>([^<]+)<\/text>/g)].map((m) => m[1])
    // Card order: "Makan", tagline, NAME, CITY, …
    return texts[2] && texts[3] ? `${texts[2]} (${texts[3]})` : null
  } catch {
    return null
  }
}

/**
 * One venue per line — so adding a venue is a ONE-LINE git diff, and a reviewer
 * can see at a glance what changed. (JSON.stringify(…, 2) would explode each
 * venue across 5 lines and bury the change.)
 */
function formatRegistry(reg) {
  const inline = (v) =>
    "{ " +
    Object.entries(v)
      .map(([k, val]) => `${JSON.stringify(k)}: ${JSON.stringify(val)}`)
      .join(", ") +
    " }"
  const keys = Object.keys(reg)
  if (keys.length === 0) return "{}\n"
  const lines = keys.map((k) => `  ${JSON.stringify(k)}: ${inline(reg[k])}`)
  return `{\n${lines.join(",\n")}\n}\n`
}

export function saveRegistry(reg) {
  writeFileSync(DATA, formatRegistry(reg))
}

export function saveLock(lock) {
  writeFileSync(LOCK, JSON.stringify(lock, null, 2) + "\n")
}

/**
 * Structural validation. Returns error strings (empty = valid) rather than throwing,
 * so an operator sees every problem at once instead of one per run.
 *
 * NOTE: an EMPTY registry is deliberately NOT an error here. Every venue un-signing
 * is a documented, sanctioned state, and this runs in `prebuild` — treating it as
 * fatal would block every deploy of the entire marketing site over a venue script.
 * The commands for which "no venues" means a mis-invocation (mint, verify) check
 * emptiness themselves.
 */
export function validateRegistry(reg) {
  const errors = []
  const seen = new Set()

  for (const [key, v] of Object.entries(reg)) {
    if (!v || typeof v !== "object" || Array.isArray(v)) {
      errors.push(`"${key}": entry must be an object.`)
      continue
    }
    for (const field of ["slug", "name", "city"]) {
      if (typeof v[field] !== "string" || v[field].trim() === "") {
        errors.push(`"${key}": missing or empty required field "${field}".`)
      }
    }
    if (typeof v.slug !== "string") continue

    if (!SLUG_RE.test(v.slug)) {
      errors.push(
        `"${key}": bad slug "${v.slug}" — lowercase kebab-case only (no leading/trailing/double hyphens). It gets PRINTED.`,
      )
    }
    if (seen.has(v.slug)) errors.push(`duplicate slug "${v.slug}" — each venue needs a unique slug.`)
    seen.add(v.slug)

    // Upgraded from a warning: the key is how a human scans this file, and a
    // key≠slug entry reads as a different venue than the one actually served.
    if (key !== v.slug) errors.push(`"${key}": registry key must equal the slug ("${v.slug}").`)

    if (v.googlePlaceId !== undefined && (typeof v.googlePlaceId !== "string" || !v.googlePlaceId.trim())) {
      errors.push(`"${key}": googlePlaceId, when present, must be a non-empty string.`)
    }
  }
  return errors
}

/**
 * THE print-safety gate. A minted slug may never be repointed at a different venue.
 *
 * Allowed:   removing a venue (it un-signed) — the route degrades to the generic
 *            landing, cards in the wild keep scanning. The slug stays burned.
 * Allowed:   filling in googlePlaceId for the first time — that is the sanctioned
 *            Phase-2 step and needs no reprint (the card only carries the slug).
 * Forbidden: a minted slug whose name/city — or whose ALREADY-RECORDED placeId —
 *            now describe a DIFFERENT venue. In Phase 2 the placeId IS the venue's
 *            identity: change it and every printed card pre-tags the wrong restaurant.
 *
 * A genuine typo fix on the SAME venue is legitimate, so it gets an explicit,
 * auditable escape hatch (`venue:relabel`). The point of this gate is not to be
 * clairvoyant about intent — it is to make an irreversible change IMPOSSIBLE TO
 * MAKE SILENTLY.
 */
export function assertNoRepurpose(reg, lock) {
  const errors = []
  for (const v of Object.values(reg)) {
    if (!v || typeof v.slug !== "string") continue
    if (!Object.hasOwn(lock, v.slug)) continue // never minted — no card exists to protect
    const minted = lock[v.slug]

    if (minted.name !== v.name || minted.city !== v.city) {
      errors.push(
        `PRINT-SAFETY: slug "${v.slug}" was minted as "${minted.name} (${minted.city})" ` +
          `but the registry now says "${v.name} (${v.city})".\n` +
          `      Printed cards for "${v.slug}" are already in the wild and cannot be recalled.\n` +
          `      • Same venue, fixing a typo? →  npm run venue:relabel -- --slug ${v.slug} --name "${v.name}" --city "${v.city}" --confirm-same-venue\n` +
          `      • A DIFFERENT venue?         →  STOP. Never repurpose a printed slug. Give the new venue its own slug.`,
      )
    }

    if (minted.googlePlaceId && minted.googlePlaceId !== v.googlePlaceId) {
      errors.push(
        `PRINT-SAFETY: slug "${v.slug}" was minted against Google Place ID "${minted.googlePlaceId}", ` +
          `but the registry now says "${v.googlePlaceId ?? "(none)"}".\n` +
          `      In Phase 2 the Place ID IS the venue — changing it makes every printed "${v.slug}" card\n` +
          `      pre-tag a different restaurant. Use \`npm run venue:set-place-id\` if this is a genuine correction.`,
      )
    }
  }
  return errors
}

/**
 * The card on disk is physical evidence the slug was minted. If a card exists with
 * no lock entry, that slug is silently UNPROTECTED — `assertNoRepurpose` would skip
 * it and someone could later point it at a different venue with every gate green.
 *
 * This is the gap that a dropped `git add`, a merge-conflict resolved "ours", a
 * `git checkout -- lib/venues.lock.json`, or a crash mid-mint all produce.
 */
export function assertMintedCardsAreLocked(lock) {
  const errors = []
  for (const slug of mintedCardSlugs()) {
    if (Object.hasOwn(lock, slug)) continue
    const printed = printedNameOn(slug)
    errors.push(
      `PRINT-SAFETY: a card exists at public/venue-qr/${slug}.svg but "${slug}" has NO entry in lib/venues.lock.json.\n` +
        `      That card may already be printed, which means the slug is burned — but nothing is protecting it,\n` +
        `      so it could later be repointed at a different venue with every check green.\n` +
        `      Was lib/venues.lock.json committed? (a dropped \`git add\`, or a merge taking "ours", does this)\n` +
        (printed ? `      The card itself prints: ${printed} — restore the lock entry to match THE CARD.\n` : "") +
        `      Restore it from the card, never from the registry — the registry is exactly what a repurpose would have changed.`,
    )
  }
  return errors
}

/** Slugs that were minted but are no longer served — informational, never an error. */
export function retiredSlugs(reg, lock) {
  return Object.keys(lock).filter((slug) => !Object.hasOwn(reg, slug))
}

/**
 * Bring the lock up to date for a venue that is being minted.
 *  - not locked yet          → record it (the slug is now burned)
 *  - locked, no placeId yet  → fill it in (sanctioned Phase-2 step, no reprint)
 *  - otherwise               → leave it ALONE. Only venue:relabel may rewrite a
 *                              minted label, and it preserves history when it does.
 */
export function lockSync(lock, venue, today) {
  const stamp = today ?? new Date().toISOString().slice(0, 10)
  if (!Object.hasOwn(lock, venue.slug)) {
    lock[venue.slug] = {
      name: venue.name,
      city: venue.city,
      ...(venue.googlePlaceId ? { googlePlaceId: venue.googlePlaceId } : {}),
      mintedAt: stamp,
    }
    return "minted"
  }
  const entry = lock[venue.slug]
  if (!entry.googlePlaceId && venue.googlePlaceId) {
    entry.googlePlaceId = venue.googlePlaceId
    return "filled"
  }
  return null
}
