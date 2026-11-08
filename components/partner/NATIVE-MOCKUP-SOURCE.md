# Owner-tool phone provenance

Native source: app main `baabae57929cadd5f2f3e1fa3331a1b9deacff3c`, read on 8 November 2026. The reference blobs are preserved in the workspace's `strategy/website-redesign-2026-11-05/restaurant-page-2026-11-08/native-source/`. They were extracted with `git show` from `MakanGit/munchies-rn-RM20364`; its older working files were not used as current app source.

This is a website illustration of existing native screens, not an owner account, a live restaurant dashboard, evidence that the feature is publicly enabled, or a current simulator capture. The surrounding page must retain its illustration/access caption. `OwnerNativeMockup` accepts `screen: 'discover' | 'dashboard'` and `locale`; it does not call a provider, read a database or submit an action.

## Source map

All paths and line numbers in this table refer to the native commit above.

| Element | Native source | Values retained |
| --- | --- | --- |
| Screen, fonts and theme | `constants/Colors.ts:14–53`, `constants/Fonts.ts:1–18`, `components/ThemedText.tsx:8–42` | White light-mode screen/card; ink `#11181C`, secondary `#697B85`, orange `#FF9932`, border `#EAEAEB`, Plus Jakarta Sans 400/500/600/700. Native system search font remains a system font. |
| Discover ordering / screen insets | `app/tabs/discover/index.tsx:541–735` | Search + map toggle; shortcuts; decision; Cravings; friends; map; Picks. Safe-area top assumed47 at390×844; header is top+8; content starts at top+44+24, with the shortcut's own8 top inset. Native scroll padding140. |
| Search row and map toggle | `components/tab/main/SearchBarMain.tsx:117–151,170–204`, `app/tabs/discover/index.tsx:556–567,722–730` | Horizontal16, gap8;44 high; search radius22 and horizontal12; search icon20; map22 inside44 circle. |
| Intent shortcuts | `components/tab/discover/DiscoverIntentShortcuts.tsx:64–130` | Three equal columns, gap8, edges16, padding10, minimum92, radius16;34×34 tint/icon box,19/21 icons,13 bold title and11 medium subtitle. |
| Decision photo/card | `components/tab/discover/DiscoverDecisionCard.tsx:234–386,389–481,533–646` |334×272 photo at390 viewport, radius20,16 left inset; original three-stop scrim; orange source and white distance pills,34 min height;24/29 bold place name;13 medium caption and14 semibold action. |
| Cravings rail | `components/tab/discover/CravingsPreviewRail.tsx:87–127,130–209` |32 top gap;16 edges;21 flame;44 header/action;164×126 images with16 radius and12 gap;32 flame badge;14 bold place and12 medium caption. |
| Friends rail | `components/tab/discover/FriendsLovedLatelyRail.tsx:54–113,166–237,244–320` | Native hardcoded English title/subtitle in both languages;150 square food photos,16 radius;14 horizontal inset;12 gap; one20px avatar with names below. |
| Around-you map shell | `components/tab/discover/AroundYouCard.tsx:93–177,187–270` |32 top,16 edges;44 header;184 high/radius18 map shell; original overlay inset14, bottom13,36 icon,16/11 copy. Native Apple/Google map rendering itself is not embedded in this website illustration: the canvas uses its source tint, without synthetic roads, places, tiles or provider requests. This is a documented adapter limitation, not pixel-identical map proof. |
| Picks conditional empty state | `components/tab/discover/MakanPicksBand.tsx:43–125,158–231` |36 top,14 edges;42 native mark;9/12 eyebrow,20 bold heading;104 min-height state card, radius18,16 padding. Illustrative ranked data is empty and Guides is empty, so the native conditional omits guide cards. The empty state is not a claim about current live coverage. |
| Discover floating navigation | `app/tabs/_layout.tsx:332–363,374–470,484–566` |80%×390=312 width, horizontal40,60 high/radius30,bottom20; four native icons plus50 camera at screen centre/bottom25. Source icon offsets are retained. No native shadow is reproduced because the founder's flat-surface rule takes priority. |
| Dashboard header, cards and metrics | `app/(modals)/business/dashboard.tsx:388–447,479–616,654–737` | Screen horizontal20, safe-area top47;48 header,14 bottom gap,16 semibold title;11 Pro; cards padding14,1 border,radius12,gap6,10 card gap; metrics28/34 bold and11 labels,8 row top gap. |
| Dashboard conditional state | `app/(modals)/business/dashboard.tsx:222–258,438–479,488–616` | Verified approved Pro illustration, no trial/launch banner, null Maître roster, zero almost-regulars so the native hero is hidden; the three-or-more-person breakdown guard is met. All five remaining sections are present and the native English copy stays English on ID. No upgrade button appears for this Pro state. |
| Native translations | `localization/resources/{en,id}.json` namespaces `discoverSocial`, `makanPicks` | All product-owned Discover labels are source translations. The illustrative place, dish, friend names and native hardcoded dashboard/friends copy are not translated. No native product copy was humanized or rewritten; the page's marketing copy is handled separately. |

