/**
 * Sign a venue in one command: validate → write the registry → mint the card → verify it.
 *
 *   npm run venue:add -- --name "Cellar Door" --city "Durham"
 *   npm run venue:add -- --name "The Cheesy Grin" --city "Durham" --slug cheesy-grin
 *   npm run venue:add -- --name "FIIK" --city "Durham" --place-id ChIJ...
 *
 * WHY: the registry used to be hand-edited JSON. That put an operator one stray
 * trailing comma (or one key≠slug typo) away from a broken page or a bad card — on
 * the one workflow that ends in a *printed* artefact. Writing it programmatically
 * deletes that whole class of error, and folds mint + verify into the same command
 * so nobody ships a card they never checked.
 *
 * Nothing is written to disk until the resulting registry has passed every check,
 * so a rejected add leaves the repo exactly as it found it.
 */

import { execFileSync } from "node:child_process"
import { join } from "node:path"
import {
  ROOT,
  loadRegistry,
  loadLock,
  saveRegistry,
  deriveSlug,
  validateRegistry,
  assertNoRepurpose,
  assertMintedCardsAreLocked,
  SLUG_RE,
} from "./venue-lib.mjs"

const KNOWN = new Set(["name", "city", "slug", "place-id"])

const USAGE = `
Usage:
  npm run venue:add -- --name "<Display Name>" --city "<City>" [--slug <slug>] [--place-id <ChIJ...>]

  --name      Exactly as it should read on the card. Short is better (~15 chars
              shows at full size; longer auto-shrinks to fit).
  --city      Shown under the name.
  --slug      Optional. Defaults to a kebab-case slug derived from the name.
              It gets PRINTED under the QR — keep it human-readable.
  --place-id  Optional. The Google Place ID (the app's placeProviderId).
              Only needed for Phase-2 auto-tag; adding it later needs no reprint.
`

function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith("--")) {
      console.error(`✖ Unexpected argument "${a}".${USAGE}`)
      process.exit(1)
    }
    const key = a.slice(2)
    // An unknown flag on a workflow that ends in a PRINTED card must never be
    // silently ignored — `--slgu cheesy-grin` would otherwise mint the wrong slug.
    if (!KNOWN.has(key)) {
      console.error(`✖ Unknown flag "--${key}". Known flags: ${[...KNOWN].map((k) => "--" + k).join(", ")}${USAGE}`)
      process.exit(1)
    }
    const val = argv[i + 1]
    if (val === undefined || val.startsWith("--")) {
      console.error(`✖ --${key} needs a value.${USAGE}`)
      process.exit(1)
    }
    out[key] = val
    i++
  }
  return out
}

function main() {
  const args = parseArgs(process.argv.slice(2))

  const name = (args.name ?? "").trim()
  const city = (args.city ?? "").trim()
  if (!name || !city) {
    console.error(`✖ --name and --city are required (and must not be blank).${USAGE}`)
    process.exit(1)
  }

  const slug = (args.slug ?? deriveSlug(name)).trim()
  const placeId = args["place-id"]?.trim()

  if (!slug) {
    console.error(
      `✖ Could not derive a slug from "${name}" — nothing usable survived.\n` +
        `  Pass one explicitly:  --slug my-venue`,
    )
    process.exit(1)
  }
  if (!SLUG_RE.test(slug)) {
    console.error(
      `✖ Bad slug "${slug}" — lowercase kebab-case only (no leading/trailing/double hyphens).\n` +
        `  It is printed under the QR. Pass a readable one explicitly: --slug my-venue`,
    )
    process.exit(1)
  }
  if (args["place-id"] !== undefined && !placeId) {
    console.error(`✖ --place-id must not be blank.`)
    process.exit(1)
  }

  const reg = loadRegistry()
  const lock = loadLock()

  if (Object.hasOwn(reg, slug)) {
    const e = reg[slug]
    console.error(
      `✖ Slug "${slug}" is already in the registry — "${e.name} (${e.city})".\n` +
        `  Pick a distinct slug: --slug ${slug}-2  (or whatever reads well on a card).`,
    )
    process.exit(1)
  }

  // The irreversible one: this slug was already minted onto physical cards for a
  // DIFFERENT venue. Reusing it sends everyone holding those cards to the wrong place.
  if (Object.hasOwn(lock, slug)) {
    const minted = lock[slug]
    if (minted.name !== name || minted.city !== city) {
      console.error(
        `✖ PRINT-SAFETY: slug "${slug}" was already minted as "${minted.name} (${minted.city})" on ${minted.mintedAt}.\n` +
          `  Those cards are physically in the wild and cannot be recalled. A printed slug is\n` +
          `  BURNED — it may never point at a different venue. Give this venue its own slug:\n` +
          `      npm run venue:add -- --name "${name}" --city "${city}" --slug <a-different-slug>`,
      )
      process.exit(1)
    }
  }

  // Validate the PROSPECTIVE registry before touching disk — a rejected add must
  // leave the repo exactly as it found it, not half-written and un-buildable.
  const next = { ...reg, [slug]: { slug, name, city, ...(placeId ? { googlePlaceId: placeId } : {}) } }
  const errors = [
    ...validateRegistry(next),
    ...assertNoRepurpose(next, lock),
    ...assertMintedCardsAreLocked(lock),
  ]
  if (errors.length > 0) {
    console.error(`\n✖ Refusing to add — ${errors.length} problem(s); nothing was written:\n`)
    for (const e of errors) console.error(`  ✖ ${e}\n`)
    process.exit(1)
  }

  saveRegistry(next)
  console.log(`✓ registry  ${name} (${city}) → /r/${slug}${placeId ? `  [placeId ${placeId}]` : ""}`)

  try {
    const run = (script) =>
      execFileSync(process.execPath, [join(ROOT, "scripts", script)], { stdio: "inherit" })
    run("venue-check.mjs")
    run("generate-venue-qr.mjs")
    run("verify-venue-qr.mjs")
  } catch {
    console.error(
      `\n✖ Minting failed after the registry was written. Undo with:\n` +
        `      git checkout -- lib/venues.data.json lib/venues.lock.json\n`,
    )
    process.exit(1)
  }

  console.log(
    `\n✓ ${name} is ready.\n` +
      `  Card:  public/venue-qr/${slug}.svg   (vector — prints crisp at any size)\n` +
      `  Page:  /r/${slug}\n\n` +
      `  Next: commit ONLY the venue files (never \`git add -A\` — this repo often has WIP).\n` +
      `  The lock file is REQUIRED — without it this slug ships unprotected:\n` +
      `      git add lib/venues.data.json lib/venues.lock.json public/venue-qr/${slug}.svg\n` +
      `      git commit -m "feat(venue-qr): add ${name} (${city}) — /r/${slug}"\n` +
      `  Then open a PR to main. Merging = a live Vercel deploy — that is Devon's call.`,
  )
}

main()
