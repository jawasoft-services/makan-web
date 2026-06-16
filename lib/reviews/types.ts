export interface QuickFact {
  label: string
  value: string
}

export interface BillLine {
  item: string
  price: string
}

export interface Bill {
  lines: BillLine[]
  subtotal: string
  serviceLabel: string
  service: string
  total: string
  perHead: string
  covers: number
}

export interface FaqItem {
  q: string
  a: string
}

export interface MealEmbed {
  caption: string
  alt: string
  /** Local path under /public once the photo is dropped in (optional until then). */
  photo?: string
  /** Makan meal doc id, to link the real post at /meal/<id> (optional). */
  mealId?: string
}

export interface Restaurant {
  name: string
  cuisine: string[]
  street: string
  locality: string
  region: string
  postalCode: string
  country: string
  telephone: string
  priceRange: string
  url: string
  bookingUrl?: string
  sameAs: string[]
  geo?: { lat: number; lng: number }
}

/** Body content as ordered, typed blocks. Special blocks (quickFacts/bill/meals/faq/cta)
 *  pull from the Review's structured fields so placement stays in the author's control. */
export type Block =
  | { kind: "lead"; text: string }
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "note"; text: string }
  | { kind: "quickFacts" }
  | { kind: "bill" }
  | { kind: "meals" }
  | { kind: "faq" }
  | { kind: "cta" }

export interface Review {
  slug: string
  title: string
  h1: string
  dek: string
  metaDescription: string
  datePublished: string
  dateModified: string
  visitDate: string
  /** Single-visit rating out of 5 (kept distinct from any aggregate site rating). */
  rating: number
  author: { name: string; role: string; url: string }
  restaurant: Restaurant
  quickFacts: QuickFact[]
  bill: Bill
  blocks: Block[]
  faq: FaqItem[]
  meals: MealEmbed[]
}
