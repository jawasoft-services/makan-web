/**
 * Validates the venue registry and enforces print-safety. Exit code IS the gate.
 *
 *   npm run venue:check
 *
 * Wired into `prebuild`, so a malformed registry — or, critically, a printed slug
 * silently repointed at a different venue — can never reach a Vercel deploy.
 * Fails CLOSED: a registry it cannot parse is a failure, never a pass.
 *
 * It must NOT, however, block the site for anything that isn't a genuine registry
 * bug: this runs before EVERY production build of the whole marketing site, so a
 * false failure here is a bigger outage than the bug it prevents. An empty registry
 * (every venue un-signed — a documented, sanctioned state) is a warning, not an error.
 */

import {
  loadRegistry,
  loadLock,
  validateRegistry,
  assertNoRepurpose,
  assertMintedCardsAreLocked,
  retiredSlugs,
} from "./venue-lib.mjs"

function main() {
  let reg, lock
  try {
    reg = loadRegistry()
    lock = loadLock()
  } catch (err) {
    console.error(`\n✖ venue:check FAILED — cannot read the registry.\n\n  ${err.message}\n`)
    process.exit(1)
  }

  const errors = [
    ...validateRegistry(reg),
    ...assertNoRepurpose(reg, lock),
    ...assertMintedCardsAreLocked(lock),
  ]

  if (Object.keys(reg).length === 0) {
    console.log(
      `  ⚠ No venues in the registry. /r/<anything> serves the generic landing — that's fine.\n` +
        `    (Not an error: this must never block a site deploy.)`,
    )
  }

  for (const slug of retiredSlugs(reg, lock)) {
    const l = lock[slug]
    console.log(
      `  ℹ retired: "${slug}" (${l.name}) was minted but is no longer in the registry.\n` +
        `    Cards in the wild still scan — they degrade to the generic landing. ` +
        `The slug stays permanently reserved; never reuse it.`,
    )
  }

  if (errors.length > 0) {
    console.error(`\n✖ venue:check FAILED — ${errors.length} problem(s):\n`)
    for (const e of errors) console.error(`  ✖ ${e}\n`)
    process.exit(1)
  }

  const venues = Object.keys(reg).length
  const locked = Object.keys(lock).length
  console.log(`✓ venue:check — ${venues} venue(s) valid, ${locked} slug(s) locked (printed).`)
}

main()
