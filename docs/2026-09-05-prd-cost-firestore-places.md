# PRD — makan-web: bring Firestore reads and Places calls back under budget

**Date:** 2026-09-05
**Repo:** `makan-web-saffron` (canonical `main`)
**Owner:** Devon Makepeace
**Implementer:** Codex
**Trigger:** Google Cloud budget alert — 150% of the Rp 200,000 monthly budget reached on 5 Sep, four days into the period.

---

## 1. Problem

The site's server-side data layer re-reads the entire `meals` collection to render pages, and re-fetches every restaurant photo from Google, on a cache that goes cold on every deployment. At the current deploy cadence this is the dominant cost on the billing account.

Measured from Cloud Monitoring, project `munchies-expo`, 1–5 Sep:

| Metric | September to date | Prior baseline |
|---|---|---|
| Firestore document reads | 3,890,045 | ~170,000/day |
| — of which `type=QUERY` | 1.5M (2 Sep), 648k (3 Sep), 1.14M (4 Sep) | ~154,000/day |
| Places `GetPhotoMedia` | 3,245 (~1,225/day) | ~2,300/month |
| Places `GetPlace` | 4,599 | — |
| Cloud Run requests | 24,694 | flat, unchanged |
| Firebase App Check verifications | 179–317/day | 800–5,885/day |

Two facts rule out the obvious explanations. Cloud Run traffic did not rise, so it is not the Cloud Functions. App Check verifications *fell*, so it is not app users. The growth is entirely in server-side collection queries.

Collection sizes: `meals` 5,064 · `rankingComparisons` 1,086 · `restaurants` 661 · `users` 647.

There were **103 commits to `main` since 1 Sep** — roughly 26 deployments per day.

---

## 2. Root cause

### 2.1 Three helpers scan the whole `meals` collection on every cold render

| Helper | Reads per cold call | `revalidate` |
|---|---|---|
| `lib/eat-standings.ts` → `getEatStandings` | 5,064 meals + 1,086 comparisons = **6,150** | 3600 |
| `lib/place-directory.ts` → `getPlaceDirectory` | **5,064** | 3600 |
| `lib/makan-stats.ts` → `getPlaceStats` | **5,064** | 86400 |

All three use `unstable_cache`. On Vercel that is the Data Cache, which is **cold after every deployment**. One cold render of all three costs ~16,000 reads, and `generateStaticParams` prerenders 661 place pages concurrently, so several racing calls repopulate the same key before the first write lands.

### 2.2 The photo path costs two Google calls per place, from two call sites

`lib/place-photo.ts` → `getPlacePhoto` issues `GetPlace` (field mask `photos`) followed by `GetPhotoMedia`. It is called from **two** places per venue:

- `app/[locale]/places/[slug]/page.tsx:91`
- `app/[locale]/places/[slug]/opengraph-image.tsx:54`

661 places × 2 call sites = **1,322 photo lookups per cold prerender pass**, against 1,223 measured on 4 Sep. The 30-day `unstable_cache` TTL is correct and compliant; the problem is that the cache does not survive a deployment.

### 2.3 `meal/[id]` is `force-dynamic` and scans the whole collection

`app/[locale]/meal/[id]/page.tsx` sets `export const dynamic = "force-dynamic"` (line 11) and calls `getPlaceDirectory()` (line 96) to resolve one place. On a cache miss that is **5,064 reads to answer a single-document question**, on the route used for every shared meal link.

`app/sitemap.ts:8` calls both `getEatStandings()` and `getPlaceDirectory()`, so crawler traffic to `/sitemap.xml` can trigger the same scans.

> **Note — an earlier hypothesis was wrong and is recorded so nobody re-tests it.** `app/[locale]/r/[place]/page.tsx` is also `force-dynamic`, but it reads the synchronous registry in `lib/venues.ts` and touches neither Firestore nor Places. It is **not** part of this problem and must not be changed by this work.

---

## 3. Goals

