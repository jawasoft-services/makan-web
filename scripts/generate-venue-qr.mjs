/**
 * Generates print-ready venue-QR cards from the single-source registry
 * (lib/venues.data.json). One SVG card per venue → public/venue-qr/<slug>.svg.
 *
 * Each card's QR encodes  https://www.makanofficial.com/r/<slug>  — the WWW form,
 * so a scan skips the apex→www 308 redirect (see middleware.ts). The slug is a
 * STABLE printed token; what /r/<slug> does is swappable server-side (see the
 * dynamic-QR contract in lib/venues.ts), so these cards never need reprinting.
 *
 * Run:  npm run venue-qr        (or `npm run venue:add`, which mints + verifies)
 * SVG prints crisp at any size; open in a browser and print, or drop into
 * Figma/Canva/a print shop.
 *
 * Minting is the point of no return — the SVG this writes is what gets PRINTED.
 * So it validates the registry AND enforces print-safety BEFORE writing a byte,
 * then records each newly-minted slug in lib/venues.lock.json: the ledger of slugs
 * that now exist on physical cards and can never be repointed at another venue.
 */

import QRCode from "qrcode"
import { writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import {
  OUT_DIR,
  SITE,
  QR_OPTS,
  loadRegistry,
  loadLock,
  saveLock,
  validateRegistry,
  assertNoRepurpose,
  assertMintedCardsAreLocked,
  lockSync,
} from "./venue-lib.mjs"

// Card geometry (portrait, ~A6 proportions). Units are SVG px; vector, so print
// resolution is unbounded.
const W = 640
const H = 900
const QR = QR_OPTS.width // one source of truth: the rendered size IS the layout size
const QUIET = 380 // white quiet-zone box behind the QR
const C = {
  cream: "#FAF7F2",
  border: "#E7E1D8",
  ink: "#0B0B0B",
  muted: "#6B6B6B",
  dim: "#9A948B",
  saffron: "#FF9932",
  white: "#FFFFFF",
}
const FONT = "Plus Jakarta Sans, system-ui, -apple-system, Segoe UI, sans-serif"

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

async function card(venue) {
  const url = `${SITE}/r/${venue.slug}`

  // Position the QR inside the centred quiet-zone box.
  const quietX = (W - QUIET) / 2
  const quietY = 330
  const qrX = quietX + (QUIET - QR) / 2
  const qrY = quietY + (QUIET - QR) / 2

  // 'Q' = ~25% recovery — a table card lives with grease, smudges and partial
  // occlusion, where 'M' (~15%) is marginal. Slightly denser modules; print a
  // touch larger. See the sizing note in docs/venue-qr-playbook.md.
  // Options live in venue-lib's QR_OPTS so verify-venue-qr.mjs re-encodes with the
  // IDENTICAL settings — its byte-comparison only proves anything if both sides match.
  let qr = await QRCode.toString(url, QR_OPTS)
  // Nest the QR <svg> at the right spot (nested <svg> honours x/y/width/height).
  qr = qr.replace("<svg ", `<svg x="${qrX}" y="${qrY}" `)

  // Auto-fit the venue name: SVG <text> doesn't wrap, so shrink the font for
  // long names instead of letting them spill past the fixed 640px card. ~15
  // chars fit at the 40px default; beyond that scale down (floor 22px).
  const nameFont = venue.name.length > 15
    ? Math.max(22, Math.round((40 * 15) / venue.name.length))
    : 40

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="${C.cream}" stroke="${C.border}" stroke-width="2"/>

  <text x="${W / 2}" y="118" text-anchor="middle" font-family="${FONT}" font-size="52" font-weight="800" letter-spacing="-1" fill="${C.ink}">Makan</text>
  <rect x="${W / 2 - 32}" y="140" width="64" height="4" rx="2" fill="${C.saffron}"/>
  <text x="${W / 2}" y="182" text-anchor="middle" font-family="${FONT}" font-size="19" font-weight="500" fill="${C.muted}">Remember every meal.</text>

  <text x="${W / 2}" y="256" text-anchor="middle" font-family="${FONT}" font-size="${nameFont}" font-weight="800" letter-spacing="-0.5" fill="${C.ink}">${esc(venue.name)}</text>
  <text x="${W / 2}" y="292" text-anchor="middle" font-family="${FONT}" font-size="20" font-weight="600" letter-spacing="2" fill="${C.saffron}">${esc(venue.city.toUpperCase())}</text>

  <rect x="${quietX}" y="${quietY}" width="${QUIET}" height="${QUIET}" rx="24" fill="${C.white}" stroke="${C.border}" stroke-width="2"/>
  ${qr}

  <text x="${W / 2}" y="768" text-anchor="middle" font-family="${FONT}" font-size="20" font-weight="600" fill="${C.ink}">Open your camera and point it here</text>
  <text x="${W / 2}" y="804" text-anchor="middle" font-family="${FONT}" font-size="17" font-weight="700" fill="${C.saffron}">makanofficial.com/r/${esc(venue.slug)}</text>
  <text x="${W / 2}" y="852" text-anchor="middle" font-family="${FONT}" font-size="14" font-weight="500" fill="${C.dim}">A private food diary you share with friends</text>
</svg>
`
}

async function main() {
  const reg = loadRegistry()
  const lock = loadLock()
  const venues = Object.values(reg)

  if (venues.length === 0) {
    console.error("No venues in lib/venues.data.json — nothing to generate.")
    process.exit(1)
  }

  // Fail CLOSED before writing a byte: minting produces the artefact that gets
  // physically printed, so a bad or repurposed entry must never reach an SVG.
  const errors = [
    ...validateRegistry(reg),
    ...assertNoRepurpose(reg, lock),
    ...assertMintedCardsAreLocked(lock),
  ]
  if (errors.length > 0) {
    console.error(`\n✖ Refusing to mint — ${errors.length} problem(s) in the registry:\n`)
    for (const e of errors) console.error(`  ✖ ${e}\n`)
    process.exit(1)
  }

  mkdirSync(OUT_DIR, { recursive: true })
  const minted = []
  const filled = []

  // Write the lock BEFORE the SVGs. If this process dies mid-loop, the worst case
  // must be "a slug is locked but has no card" (harmless — check tolerates it), never
  // "a card exists with no lock entry" (a silently unprotected printed slug).
  for (const v of venues) {
    const change = lockSync(lock, v)
    if (change === "minted") minted.push(v.slug)
    if (change === "filled") filled.push(v.slug)
  }
  if (minted.length > 0 || filled.length > 0) saveLock(lock)

  for (const v of venues) {
    const svg = await card(v)
    writeFileSync(join(OUT_DIR, `${v.slug}.svg`), svg)
    console.log(`  ✓ ${v.name.padEnd(14)} → public/venue-qr/${v.slug}.svg   (${SITE}/r/${v.slug})`)
  }

  if (minted.length > 0) {
    console.log(
      `\n  🔒 locked ${minted.length} new slug(s): ${minted.join(", ")}\n` +
        `     These now exist on printable cards — they can never be repointed at another venue.\n` +
        `     COMMIT lib/venues.lock.json alongside the card, or the slug ships unprotected.`,
    )
  }
  if (filled.length > 0) {
    console.log(`\n  🔒 recorded Place ID for: ${filled.join(", ")} (no reprint needed)`)
  }

  console.log(`\nGenerated ${venues.length} venue QR card(s). Run \`npm run venue:verify\` before printing.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