## Illustrative data

The Discover diner has two saved Cravings, three saved places and an authored650m distance to Kendal Street Kitchen. Harissa prawns and tiramisu are existing Makan-owned/credited site assets. Friends Jamie, Alex and Priya use the existing generated adult portrait sprite; these are fictional people, not claims about real customers or relationships. No new portrait or meal was generated. Full-resolution source food assets are reused through existing image handling.

Dashboard figures are authored examples, **not KSK business results**:20 visitors,52 posts,0 almost regulars;12 first visits,0 second visits and8 regulars. The implied minimum36 visit days does not exceed52 saved posts. The native backend's `Most posted` values are meal-type counts, not identified dish sales or popularity: Dinner24, Lunch18, Snack7, Breakfast3, totaling52. There are no invented revenue, conversion, reach, footfall, trend or customer-contact statistics.

Global owner flags are gated. Rendering a Pro illustration does not enable any app feature or promise owner access. The parent page offers a route to ask about access; it does not sell ranking or discovery placement.

## Assets

- `public/redesign/native/AntDesign.ttf`: unchanged installed `@expo/vector-icons`15.1.1 font at `MakanGit/munchies-rn-RM20364/node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/AntDesign.ttf`; SHA256 `08a9d5b513cf947e22ede81e9a843bd8d7763a63444cd21484bfde7662cc6543`. Compass U+F15A is the glyph used by native Discover navigation. Existing Expo/vector-icons licence files remain alongside.
- `public/redesign/native/makan-mark.png`: unchanged `assets/images/makan-mark.png` from app source main `baabae57929cadd5f2f3e1fa3331a1b9deacff3c`; SHA256 `aa756c4176e5f201990051cc864d7ded62f1fdc22d37a6d48823eab5c36fa61f`.
- Ionicons, Jakarta font weights and craving frames reuse the existing website copies and their existing provenance. Glyphs were checked against the installed package's `glyphmaps/Ionicons.json`; they were not hand-drawn.

## Rendering and checks

The full layout is a390×844 SVG foreignObject and scales only at the outer box. Inner content scrolls and is keyboard focusable with a translated descriptive label. Miniature native controls are static illustration elements, not misleading dead browser buttons. Switching screens remounts the keyed scroll region at its top. No random data, request, timer, listener or animation was added. The decorative craving uses the canonical first frame, retaining the reduced-motion-safe representation.

TypeScript `npx tsc --noEmit --pretty false` and targeted ESLint passed after these files were added. A bounded assertion check verified EN/ID source labels, illustrated metric consistency, absence of provider reads/effects, and keyed scroll reset.

Integrated fixture-browser checks at `http://localhost:3474/partner` and `/id/partner` covered both screens at1440/390 browser widths. A global site SVG rule initially shrank the illustration despite a correctly sized outer frame; the existing Maître SVG's inline100% width/height pattern fixed the shared-style conflict. The corrected browser assertions compare the actual SVG rectangle to its frame:306×662.20 at desktop and296×640.56 at mobile. Canonical390×844 screenshots were then captured for EN/ID Discover/Dashboard by widening only the browser's outer phone frame, with no source change. All five source sections exist per screen, no horizontal overflow or page errors, and external requests/forms were blocked. Keyboard End reaches Discover's bottom (933px EN,951px ID); switching back remounts it at0. Dashboard fits entirely within844px. The source-based screenshots were visually inspected. Evidence: `strategy/website-redesign-2026-11-05/restaurant-page-2026-11-08/phone-review/`.

**Unperformed:** fresh simulator side-by-side, physical-device rendering, native font-metric pixel equality, speech screen reader and a native map snapshot. No simulator was booted. Source-matched sizes and browser evidence must not be described as a fresh native1:1 comparison or public-release proof.
