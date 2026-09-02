# Decision home — launch checklist

Devon gives the go. Until then the page lives at `/dev-preview` (404 in production) and `/` keeps the legacy home.

Merging this branch to main changes these immediately, whether or not DECISION_HOME is set: /partner (now a full restaurant page), /standings (new, en and id, in the sitemap and footer), the shared FAQ answer for "What is Eat or Yeet?", the 18px base type size on every page, the meal-strip filters, and the llms.txt page list. Only the homepage itself and the llms.txt tagline are behind the gate. Confirm those are wanted live before merging.

- [x] `npm run lint` passes (founder decisions, i18n parity, contrast, photo credits) — 2026-09-02, 482 keys
- [x] `npm run check:scenes` passes against the dev server (`BASE=http://localhost:3456`) — 2026-09-02, at the 18px base
- [x] Production-build audit (2026-09-02 final: perf 95, a11y 97, best practices 100, seo 92 with the same localhost-canonical miss): `DECISION_HOME=1 npm run build && npx next start -p 3457`, then `AUDIT_URL=http://localhost:3457/en npm run audit:home` meets perf ≥ 80, a11y ≥ 95, best practices ≥ 95, seo ≥ 95 (the dev server scores perf 67 from compile overhead; only the production build counts. Measured 2026-09-02 on the production build: perf 84, a11y 97, best practices 100, seo 92, where the 3-point SEO miss is the canonical check failing only because the audit runs on localhost while the canonical points at the real domain; it passes on production)
- [x] axe against the same URL (2026-09-02: 26 saffron contrast nodes, 1 carousel focus, nothing else): no violations beyond the accepted saffron contrast pairs (D10, D11, RM18846) and the live carousel focus finding
- [ ] `docs/decision-first/id-review.md` reviewed by Devon; no row marked `fix`
- [ ] Chicken rice card credit decided (handle printed, or "Saved at Lucky Plaza" kept)
- [x] `DECISION_HOME=1 npm run build` succeeds; `<title>` reads "Makan — Know what to order" — 2026-09-02; /standings prerendered in both locales; /dev-preview 404s in the production build
- [x] Gated-copy leak with the gate off (0 on 2026-09-02): `grep -c "No guessing" .next/server/app/en/story.html` → 0
- [ ] Vercel production env has `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (the standings, place numbers and meal strip read Firestore at build and revalidate); the service account can call the Places API for any restaurant that reaches the standings floor after today (see the handoff doc)
- [ ] Devon says go: set `DECISION_HOME=1` on Vercel production, deploy
- [ ] Post-deploy: `App Store CTA Clicked` events arrive with locations `hero`, `proof`, `final`
- [ ] Then Task 11 of the plan: retire the legacy homepage sections
