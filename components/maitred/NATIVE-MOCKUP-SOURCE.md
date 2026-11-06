# Maître d’ website phone provenance

Reference date: 6 November 2026. Native source is main `18d991a7527d76ff14eb2dd23846ad69da79e13f`, verified against the remote reference on this date. Reads used `GIT_NO_LAZY_FETCH=1 git show` in `/Users/devonmakepeace/Developer/MAKAN/MakanGit/munchies-rn-baseline-refresh`. Its older materialized HEAD was not used as the design source. No native files, public restaurant route, live readers or providers were changed.

The user's final scope is **phone mockups, including all restaurant details**. They explicitly requested fictional diners, portraits and an Eat or Yeet score to show the complete story. This supersedes the earlier sparse holder-only illustration. Their removal of visible Demo labels and square brackets remains in effect; provenance is recorded here.

## Source map

All native references below are bound to `18d991a75`.

| Rendered element | Native source | Values / contract |
| --- | --- | --- |
| Restaurant host | `app/(modals)/restaurantPage.tsx:1127–1583` | Photo, metadata, Maître d’, address/phone/site/claim, own history, dish guidance, cravings, Eat or Yeet, friends and recent meals. |
| Photo/sheet/title | `restaurantPage.tsx:1727–1740`, `2011–2047` | Photo 390 × 280, overlap 24; radius 22, padding 20, handle 36 × 4, Jakarta Bold title 30/36. |
| Restaurant metadata | `restaurantPage.tsx:1141–1200` | Separate Google rating and Eat or Yeet percentage, price, compact hours text and meal count. The native screen has no weekly hours list. |
| Floating/bottom controls | `restaurantPage.tsx:1778–1859`, `1885–1930`, `2350–2384` | Exact back/share/bookmark glyphs and sticky Post a meal here action, shown as illustrations rather than simulated native operations. |
| Regulars card/rows | `components/maitred/MaitredExperience.tsx:470–628` | Native padding, gaps, radii, tabs, ranks, avatars, counting window and typography. |
| Table selection | `utils/maitredTable.ts:4–22` | Top three plus the viewer when outside them. A one-day viewer remains visible; qualifying is distinct from winning. |
| Usual order | `MaitredExperience.tsx:416–469` | Crown 22, avatar 48, role 18/26, dish 24/32. No meal image inside the native card. |
| Equal panel heights | `MaitredExperience.tsx:381–388`, `639–677` | CSS grid measures both pages, retaining native equal-height behavior without a fixed guessed height. |
| Unpublished holder | `MaitredExperience.tsx:558–691` | Regulars only until an order exists; Add your usual order and disabled Share. Published state shows Edit and available Share. |
| Crown/actions | `components/maitred/MaitredUi.tsx:60–71`, `102–153`, `455–465` | Exact native crown path and action metrics. |
| Dish guidance | `components/decision/RestaurantDecisionSection.tsx:83`; `utils/selectYourTaste.ts:57–58` | Compare needs two distinct owned dish IDs, not two visits. An unpublished holder uses the saved-meal memory fallback. |
| Recent meals | `restaurantPage.tsx:1064–1113`, `1745–1762` | Everyone/Friends segment; two-column photos with names/captions below. |
| Other section styling | `restaurantPage.tsx:1885–2465` | Native thumbnails, score bar, friends, spacing and typography. |
| Colours/fonts | `constants/Colors.ts:14–49`, `constants/Fonts.ts:1–18` | Native tokens and Jakarta 400/500/600/700. Medium/SemiBold are byte-identical to installed app package files; Regular/Bold already existed. |
| Icons/flames | Installed Ionicons font; `assets/icons/crave/crave-flame-frame-{1,2,3}.png` | Exact glyphs and unchanged native PNG frames, with provenance under `public/redesign/native/`. |
| Native copy | `localization/resources/{en,id}.json` | App-owned translations in `native-copy.ts`. Native host hardcoded English labels stay English on ID. Names/dishes are not translated. |

## Illustration data

`MaitredIllustration.tsx` is the shared website-only source for the phones and homepage/partner Regulars widget. It has no backend imports.