- **G1** Firestore reads return to the pre-1-September baseline of roughly 170,000/day or lower, and stay there across a normal day of deployments.
- **G2** Places API calls become proportional to *new or expired* places, not to deployments. A deploy with no venue changes should make close to zero Places calls.
- **G3** No page renders more slowly than it does today, and no page shows stale data beyond the freshness stated per surface in R2.
- **G4** The savings hold at any deploy frequency. The fix must not depend on shipping less often.

## 4. Non-goals

- Adding a hard quota cap on any customer-facing API. Caps break the product; budget alerts and key restrictions are the control (standing decision, RM18605).
- Reducing deploy frequency.
- Changing what any page displays, its copy, or its design.
- Touching the venue-QR route (`/r/[place]`), the app repo's Cloud Functions, or Firestore security rules.

---

## 5. Requirements

### R1 — Durable place-photo cache in Firestore *(highest saving, smallest change)*

Replace the deploy-scoped `unstable_cache` in `lib/place-photo.ts` with a Firestore-backed cache that survives deployments.

- Store one document per place at `webCache/placePhotos/{placeId}` containing `uri`, `author`, `authorUri`, and `fetchedAt`.
- On read: if the document exists and `fetchedAt` is under 30 days old, return it and make **no** Google call. Otherwise fetch from Places, write the document, and return the fresh value.
- Keep `unstable_cache` in front of the Firestore read so a warm instance does not re-read the document.
- On a Places error, return the last cached value if one exists rather than `null`, so a transient failure does not blank a hero image. If nothing is cached, return `null` as today.

**Acceptance:** a full prerender of all place pages, run twice with a deployment between the runs, makes 661 or fewer Places calls in the first run and **zero** in the second.

### R2 — Precomputed aggregates instead of full-collection scans

Add a scheduled route that performs the collection scan **once per interval** and writes the result to Firestore. Every page then reads documents, not collections.

- New route `app/api/cron/aggregates/route.ts`, invoked by Vercel Cron **daily** (Hobby plans reject anything more frequent; hourly via GitHub Actions once the repo secret is set), protected by a bearer secret in `CRON_SECRET` (return 401 without it — the route must not be publicly triggerable).
- The route scans `meals` and `rankingComparisons` **once**, then writes:
  - `webAggregates/standings` — the `EatStandings` payload that `getEatStandings` returns today.
  - `webAggregates/placeIndex` — place id, slug, name and city for every place; this backs `sitemap.ts` and `generateStaticParams`.
  - `webAggregates/places/{placeId}` — the per-place payload `places/[slug]` and `meal/[id]` need.
  - `webAggregates/stats` — the `getPlaceStats` payload.
- **Write only documents whose content changed.** Hash each payload and compare with the stored `contentHash`; skip identical writes. Most hours will write almost nothing.
- Rewrite `getEatStandings`, `getPlaceDirectory` and `getPlaceStats` to read their aggregate document. Keep the exported function names and return types **byte-identical** so no page component changes.
- Keep the existing scan code as the fallback path used only when the aggregate document is missing, and log when that happens.

**Design constraint:** a Firestore document is capped at 1 MB. The place directory for 661 places will not fit in one document — this is why `webAggregates/places/{placeId}` is per-place rather than a single array. `webAggregates/placeIndex` holds only the four small fields listed above; if it approaches 1 MB, shard it as `placeIndex/{n}` in blocks of 500.

**Acceptance:** rendering every page on the site, from a cold cache, performs **no** `meals` or `rankingComparisons` collection query. Verified by the read counter in §7 staying flat during a full prerender.

### R3 — `meal/[id]` reads one document, not the directory

In `app/[locale]/meal/[id]/page.tsx`, replace `(await getPlaceDirectory()).find(...)` with a direct read of `webAggregates/places/{placeProviderId}`.

The route may stay `force-dynamic`. The defect is the scan, not the rendering mode.

**Acceptance:** one meal page view performs at most three document reads and zero collection queries.

### R4 — One photo fetch per place, not two

