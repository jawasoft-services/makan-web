import { Timestamp, type Firestore } from 'firebase-admin/firestore'
import { getPlaceSeed, getPlaceWhere, hasSeededWhere, isFoodVenue, placeLabel } from '@/lib/place-city'
import { isCleanCaption } from '@/lib/captions'
import { placeSlug, shortHash, slugify } from '@/lib/slug'
import {
  CITY_FLOOR,
  EVIDENCE_FLOOR,
  FALLBACK_PLACE_STATS,
  INDEX_MIN_MEALS,
  MIN_CITY_ROWS,
  TOP_PLACES,
  type CityStanding,
  type DirectoryPlace,
  type EatStandings,
  type PlaceIndexEntry,
  type PlaceStats,
  type StandingRow,
} from './types'

/**
 * The full-collection scans, run by the aggregate cron once an hour and by
 * the readers only as a fallback when no aggregate exists. Nothing here is
 * cached: the caller decides where the result lives.
 *
 * One Eat or Yeet comparison is one person choosing between two of their OWN
 * saved meals. When both meals are tagged to a restaurant and the restaurants
 * differ, the winner's restaurant gets an Eat and the loser's a Yeet (a tie
 * gives both a tie). Same-restaurant comparisons prove nothing about the place
 * and are skipped. Only totals ever leave: no user, no meal, no individual pick
 * is exposed. Public captions are the only user text, and only clean ones.
 *
 * The Eat, Yeet and tie totals come from the app's own server aggregate
 * (RM19117, `eatEvidenceAggregateState/{placeId}`), which the app's comparison
 * function keeps current and which holds the replayed pre-August history. The
 * legacy `rankingComparisons` collection stopped receiving picks on
 * 7 Aug 2026, so it must not be counted here.
 */

const RECENT_CAPTIONS = 3
const MAX_MEALS_ON_PAGE = 60
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

// The app's Makan Picks order (functions/eatEvidence/domain.js
// compareRankingCandidates): Eat rate compared exactly by cross-multiplying,
// then more matchups, then more Eats, then the earlier first meal.
const byEatRate = (x: StandingRow, y: StandingRow) =>
  y.eats * x.matchups - x.eats * y.matchups ||
  y.matchups - x.matchups ||
  y.eats - x.eats ||
  (x.since ?? '').localeCompare(y.since ?? '')

