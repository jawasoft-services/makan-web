/**
 * Generates print-ready venue-QR cards from the single-source registry
 * (lib/venues.data.json). One SVG card per venue → public/venue-qr/<slug>.svg.
 *
 * Each card's QR encodes  https://www.makanofficial.com/r/<slug>  — the WWW form,
 * so a scan skips the apex→www 308 redirect (see middleware.ts). The slug is a
 * STABLE printed token; what /r/<slug> does is swappable server-side (see the
 * dynamic-QR contract in lib/venues.ts), so these cards never need reprinting.
 *
 * Run:  npm run venue-qr
 * SVG prints crisp at any size; open in a browser and print, or drop into
 * Figma/Canva/a print shop. Add a venue to lib/venues.data.json and re-run.
 */

import QRCode from "qrcode"
import { readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = join(HERE, "..")
const DATA = join(ROOT, "lib", "venues.data.json")
const OUT_DIR = join(ROOT, "public", "venue-qr")
const SITE = "https://www.makanofficial.com"

// Card geometry (portrait, ~A6 proportions). Units are SVG px; vector, so print
// resolution is unbounded.
const W = 640
const H = 900
const QR = 340
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

  let qr = await QRCode.toString(url, {
    type: "svg",
    margin: 1,
    width: QR,
    errorCorrectionLevel: "M",
    color: { dark: C.ink, light: C.white },
  })
  // Nest the QR <svg> at the right spot (nested <svg> honours x/y/width/height).
  qr = qr.replace("<svg ", `<svg x="${qrX}" y="${qrY}" `)

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="28" fill="${C.cream}" stroke="${C.border}" stroke-width="2"/>

  <text x="${W / 2}" y="118" text-anchor="middle" font-family="${FONT}" font-size="52" font-weight="800" letter-spacing="-1" fill="${C.ink}">Makan</text>
  <rect x="${W / 2 - 32}" y="140" width="64" height="4" rx="2" fill="${C.saffron}"/>
  <text x="${W / 2}" y="182" text-anchor="middle" font-family="${FONT}" font-size="19" font-weight="500" fill="${C.muted}">Remember every meal.</text>

  <text x="${W / 2}" y="256" text-anchor="middle" font-family="${FONT}" font-size="40" font-weight="800" letter-spacing="-0.5" fill="${C.ink}">${esc(venue.name)}</text>
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
  const venues = Object.values(JSON.parse(readFileSync(DATA, "utf8")))
  if (venues.length === 0) {
    console.error("No venues in lib/venues.data.json — nothing to generate.")
    process.exit(1)
  }
  mkdirSync(OUT_DIR, { recursive: true })

  for (const v of venues) {
    if (!/^[a-z0-9-]+$/.test(v.slug)) {
      console.error(`Bad slug "${v.slug}" — use lowercase kebab-case only.`)
      process.exit(1)
    }
    const svg = await card(v)
    const path = join(OUT_DIR, `${v.slug}.svg`)
    writeFileSync(path, svg)
    console.log(`  ✓ ${v.name.padEnd(14)} → public/venue-qr/${v.slug}.svg   (${SITE}/r/${v.slug})`)
  }
  console.log(`\nGenerated ${venues.length} venue QR card(s). Open each SVG in a browser to print.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
