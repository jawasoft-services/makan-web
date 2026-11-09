import type { Review } from "./types"

const orderSummary = "The Thai sea bass was our standout, followed by the crispy duck. The dim sum was fine but the least memorable part of our meal."

export const uliMarylebone: Review = {
  slug: "uli-marylebone",
  orderSummary,
  title: "ULI Marylebone Review: Birthday Dinner & the £142.01 Bill",
  h1: "ULI Marylebone review: a lovely birthday dinner, but would I go back?",
  dek: "My 22nd birthday dinner with my girlfriend: a beautiful room, good food, standout sea bass and the full £142.01 bill.",
  metaDescription:
    "A first-hand review of ULI Marylebone on Seymour Place: dim sum, crispy duck, Thai sea bass, the £142.01 bill for two, and an honest verdict on value.",
  datePublished: "2026-11-09",
  dateModified: "2026-11-09",
  visitDate: "2026-11-02",
  author: {
    name: "Devon Makepeace",
    role: "Founder, Makan",
    url: "https://www.makanofficial.com/manifesto",
  },
  restaurant: {
    name: "ULI Marylebone",
    makanSlug: "uli-marylebone-8d3501",
    cuisine: ["Chinese", "Thai", "Malaysian", "Singaporean"],
    street: "15 Seymour Place",
    locality: "London",
    region: "Greater London",
    postalCode: "W1H 5BE",
    country: "GB",
    telephone: "+44 20 3141 5877",
    priceRange: "£££",
    url: "https://www.w1.ulilondon.com/",
    sameAs: [],
  },
  quickFacts: [
    { label: "Where", value: "15 Seymour Place, Marylebone, London W1H 5BE" },
    { label: "Nearest", value: "Marble Arch" },
    { label: "Food", value: "Chinese, Thai, Malay and Singaporean" },
    { label: "We paid", value: "£142.01 for two (~£71pp), including wine and 10% service" },
    { label: "Go for", value: "Thai sea bass, followed by the crispy duck" },
    { label: "Visited", value: "2 November 2026 · my 22nd birthday dinner for two" },
  ],
  bill: {
    lines: [
      { item: "Kaleidoscope dim sum basket", price: "£23.30" },
      { item: "¼ crispy duck", price: "£21.00" },
      { item: "Thai sea bass", price: "£28.00" },
      { item: "Jasmine rice", price: "£6.50" },
      { item: "Vermentino, bottle", price: "£48.00" },
      { item: "Extra pancakes", price: "£2.30" },
    ],
    subtotal: "£129.10",
    serviceLabel: "Service (discretionary 10%)",
    service: "£12.91",
    total: "£142.01",
    perHead: "~£71",
    covers: 2,
  },
  meals: [
    {
      caption: "Thai sea bass, the standout of the evening. Photo: @ridorichard.",
      alt: "Thai sea bass with sliced chillies and spring onions, served beside jasmine rice at ULI Marylebone",
      photo: "/blog/uli-marylebone/sea-bass.webp",
      mealId: "pHXX2GZ0cC7jm3HyxjZu",
    },
    {
      caption: "Crispy duck with pancakes. Photo: @ridorichard.",
      alt: "Shredded crispy duck with pancakes, cucumber, spring onions and sauce at ULI Marylebone",
      photo: "/blog/uli-marylebone/crispy-duck.webp",
      mealId: "VAJ9tgEZJjlh0Pkdyq0P",
    },
    {
      caption: "The Kaleidoscope dim sum basket. Photo: @ridorichard.",
      alt: "Colourful dim sum dumplings in a bamboo steamer at ULI Marylebone",
      photo: "/blog/uli-marylebone/dim-sum.webp",
      mealId: "3CCSPznIg3RPbFCf3xoH",
    },
  ],
  faq: [
    {
      q: "Where is ULI Marylebone?",
      a: "15 Seymour Place, Marylebone, London W1H 5BE, near Marble Arch.",
    },
    {
      q: "How much was dinner at ULI Marylebone?",
      a: "Our dinner for two on 2 November 2026 came to £142.01, including a £48 bottle of Vermentino and £12.91 discretionary service. The food came to £81.10 before service.",
    },
    {
      q: "What should I order at ULI Marylebone?",
      a: orderSummary,
    },
    {
      q: "Were the portions enough for two?",
      a: "Yes. The portions were decently sized, and we both left full without being stuffed.",
    },
    {
      q: "Would I go back to ULI Marylebone?",
      a: "Personally, no, at these prices. The food was good, the room was beautiful and we had a lovely birthday evening, but I didn't feel the food justified the cost.",
    },
  ],
  blocks: [
    { kind: "quickFacts" },
    {
      kind: "lead",
      text: "I spent my 22nd birthday at ULI Marylebone with my girlfriend, the love of my life. We were celebrating in a beautiful room, drinking wine and enjoying the evening together. It was a lovely occasion, and I’ll remember it fondly.",
    },
    {
      kind: "p",
      text: "The food was good, too. I want to be clear about that, because my hesitation about ULI comes down to the price. We ate well, the service was decent, and we both left full without being stuffed. But at £142.01 for the two of us, including a bottle of wine and service, I didn’t leave wanting to book again.",
    },
    { kind: "h2", text: "Where it is" },
    {
      kind: "p",
      text: "We visited the Marylebone restaurant at 15 Seymour Place on 2 November. For a birthday dinner, the setting was a good choice. The room is beautiful, and the ambience was one of the strongest parts of the experience. It gave us somewhere lovely to spend the evening together.",
    },
    { kind: "h2", text: "What we ordered, and what to get" },
    {
      kind: "p",
      text: "We ordered the Kaleidoscope dim sum basket, a quarter crispy duck with extra pancakes, and Thai sea bass with jasmine rice. Alongside that, we shared a bottle of Vermentino.",
    },
    {
      kind: "p",
      text: "The dim sum was fine, although it was the least memorable part of the meal. At £23.30, it would be the first thing I’d leave off the order if I were choosing again. The crispy duck was better. Our quarter portion cost £21, with another £2.30 for extra pancakes, and I preferred it to the dim sum.",
    },
    {
      kind: "p",
      text: "The Thai sea bass was the standout. It was comfortably my favourite dish of the evening and the one I’d recommend first if you’re going. At £28, with jasmine rice at £6.50 alongside it, it was also the part of the food order I felt best about.",
    },
    {
      kind: "p",
      text: "The portions were decently sized. We both left full, without being stuffed, so there was enough food. My question about value wasn’t about needing another plate afterwards. It was whether the food itself gave me enough reason to spend that much on the meal.",
    },
    { kind: "h2", text: "The bill, in full" },
    { kind: "p", text: "Two of us, birthday dinner, with a bottle of wine. Here’s the bill in full, with prices from our visit:" },
    { kind: "bill" },
    {
      kind: "p",
      text: "The food came to £81.10. Our bottle of Vermentino was £48, making the subtotal £129.10. A discretionary 10% service charge added £12.91, bringing the total to £142.01, or roughly £71 each.",
    },
    {
      kind: "p",
      text: "Having lived in Asia for most of my life, this is food I know and enjoy. I thought ULI’s was good, but it didn’t feel special enough to justify the price for me. The sea bass stood out; the rest of the meal didn’t leave the same impression.",
    },
    { kind: "h2", text: "The service and the room" },
    {
      kind: "p",
      text: "The service was decent, and I have no complaint about the amount we ate. The room deserves credit, too. If you’re choosing ULI for the setting, I can understand the appeal. It made a beautiful backdrop for my birthday.",
    },
    { kind: "h2", text: "Would I go back?" },
    {
      kind: "p",
      text: "Personally, no, at these prices. If you already have a table booked, I’d point you towards the Thai sea bass, followed by the crispy duck. We had a lovely evening, and I’m glad I spent my 22nd birthday there with the person I love. For our next dinner, though, I’d choose somewhere else.",
    },
    { kind: "meals" },
    { kind: "faq" },
    { kind: "cta" },
  ],
}
