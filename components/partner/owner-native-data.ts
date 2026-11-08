// Dated illustration from public, photo-verified meals; not the inactive native feed.
export const OWNER_NATIVE_PICKS = {
  snapshotAt: '2026-11-08T12:00:34.005Z',
  source: 'webAggregates/standings',
  nativeActiveRankVersion: null,
  ranked: {
    id: 'highest-eat-percent',
    title: 'Makan',
    titleItalicWord: 'Picks',
    subtitle: 'Restaurants ranked by public Eat outcomes',
    market: 'Across Makan',
    imageSrc: '/redesign/native/picks-plaza-khao-gaeng.jpg',
    placeCount: 2,
    leadingRating: { rank: 1, eatPercent: 83, comparisonCount: 12, restaurantName: 'Plaza Khao Gaeng Covent Garden' },
  },
  selectedPublicRows: [
    { restaurantName: 'Plaza Khao Gaeng Covent Garden', rank: 1, eats: 10, yeets: 2, ties: 0, comparisonCount: 12, meal: 'Beef massaman', photographer: 'ridorichard' },
    { restaurantName: 'Trabuxu Bistro', rank: 3, eats: 18, yeets: 5, ties: 0, comparisonCount: 23, meal: 'Rabbit saddle!', photographer: 'Ridorichard' },
  ],
  guides: [],
} as const
