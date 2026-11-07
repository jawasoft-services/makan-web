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

The separate hero phone keeps its EN/ID scroll-region name, keyboard focus and independent restaurant-detail scrolling. In **A title earned at the table**, the user has explicitly disabled inner-phone scrolling. Those phone regions use overflow hidden, are not focusable, and contain no operable miniature controls. Wheel/touch gestures over the illustration control the page. The scene uses the site's existing Lenis wheel smoothing; the animation follows the resulting page position. Native touch scrolling and reduced-motion preferences retain their existing behavior. There is no separate smoothing clock inside the phone. The four full-size radio controls remain pinned beside the phone. Clicking or selecting one with the keyboard smoothly scrolls through the same timeline to its position; the phone and highlight follow the current position throughout. Reduced-motion selection is immediate. A later click retargets from the current position, and normal wheel input remains available during travel. On mobile all four titles remain beside the phone; the current explanation appears below. All four explanations share one CSS grid cell, reserving the tallest height so changing steps cannot shift the pinned layout. CSS-only snapshots and all explanations remain available without JavaScript.

Scroll position is the sole animation clock. The phone subscribes directly to Lenis scroll updates after sibling effects have installed the instance; native scrolling falls back to a single animation frame per burst; no damping loop, animation timer, CSS transition, digit keyframe or Web Animation continues after scrolling stops. Every partial position is deterministic and reversible. Wheel direction changes over the scene discard momentum in the old direction before applying the new delta. Progress clamps to both endpoints even when a fast scroll crosses the whole boundary. The three no-JavaScript phone snapshots are removed after hydration, leaving only the persistent animated phone to render on each update. A separate scroll track provides 290svh of desktop travel and 240svh on mobile while the shared steps-and-phone stage stays sticky. The first two intervals each use one quarter of the distance; publishing uses the remaining half. The selected step follows meal arrival, the lead phase and the start of the usual-order sheet. Every radio checked state is synchronized explicitly so repeated clicks remain reliable after scroll-driven selection. Resize recomputes the stage inset and track geometry. The phone camera is positioned instantly from that same progress, never by a separate smooth scroll.

The first segment lands the second authored meal (carbonara and mushroom risotto) beside Harissa prawns. At landing completion, the history becomes **You've eaten here twice** (the user's explicit wording), with two corresponding owned meals. The camera then moves from meal history to the regulars card. Counts increase2→8; the four stable profile nodes interpolate between native40px regular and52px holder rows (23px name +1px gap +20px role +8px padding). The viewer passes in a narrow foreground lane so both faces remain visible at a paused crossover. Native top-three-plus-viewer membership, incumbent-first tie sorting, visits and ownership remain synchronized. Jamie holds seven; the crown follows a reversible arc onto Alex at eight. The external decorative crown is scrubbed too.

The final segment preserves the complete native route: **Add your usual order → editor → type Harissa prawns → private Preview → Publish → restaurant Usual order**. The75% editor and fitted preview share one sheet, with scroll-driven opacity/height and a measured preview-content height. One ResizeObserver updates that measurement and is disconnected on removal. The caret does not blink. Publication is a distinct later phase; the restaurant order fades in as the sheet closes. No real form, keyboard, meal save or publication runs. All props and fixture data are local.

Reduced motion applies discrete row/crown/camera/sheet states and retains every text/phase. Source-matched editor references at18d991a75: `app/(modals)/maitredMenu.tsx:154–181,197–273`, `components/maitred/MaitredExperience.tsx:107–150`, `components/maitred/MaitredUi.tsx:31–58,102–153,214–230,455–482`, `app/_layout.tsx:744–752`, and `localization/resources/{en,id}.json:226–239`. Editor field96px minimum, padding16, border1, radius16, Jakarta20/28; actions48px minimum, radius13; native forward glyphU+F133. Sheet radius24 and75% detent follow source. The OS grabber/backdrop are representations, not a fresh native capture; no keyboard image was invented.

The homepage/partner widget retains real tabs, arrow/Home/End navigation, information overlay and Escape return. The native craving frames support reduced motion. One shared lossless WebP portrait sprite has identical decoded pixels to the generated PNG and 35.36% fewer bytes. No provider calls, database listeners or writes were added.

## Verification boundary

Applied the requested `makan-rn-design` skill and project design guidance. Source and browser checks cover all restaurant sections, four story states, shared widgets, EN/ID and 320/390/768/1440 widths. Base evidence is in the workspace's `strategy/website-redesign-2026-11-05/maitred-page/populated-2026-11-06/`. Direct-scrub story evidence is in `strategy/website-redesign-2026-11-05/maitred-page/scrubbed-story-2026-11-07/`. Pinned steps and responsive pacing evidence is in `strategy/website-redesign-2026-11-05/maitred-page/pinned-steps-2026-11-07/`.

Historical native captures `250-final-regulars.png` and `254-final-published.png` in `.makan3-state/evidence/maitred-ui-pipeline/` were previously inspected. They bind to fixture candidate `fb78b45ec6357fb8bcdfed152681a2ac3dbb2e73` from 2–3 October, not the current installed app. Relevant held-card styles remain unchanged, but the older host arrangement is not reused.

No simulator was booted during this verification. This is **source-matched website and browser evidence**, not a fresh native screenshot comparison, pixel-equality sign-off, physical-device test or production release.
