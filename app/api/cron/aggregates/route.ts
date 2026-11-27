import { WEBSITE_FIXTURES } from '@/lib/website-fixtures'
import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'
import { computeEatStandings, computePlaceDirectory, computePlaceStats, indexOf } from '@/lib/aggregates/compute'
import { buildMaitredList, readMaitredPhotos, readMaitredSource } from '@/lib/aggregates/maitred'
import { readStoredPlaces, writeAggregates } from '@/lib/aggregates/store'
import { withPlaceDishes, type DishVenue } from '@/lib/aggregates/dishes'
import { dishPagesOn } from '@/lib/dish-pages'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * The one place the site scans `meals` and reads the app's Eat evidence
 * totals (`eatEvidenceAggregateState`). Firebase Cloud Scheduler calls this
 * endpoint hourly (makan-web-aggregates, us-central1) using its existing
 * bearer credential. Missing or incorrect credentials return 401.
 * It writes to webAggregates/* only, and only the documents whose content
 * changed (lib/aggregates/store.ts); most hours write just the heartbeat.
 *
 * Locally, with no CRON_SECRET configured, a development server accepts the
 * call so the aggregates can be seeded by hand.
 */
function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV === 'development'
  // Constant-time: `===` returns at the first differing byte, which leaks how
  // much of a guess matched. timingSafeEqual needs equal lengths.
  const expected = Buffer.from(`Bearer ${secret}`)
  const given = Buffer.from(request.headers.get('authorization') ?? '')
  return given.length === expected.length && timingSafeEqual(given, expected)
}

export async function GET(request: Request) {
  if (WEBSITE_FIXTURES) return NextResponse.json({ error: "Cron is disabled in website fixtures." }, { status: 403 })
  if (!authorised(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
  const db = getDb()
  if (!db) return NextResponse.json({ error: 'No database.' }, { status: 500 })
  const started = Date.now()
  try {
    const timed = async <T,>(name: string, work: Promise<T>): Promise<T> => {
      const t0 = Date.now()
      const out = await work
      timings[name] = Date.now() - t0
      return out
    }
    const timings: Record<string, number> = {}
    // RM20616 dish pages U1: off unless DISH_PAGES=1. With it on, the stored places are read once at the start
    // (their hashes for the writer, their dishes for the dish step) and each place gets its `dishes`.
    const dishes = dishPagesOn()
    const storedWork = dishes ? readStoredPlaces(db) : null
    // Awaited later; a failure still fails the run there, but is never an unhandled rejection meanwhile.
    storedWork?.catch(() => {})
    // Maître d' venues get a page even without public meals, so the
    // directory is built after the holders are read.
    const standingsWork = timed('standings', computeEatStandings(db))
    const directoryWithMaitred = async () => {
      const [source, standings] = await Promise.all([readMaitredSource(db), standingsWork])
      const dishVenues = dishes ? new Map<string, DishVenue>() : undefined
      const directory = await computePlaceDirectory(db, [...new Set([...source.holders.map(holder => holder.placeId), ...standings.all.map(row => row.placeId)])], dishVenues)
      const photos = await readMaitredPhotos(db, source, directory)
      const maitred = buildMaitredList(source, directory, photos)
      if (!storedWork || !dishVenues) return { directory, maitred }
      const stored = await storedWork
      return { directory: await withPlaceDishes(db, directory, { venues: dishVenues, stored: stored.dishes, dailyPass: new Date().getUTCHours() === 3 }), maitred }
    }
    const [standings, { directory, maitred }, stats] = await Promise.all([
      standingsWork,
      timed('directory', directoryWithMaitred()),
      timed('stats', computePlaceStats(db)),
    ])
    const summary = await timed('write', writeAggregates(db, { standings, directory, index: indexOf(directory), stats, maitred }, storedWork ? (await storedWork).hashes : undefined))
    const body = { ok: true, ...summary, places: directory.length, ranked: standings.rows.length, maitred: maitred.venues.length, ms: Date.now() - started, timings }
    console.log('aggregates: run', JSON.stringify(body))
    return NextResponse.json(body)
  } catch (err) {
    console.error('aggregates: run failed', err)
    const message = err instanceof Error ? err.message : 'Aggregate run failed.'
    return NextResponse.json({ ok: false, error: message, ms: Date.now() - started }, { status: 500 })
  }
}
