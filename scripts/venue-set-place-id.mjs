/**
 * Set (or correct) a venue's Google Place ID — the app's `placeProviderId`.
 *
 *   npm run venue:set-place-id -- --slug cellar-door --place-id ChIJ...
 *
 * This is the Phase-2 prerequisite (RM18722): the printed card only carries the
 * slug, so the app resolves slug → googlePlaceId to pre-tag the composer. Adding a
 * Place ID needs NO reprint — the card is unchanged.
 *
 * It is a first-class command because the registry is no longer hand-editable, and
 * without this there would be no legal way to perform the documented Phase-2 step.
 *
 * ── Why CHANGING an existing Place ID is guarded ──
 * In Phase 2 the Place ID *is* the venue's identity: it decides which restaurant a
 * scan pre-tags. Silently changing it on a minted slug makes every printed card
 * tag the wrong restaurant — the same unrecoverable class as repurposing a slug.
 * So: filling an EMPTY one is free; overwriting a locked one needs --force.
 */

import { execFileSync } from "node:child_process"
import { join } from "node:path"
import {
  ROOT,
  loadRegistry,
  loadLock,
  saveRegistry,
  saveLock,
  validateRegistry,
  assertMintedCardsAreLocked,
} from "./venue-lib.mjs"

const KNOWN = new Set(["slug", "place-id", "force"])
const BOOLEAN = new Set(["force"])

const USAGE = `
Usage:
  npm run venue:set-place-id -- --slug <slug> --place-id <ChIJ...> [--force]

  Sets the Google Place ID used by Phase-2 auto-tag. No reprint needed — the
  printed card only carries the slug.

  --force   Required only to CHANGE a Place ID already recorded in the lock.
            Doing so repoints every printed card for this slug at a different
            restaurant. Be certain.
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
    if (!KNOWN.has(key)) {
      console.error(`✖ Unknown flag "--${key}".${USAGE}`)
      process.exit(1)
    }
    if (BOOLEAN.has(key)) {
      out[key] = true
      continue
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
  const slug = (args.slug ?? "").trim()
  const placeId = (args["place-id"] ?? "").trim()

  if (!slug || !placeId) {
    console.error(`✖ --slug and --place-id are required (and must not be blank).${USAGE}`)
    process.exit(1)
  }

  const reg = loadRegistry()
  const lock = loadLock()

  if (!Object.hasOwn(reg, slug)) {
    console.error(`✖ "${slug}" is not in the registry.`)
    process.exit(1)
  }
  const entry = reg[slug]
  const minted = Object.hasOwn(lock, slug) ? lock[slug] : null

  if (minted?.googlePlaceId && minted.googlePlaceId !== placeId && !args.force) {
    console.error(
      `✖ PRINT-SAFETY: "${slug}" is already locked to Place ID "${minted.googlePlaceId}".\n` +
        `  Changing it to "${placeId}" would make every printed "${slug}" card pre-tag a\n` +
        `  DIFFERENT restaurant once Phase 2 ships. If this is a genuine correction, re-run\n` +
        `  with --force. If this is a different venue, give it its own slug instead.`,
    )
    process.exit(1)
  }

  const nextReg = { ...reg, [slug]: { ...entry, googlePlaceId: placeId } }
  const errors = [...validateRegistry(nextReg), ...assertMintedCardsAreLocked(lock)]
  if (errors.length > 0) {
    console.error(`\n✖ Refusing — ${errors.length} problem(s); nothing was written:\n`)
    for (const e of errors) console.error(`  ✖ ${e}\n`)
    process.exit(1)
  }

  saveRegistry(nextReg)

  if (minted) {
    const previous = minted.googlePlaceId
    lock[slug] = { ...minted, googlePlaceId: placeId }
    if (previous && previous !== placeId) {
      lock[slug].placeIdHistory = [...(minted.placeIdHistory ?? []), previous]
    }
    saveLock(lock)
  }

  try {
    execFileSync(process.execPath, [join(ROOT, "scripts", "venue-check.mjs")], { stdio: "inherit" })
  } catch {
    console.error(`\n✖ Check failed. Undo with:\n      git checkout -- lib/venues.data.json lib/venues.lock.json\n`)
    process.exit(1)
  }

  console.log(
    `\n✓ /r/${slug} → Place ID ${placeId}\n` +
      `  No reprint needed — the printed card only carries the slug.\n` +
      `      git add lib/venues.data.json lib/venues.lock.json\n` +
      `      git commit -m "feat(venue-qr): set Place ID for ${entry.name} — /r/${slug}"`,
  )
}

main()
