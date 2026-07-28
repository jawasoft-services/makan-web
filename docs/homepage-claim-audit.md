# Homepage product-claim audit

Audited 23 July 2026 against the mobile app at `../munchies-rn`
(`cc9566f7e`) and this website worktree.

This file covers factual product claims on the homepage. Questions, emotional
hooks and audience-positioning statements are not treated as implementation
claims.

| Website claim | Code evidence |
| --- | --- |
| Save what you ate, where you ate it and who was there | `app/(modals)/postMeal.tsx` collects the photo, meal type, caption, location and tagged friends. `services/MealService.ts` persists `imageURL`, `mealType`, `caption`, `locationName`, `taggedFriends`, `createdAt` and `localDate`. |
| The meal is kept in a dated diary/calendar | `components/calendar/CalendarGrid.tsx` loads the signed-in user's meals for the selected month through `mealService.getMeals`. |
| The Friends feed is chronological rather than engagement-ranked | `providers/Firebase/FeedRepository.ts` queries the Friends feed with `orderBy('createdAt', 'desc')`. `store/useFeedStore.ts` keeps both feed arrays in post-time order and does not use likes or craves as sort keys. |
| Public and Friends Only are the posting audiences | `app/(modals)/postMeal.tsx` renders the two audience controls and persists the resulting `isPublic` boolean with the meal. |
| The first post is Friends Only; later composers remember the last explicit audience choice | `app/(modals)/postMeal.tsx` locks onboarding/first-post intent to Friends Only, stores later audience picks under the per-user `share_publicly` key and loads that saved value on a new, non-edit composer session. |
| Tagged places appear on the map | `app/tabs/discover/index.tsx` renders `MapDiscoveryView`; the map data hooks build place markers from visibility-filtered meal data. |
| Eat or Yeet ranks the user's own meals | `components/ranking/EatOrYeetSession.tsx`, `services/RankingService.ts` and `store/useRankingStore.ts` build pairwise comparisons and a personal ranked result. |
| Makan does not collect calorie or macro data for meals | The canonical meal shape in `types/meal.d.ts` and both persistence paths in `services/MealService.ts` contain no calorie, macro or nutrition fields. The composer has no nutrition input. |
| Users do not give meals star ratings | The composer and canonical meal shape have no user-rating field. Eat or Yeet stores a private personal ordering instead. Google Places data may include Google's venue rating, which is different and is not presented as the user's rating. |
| Captions, meal ranking and photo identification are not AI-generated | The composer takes manual caption and meal-type input. The app dependency manifest and service layer contain no generative-AI client or inference call. |
| Likes and craves are separate actions; craves have a saved list | `components/tab/main/FeedItem.tsx` exposes separate like and crave actions. `app/(modals)/cravingList.tsx` loads the signed-in user's saved `cravedMeals`. |
| Posting on consecutive days builds a streak | `functions/streakRecompute.js` computes current and longest streaks from consecutive meal day keys; `services/MealService.ts` writes the local day key used by that computation. The composer rejects backdated posts, so missed days cannot be filled retrospectively. |
| The Journey screen brings together places, streaks and memories | `app/(modals)/gamificationDetail.tsx` renders the live “Your journey” view with meal photos, unique-place count, current and best streaks, and the user’s badge collection. |
| Likes and craves do not reorder the Friends feed | Likes and craves are stored and rendered on meals, but the Friends query and feed-store sort use only creation/post time. |
| The meal total is a database count when Firestore is available | `lib/makan-stats.ts` uses a Firestore aggregation count on the `meals` collection and an explicit fallback if that read fails; homepage sections receive the result from `app/page.tsx`. |
| Makan is available free on iPhone | `lib/links.ts` holds the live App Store URL; `components/SiteSchema.tsx` identifies iOS and a zero-price offer. `lib/support.ts` records the iPhone-only platform status. |
| The hero QR opens the same App Store path | `scripts/generate-app-qr.mjs` encodes `https://www.makanofficial.com/app`; `app/app/AppLanding.tsx` hands iOS visitors to `APP_STORE_URL`. |
| Android has no announced release date | `lib/support.ts` is the website's support source of truth and documents the draft Android submission state without promising a date. |

## Audience wording

Do not use “Friends Only by default.” It hides two implemented behaviours:

1. The first-post flow is locked to Friends Only.
2. Later composer sessions remember the audience the user explicitly chose
   previously, and the user can switch between Public and Friends Only before
   posting.

Approved concise wording: **“Public or Friends Only.”**

## App Store screenshot provenance

The website feature gallery uses only the five isolated device mockups from
`/Users/devonmakepeace/Desktop/Projects/MAKAN/app-store-screenshots-2026-07-22/device-cutouts`.
It does not embed the composed App Store headline frames. The diary, Journey,
Friends, map and meal-detail messages beside the mockups are covered by the
implementation evidence above. The source app revision remains `cc9566f7e`.
