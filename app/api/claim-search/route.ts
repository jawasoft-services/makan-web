import { NextResponse } from 'next/server'
import { getClaimSearchEntries } from '@/lib/claim-venues'
import { MAX_QUERY, searchVenues } from '@/lib/claim-search'

/** RM20364 — "Find your restaurant" on /partner. Reads only the hourly cached venue list. */
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q') ?? ''
  if (query.length > MAX_QUERY * 2) return NextResponse.json({ results: [] }, { status: 400 })
  const results = searchVenues(await getClaimSearchEntries(), query).map(({ name, area, path }) => ({ name, area, path }))
  return NextResponse.json({ results }, { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } })
}
