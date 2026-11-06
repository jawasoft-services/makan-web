# Maître d’ website phone provenance

Reference date: 6 November 2026. Native source is the cached `origin/main` object
`18d991a7527d76ff14eb2dd23846ad69da79e13f` in
`/Users/devonmakepeace/Developer/MAKAN/MakanGit/munchies-rn-baseline-refresh`.
Reads used `GIT_NO_LAZY_FETCH=1 git show 18d991a75:<path>`; the checkout's
materialized HEAD is older (`4e046fc9f2aa12b80b9ccdf9077636acb671376a`) and was
not used as the design source. No native files, runtime or providers were changed.

## Source map

All line numbers below refer to native commit `18d991a75`.

| Rendered element | Native source | Values / contract |
| --- | --- | --- |
| Restaurant screen host | `app/(modals)/restaurantPage.tsx:1201–1210` | `MaitredExperience` inside the restaurant info sheet, with owner Share tools. |
| Restaurant photo | `restaurantPage.tsx:1727–1740`, `2011–2025` | `AppImage` content variant, 390-wide × 280-high viewport; sheet overlap 24. This website uses the existing attributed meal as explicit fixture data, not a fetched Google photo. |
| Sheet/title | `restaurantPage.tsx:2029–2047` | Radius 22, horizontal padding 20, top 12; handle 36 × 4, bottom margin 16; title Jakarta Bold 30/36, tracking −0.6. |
| Rating fallback | `restaurantPage.tsx:1161–1167`, `2068–2087` | Native `EAT OR YEET` / `UNRANKED`; no invented rating. The source hardcodes both strings in English, including on the Indonesian surface. |
| Floating controls | `restaurantPage.tsx:1801–1855`, `1893–1930` | 38 × 38 circular controls at safeTop + 8; left/right 16, Share right 62. Ionicons `chevron-back` 22, `share-outline` 20 and `bookmark-outline` 20. |
| Regulars card | `components/maitred/MaitredExperience.tsx:558–628` | White, padding/gap 16, radius 16, 1px divider; two 48-high tabs with padding 10 × 12, radius 12, 14/22 Bold; 48-wide information target with Ionicons `information-circle-outline` 20. |
| Regulars rows | `MaitredExperience.tsx:470–531` | Counting window 13/20; row minimum 40, horizontal 8/vertical 4, gap 8, radius 12; rank 13/20, avatar 28, name/count 16/23, role 13/20 Bold. |
| Missing counts | `utils/maitredTable.ts:8–9`, `MaitredExperience.tsx:501–529` | When qualifying counts are absent, only the holder appears and rank/day cells show `—`. This is the chosen fixture. No rival counts or identities are invented. |
| Usual order | `MaitredExperience.tsx:416–469` | Crown 22, avatar 48 with top padding 12; name 14/22; role 18/26 Bold; order label 14/22; dish 24/32 Bold. No food image or published badge inside the native card. |
| Equal page heights | `MaitredExperience.tsx:381–388`, `639–677` | Both pages share the larger measured content height. CSS grid retains the hidden page's intrinsic measurement; there is no guessed fixed card height. |
| New holder / published actions | `MaitredExperience.tsx:683–690`, `components/maitred/MaitredShareCard.tsx:98–115` | New holder shows Add your usual order; Share exists but is disabled without a recommendation. Published state shows Edit your usual order and available Share. |
| Shared action | `components/maitred/MaitredUi.tsx:102–153`, `455–465` | Minimum 48, padding 12 × 14, radius 13, 1px border, gap 8. |
| Original crown | `MaitredUi.tsx:60–71` | Exact `M4 7 L11 12 L17 3 L23 12 L31 6 L28 21 Q17 24 7 21 Z` path, 35 × 27 viewBox, size × .78 height, 2px round stroke. Inline dimensions protect it from website SVG sizing. |
| Avatar fallback / typography | `MaitredUi.tsx:31–59`, `225–246` | Exact first-letter fallback on accent tint; Jakarta Regular/Bold; body16/24, small13/20, label16/23. |
| Colours | `constants/Colors.ts:14–49` | White surfaces; text #11181C, primary #2C3B4D, accent #FF9932, tab text #AD5200, line #E3E8E5, tint #FFE9D4, subtle tint #FFF2E3. |
| Fonts | `constants/Fonts.ts:1–18` | Native Regular400 and Bold700 use the existing identical public TTFs. No new font family or copied font binaries except Ionicons. |
| Native copy | `localization/resources/{en,id}.json:154–207`, `262` | Copied verbatim to `native-copy.ts`. English: Regulars / Usual order / Your usual order. Indonesian: Pelanggan tetap / Pesanan biasa / Pesanan biasamu. User-authored dish fixture remains English. |
| Bottom action | `restaurantPage.tsx:1778–1797`, `2350–2384` | Source `Post a meal here`, including its English-only source string on ID. Native founder-approved white/orange pairing retained. |

