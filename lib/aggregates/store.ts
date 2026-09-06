import { createHash } from 'node:crypto'
import { Timestamp, type Firestore } from 'firebase-admin/firestore'
import type { DirectoryPlace, EatStandings, PlaceIndexEntry, PlaceStats } from './types'

/**
 * Where the aggregates live in Firestore, and how they are written and read.
 *
 *   webAggregates/meta                       lastRunAt (every run: the heartbeat)
 *   webAggregates/standings                  EatStandings
 *   webAggregates/stats                      PlaceStats
 *   webAggregates/placeIndex                 { shards, count } + shards/{n} of 500 entries
 *   webAggregates/places/items/{placeId}     DirectoryPlace
 *
 * (Firestore paths alternate collection and document, so the per-place
 * documents sit one level under a `places` document, which is otherwise
 * empty.) Every content document carries a contentHash; a write is skipped
 * when the hash matches, so an hour with no new meals writes only the
 * heartbeat. A Firestore document is capped at 1 MB, which is why places
 * are separate documents and the index is sharded.
 *
 * This module writes to webAggregates/* only. It must never write to meals,
 * restaurants, users or anything the app reads or writes.
 */

const ROOT = 'webAggregates'
const SHARD_SIZE = 500
/** Aggregates older than this are treated as missing (the cron has stopped). */
/**
 * How old the heartbeat may be before readers fall back to a live scan.
 * The Vercel cron runs once a day (Hobby plans allow no more; an hourly
 * schedule rejects the whole deployment), and Hobby crons fire "within the
 * hour", so 36 hours tolerates one late run. Stale-by-a-day aggregates cost
 * nothing; a fallback scan is the cost this module exists to remove.
 */
export const MAX_AGE_MS = 36 * 60 * 60 * 1000

export function hashOf(payload: unknown): string {
  return createHash('sha1').update(JSON.stringify(payload)).digest('hex')
}

interface Stored<T> {
  payload: T
  contentHash: string
  updatedAt: Timestamp
}

async function readDoc<T>(db: Firestore, ref: FirebaseFirestore.DocumentReference): Promise<T | null> {
  const snap = await ref.get()
  if (!snap.exists) return null
  const d = snap.data() as Partial<Stored<T>> | undefined
  return d && d.payload !== undefined ? (d.payload as T) : null
}

/** When the cron last ran, or null if never. */
export async function readLastRun(db: Firestore): Promise<Date | null> {
  const snap = await db.collection(ROOT).doc('meta').get()
  const at = snap.exists ? (snap.data()?.lastRunAt as Timestamp | undefined) : undefined
  return at instanceof Timestamp ? at.toDate() : null
}

export async function readStandings(db: Firestore): Promise<EatStandings | null> {
  return readDoc<EatStandings>(db, db.collection(ROOT).doc('standings'))
}

export async function readStats(db: Firestore): Promise<PlaceStats | null> {
  return readDoc<PlaceStats>(db, db.collection(ROOT).doc('stats'))
}

export async function readPlaceIndex(db: Firestore): Promise<PlaceIndexEntry[] | null> {
  const meta = await db.collection(ROOT).doc('placeIndex').get()
  if (!meta.exists) return null
  const shards = Number(meta.data()?.shards ?? 0)
  if (!shards) return []
  const docs = await db.getAll(...Array.from({ length: shards }, (_, i) => db.collection(ROOT).doc('placeIndex').collection('shards').doc(String(i))))
  const out: PlaceIndexEntry[] = []
  for (const d of docs) {
    const entries = (d.data()?.entries ?? []) as PlaceIndexEntry[]
    out.push(...entries)
  }
  return out
}

export async function readPlace(db: Firestore, placeId: string): Promise<DirectoryPlace | null> {
  return readDoc<DirectoryPlace>(db, db.collection(ROOT).doc('places').collection('items').doc(placeId))
}

export async function readPlaces(db: Firestore, placeIds: string[]): Promise<Map<string, DirectoryPlace>> {
  const out = new Map<string, DirectoryPlace>()
  for (let i = 0; i < placeIds.length; i += 100) {
    const docs = await db.getAll(...placeIds.slice(i, i + 100).map((id) => db.collection(ROOT).doc('places').collection('items').doc(id)))
    for (const d of docs) {
      const payload = d.exists ? (d.data()?.payload as DirectoryPlace | undefined) : undefined
      if (payload) out.set(d.id, payload)
    }
  }
  return out
}