`places/[slug]/page.tsx` and `places/[slug]/opengraph-image.tsx` both call `getPlacePhoto`. With R1 in place the second call is a Firestore read rather than a Google call, which is acceptable. No further change is required — this requirement exists to record that the duplication is known and deliberate, so a future reader does not "fix" it by removing the OG image's photo.

---

## 6. Constraints

**Legal — Google Maps Platform Terms §3.2.3.** Place content may be cached for at most **30 days**; `place_id` may be held indefinitely. R1's `fetchedAt` TTL is what keeps us compliant and must not be lengthened. Google also requires the photo's author attribution to be displayed alongside the image — `author` and `authorUri` are already carried for this and must continue to be stored and rendered.

**Repo conventions that will otherwise cost a round:**

- `next build` fails on ESLint errors. Run the build before pushing.
- Never run `next build` while a dev server is up.
- Never pass `-c user.email` to `git commit`; the deploy blocks on commit author.
- Deployment is Devon's call. Do not deploy as part of this work.

**Data safety.** The cron route writes to `webAggregates/*` and `webCache/*` only. It must never write to `meals`, `restaurants`, `users` or any collection the app reads or writes.

---

## 7. Verification

Every claim in §1 came from Cloud Monitoring, and the same queries prove the fix. Run them before the change and again 24 hours after it is live.

The installed gcloud has no `monitoring time-series` command, so the queries call the Monitoring API directly. `scripts/cost-monitor.mjs` does both in one go, aligned to whole days, and marks each day against the pass condition below:

```bash
npm run monitor:cost          # last 8 days; `npm run monitor:cost -- 30` for 30
```

It needs an application-default credential (`gcloud auth application-default login`, once) with `monitoring.viewer` on `munchies-expo`. Under the hood it is two `GET /v3/projects/munchies-expo/timeSeries` calls with `alignmentPeriod=86400s`, `perSeriesAligner=ALIGN_SUM`, `crossSeriesReducer=REDUCE_SUM`: Firestore `firestore.googleapis.com/document/read_count` grouped by `metric.label.type` (LOOKUP vs QUERY), and `serviceruntime.googleapis.com/api/request_count` filtered to `resource.label.service="places.googleapis.com"` grouped by `resource.label.method`.

**Pass condition:** Firestore `type=QUERY` reads at or below 200,000/day, and Places `GetPhotoMedia` at or below 100/day, sustained over 24 hours that include at least two deployments.

**Cost attribution, to be confirmed by a human in the console:** this project has no BigQuery billing export, so per-SKU spend is not available from the CLI. Confirm the improvement in Billing → Reports → group by SKU before closing.

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| Aggregates go stale if the cron stops | Log the aggregate's age on every page read; fall back to the live scan when the document is missing or older than 36 hours (one missed daily run) |
| Cron route is discovered and hammered | Bearer secret in `CRON_SECRET`, 401 without it; the route writes only, and writes are hash-gated |
| A 1 MB document limit is hit as Makan grows | `placeIndex` holds four fields per place and shards at 500; per-place payloads are separate documents |
| Photo cache returns a URI Google has expired | `photoUri` is refreshed on the same 30-day cycle; on fetch failure the stale value is served rather than a blank hero, which is the better failure |
| Aggregate shape drifts from what pages expect | The exported function signatures and return types do not change; existing page components are untouched |

---

## 9. Suggested order

R1 first — it is the largest saving for the smallest diff, and it is independent. Then R2, which is the substantial piece. R3 is a two-line change that depends on R2's per-place documents. R4 is documentation only.

R1 and R2 are separately shippable and separately verifiable. Do not batch them into one commit.

---

## 10. Implementation status (2026-09-06)

Branch `cost/firestore-places`, merged to `main` at `1469182` on 2026-09-06. **The first two pushes did not deploy:** Vercel rejected them outright (GitHub status "Deployment failed", no deployment record, the failure link resolving to the cron pricing page) because the Hobby plan allows crons once a day at most and `vercel.json` asked for hourly. Fixed by the follow-up commit: daily schedule, a 36-hour freshness window, and an optional hourly trigger from GitHub Actions (`.github/workflows/aggregates.yml`, active once `gh secret set CRON_SECRET` has been run on the repo).

