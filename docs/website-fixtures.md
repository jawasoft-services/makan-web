# Local website fixture lane

Set `MAKAN_WEBSITE_FIXTURES=1` for isolated local development/build verification. This is not a provider emulator, release artifact or live-data test. The mode is rejected when Vercel, Cloud Run or Firebase hosting markers are present. Root's Next configuration uses a separate `.next-fixtures` output and derives the client fixture flag from this server flag.

`MAKAN_WEBSITE_FIXTURE_STATE` accepts `healthy` (default), `empty`, `unavailable` or `stale`; restart the server and use fresh fixture output when changing state. No public URL or user input can enable fixture mode. Production behavior remains selected when the flag is absent.

## Synthetic route fixtures

- `/places/kendal-street-kitchen-f10001`
- `/standings/london`
- `/meal/fixture-public-meal`; private sentinel `/meal/fixture-private-meal`; unknown IDs remain unavailable.
- `/claim/kendal-street-kitchen-f10001` prepared/unclaimed; `/claim/fixture-cafe-f10002` manual/claimed.
- `/p/fixture_kendal_0001` and `/p/fixture_kendal_0001/d_00000000000000000001`.
- Table public IDs: `fixtureTable`, `expiredTable`, `revokedTable`, `fullTable___`. Secret: the character `f` repeated43times. Complete link uses `/invite/<id>#s=<secret>`.
- Taste public IDs: `fixtureTaste`, `expiredTaste`, `revokedTaste`, `privateTaste`; the same public test secret. Complete path is `/taste/<id>/<secret>`.
- Valid contact/partner submissions return `{success:true,fixture:true}` after existing validation; `fail@example.test` returns a local503 to exercise recovery. No input is sent, persisted or echoed. When exercising configured Turnstile validation directly, use `fixture-turnstile-pass` or `fixture-turnstile-fail`; root suppresses the external browser widget in this local mode.

Food images are local `/redesign/` assets; all diner names, links and numerical evidence are synthetic fixtures or pinned design snapshots. Never present fixture statistics or a fixture participant as production data.

## Boundaries

The fixture guard precedes cached Firestore access and ADC/federation credentials; Places tokens, photos and Apple ratings return locally; Sheets client construction is blocked. Typed fixtures sit at existing reader exports. The actual public-meal gate still filters private data, and the table API still checks the request, secret hash and terminal state. Cron is disabled; remote thumbnails cannot fetch or redirect upstream. Venue OG cards read only allowlisted local fixture filenames.

The source tests use the existing transpile/VM pattern: any provider construction/fetch fails and is counted. They exercise healthy/empty/unavailable/stale readers, private meal metadata, table secret/state validation, form failures/successes, local OG rendering and production-path selection with the flag absent. Root separately blocks client map tiles/Turnstile and uses local fonts; browser inspection and the controlled production build remain separate proof.

Run `node --test scripts/website-fixtures.test.mjs`. Do not run ordinary live-provider build/dev commands during repetitive fixture tests, and never publish `.next-fixtures` output or the flag. A deployment preflight must bind the exact source and verify fixture mode is absent.