export async function computeEatStandings(db: Firestore): Promise<EatStandings> {
  const [mealsSnap, evidenceSnap] = await Promise.all([
    db.collection('meals').select('placeProviderId', 'locationName', 'createdAt', 'isPublic', 'moderationStatus', 'caption').get(),
    db.collection('eatEvidenceAggregateState').select('eat', 'yeet', 'tie').get(),
  ])

  // Per-place name votes, first-meal date, public meals and captions.
  const nameVotes = new Map<string, Map<string, number>>()
  const firstMeal = new Map<string, number>()
  const publicMeals = new Map<string, number>()
  const captions = new Map<string, { at: number; caption: string }[]>()
  for (const doc of mealsSnap.docs) {
    const d = doc.data()
    const id = str(d.placeProviderId)
    if (!id) continue
    const name = str(d.locationName)
    if (name) {
      const votes = nameVotes.get(id) ?? new Map<string, number>()
      votes.set(name, (votes.get(name) ?? 0) + 1)
      nameVotes.set(id, votes)
    }
    const at = toMillis(d.createdAt)
    if (at && (!firstMeal.has(id) || at < (firstMeal.get(id) as number))) firstMeal.set(id, at)
    const isPublic = d.isPublic === true && (d.moderationStatus === undefined || d.moderationStatus === 'active')
    if (isPublic) {
      publicMeals.set(id, (publicMeals.get(id) ?? 0) + 1)
      const caption = str(d.caption)
      if (caption && isCleanCaption(caption)) {
        const list = captions.get(id) ?? []
        list.push({ at: at ?? 0, caption })
        captions.set(id, list)
      }
    }
  }

  // Every applied comparison adds one result to each of its two restaurants,
  // so the number of comparisons is half the sum of all per-place results.
  // Places whose evidence was later withdrawn sit at zero and are skipped.
  const tally = new Map<string, { eats: number; yeets: number; ties: number }>()
  let results = 0
  for (const doc of evidenceSnap.docs) {
    const d = doc.data()
    const t = { eats: wholeCount(d.eat), yeets: wholeCount(d.yeet), ties: wholeCount(d.tie) }
    const n = t.eats + t.yeets + t.ties
    if (!n) continue
    tally.set(doc.id, t)
    results += n
  }
  const matchups = Math.round(results / 2)

  // Canonical display names where the app has them; the most-used tag otherwise.
  const ids = [...tally.keys()]
  const canonical = new Map<string, string>()
  for (let i = 0; i < ids.length; i += 100) {
    const docs = await db.getAll(...ids.slice(i, i + 100).map((id) => db.collection('restaurants').doc(id)), { fieldMask: ['displayName', 'locationName'] })
    for (const d of docs) {
      if (!d.exists) continue
      const name = str(d.data()?.displayName) || str(d.data()?.locationName)
      if (name) canonical.set(d.id, name)
    }
  }

  const all: StandingRow[] = ids.map((id) => {
    const t = tally.get(id) as { eats: number; yeets: number; ties: number }
    const n = t.eats + t.yeets + t.ties
    const since = firstMeal.get(id)
    const name = canonical.get(id) || topVote(nameVotes.get(id)) || 'Unnamed place'
    const recent = (captions.get(id) ?? []).sort((x, y) => y.at - x.at)
    const seen = new Set<string>()
    const recentCaptions: string[] = []
    for (const r of recent) {
      const key = r.caption.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      recentCaptions.push(r.caption)
      if (recentCaptions.length >= RECENT_CAPTIONS) break
    }
    return {
      placeId: id,
      slug: placeSlug(name, id),
      name,
      eats: t.eats,
      yeets: t.yeets,
      ties: t.ties,
      matchups: n,
      eatRate: n ? t.eats / n : 0,
      since: since ? new Date(since).toISOString() : null,
      where: null,
      lat: getPlaceSeed(id)?.lat ?? null,
      lng: getPlaceSeed(id)?.lng ?? null,
      publicMeals: publicMeals.get(id) ?? 0,
      recentCaptions,
      rank: null,
      cityRank: null,
    }
  })
  all.sort(byEatRate)

  // Locate every place that is either already known (free) or big enough
  // to earn a paid lookup; tiny unseeded places stay unlocated.
  const locate = all.filter((r) => hasSeededWhere(r.placeId) || r.matchups >= CITY_FLOOR).map((r) => r.placeId)
  const where = await getPlaceWhere(locate)
  for (const r of all) r.where = where.get(r.placeId) ?? null

  // Ranked by Eat rate, as the app ranks Makan Picks (Devon, 31 Oct 2026).
  const rows = all.filter((r) => r.matchups >= EVIDENCE_FLOOR)
  rows.forEach((r, i) => (r.rank = i + 1))

  // City pages: the same ranking inside one city, from the city floor.
  const cityMap = new Map<string, CityStanding>()
  for (const r of all) {
    if (!r.where || r.matchups < CITY_FLOOR) continue
    const slug = slugify(r.where.city)
    const c: CityStanding = cityMap.get(slug) ?? { slug, city: r.where.city, country: r.where.country, rows: [] }
    c.rows.push(r)
    cityMap.set(slug, c)
  }
  const cities = [...cityMap.values()]
    .filter((c) => c.rows.length >= MIN_CITY_ROWS)
    .sort((x, y) => y.rows.length - x.rows.length || x.city.localeCompare(y.city))
  for (const c of cities) c.rows.forEach((r, i) => (r.cityRank = i + 1))

  const countries = new Set(rows.map((r) => r.where?.country).filter(Boolean)).size

  return { rows, all, cities, belowFloor: all.length - rows.length, matchups, countries, computedAt: new Date().toISOString() }
}

/**
 * Every restaurant with public meals, as the app's place screen shows it.
 * Only meals marked public and not moderated away, with a photo; only
 * places Google types as somewhere people eat; handles only where the
 * account chose one; captions only when clean.
 */
