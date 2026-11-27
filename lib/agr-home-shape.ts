import { PLATES } from '@/components/agr/plates'
import type { AgrData, AgrFeedItem, AgrPin, AgrStanding, AgrSticker } from '@/components/agr/types'
import type { StandingRow } from '@/lib/aggregates/types'
import type { WallMeal } from '@/lib/dish-wall'
import type { PublicMeal } from '@/lib/makan-stats'
import { thumbUrl } from '@/lib/thumb'

/** RM20773: shapes the readers' results into the home page's data. Pure, so it is unit-tested. */

const BOARD_SIZE = 10
const STICKERS = 3

/** Public web rule (Devon, 24 Nov 2026): a Maître d' reads "A regular", never a name. */
const HOLDER = 'A regular'

export const ASSET_VERSION = '20261126'

const key = (name: string) => name.trim().toLowerCase()

function whereOf(row: StandingRow | undefined): string {
  return row?.where ? [row.where.city, row.where.country].filter(Boolean).join(', ') : ''
}

/**
 * The "Go beyond the menu" strip's meals come from the homepage dish wall (lib/dish-wall-data.ts),
 * which already applies the public-material rules: tagged at a venue, the dish line bound to the
 * meal's owner and venue, no pork, no drinks, two cards per diner at most (Devon, 17 and 24 Nov
 * 2026). The raw recent-meals reader had none of these, so pork, a juice and venue-less "At ." cards
 * reached the live page (27 Nov 2026).
 */
export function feedMealsFromWall(wall: { previews: WallMeal[]; wall: WallMeal[] } | null): PublicMeal[] {
  if (!wall) return []
  return [...wall.previews, ...wall.wall].map((m) => ({
    src: m.src,
    caption: m.dish,
    locationName: m.venue,
    mealType: m.mealType,
    username: m.handle,
    alt: '',
  }))
}

export function buildAgrData(input: {
  locale: string
  meals: PublicMeal[]
  standings: { rows: StandingRow[]; all: StandingRow[]; countries: number }
  venues: { placeId: string; name: string; lat: number | null; lng: number | null }[]
  maitred: { name: string; notes: { always: string } }[]
  /** placeId → newest public meal thumbnail there, from the place directory. Feeds the board and the globe pins. */
  thumbs?: Record<string, string>
  t: Record<string, string>
}): AgrData {
  const { meals, standings, venues, maitred, locale, t, thumbs = {} } = input
  const rowByName = new Map(standings.all.map((r) => [key(r.name), r]))
  const photoByVenue = new Map<string, string>()
  for (const m of meals) if (m.locationName && !photoByVenue.has(key(m.locationName))) photoByVenue.set(key(m.locationName), m.src)

  // A card always names its venue: never "At ." (the strip's line is "At {venue}.").
  const feed: AgrFeedItem[] = meals.filter((m) => m.locationName.trim() && m.caption.trim()).map((m) => ({
    d: m.caption,
    v: m.locationName,
    h: m.username ? `@${m.username}` : '',
    s: thumbUrl(m.src, 240),
    w: whereOf(rowByName.get(key(m.locationName))),
  }))

  const pins: AgrPin[] = venues
    .filter((v) => typeof v.lat === 'number' && typeof v.lng === 'number')
    .map((v) => {
      const photo = photoByVenue.get(key(v.name))
      return { lat: v.lat as number, lng: v.lng as number, s: thumbs[v.placeId] || (photo ? thumbUrl(photo, 240) : '') }
    })

  const board: AgrStanding[] = standings.rows.slice(0, BOARD_SIZE).map((r, i) => {
    const photo = photoByVenue.get(key(r.name))
    return {
      rank: r.rank ?? i + 1,
      name: r.name,
      city: r.where?.city ?? '',
      country: r.where?.country ?? '',
      pct: Math.round(r.eatRate * 100),
      eats: r.eats,
      yeets: r.yeets,
      img: thumbs[r.placeId] || (photo ? thumbUrl(photo, 240) : ''),
    }
  })

  const stickers: AgrSticker[] = maitred
    .filter((v) => v.notes.always)
    .slice(0, STICKERS)
    .map((v) => ({ venue: v.name, dish: v.notes.always, holder: HOLDER, initial: HOLDER.slice(0, 1) }))

  return {
    locale,
    dishes: PLATES,
    feed,
    pins,
    standings: board,
    countries: standings.countries,
    stickers,
    assets: {
      earth: '/agr/earth-2048.jpg',
      bump: '/agr/bump-1024.jpg',
      storyMenu: '/agr/story3d-menu/',
      version: ASSET_VERSION,
    },
    t,
  }
}