- **R1** `lib/place-photo.ts`: photos cached at `webCache/placePhotos/places/{placeId}` with `fetchedAt` (30 days), stale value served on a Google error. Verified: one place render wrote the document. *(Firestore paths alternate collection and document, so the per-item documents sit one level under a `placePhotos` document; same for `webAggregates/places/items/{placeId}`.)*
- **R2** `lib/aggregates/{types,compute,store}.ts`, `app/api/cron/aggregates/route.ts`, `vercel.json` (daily, 03:00 UTC). Readers keep their names and types. New `getPlaceIndex` and `getDirectoryPlaceById` read one or two documents; the sitemap, `generateStaticParams` and the guide story use them. A heartbeat document (`webAggregates/meta`) is written every run so an unchanged hour still counts as fresh; readers fall back to the scan, with a log line, when it is missing or older than 36 hours. Measured on the dev server: a run is 17 s (under the 60 s function limit); a second run wrote only the heartbeat and skipped 591 documents. `CRON_SECRET` is set in Vercel production. The aggregates were seeded from the dev server on 2026-09-06, so the first production render after deploy reads documents.
- **R3** `app/[locale]/meal/[id]/page.tsx` reads `getDirectoryPlaceById(placeProviderId)`: one document.
- **R4** recorded as a comment beside the second `getPlacePhoto` call in the share card.

### Baseline before the fix (`npm run monitor:cost`, run 2026-09-06 just after the deploy)

| day | Firestore LOOKUP | Firestore QUERY | Places GetPlace | Places GetPhotoMedia |
|---|---:|---:|---:|---:|
| 2026-08-30 | 10,719 | 121,346 | – | – |
| 2026-08-31 | 25,901 | 218,160 | – | – |
| 2026-09-01 | 46,746 | 141,578 | – | – |
| 2026-09-02 | 10,227 | 109,666 | – | – |
| 2026-09-03 (site live) | 27,912 | 622,498 | 699 | – |
| 2026-09-04 | 113,974 | 1,389,619 | 1,710 | 1,710 |
| 2026-09-05 | 76,680 | 1,230,744 | 2,158 | 1,503 |
| 2026-09-06 (partial) | 57,920 | 1,518,289 | 880 | 880 |

QUERY reads were 100–220k/day from the app alone, then 1.2–1.5M/day once the site went live; GetPhotoMedia tracked GetPlace one-to-one, which is the two-calls-per-place pattern in §2.2. The 2026-09-06 row includes the local seeding runs and test renders from the dev server against production.

**Production writes were failing silently (found 2026-09-06 07:25 UTC).** The Vercel service account `makan-website@munchies-expo` holds `roles/datastore.viewer` only, so the cron's BulkWriter writes (and the R1 photo-cache writes) are rejected in production; BulkWriter surfaced nothing and the route returned `ok:true`. The route now throws on any failed write and returns 500 with the reason. The aggregates the site reads are the ones seeded from the dev server at 06:43 UTC; readers accept them for 36 hours, then fall back to scans. To unblock, grant the account write access (a human runs this; the CLI grant is blocked for the agent):

```bash
gcloud projects add-iam-policy-binding munchies-expo --member=serviceAccount:makan-website@munchies-expo.iam.gserviceaccount.com --role=roles/datastore.user --condition=None
```

then trigger the route once (`curl -H "Authorization: Bearer $CRON_SECRET" https://www.makanofficial.com/api/cron/aggregates`) and confirm `ok:true` and a fresh `webAggregates/meta.lastRunAt`.

Still to do by hand: run `npm run monitor:cost` on 2026-09-07 and again on 2026-09-08 (the pass condition needs a day with at least two deployments), and confirm the spend in Billing → Reports by SKU.
