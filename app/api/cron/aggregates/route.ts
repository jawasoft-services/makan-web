import { NextResponse } from 'next/server'
import { getDb } from '@/lib/firebase-admin'
import { computeEatStandings, computePlaceDirectory, computePlaceStats, indexOf } from '@/lib/aggregates/compute'
import { writeAggregates } from '@/lib/aggregates/store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * The one place the site scans `meals` and `rankingComparisons`. Vercel
 * Cron calls it daily at 03:00 UTC (vercel.json; Hobby plans reject anything
 * more frequent) and the GitHub Actions workflow in
 * .github/workflows/aggregates.yml can call it hourly once the repository has
 * a CRON_SECRET secret. Both send `Authorization: Bearer $CRON_SECRET`;
 * without the secret it is a 401, so it cannot be triggered from outside.
 * It writes to webAggregates/* only, and only the documents whose content
 * changed (lib/aggregates/store.ts); most hours write just the heartbeat.
 *
 * Locally, with no CRON_SECRET configured, a development server accepts the
 * call so the aggregates can be seeded by hand.
 */
function authorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return process.env.NODE_ENV === 'development'
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: Request) {
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
    const [standings, directory, stats] = await Promise.all([
      timed('standings', computeEatStandings(db)),
      timed('directory', computePlaceDirectory(db)),
      timed('stats', computePlaceStats(db)),
    ])
    const summary = await timed('write', writeAggregates(db, { standings, directory, index: indexOf(directory), stats }))
    const body = { ok: true, ...summary, places: directory.length, ranked: standings.rows.length, ms: Date.now() - started, timings }
    console.log('aggregates: run', JSON.stringify(body))
    return NextResponse.json(body)
  } catch (err) {
    console.error('aggregates: run failed', err)
    const message = err instanceof Error ? err.message : 'Aggregate run failed.'
    return NextResponse.json({ ok: false, error: message, ms: Date.now() - started }, { status: 500 })
  }
}