## Fixture and scaling boundaries

- The website's existing five sections and educational radio controls remain.
  They are website controls, not a simulated native save/publish operation.
- All native content renders at **390 × 844**. An SVG viewBox scales that entire
  HTML viewport together without JavaScript or typed CSS arithmetic. No mobile
  breakpoint independently changes native font sizes, padding or control sizes.
- The example shows the restaurant list at a fixed 72-point scroll offset;
  the 280-point photo uses the source parallax factor .3. Safe-area assumptions
  are 47 top / 34 bottom for this 390 × 844 composition. System status-bar
  glyphs are not invented; the accepted marketing phone frame remains outside.
- Venue, address, website and dish values are illustration data. Devon explicitly
  requested removal of visible Demo labels and data brackets on 6 November 2026;
  this supersedes the earlier labelled-fixture presentation requirement. The
  source notes retain provenance, and no illustration is used as live proof. Native
  fallback `A regular` / `Pelanggan tetap` and `You` / `Kamu` are source copy,
  not named people. The one-time venue notice is in its answered state.
- `/redesign/prawns.jpg` is the unchanged, attributed Kendal Street Kitchen
  meal photograph also used in the accepted website preview and original
  review. Its caption credits **@ridorichard** outside the native viewport.
  This is a review fixture, not proof that this person is the current holder,
  and not a claim that the photo is the current provider restaurant image.
- The informational illustration is `aria-hidden` and has no links, buttons,
  inputs or focus targets at its scaled size. Full-size labelled native radio
  controls outside it expose the four explanations and work without hydration.
  Their EN/ID legends describe how the title is earned without a Demo label.
- No backend reads, standings calculations, automatic animation or personal
  analytics were added. Repeated images use the same existing asset URL.

## Historical native comparison

Inspected these native captures in
`/Users/devonmakepeace/Developer/MAKAN/.makan3-state/evidence/maitred-ui-pipeline/`:

- `250-final-regulars.png`
- `254-final-published.png`

They were created 2–3 October 2026 at **1206 × 2622** pixels. `VERIFY.md`,
`native-results.json` and `harness-manifest.json` bind them to native fixture
candidate `fb78b45ec6357fb8bcdfed152681a2ac3dbb2e73`, with real native
presentation components and mocked providers. They include a local review
toolbar and the older restaurant placement, so the complete images are not
used as current production screenshots or website phone contents.

`git diff fb78b45e 18d991a75 -- components/maitred/MaitredExperience.tsx
components/maitred/MaitredUi.tsx constants/Fonts.ts` confirms the shown held
Regulars/usual-order visual styles are unchanged. Later changes add the venue
notice and change vacant/unresolved visibility/notice treatment. The captured
regulars rows show fixture counts; those counts are deliberately not copied.

This is source and historical component evidence, **not a fresh simulator
comparison, current installed-app proof or pixel-equality sign-off**. The root
agent's bounded device inventory found no booted simulator; the available
iPhone13 contains Expo Go but no MakanDev app/native build. Browser visual
review of the new composition remains a separate check owned by the root.

## Copy and skills

Applied the explicitly requested `makan-rn-design` skill, project-local
`ui-ux-pro-max` React Native query and checklist, native-craft fallback §1/§5,
and Humanizer review. Native copy is source-owned and was not rewritten.
The approximate phone's marketing status messages were replaced by the
actual native labels and states above; the surrounding educational copy was
preserved. No before/after copywriting table applies to unchanged native strings.