export interface WriteSummary {
  written: number
  skipped: number
  removed: number
}

/**
 * Writes every aggregate whose content changed, and the heartbeat. The
 * standings' computedAt is excluded from the hash so an unchanged table
 * keeps its earlier date (the page shows it as "Updated"); it is replaced
 * only when the content is.
 */
export async function writeAggregates(
  db: Firestore,
  data: { standings: EatStandings; directory: DirectoryPlace[]; index: PlaceIndexEntry[]; stats: PlaceStats },
): Promise<WriteSummary> {
  const summary: WriteSummary = { written: 0, skipped: 0, removed: 0 }
  const now = Timestamp.now()
  const root = db.collection(ROOT)

  // Existing hashes, one read per content document.
  const [standingsSnap, statsSnap, indexMetaSnap] = await Promise.all([root.doc('standings').get(), root.doc('stats').get(), root.doc('placeIndex').get()])
  const existingPlaces = await root.doc('places').collection('items').select('contentHash').get()
  const placeHash = new Map<string, string>()
  for (const d of existingPlaces.docs) placeHash.set(d.id, String(d.data()?.contentHash ?? ''))

  // BulkWriter reports a failed write only through onWriteError and the
  // per-write promise; without both, a rejected write (for instance a
  // service account that can only read) leaves close() resolving and the
  // run looking successful. Collect the failures and throw after the flush.
  const writer = db.bulkWriter()
  const failures: string[] = []
  writer.onWriteError((err) => {
    if (err.failedAttempts < 3) return true
    failures.push(`${err.documentRef.path}: ${err.message}`)
    return false
  })
  const swallow = (p: Promise<unknown>) => void p.catch(() => undefined)
  const put = (ref: FirebaseFirestore.DocumentReference, payload: unknown, hash: string) => {
    swallow(writer.set(ref, { payload, contentHash: hash, updatedAt: now }))
    summary.written += 1
  }

  // Standings: hash without computedAt.
  const { computedAt: _computedAt, ...standingsBody } = data.standings
  void _computedAt
  const standingsHash = hashOf(standingsBody)
  if (standingsSnap.data()?.contentHash === standingsHash) summary.skipped += 1
  else put(root.doc('standings'), data.standings, standingsHash)

  const statsHash = hashOf(data.stats)
  if (statsSnap.data()?.contentHash === statsHash) summary.skipped += 1
  else put(root.doc('stats'), data.stats, statsHash)

  // Index: sharded, one hash over the whole list on the meta document.
  const indexHash = hashOf(data.index)
  if (indexMetaSnap.data()?.contentHash === indexHash) summary.skipped += 1
  else {
    const shards = Math.ceil(data.index.length / SHARD_SIZE)
    for (let i = 0; i < shards; i += 1) {
      swallow(writer.set(root.doc('placeIndex').collection('shards').doc(String(i)), { entries: data.index.slice(i * SHARD_SIZE, (i + 1) * SHARD_SIZE), updatedAt: now }))
    }
    const previous = Number(indexMetaSnap.data()?.shards ?? 0)
    for (let i = shards; i < previous; i += 1) swallow(writer.delete(root.doc('placeIndex').collection('shards').doc(String(i))))
    swallow(writer.set(root.doc('placeIndex'), { shards, count: data.index.length, contentHash: indexHash, updatedAt: now }))
    summary.written += 1
  }

  // Places: one document each, hash-gated; documents for places that no
  // longer qualify are removed.
  const keep = new Set<string>()
  for (const place of data.directory) {
    keep.add(place.placeId)
    const hash = hashOf(place)
    if (placeHash.get(place.placeId) === hash) summary.skipped += 1
    else put(root.doc('places').collection('items').doc(place.placeId), place, hash)
  }
  for (const id of placeHash.keys()) {
    if (keep.has(id)) continue
    swallow(writer.delete(root.doc('places').collection('items').doc(id)))
    summary.removed += 1
  }

  swallow(writer.set(root.doc('meta'), { lastRunAt: now, places: data.directory.length, standingsRows: data.standings.rows.length }))
  await writer.close()
  if (failures.length > 0) throw new Error(`${failures.length} of ${summary.written + 1} writes failed; first: ${failures[0]}`)
  return summary
}
