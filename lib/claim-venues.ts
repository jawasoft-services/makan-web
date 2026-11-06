import 'server-only'
import { unstable_cache } from 'next/cache'
import { getDb } from '@/lib/firebase-admin'
import { getPlaceIndex } from '@/lib/place-directory'
import { mergeVenues, type ClaimSearchEntry } from '@/lib/claim-search'

/**
 * RM20364 — the venues an owner can search for on /partner: every place with public meals (the cached
 * place index) plus every venue the prepare tool made a claim link for. Built at most once an hour and
 * only when someone searches; the typing itself is filtered in memory (lib/claim-search.ts).
 *
 * A claim token is not a secret: it is the venue's public name slug plus a hash of its place ID, any
 * signed-in app user can already read one by its path (RM20363 rules), and it only picks the venue. Search
 * results may therefore name it; every ownership check still happens in the app.
 */
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export const getClaimSearchEntries = unstable_cache(
  async (): Promise<ClaimSearchEntry[]> => {
    const db = getDb()
    const [index, links] = await Promise.all([
      getPlaceIndex(),
      db ? db.collection('claimLinks').select('placeId', 'displayName', 'area').get() : Promise.resolve(null),
    ])
    const listed = index.map((place) => ({ placeId: place.placeId, name: place.name, area: place.city ?? '', path: `/claim/${place.slug}` }))
    const prepared = (links?.docs ?? [])
      .map((doc) => ({ placeId: text(doc.data().placeId), name: text(doc.data().displayName), area: text(doc.data().area), path: `/claim/${doc.id}` }))
      .filter((entry) => entry.placeId && entry.name)
    return mergeVenues(prepared, listed)
  },
  ['makan-claim-search', 'v1'],
  { revalidate: 3600 },
)
