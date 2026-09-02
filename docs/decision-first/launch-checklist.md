# Decision home — launch checklist

Devon gives the go. Until then the page lives at `/dev-preview` (404 in production) and `/` keeps the legacy home.

Merging this branch to main changes /partner (now a full restaurant page) and the shared FAQ answer for "What is Eat or Yeet?" immediately, whether or not DECISION_HOME is set. Confirm those two are wanted live before merging.

- [ ] `npm run lint` passes (founder decisions, i18n parity, contrast, photo credits)
- [ ] `npm run check:scenes` passes against the dev server (`BASE=http://localhost:3456`)
- [ ] Production-build audit: `DECISION_HOME=1 npm run build && npx next start -p 3457`, then `AUDIT_URL=http://localhost:3457/en npm run audit:home` meets perf ≥ 80, a11y ≥ 95, best practices ≥ 95, seo ≥ 95 (the dev server scores perf 67 from compile overhead; only the production build counts. Measured 2026-09-02 on the production build: perf 84, a11y 97, best practices 100, seo 92, where the 3-point SEO miss is the canonical check failing only because the audit runs on localhost while the canonical points at the real domain; it passes on production)
- [ ] axe against the same URL: no violations beyond the accepted saffron contrast pairs (D10, D11, RM18846) and the live carousel focus finding
- [ ] `docs/decision-first/id-review.md` reviewed by Devon; no row marked `fix`
- [ ] Chicken rice card credit decided (handle printed, or "Saved at Lucky Plaza" kept)
- [ ] `DECISION_HOME=1 npm run build` succeeds; `<title>` reads "Makan — Know what to order"
- [ ] Gated-copy leak with the gate off: `grep -c "No guessing" .next/server/app/en/story.html` → 0
- [ ] Devon says go: set `DECISION_HOME=1` on Vercel production, deploy
- [ ] Post-deploy: `App Store CTA Clicked` events arrive with locations `hero`, `proof`, `final`
- [ ] Then Task 11 of the plan: retire the legacy homepage sections
