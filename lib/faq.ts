// Single source of truth for the homepage FAQ — rendered by components/FAQ.tsx
// and emitted as FAQPage JSON-LD by components/FaqSchema.tsx. Edit Q&As here only.
export interface FaqItem {
  q: string
  a: string
}

export const FAQS: FaqItem[] = [
  {
    q: 'What is Makan?',
    a: "A food diary you keep with friends. Snap a photo of your meal, tag the place if it matters, and it stays in your record. The kind that remembers what you'd otherwise forget.",
  },
  {
    q: 'What does “makan” mean?',
    a: 'In Indonesian, it means eat. Devon — our founder — is Indonesian, so naming the app Makan made sense.',
  },
  {
    q: 'Who can see my meals?',
    a: "Only your friends, unless you say otherwise. Every post can be Public (anyone on Makan), Friends (mutuals only), or Private (just you). The default is friends.",
  },
  {
    q: 'Are there star ratings?',
    a: "No. A meal isn't 4.2 out of 5. The rankings we show are personal — yours, and your friends'. When a friend posts a meal, you'll see if it's their #3 of all time. That tells you more than a 4.6 average from strangers ever could.",
  },
  {
    q: 'Can restaurants pay to be featured?',
    a: "No. If you see a place on Makan, it's because someone you know actually ate there and remembered it.",
  },
  {
    q: 'Does Makan use AI?',
    a: "No. AI has never tasted food. It can't smell, can't chew, can't remember being hungry as a kid. So it doesn't write your meals, generate your recipes, or guess what you ate from a photo.",
  },
  {
    q: 'What’s the difference between a like and a crave?',
    a: 'A like is a thumbs-up between friends. A crave saves the meal to a wishlist of things you want to try — mostly used when a friend posts something that makes you instantly hungry.',
  },
  {
    q: 'Is there calorie counting?',
    a: 'No. No macros, no nutrition data, no scoring your dinner. Just photos of what you eat.',
  },
  {
    q: 'Is there a streak?',
    a: "Yes. Post a meal a day to keep it. Miss one and it ends — no insurance, no make-ups. People get oddly attached.",
  },
]
