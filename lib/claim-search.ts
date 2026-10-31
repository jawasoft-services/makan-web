/**
 * RM20364 — "Find your restaurant" matching. Pure: the cached list is filtered in memory, so a search
 * costs no database read. Every word typed must appear in the venue's name or area, accents ignored.
 */
export interface ClaimSearchEntry {
  placeId: string
  name: string
  area: string
  /** Where the owner goes: /claim/<token or slug>. */
  path: string
}

export const MAX_QUERY = 60
export const MAX_RESULTS = 8

export const normalize = (value: string): string =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export function searchVenues(entries: readonly ClaimSearchEntry[], rawQuery: string, limit = MAX_RESULTS): ClaimSearchEntry[] {
  const words = normalize(rawQuery.slice(0, MAX_QUERY)).split(' ').filter(Boolean)
  if (!words.length || words.join('').length < 2) return []
  const scored: { entry: ClaimSearchEntry; rank: number }[] = []
  for (const entry of entries) {
    const name = normalize(entry.name)
    const haystack = `${name} ${normalize(entry.area)}`
    if (!words.every((word) => haystack.includes(word))) continue
    // A name that starts with the first word comes before one that merely contains it.
    scored.push({ entry, rank: name.startsWith(words[0]) ? 0 : 1 })
  }
  return scored.sort((a, b) => a.rank - b.rank || a.entry.name.localeCompare(b.entry.name)).slice(0, limit).map((item) => item.entry)
}

/** One entry per venue; a prepared claim link wins over a plain slug because it can open the app on the venue. */
export function mergeVenues(prepared: readonly ClaimSearchEntry[], listed: readonly ClaimSearchEntry[]): ClaimSearchEntry[] {
  const byPlace = new Map<string, ClaimSearchEntry>()
  for (const entry of listed) byPlace.set(entry.placeId, entry)
  for (const entry of prepared) byPlace.set(entry.placeId, entry)
  return [...byPlace.values()]
}