export async function computePlaceDirectory(db: Firestore, include: string[] = []): Promise<DirectoryPlace[]> {
  // Restaurants that must have a page whatever their meals (a current
  // Maître d'): they are real venues in the app, so the food-type check and
  // the one-public-meal floor do not apply to them.
  const extra = new Set(include)
  const snap = await db
    .collection('meals')
    .select('placeProviderId', 'locationName', 'createdAt', 'isPublic', 'moderationStatus', 'imageURL', 'thumbnailUrl', 'caption', 'mealType', 'userID', 'uid', 'userName')
    .get()

  type Raw = { id: string; src: string; thumb: string; caption: string; mealType: string; uid: string; legacyName: string; at: number }
  const byPlace = new Map<string, { name: Map<string, number>; first: number; meals: Raw[] }>()
  for (const doc of snap.docs) {
    const d = doc.data()
    const placeId = str(d.placeProviderId)
    if (!placeId) continue
    const entry: { name: Map<string, number>; first: number; meals: Raw[] } = byPlace.get(placeId) ?? { name: new Map<string, number>(), first: Infinity, meals: [] }
    const name = str(d.locationName)
    if (name) entry.name.set(name, (entry.name.get(name) ?? 0) + 1)
    const at = toMillis(d.createdAt) ?? 0
    if (at && at < entry.first) entry.first = at
    const isPublic = d.isPublic === true && (d.moderationStatus === undefined || d.moderationStatus === 'active')
    const src = str(d.imageURL)
    if (isPublic && src.startsWith('https://firebasestorage.googleapis.com/')) {
      const thumb = str(d.thumbnailUrl)
      entry.meals.push({
        id: doc.id,
        src,
        thumb: thumb.startsWith('https://firebasestorage.googleapis.com/') ? thumb : '',
        caption: str(d.caption),
        mealType: str(d.mealType),
        uid: str(d.userID) || str(d.uid),
        legacyName: str(d.userName),
        at,
      })
    }
    byPlace.set(placeId, entry)
  }

  for (const id of extra) if (!byPlace.has(id)) byPlace.set(id, { name: new Map<string, number>(), first: Infinity, meals: [] })
  const candidates = [...byPlace.entries()].filter(([id, e]) => extra.has(id) || (e.meals.length && isFoodVenue(getPlaceSeed(id)?.types)))

  const canonical = new Map<string, { name: string; cuisine: string[]; lat: number | null; lng: number | null }>()
  const refs = candidates.map(([id]) => db.collection('restaurants').doc(id))
  for (let i = 0; i < refs.length; i += 100) {
    const docs = await db.getAll(...refs.slice(i, i + 100), { fieldMask: ['displayName', 'locationName', 'cuisine', 'latitude', 'longitude'] })
    for (const d of docs) {
      if (!d.exists) continue
      const data = d.data() ?? {}
      const cats = (data.cuisine?.categories ?? []) as { label?: string }[]
      canonical.set(d.id, {
        name: str(data.displayName) || str(data.locationName),
        cuisine: cats.map((c) => str(c.label)).filter(Boolean),
        lat: typeof data.latitude === 'number' ? data.latitude : null,
        lng: typeof data.longitude === 'number' ? data.longitude : null,
      })
    }
  }
  // Unseeded extras: the month-cached city lookup the standings already use.
  const lookedUp = await getPlaceWhere(candidates.filter(([id]) => extra.has(id) && !getPlaceSeed(id)).map(([id]) => id))

  const uids = new Set<string>()
  for (const [, e] of candidates) for (const m of e.meals.slice(0, MAX_MEALS_ON_PAGE)) if (!m.legacyName && m.uid) uids.add(m.uid)
  const handle = new Map<string, string>()
  const uidList = [...uids]
  for (let i = 0; i < uidList.length; i += 100) {
    const docs = await db.getAll(...uidList.slice(i, i + 100).map((u) => db.collection('users').doc(u)), { fieldMask: ['username'] })
    for (const u of docs) {
      const name = u.exists ? str(u.data()?.username) : ''
      if (name && !/^user_/i.test(name)) handle.set(u.id, name)
    }
  }

  return candidates
    .map(([placeId, e]) => {
      const seed = getPlaceSeed(placeId)
      const name = canonical.get(placeId)?.name || topVote(e.name) || 'Unnamed place'
      const meals = e.meals
        .sort((x, y) => y.at - x.at)
        .slice(0, MAX_MEALS_ON_PAGE)
        .map((m) => ({
          id: m.id,
          src: m.src,
          thumb: m.thumb,
          caption: isCleanCaption(m.caption) ? m.caption : '',
          mealType: m.mealType,
          username: (m.legacyName && !/^user_/i.test(m.legacyName) ? m.legacyName : handle.get(m.uid)) ?? '',
          at: new Date(m.at).toISOString(),
        }))
      return {
        placeId,
        slug: placeSlug(name, placeId),
        hash: shortHash(placeId),
        name,
        where: seed ? placeLabel(seed) : (lookedUp.get(placeId) ?? null),
        address: seed?.address ?? '',
        lat: seed?.lat ?? canonical.get(placeId)?.lat ?? null,
        lng: seed?.lng ?? canonical.get(placeId)?.lng ?? null,
        cuisine: canonical.get(placeId)?.cuisine ?? [],
        since: Number.isFinite(e.first) ? new Date(e.first).toISOString() : null,
        meals,
        indexable: meals.length >= INDEX_MIN_MEALS,
      }
    })
    .sort((x, y) => y.meals.length - x.meals.length || x.name.localeCompare(y.name))
}

