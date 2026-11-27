import { PLATES } from '@/components/agr/plates'
import type { AgrData, AgrFeedItem, AgrPin, AgrStanding, AgrSticker } from '@/components/agr/types'
import type { StandingRow } from '@/lib/aggregates/types'
import type { PublicMeal } from '@/lib/makan-stats'
import { thumbUrl } from '@/lib/thumb'
import { maitredCardDish } from '@/lib/dish-pages'

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

export function buildAgrData(input: {
  locale: string
  meals: PublicMeal[]
  standings: { rows: StandingRow[]; all: StandingRow[]; countries: number }
  venues: { placeId: string; name: string; lat: number | null; lng: number | null }[]
  maitred: { placeId?: string; name: string; notes: { always: string } }[]
  /**
   * RM20616 dish pages L6: placeId → the app's dish answer (null for none), given only while the answers are shown
   * (lib/dish-pages.ts dishAnswersShown). A card then names that answer when it is the Maître d's pick, never the free
   * text; a venue without one has no card. Absent, the cards are the holders' own picks, as before.
   */
  dishAnswers?: ReadonlyMap<string, { name: string; maitred: boolean } | null>
  /** placeId → newest public meal thumbnail there, from the place directory. Feeds the board and the globe pins. */
  thumbs?: Record<string, string>
  t: Record<string, string>
}): AgrData {
  const { meals, standings, venues, maitred, locale, t, thumbs = {}, dishAnswers } = input
  const rowByName = new Map(standings.all.map((r) => [key(r.name), r]))
  const photoByVenue = new Map<string, string>()
  for (const m of meals) if (m.locationName && !photoByVenue.has(key(m.locationName))) photoByVenue.set(key(m.locationName), m.src)

  const feed: AgrFeedItem[] = meals.map((m) => ({
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

  const cardDish = (v: { placeId?: string; notes: { always: string } }) => dishAnswers ? maitredCardDish(dishAnswers.get(v.placeId ?? '')) : v.notes.always
  const stickers: AgrSticker[] = maitred
    .filter((v) => cardDish(v))
    .slice(0, STICKERS)
    .map((v) => ({ venue: v.name, dish: cardDish(v) as string, holder: HOLDER, initial: HOLDER.slice(0, 1) }))

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
