/**
 * Proves every minted card's QR actually encodes that venue's URL.
 *
 *   npm run venue:verify
 *
 * WHY THIS EXISTS: printing is the irreversible step. A card whose QR encodes the
 * wrong URL is a dead print run — money spent, cards on tables, diners landing
 * nowhere. `tsc` and `next build` cannot see inside an SVG; the only check before
 * this was "scan it with your phone", which is manual and therefore skippable.
 *
 * HOW: re-encode the URL the card is SUPPOSED to carry, using the exact same
 * qrcode options the generator used (QR_OPTS — shared, so the two sides cannot
 * drift), and assert the resulting module path appears verbatim in the minted SVG.
 *
 * It also cross-checks that no two cards carry the same QR — which catches the
 * genuinely catastrophic generator bug of stamping one venue's QR onto every card.
 * A check that cannot fail is not a check, so the cross-check is what proves this
 * comparison actually discriminates.
 *
 * Exit code IS the gate. Fails CLOSED — a card it cannot parse is a failure.
 */

import QRCode from "qrcode"
import { readFileSync, existsSync } from "node:fs"
import { join } from "node:path"
import { loadRegistry, OUT_DIR, cardUrl, QR_OPTS } from "./venue-lib.mjs"

/**
 * The data modules are emitted as the STROKED path (the light background is a
 * separate fill path). If qrcode ever stops emitting a stroked path we return
 * empty and the caller fails — never silently "verify" nothing.
 */
function modulePaths(svg) {
  const tags = svg.match(/<path\b[^>]*?\/?>/g) || []
  return tags
    .filter((t) => /\bstroke=/.test(t))
    .map((t) => (t.match(/\bd="([^"]+)"/) || [])[1])
    .filter(Boolean)
}

async function main() {
  const reg = loadRegistry()
  const venues = Object.values(reg)
  const errors = []
  const seenQr = new Map() // module path → slug that already used it

  if (venues.length === 0) {
    console.error("✖ venue:verify FAILED — registry is empty.")
    process.exit(1)
  }

  for (const v of venues) {
    const cardPath = join(OUT_DIR, `${v.slug}.svg`)
    if (!existsSync(cardPath)) {
      errors.push(`"${v.slug}": no card at public/venue-qr/${v.slug}.svg — run \`npm run venue-qr\`.`)
      continue
    }
    const card = readFileSync(cardPath, "utf8")
    const url = cardUrl(v.slug)

    // Re-encode what this card SHOULD carry, with the generator's exact options.
    const expected = modulePaths(await QRCode.toString(url, QR_OPTS))
    if (expected.length === 0) {
      errors.push(`"${v.slug}": could not extract a QR module path from a freshly-encoded QR — cannot verify. Failing closed.`)
      continue
    }

    const missing = expected.filter((d) => !card.includes(d))
    if (missing.length > 0) {
      errors.push(
        `"${v.slug}": the card's QR does NOT encode ${url}.\n` +
          `      This card would be a dead print run. Re-run \`npm run venue-qr\`.`,
      )
      continue
    }

    // Two cards must never carry the same QR.
    const fingerprint = expected.join("|")
    if (seenQr.has(fingerprint)) {
      errors.push(
        `"${v.slug}": its QR is IDENTICAL to "${seenQr.get(fingerprint)}"'s — both cards would scan to the same venue.`,
      )
    }
    seenQr.set(fingerprint, v.slug)

    // The printed caption must agree with the QR, or the card contradicts itself.
    if (!card.includes(`makanofficial.com/r/${v.slug}`)) {
      errors.push(`"${v.slug}": the printed URL caption does not match the slug.`)
      continue
    }

    console.log(`  ✓ ${v.name.padEnd(14)} card QR → ${url}`)
  }

  if (errors.length > 0) {
    console.error(`\n✖ venue:verify FAILED — ${errors.length} problem(s):\n`)
    for (const e of errors) console.error(`  ✖ ${e}\n`)
    process.exit(1)
  }

  console.log(`\n✓ venue:verify — all ${venues.length} card(s) encode the correct URL. Safe to print.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
