/**
 * The sanctioned escape hatch from the print-safety lock: correct the NAME or CITY
 * of a venue whose card has already been minted — for the SAME venue.
 *
 *   npm run venue:relabel -- --slug cellar-door --name "Cellar Door" --confirm-same-venue
 *
 * WHY THIS EXISTS: the lock deliberately fails the build when a minted slug's
 * name/city change, because that is indistinguishable, to a script, from someone
 * repointing a printed card at a different restaurant. But a genuine typo fix is
 * legitimate and must stay easy — the playbook allows it (cards already out keep
 * scanning and show the corrected name after deploy).
 *
 * So the fix is not "make the guard smarter" — it is "make the irreversible thing
 * impossible to do SILENTLY". Hence `--confirm-same-venue`: you must state, in the
 * command, that this is the same restaurant. Without it, this exits non-zero.
 *
 * It NEVER destroys the record of what was physically printed. The previous minted
 * label is pushed onto `history[]` in the lock, because the cards in the wild still
 * say the OLD name and that fact must remain recoverable. (An earlier version
 * overwrote it — which quietly deleted the only in-repo evidence of what is on the
 * tables in Durham.)
 *
 * It will NOT let you change the slug. A printed slug is immutable, full stop.
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

const KNOWN = new Set(["slug", "name", "city", "confirm-same-venue"])
const BOOLEAN = new Set(["confirm-same-venue"])

const USAGE = `
Usage:
  npm run venue:relabel -- --slug <slug> [--name "<New Name>"] [--city "<New City>"] --confirm-same-venue

  Corrects the label of an ALREADY-MINTED venue — the SAME venue, wrong label.
  The slug itself can never change: it is printed on cards in the wild.

  --confirm-same-venue   Required. You are asserting this is the same restaurant.
                         If it is a DIFFERENT restaurant, STOP and use venue:add
                         with its own slug — repointing a printed slug sends
                         diners to the wrong place, and no deploy can undo it.
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

  if (!slug || (args.name === undefined && args.city === undefined)) {
    console.error(`✖ --slug and at least one of --name / --city are required.${USAGE}`)
    process.exit(1)
  }

  const reg = loadRegistry()
  const lock = loadLock()

  if (!Object.hasOwn(reg, slug)) {
    console.error(`✖ "${slug}" is not in the registry. Nothing to relabel.`)
    process.exit(1)
  }
  const entry = reg[slug]

  // `??` would wave through an empty string and write "name": "" into the lock.
  const name = (args.name === undefined ? entry.name : args.name).trim()
  const city = (args.city === undefined ? entry.city : args.city).trim()
  if (!name || !city) {
    console.error(`✖ --name / --city must not be blank.${USAGE}`)
    process.exit(1)
  }

  const minted = lock[slug]
  const before = `${entry.name} (${entry.city})`

  if (!args["confirm-same-venue"]) {
    console.error(
      `✖ Refusing to relabel a minted slug without --confirm-same-venue.\n\n` +
        `    /r/${slug}:  "${before}"  →  "${name} (${city})"\n\n` +
        `  ${minted ? `Cards for "${slug}" were minted as "${minted.name} (${minted.city})" on ${minted.mintedAt} and are physically in the wild.` : `"${slug}" has no minted card on record.`}\n` +
        `  If this is the SAME restaurant with a wrong label, re-run with --confirm-same-venue.\n` +
        `  If it is a DIFFERENT restaurant, STOP — give it its own slug via venue:add.`,
    )
    process.exit(1)
  }

  const nextReg = { ...reg, [slug]: { ...entry, name, city } }
  const errors = [...validateRegistry(nextReg), ...assertMintedCardsAreLocked(lock)]
  if (errors.length > 0) {
    console.error(`\n✖ Refusing to relabel — ${errors.length} problem(s); nothing was written:\n`)
    for (const e of errors) console.error(`  ✖ ${e}\n`)
    process.exit(1)
  }

  console.log(
    `\n⚠ Relabelling a minted slug — you have confirmed this is the SAME venue.\n` +
      `    /r/${slug}:  "${before}"  →  "${name} (${city})"\n` +
      `  Cards already printed keep scanning to /r/${slug} and will show the corrected\n` +
      `  name once deployed. Reprint to bring the physical cards in line.\n`,
  )

  saveRegistry(nextReg)

  // Move the lock forward, PRESERVING what the printed cards actually say.
  if (minted) {
    const { history = [], ...rest } = minted
    lock[slug] = {
      ...rest,
      name,
      city,
      relabelledAt: new Date().toISOString().slice(0, 10),
      history: [...history, { name: minted.name, city: minted.city, until: new Date().toISOString().slice(0, 10) }],
    }
    saveLock(lock)
  }

  try {
    const run = (script) =>
      execFileSync(process.execPath, [join(ROOT, "scripts", script)], { stdio: "inherit" })
    run("venue-check.mjs")
    run("generate-venue-qr.mjs")
    run("verify-venue-qr.mjs")
  } catch {
    console.error(
      `\n✖ Re-mint failed. Undo with:\n` +
        `      git checkout -- lib/venues.data.json lib/venues.lock.json public/venue-qr/\n`,
    )
    process.exit(1)
  }

  console.log(`\n✓ Relabelled /r/${slug} → "${name} (${city})". Reprint the card to show the corrected name.`)
}

main()
