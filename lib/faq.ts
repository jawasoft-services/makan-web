// Single source of truth for the homepage FAQ — rendered by components/FAQ.tsx
// and emitted as FAQPage JSON-LD by components/FaqSchema.tsx. Edit Q&As here only.
//
// Questions are phrased as real search queries (People Also Ask / AI answer
// engines), and every answer leads with a direct, extractable first sentence.
// Product claims are verified against the app. Audience is a binary Public /
// Friends Only choice. The first post is locked to Friends Only; later composer
// sessions remember the user's last explicit choice. Do not describe Friends
// Only as the universal default, reintroduce a "Private (just you)" posting
// audience, or claim the whole app has no algorithm (only the Friends feed is
// chronological).
export interface FaqItem {
  q: string
  a: string
}

export const FAQS: FaqItem[] = [
  {
    q: 'What is Makan?',
    a: "Makan is a food diary you keep with friends. Snap a photo of your meal, tag the place if it matters, and it stays in your record — the kind that remembers what you'd otherwise forget.",
  },
  {
    q: 'Is Makan free?',
    a: "Yes. Makan is free on the App Store and built for iPhone. Android is in the works, and we don't have a release date to share yet.",
  },
  {
    q: 'What does “makan” mean?',
    a: "It means “eat” in Malay and Indonesian. Devon — our founder — is Indonesian, so naming a food app Makan made sense.",
  },
  {
    q: 'Who can see my meals? Is my food private?',
    a: "Your first post is Friends Only. After that, choose Public or Friends Only when you post. Makan remembers the audience you last chose for the next meal, and you can switch it before posting. Public means anyone on Makan can see it; Friends Only means only your friends can.",
  },
  {
    q: 'Does Makan count calories or track macros?',
    a: "No. No calories, no macros, no nutrition scores, no grading your dinner. Makan is a photo diary, not a tracker — it remembers what you ate, not what it “cost” you.",
  },
  {
    q: 'Are there star ratings?',
    a: "You don't give meals star ratings on Makan. Eat or Yeet compares your own meals with each other and builds your personal ranking.",
  },
  {
    q: 'How is Makan different from Yelp or Google reviews?',
    a: "Makan is built around meal posts, not restaurant reviews. It keeps your own diary, shows a chronological Friends feed and offers a separate Public feed for discovery.",
  },
  {
    q: 'Does Makan use AI?',
    a: "No. AI has never tasted food — it can't smell, can't chew, can't remember being hungry as a kid. So it doesn't write your captions, rank your meals, or guess what you ate from a photo. That part's yours.",
  },
  {
    q: 'What’s the difference between a like and a crave?',
    a: "A like is the quick “yum” you give a friend's meal. A crave is stronger — it saves that exact dish to your want-to-try list, for the moment a friend posts something and you need to eat it immediately.",
  },
  {
    q: 'Is there a streak?',
    a: "Yes. Post a meal a day to keep it. Miss one and it ends — no insurance, no make-ups. People get oddly attached.",
  },
]