- Six fictional adults have generated portraits and varied names. Native table selection displays four rows while the viewer is outside the top three, then three rows after the viewer takes the title. All six appear across viewer/friends content; six table rows would not match the native selector.
- Alex progresses through 1 → 2 → 8 qualifying days. Jamie holds the title at seven until Alex leads. Becoming eligible does not award the title.
- Winning and publishing are separate states. The newly crowned holder has no published order; the final state publishes Harissa prawns.
- Eat or Yeet is an authored **84%** illustration: 21 Eat, 4 Yeet, zero ties, 25 comparisons. It is not a measured KSK result.
- Meal count is 36 other illustrated meals plus Alex's current count. Alex's history contains only Alex-owned records with stable dish IDs. Compare follows distinct dishes; the thumbnail maximum stays four.
- Google 4.8 and `Closes at 9:30 PM` are fixed illustration snapshots, not live provider responses or a real-time open indicator. KSK's official site confirms the address and phone. Its 12:00–21:30 main-menu service hours are not represented as all-day opening hours; public directories list a 21:30 close. No live venue data was rewritten.
- Existing meal photographs retain photographer attribution. Names below illustrated recent meals are fictional record authors, not photographer credits or real customer claims. No venue-name overlay appears on meal photos.

## Rendering and interaction

The entire native layout uses a **390 × 844** viewport inside an SVG viewBox. The initial photo is 280 points tall with the native 24-point sheet overlap. Content scrolls inside the phone; it is not compressed into one screen. Safe-area assumptions remain 47 top / 34 bottom within the accepted marketing frame. No system status-bar glyphs are invented.

The scroll region has an EN/ID accessible name, keyboard focus and a Lenis exclusion. PageDown, End and Home expose lower content. Native action illustrations are non-interactive; full-size educational radio controls select the four states. Each radio also names the phone panel it controls. Selecting Save reveals the viewer's first meal; the other steps reveal the Maître card with two days, crown transfer and published order respectively. The checked step is positioned on mount, preserving a browser-restored or pre-hydration selection. The four panels share a fixed grid and crossfade for 220 ms. Inactive panels become inert immediately, so their fading content cannot receive focus; the fade is enabled only after this focus management mounts. Without JavaScript, visibility switches immediately. Each incoming panel inherits the outgoing panel's exact current scroll position, then smoothly moves to its relevant detail. Rapid selections stop the old scroll and cancel stale destinations; manual wheel, touch or keyboard navigation cancels the pending automatic movement. Crown transitions continue from their current visual state. Scrolling uses native layout offsets so scaling cannot misalign the result; reduced motion skips the fade/delay and uses immediate scrolling. Radio/CSS state switching still works before hydration and without JavaScript.

Page scrolling follows the step nearest the reading line, forward and backward, using one pending animation frame and no scroll analytics. Desktop keeps the phone sticky beside spaced steps. Mobile keeps the complete scaled phone above the steps and measures the reading area below it. Explicit clicks stay selected until page scrolling crosses the next step boundary; minor movements within the same step do not undo the click. Native phone scrolling stays independent of page scrolling.

The homepage/partner widget retains real tabs, arrow/Home/End navigation, information overlay and Escape return. The native craving frames support reduced motion. One shared lossless WebP portrait sprite has identical decoded pixels to the generated PNG and 35.36% fewer bytes. No provider calls, listeners or writes were added.

## Verification boundary

Applied the requested `makan-rn-design` skill and project design guidance. Source and browser checks cover all restaurant sections, four story states, shared widgets, EN/ID and 320/390/768/1440 widths. Evidence is in the workspace's `strategy/website-redesign-2026-11-05/maitred-page/populated-2026-11-06/`.

Historical native captures `250-final-regulars.png` and `254-final-published.png` in `.makan3-state/evidence/maitred-ui-pipeline/` were previously inspected. They bind to fixture candidate `fb78b45ec6357fb8bcdfed152681a2ac3dbb2e73` from 2–3 October, not the current installed app. Relevant held-card styles remain unchanged, but the older host arrangement is not reused.

No simulator was booted during this verification. This is **source-matched website and browser evidence**, not a fresh native screenshot comparison, pixel-equality sign-off, physical-device test or production release.
