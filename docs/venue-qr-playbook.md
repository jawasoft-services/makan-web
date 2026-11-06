# Venue QR — stable printed links

Each card encodes `https://www.makanofficial.com/r/<slug>`. That URL belongs to Makan and must remain stable once a card is minted. The current route resolves the registry and preserves a useful generic landing for unknown or retired slugs. The card is evidence of a minted identity; it does not prove that a venue printed or displayed it.

The current committed cards are **Cellar Door (Durham)** and **FIIK (Durham)**. Their printed names, cities and distinct QR module paths were checked against the archived PR #5 lock and their expected URLs during the redesign integration. The lock dates retain the archived source record; they are not a new verification of physical placement.

## Files and safeguards

| File | Purpose |
| --- | --- |
| `lib/venues.data.json` | Current venue labels and optional Google place IDs. |
| `lib/venues.lock.json` | Permanent record of minted slugs and the original identity, including relabel history. Never discard a lock entry for a retired venue. |
| `public/venue-qr/<slug>.svg` | Existing printable card. Its presence requires a matching lock entry. |
| `scripts/venue-lib.mjs` | Shared registry validation, slug derivation, URL/QR options and print-safety rules. |
| `scripts/venue-add.mjs` | Validate a new venue, reserve its identity, mint and verify its card. |
| `scripts/venue-check.mjs` | Read-only registry and printed-identity check, also run by npm `prebuild`. |
| `scripts/generate-venue-qr.mjs` | Validate before writing; record new locks before writing cards. |
| `scripts/verify-venue-qr.mjs` | Re-encode expected URLs in memory and compare QR module paths and captions. |
| `scripts/venue-relabel.mjs` | Correct a label for the same venue, preserving label history. |
| `scripts/venue-set-place-id.mjs` | Add a place ID or explicitly correct a locked ID, preserving its history. |

The runtime helpers `getVenue` and `allVenues` retain their existing contract. No third-party dynamic-QR service is required.

## Add a venue

Work in the exact authorized checkout. Confirm the venue name, city and intended stable slug first. Keep the displayed name readable at the planned print size.

```sh
npm run venue:add -- --name "Venue Name" --city "City" --slug venue-name
```

An optional `--place-id` records the app's Google place ID. An omitted slug is derived from the name. The command rejects duplicate or repurposed slugs, bad input and unlocked existing cards before writing. It then mints and verifies. A later failure can leave legitimate local output: inspect the diff and preserve the printed identity and lock before choosing any rollback.

Review and stage only the intended registry, lock and new card files. Never claim that a card is placed at a venue from its presence in Git.

## Correct or retire a venue

For a typo on the **same venue**, use the explicit confirmation and review the before/after identity:

```sh
npm run venue:relabel -- --slug venue-name --name "Correct Name" --confirm-same-venue
npm run venue:set-place-id -- --slug venue-name --place-id ChIJexample
```

Changing an already locked place ID requires `--force`; use it only for an authorized correction to the same venue. It records the previous ID. A different venue needs a new slug.

A retired venue may leave the active registry. Keep its lock entry permanently. Existing cards continue to reach the generic landing, and the slug cannot be reused for another venue. If a printed slug contains a typo, retain that slug and add the corrected one as a separate alias; never rename the printed token.

## Verify without changing cards

From the local checkout:

```sh
npm run venue:check
npm run venue:verify
node --test scripts/venue-qr.test.mjs
```

These commands make no external requests and do not regenerate cards. The tests cover identity changes, missing locks, idempotent checks and refusal of a repurposed fixture. QR verification proves the expected encoded module paths and URL captions; it is not a physical scan test. Scan at the intended print size on a real phone before any new print run.

`npm run build` runs `prebuild` automatically, then preserves the existing static-image stage and Next build. Calling Next directly bypasses npm `prebuild`, so run `venue:check` explicitly in that lane. Repetitive website checks use `MAKAN_WEBSITE_FIXTURES=1` with live providers blocked; this local fixture mode must never be deployed. The ordinary production build uses its authorized runtime configuration.

## Hosting and release

The current integration contains Firebase App Hosting configuration. The older PR #5 Vercel-only build instructions and Desktop/iCloud workaround are historical and are not the deployment route. This port leaves the current hosting and cron configuration intact. Verify the actual hosting build command invokes the npm build lifecycle before release; do not infer that from the local script alone.

A local port, test pass or PR does not authorize a main merge, a deployment, a print order or venue distribution. Keep the existing separate main and production checkpoints. After an authorized deployment, verify each printed URL and the unknown-slug fallback on the exact release, then perform the bounded physical scan check.

Do not promise venue tagging through installation from this web QR route. Any native universal-link or composer behavior requires matching app release evidence. Adding a place ID does not by itself prove that behavior.

## Port provenance

Safeguards were ported from the supplied `/private/tmp/makan-qr5` archive associated with PR #5 (`95bdf0dd39aef01669829ac7c140d19dedc08020`). The partial clone contained that commit but not all of its file blobs, so the archive-to-commit content comparison was unavailable offline. Current registry/card identity and QR content were verified separately. No existing card was regenerated by the port, no new dependency was added, and current card wording remains the generator baseline.
