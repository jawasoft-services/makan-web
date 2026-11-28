/**
 * RM20773: the data the new home page (the approved 25–26 Nov 2026 prototype) renders.
 *
 * The server builds one `AgrData` from the existing cached `lib/` readers
 * (`lib/agr-home-data.ts`). It renders the text into the HTML, and the client
 * runtime (`components/agr/runtime/`) reads the same object for the 3D and
 * animated parts. There are no snapshot numbers and no base64 images:
 * every photo is a URL (a static file under `/public`, or a Firebase Storage
 * meal photo passed through `thumbUrl`).
 */

/** A dish on a hero plate. A curated static set, the same photos the prototype used. */
export interface AgrDish {
  name: string
  venue: string
  /** "@handle", or "" when the photo has no public author. */
  handle: string
  /** Square plate image, e.g. `/agr/plates/01.webp`. */
  src: string
}

/** One row of the endless "Go beyond the menu" feed: a recent public meal. */
export interface AgrFeedItem {
  /** Dish or caption. User text: never translated. */
  d: string
  /** Restaurant name. */
  v: string
  /** "@handle" of the person who saved it. */
  h: string
  /** Thumbnail URL (`thumbUrl(src, 240)`). */
  s: string
  /** The phone-size copy (`thumbUrl(src, 192)`: the row is 96 px there), when the photo goes through /api/thumb. */
  sm?: string
  /** "City, Country" from Makan's own venue data, or "" (never a Places call). */
  w: string
}

/** A globe pin: a public venue with coordinates. */
export interface AgrPin {
  lat: number
  lng: number
  /** Thumbnail URL of a recent public meal there, or "" (drawn as a plain dot). */
  s: string
}

/** One row of the live standings board. */
export interface AgrStanding {
  rank: number
  name: string
  city: string
  country: string
  /** Whole-number Eat %, 0..100. */
  pct: number
  eats: number
  yeets: number
  /** Thumbnail URL, or "". */
  img: string
}

/** A Maître d' sticker in the restaurants chapter: a real venue, its published usual. */
export interface AgrSticker {
  venue: string
  dish: string
  /** Shown name for the holder. Follows the public-web rule (see lib/agr-home-data.ts). */
  holder: string
  /** Initial shown in the avatar circle. */
  initial: string
}

export interface AgrData {
  locale: string
  dishes: AgrDish[]
  feed: AgrFeedItem[]
  pins: AgrPin[]
  standings: AgrStanding[]
  /** Distinct countries in the global standings ("Right now that's N countries."). */
  countries: number
  stickers: AgrSticker[]
  /** Static asset URLs for the runtime. */
  assets: {
    earth: string
    bump: string
    storyMenu: string
    version: string
  }
  /**
   * Every user-visible string the client runtime writes itself (counters,
   * "Saved by …", aria labels). Keys are the `Agr.runtime` message keys.
   */
  t: Record<string, string>
}
