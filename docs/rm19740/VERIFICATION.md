# RM19740 — source review verification

Verified 6 September 2026. These results apply to the policy source in this commit; the exact pushed commit and Redmine revision are bound in the handoff. No production deployment is implied.

- `npm run lint`: PASS (including founder decision, i18n, contrast and photo-credit checks).
- `npx tsc --noEmit`: PASS.
- `npm run build -- --webpack`: PASS after the final change-log correction. Next 16.2.10 compiled, typechecked and generated the production routes.
- Default Turbopack build: environment failure because the pre-existing node_modules symlink leaves the checkout. The supported webpack command succeeds without changing dependencies/configuration. The first server attempt used 127.0.0.1 and looped on a localhost rewrite; matching `--hostname localhost` and `http://localhost:3474` resolves it.
- HTTP GET: `/privacy-policy` → 200; `/en/privacy-policy` → 308 → canonical 200; `/id/privacy-policy` → 307 → canonical English 200.
- Browser: correct candidate date, independent Sentry disclosure and all 14 numbered sections rendered. At widths 390 and 1280, document width equals viewport width; no horizontal overflow. No browser console errors observed.
- Navigation cycle: policy Back to home → home → footer Privacy Policy → policy PASS. Tab focuses Skip to content; Enter follows #main-content. Existing support mailto links point to support@makanofficial.com; no email sent.
- Source preservation: all existing href destinations retained. Sections 1, 3, 4, 5, 6, 8, 9, 10, 11, 12 and 13 are byte-identical to main. No route, schema, SDK, dependency, style or mobile-code change.
- Repository integrity: two Finder-pattern matches are pre-existing tracked PNG assets, byte-identical to main; retained. No missing package-script file references.

## Acceptance and symptom-layer coverage

| Acceptance | Implemented evidence | Coverage at this boundary |
|---|---|---|
| AC-01 | PRD/PLAN; original six requirements mapped; doctrine snapshot | Complete authored contract; decision retained |
| AC-02 | §7; RM19738 exact-source mapping in PRD | Policy rendering PASS; mobile release proof stays O-01 |
| AC-03 | §2.3/§7 independent Firebase/Sentry disclosure | Rendered wording PASS |
| AC-04 | §7 objection/scope and held-data distinction; PRD support procedure | Authored route PASS; rehearsal stays O-04 |
| AC-05 | §2.3/§7 restrictions and removed other-person ID wording | Source/render PASS; provider settings stay O-02/03 |
| AC-06 | Preserved sections; doctrine snapshot and control matrix | No behavior/schema change; historical safeguards retained |
| AC-07 | ASSESSMENTS.md | Three unsigned draft assessments; counsel remains O-05 |
| AC-08 | HTTP/browser checks and source-preservation comparison above | PASS on exact local production build |
| AC-09 | PRD O-01–08 with owners and unlock evidence | Complete obligation register; no external PASS inferred |
| AC-10 | Exact-SHA remote readback and current Redmine card | Verified by handoff receipts after this commit |

The observable symptom is misleading policy wording. The delivery chain is the policy TSX → locale page/static build → existing proxy canonical route → rendered paragraphs and existing links. The browser measures that rendered result, including navigation away and back. There is no mobile render or cumulative account-state test in this ticket. G18 has no cumulative-state steps; reviewers need only a clean checkout and the local server, with no signed-in account.

## Read-only reviewer steps

1. Checkout the handoff’s exact SHA. Run the commands in PLAN.md; use the documented localhost server address.
2. Visit all three URLs above. Confirm they land on the same English policy and read §2.3/§7/§14.
3. Check device scope, persistent opt-out, independent Sentry account linkage, objection email and the distinction between stopping future collection and erasing historical data.
4. Follow Back to home and return via the footer. Check narrow/wide widths and keyboard skip navigation.
5. Compare the preserved sections and read PRD, ASSESSMENTS, RECONCILIATION and DOCTRINE_SNAPSHOT. Verify open publication obligations remain open.

These steps perform local GETs and navigation only. Do not send mail, change console settings, execute reporting SQL, merge main or publish. This is source Code Review; Ewan’s verdict is still required. Existing assertions outside the changed sections are preserved for their separately owned processing/activation routes and are not re-certified here.
