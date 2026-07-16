// Single source of truth for the homepage FAQ — rendered by components/FAQ.tsx
// and emitted as FAQPage JSON-LD by components/FaqSchema.tsx. Edit Q&As here only.
//
// Questions are phrased as real search queries (People Also Ask / AI answer
// engines), and every answer leads with a direct, extractable first sentence.
// Product claims are verified against the app — notably: audience is a binary
// Friends-Only (default) / Public toggle, NOT a three-state Public/Friends/
// Private control (postMeal.tsx). Do not reintroduce a "Private (just you)"
// posting audience, and do not claim "no algorithm" (Explore is algorithmic —
// only the main friends feed is chronological).
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
    a: 'Yes. Makan is free on the App Store, built for iPhone — no subscription, no paywall, no ads. Android is coming next.',
  },
  {
    q: 'What does “makan” mean?',
    a: "It means “eat” in Malay and Indonesian. Devon — our founder — is Indonesian, so naming a food app Makan made sense.",
  },
  {
    q: 'Who can see my meals? Is my food private?',
    a: "By default, only your friends. Every meal you post is either Friends Only — the people you've added, and no one else — or Public, which anyone on Makan can see. Friends is the default, and going public is a per-meal choice that opens up as you settle in. Either way, the meal is saved in your own diary first.",
  },
  {
    q: 'Does Makan count calories or track macros?',
    a: "No. No calories, no macros, no nutrition scores, no grading your dinner. Makan is a photo diary, not a tracker — it remembers what you ate, not what it “cost” you.",
  },
  {
    q: 'Are there star ratings?',
    a: "No. A meal isn't 4.2 out of 5. The only ranking on Makan is your own — your meals, held up against each other, until the order is one you actually believe. Your #3 of all time might be the same dish your mum made for you as a kid. That means more than a 4.6 from people who weren't there.",
  },
  {
    q: 'How is Makan different from Yelp or Google reviews?',
    a: "Yelp tells you what a thousand strangers thought once. Makan shows you what the people you actually trust ate and remembered. No star averages, no anonymous reviews, and no paying to be featured — if a place shows up on Makan, it's because someone you know ate there and kept it.",
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
