import 'server-only'
import { unstable_cache } from 'next/cache'
import { GoogleAuth, JWT } from 'google-auth-library'
import seed from '@/lib/data/place-cities.json'

/**
 * City and country for a Google Place id, for the standings.
 *
 * Meals and restaurants carry no address, so this resolves one from the
 * Places API address components. Two paths:
 *   1. lib/data/place-cities.json: every place that has appeared in a verified
 *      matchup, resolved once (2026-09-02) with the project's own credential
 *      and checked in. No call at runtime for these.
 *   2. Anything not in the seed: one Places call ("Location Only" field mask,
 *      addressComponents), authorised with the same service account the site
 *      already uses for Firestore (or ADC locally) and billed to the project
 *      via X-Goog-User-Project. Cached for 30 days per id. Fails to null.
 *
 * Labels are computed here, not stored, so a naming rule can change without
 * re-resolving anything.
 */
export interface PlaceWhere {
  city: string
  country: string
}

export interface RawComponents {
  /** locality (seed rows also carry `city`: locality, else postal_town, else the first admin area) */
  loc: string
  city?: string
  /** Google's formatted address, coordinates and place types (seed rows resolved with them). */
  address?: string
  lat?: number | null
  lng?: number | null
  types?: string[]
  /** administrative_area_level_1..3 */
  a1: string
  a2: string
  a3: string
  /** country long name and ISO code */
  country: string
  cc: string
}

const SEED = seed as Record<string, RawComponents>

const COUNTRY_SHORT: Record<string, string> = { GB: 'UK', US: 'USA', AE: 'UAE' }

/** Turns Google's components into a label a reader recognises. */
export function placeLabel(r: RawComponents): PlaceWhere | null {
  if (!r.cc) return null
  const country = COUNTRY_SHORT[r.cc] ?? r.country
  const strip = (s: string) =>
    s
      .replace(/^(Kecamatan|Kota|Kabupaten)\s+/i, '')
      .replace(/\s+(City|Regency)$/i, '')
      .trim()
  let city = ''
  if (r.cc === 'ID') {
    if (/jakarta/i.test(r.a2) || /jakarta/i.test(r.a1)) city = 'Jakarta'
    else if (/^bali$/i.test(r.a1)) {
      const district = strip(r.a3 || r.a2).replace(/^Denpasar\s+\w+$/i, 'Denpasar')
      city = district ? `${district}, Bali` : 'Bali'
    } else city = strip(r.a2 || r.a3 || r.a1)
  } else {
    city = r.loc || r.city || r.a3 || r.a2 || r.a1
    // "Il-Belt Valletta" is Valletta to everyone but the postal service.
    city = city.replace(/^Il-Belt\s+/i, '')
  }
  if (!city) return null
  return { city, country }
}

function pick(components: { longText?: string; types?: string[] }[], types: string[]): string {
  for (const t of types) {
    const c = components.find((x) => (x.types ?? []).includes(t))
    if (c?.longText) return c.longText
  }
  return ''
}

async function accessToken(): Promise<string | null> {
  const scopes = ['https://www.googleapis.com/auth/cloud-platform']
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
  const client =
    clientEmail && privateKey
      ? new JWT({ email: clientEmail, key: privateKey.replace(/\\n/g, '\n'), scopes })
      : await new GoogleAuth({ scopes }).getClient()
  const token = await client.getAccessToken()
  return typeof token === 'string' ? token : (token?.token ?? null)
}

/** One live lookup, cached a month per place id. */
const lookup = unstable_cache(
  async (placeId: string): Promise<RawComponents | null> => {
    try {
      const token = await accessToken()
      if (!token) return null
      const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Goog-User-Project': process.env.FIREBASE_PROJECT_ID ?? 'munchies-expo',
          'X-Goog-FieldMask': 'addressComponents',
        },
      })
      if (!res.ok) return null
      const json = (await res.json()) as { addressComponents?: { longText?: string; shortText?: string; types?: string[] }[] }
      const ac = json.addressComponents ?? []
      const countryComponent = ac.find((x) => (x.types ?? []).includes('country'))
      return {
        loc: pick(ac, ['locality']),
        city: pick(ac, ['locality', 'postal_town', 'administrative_area_level_3', 'administrative_area_level_2', 'administrative_area_level_1']),
        a1: pick(ac, ['administrative_area_level_1']),
        a2: pick(ac, ['administrative_area_level_2']),
        a3: pick(ac, ['administrative_area_level_3']),
        country: countryComponent?.longText ?? '',
        cc: countryComponent?.shortText ?? '',
      }
    } catch {
      return null
    }
  },
  ['makan-place-city', 'v1'],
  { revalidate: 30 * 24 * 60 * 60 },
)

/** The raw seed row for a place, if known. */
export function getPlaceSeed(placeId: string): RawComponents | null {
  return SEED[placeId] ?? null
}

// A page is only made for somewhere people eat. Google's own types decide,
// so a meal tagged to a street address or a home never becomes a public
// page with photos on it.
const FOOD_TYPE = /restaurant|cafe|coffee|\bbar$|_bar$|\bpub$|bakery|food|meal_|dessert|ice_cream|tea_house|juice|deli|market|wine|night_club|cafeteria|sandwich|pizza|donut|bagel|confection|brunch|breakfast|diner|steak|sushi|ramen|noodle|hotel|resort|catering|buffet|bistro|brasserie|gastropub|winery|brewery|distillery|hawker|warung/
const NOT_A_VENUE = /^(premise|subpremise|street_address|route|locality|postal_code|political|neighborhood|natural_feature)$/
export function isFoodVenue(types: string[] | undefined): boolean {
  if (!types || !types.length) return false
  // A food type is required: "establishment" alone lets in gyms, marinas
  // and barbers that someone once ate a sandwich at.
  if (types.some((t) => NOT_A_VENUE.test(t)) && !types.some((t) => FOOD_TYPE.test(t))) return false
  return types.some((t) => FOOD_TYPE.test(t))
}

/** True when the seed already knows this place (no lookup needed). */
export function hasSeededWhere(placeId: string): boolean {
  return Boolean(SEED[placeId])
}

/** Where each place is, for the ids given. Missing ids resolve to null. */
export async function getPlaceWhere(ids: string[]): Promise<Map<string, PlaceWhere | null>> {
  const out = new Map<string, PlaceWhere | null>()
  const unknown: string[] = []
  for (const id of ids) {
    const raw = SEED[id]
    if (raw) out.set(id, placeLabel(raw))
    else unknown.push(id)
  }
  const fetched = await Promise.all(unknown.map((id) => lookup(id)))
  unknown.forEach((id, i) => {
    const raw = fetched[i]
    out.set(id, raw ? placeLabel(raw) : null)
  })
  return out
}