/** The small index derived from a directory: what the sitemap and static params need. */
export function indexOf(directory: DirectoryPlace[]): PlaceIndexEntry[] {
  return directory.map((p) => ({
    placeId: p.placeId,
    slug: p.slug,
    hash: p.hash,
    name: p.name,
    city: p.where?.city ?? null,
    indexable: p.indexable,
    meals: p.meals.length,
  }))
}

/** Distinct places with meals, meals in the last 30 days, and the busiest places. */
export async function computePlaceStats(db: Firestore): Promise<PlaceStats> {
  const cutoff = Timestamp.fromMillis(Date.now() - THIRTY_DAYS_MS)
  const [placesSnap, recentSnap] = await Promise.all([
    db.collection('meals').select('placeProviderId', 'locationName').get(),
    db.collection('meals').where('createdAt', '>=', cutoff).count().get(),
  ])
  const byPlace = new Map<string, { name: string; meals: number }>()
  for (const doc of placesSnap.docs) {
    const d = doc.data()
    const id = str(d.placeProviderId)
    if (!id) continue
    const entry = byPlace.get(id) ?? { name: str(d.locationName), meals: 0 }
    entry.meals += 1
    if (!entry.name) entry.name = str(d.locationName)
    byPlace.set(id, entry)
  }
  const topPlaces = [...byPlace.values()]
    .filter((p) => p.name)
    .sort((a, b) => b.meals - a.meals)
    .slice(0, TOP_PLACES)
  return {
    places: clamp(byPlace.size, FALLBACK_PLACE_STATS.places),
    recentMeals: clamp(recentSnap.data().count, FALLBACK_PLACE_STATS.recentMeals),
    mealCount: clamp(placesSnap.size, FALLBACK_PLACE_STATS.mealCount),
    topPlaces,
  }
}

function clamp(value: number, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return fallback
  return Math.floor(value)
}

function topVote(votes?: Map<string, number>): string {
  if (!votes) return ''
  let best = ''
  let n = 0
  for (const [name, count] of votes) if (count > n) (best = name), (n = count)
  return best
}

function toMillis(v: unknown): number | null {
  if (!v || typeof v !== 'object') return null
  const t = v as { toMillis?: () => number; _seconds?: number }
  if (typeof t.toMillis === 'function') return t.toMillis()
  if (typeof t._seconds === 'number') return t._seconds * 1000
  return null
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function wholeCount(v: unknown): number {
  return Number.isSafeInteger(v) && (v as number) > 0 ? (v as number) : 0
}
